import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import type { AuthedRequest } from '../middleware/types';
import { validateRegister, validateLogin, validateUpdateProfile } from '../validators/auth.validators';
import { registerUser, loginUser, getUserById, updateProfile } from '../services/auth.service';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = validateRegister(req.body ?? {});
  const result = await registerUser(input);
  return sendSuccess(res, result, 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = validateLogin(req.body ?? {});
  const result = await loginUser(input);
  return sendSuccess(res, result, 200);
});

export const me = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const user = await getUserById(req.user!.id);
  return sendSuccess(res, { user });
});

export const patchProfile = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const input = validateUpdateProfile(req.body ?? {});
  const user = await updateProfile(req.user!.id, input);
  return sendSuccess(res, { user });
});
