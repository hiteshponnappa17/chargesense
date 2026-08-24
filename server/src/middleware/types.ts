import type { Request } from 'express';
import type { Role } from '../utils/constants';

export interface AuthUser {
  id: string;
  role: Role;
  email: string;
}

export interface AuthedRequest extends Request {
  user?: AuthUser;
}
