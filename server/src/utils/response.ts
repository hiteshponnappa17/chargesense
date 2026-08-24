import type { Response } from 'express';

/** Standard success envelope: { success: true, data, ...meta } */
export function sendSuccess<T>(
  res: Response,
  data: T,
  status = 200,
  meta?: Record<string, unknown>,
): Response {
  return res.status(status).json({ success: true, data, ...(meta ?? {}) });
}
