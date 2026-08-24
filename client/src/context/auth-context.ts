import { createContext } from 'react';
import type { Role, User } from '@/types';

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
}

export interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
