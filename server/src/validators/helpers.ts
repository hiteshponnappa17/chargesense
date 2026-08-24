import { ApiError } from '../utils/ApiError';

type Issue = { path: string; message: string };

/**
 * Tiny accumulating validator — no external dependency. Collects all issues
 * and throws a single 400 ApiError with details when `.done()` is called.
 */
export class Validator {
  private issues: Issue[] = [];
  private out: Record<string, unknown> = {};

  constructor(private body: Record<string, unknown>) {}

  private add(path: string, message: string) {
    this.issues.push({ path, message });
  }

  string(path: string, opts: { required?: boolean; min?: number; max?: number; trim?: boolean } = {}) {
    const raw = this.body[path];
    const { required = true, min, max, trim = true } = opts;
    if (raw === undefined || raw === null || raw === '') {
      if (required) this.add(path, `${path} is required`);
      return this;
    }
    if (typeof raw !== 'string') {
      this.add(path, `${path} must be a string`);
      return this;
    }
    const value = trim ? raw.trim() : raw;
    if (min !== undefined && value.length < min) this.add(path, `${path} must be at least ${min} characters`);
    if (max !== undefined && value.length > max) this.add(path, `${path} must be at most ${max} characters`);
    this.out[path] = value;
    return this;
  }

  email(path = 'email') {
    const raw = this.body[path];
    if (typeof raw !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim())) {
      this.add(path, 'A valid email address is required');
      return this;
    }
    this.out[path] = raw.trim().toLowerCase();
    return this;
  }

  phone(path = 'phone') {
    const raw = this.body[path];
    if (typeof raw !== 'string' || !/^[+()\-\s0-9]{7,18}$/.test(raw.trim())) {
      this.add(path, 'A valid phone number is required');
      return this;
    }
    this.out[path] = raw.trim();
    return this;
  }

  number(
    path: string,
    opts: { required?: boolean; min?: number; max?: number; integer?: boolean } = {},
  ) {
    const raw = this.body[path];
    const { required = true, min, max, integer } = opts;
    if (raw === undefined || raw === null || raw === '') {
      if (required) this.add(path, `${path} is required`);
      return this;
    }
    const value = typeof raw === 'string' ? Number(raw) : raw;
    if (typeof value !== 'number' || Number.isNaN(value)) {
      this.add(path, `${path} must be a number`);
      return this;
    }
    if (integer && !Number.isInteger(value)) this.add(path, `${path} must be a whole number`);
    if (min !== undefined && value < min) this.add(path, `${path} must be >= ${min}`);
    if (max !== undefined && value > max) this.add(path, `${path} must be <= ${max}`);
    this.out[path] = value;
    return this;
  }

  enum<T extends string>(path: string, allowed: readonly T[], opts: { required?: boolean } = {}) {
    const raw = this.body[path];
    const { required = true } = opts;
    if (raw === undefined || raw === null || raw === '') {
      if (required) this.add(path, `${path} is required`);
      return this;
    }
    if (typeof raw !== 'string' || !allowed.includes(raw as T)) {
      this.add(path, `${path} must be one of: ${allowed.join(', ')}`);
      return this;
    }
    this.out[path] = raw;
    return this;
  }

  hhmm(path: string, opts: { required?: boolean } = {}) {
    const raw = this.body[path];
    const { required = true } = opts;
    if (raw === undefined || raw === null || raw === '') {
      if (required) this.add(path, `${path} is required`);
      return this;
    }
    if (typeof raw !== 'string' || !/^([01]?\d|2[0-3]):[0-5]\d$/.test(raw.trim())) {
      this.add(path, `${path} must be a time in HH:mm format`);
      return this;
    }
    this.out[path] = raw.trim();
    return this;
  }

  isoDate(path: string, opts: { required?: boolean } = {}) {
    const raw = this.body[path];
    const { required = true } = opts;
    if (raw === undefined || raw === null || raw === '') {
      if (required) this.add(path, `${path} is required`);
      return this;
    }
    const d = new Date(raw as string);
    if (Number.isNaN(d.getTime())) {
      this.add(path, `${path} must be a valid date/time`);
      return this;
    }
    this.out[path] = d;
    return this;
  }

  boolean(path: string) {
    const raw = this.body[path];
    if (raw === undefined || raw === null) return this;
    this.out[path] = raw === true || raw === 'true';
    return this;
  }

  stringArray(path: string, allowed?: readonly string[]) {
    const raw = this.body[path];
    if (raw === undefined || raw === null) {
      this.out[path] = [];
      return this;
    }
    if (!Array.isArray(raw)) {
      this.add(path, `${path} must be a list`);
      return this;
    }
    const values = raw.filter((v): v is string => typeof v === 'string');
    if (allowed) {
      const invalid = values.filter((v) => !allowed.includes(v));
      if (invalid.length) this.add(path, `${path} contains invalid values: ${invalid.join(', ')}`);
    }
    this.out[path] = values;
    return this;
  }

  custom(condition: boolean, path: string, message: string) {
    if (!condition) this.add(path, message);
    return this;
  }

  /** Throws if any issue was collected; otherwise returns the cleaned values. */
  done<T = Record<string, unknown>>(): T {
    if (this.issues.length) {
      throw ApiError.badRequest('Validation failed', 'VALIDATION_ERROR', this.issues);
    }
    return this.out as T;
  }
}
