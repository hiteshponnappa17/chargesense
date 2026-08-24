import { apiGet, apiPatch, apiPost, tokenStore } from '@/lib/api';
import type { Role, User } from '@/types';

interface AuthPayload {
  user: User;
  token: string;
}

export async function register(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
}): Promise<AuthPayload> {
  const result = await apiPost<AuthPayload>('/auth/register', input);
  tokenStore.set(result.token);
  return result;
}

export async function login(input: { email: string; password: string }): Promise<AuthPayload> {
  const result = await apiPost<AuthPayload>('/auth/login', input);
  tokenStore.set(result.token);
  return result;
}

export async function fetchMe(): Promise<User> {
  const { user } = await apiGet<{ user: User }>('/auth/me');
  return user;
}

export async function updateProfile(input: {
  name?: string;
  phone?: string;
  defaultCarModelId?: string | null;
  vehicleRegistration?: string | null;
}): Promise<User> {
  const { user } = await apiPatch<{ user: User }>('/auth/me', input);
  return user;
}

export function logout() {
  tokenStore.clear();
}
