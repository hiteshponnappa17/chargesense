import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setUnauthorizedHandler, tokenStore } from '@/lib/api';
import * as authService from '@/services/auth.service';
import type { User } from '@/types';
import { AuthContext, type RegisterInput } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  // Restore the session from a stored token on first load.
  useEffect(() => {
    let active = true;
    const token = tokenStore.get();
    if (!token) {
      setInitializing(false);
      return;
    }
    authService
      .fetchMe()
      .then((u) => {
        if (active) setUser(u);
      })
      .catch(() => {
        tokenStore.clear();
      })
      .finally(() => {
        if (active) setInitializing(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // If the API rejects our token mid-session, drop back to logged-out state.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      authService.logout();
      setUser(null);
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: u } = await authService.login({ email, password });
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const { user: u } = await authService.register(input);
    setUser(u);
    return u;
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      setUser,
    }),
    [user, initializing, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
