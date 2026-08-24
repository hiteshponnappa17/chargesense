import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';
const TOKEN_KEY = 'cs_token';

// ---- Token persistence -----------------------------------------------------
export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// ---- Normalized error ------------------------------------------------------
export class ApiClientError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  /** Full response body — needed for the booking conflict envelope. */
  body: any;

  constructor(status: number, message: string, code?: string, details?: unknown, body?: any) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.body = body;
  }
}

export const http: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Allow the auth layer to react to an expired/invalid session token.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

http.interceptors.response.use(
  (res) => res,
  (error: AxiosError<any>) => {
    if (error.response) {
      const { status, data } = error.response;
      const code = data?.code as string | undefined;
      const message = data?.message || error.message || 'Request failed';
      // Only force logout when a *token* is rejected — not on login failures.
      if (status === 401 && code === 'INVALID_TOKEN' && onUnauthorized) {
        onUnauthorized();
      }
      return Promise.reject(new ApiClientError(status, message, code, data?.details, data));
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new ApiClientError(0, 'The request timed out. Please try again.', 'TIMEOUT'));
    }
    return Promise.reject(
      new ApiClientError(
        0,
        'Cannot reach the ChargeSense API. Is the server running on port 5000?',
        'NETWORK_ERROR',
      ),
    );
  },
);

/** Unwrap the standard `{ success, data }` envelope, returning `data`. */
export async function unwrap<T>(promise: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await promise;
  return res.data.data;
}

export const apiGet = <T>(url: string, config?: AxiosRequestConfig) => unwrap<T>(http.get(url, config));
export const apiPost = <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
  unwrap<T>(http.post(url, body, config));
export const apiPatch = <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
  unwrap<T>(http.patch(url, body, config));
export const apiDelete = <T>(url: string, config?: AxiosRequestConfig) =>
  unwrap<T>(http.delete(url, config));

/** Human-friendly message from any thrown value. */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiClientError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}
