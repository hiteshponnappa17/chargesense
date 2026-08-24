import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { User, type UserDoc } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { signToken } from '../utils/jwt';
import type { Role } from '../utils/constants';

const SALT_ROUNDS = 10;

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  defaultCarModelId: string | null;
  vehicleRegistration: string | null;
  createdAt: Date;
}

export function toPublicUser(user: UserDoc | Record<string, any>): PublicUser {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    defaultCarModelId: user.defaultCarModelId ? String(user.defaultCarModelId) : null,
    vehicleRegistration: user.vehicleRegistration ?? null,
    createdAt: user.createdAt,
  };
}

export async function registerUser(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
}): Promise<{ user: PublicUser; token: string }> {
  const existing = await User.findOne({ email: input.email }).lean();
  if (existing) {
    throw ApiError.conflict('An account with this email already exists', 'EMAIL_TAKEN');
  }
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await User.create({
    name: input.name,
    email: input.email,
    phone: input.phone,
    passwordHash,
    role: input.role,
  });
  const token = signToken({ sub: String(user._id), role: user.role as Role, email: user.email });
  return { user: toPublicUser(user), token };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<{ user: PublicUser; token: string }> {
  const user = await User.findOne({ email: input.email }).select('+passwordHash');
  if (!user) throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  const token = signToken({ sub: String(user._id), role: user.role as Role, email: user.email });
  return { user: toPublicUser(user), token };
}

export async function getUserById(userId: string): Promise<PublicUser> {
  const user = await User.findById(userId).lean();
  if (!user) throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
  return toPublicUser(user);
}

export async function updateProfile(
  userId: string,
  data: { name?: string; phone?: string; defaultCarModelId?: string | null; vehicleRegistration?: string | null },
): Promise<PublicUser> {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
  if (data.name !== undefined) user.name = data.name;
  if (data.phone !== undefined) user.phone = data.phone;
  if (data.vehicleRegistration !== undefined) user.vehicleRegistration = data.vehicleRegistration;
  if (data.defaultCarModelId !== undefined) {
    user.defaultCarModelId = data.defaultCarModelId ? new Types.ObjectId(data.defaultCarModelId) : null;
  }
  await user.save();
  return toPublicUser(user);
}
