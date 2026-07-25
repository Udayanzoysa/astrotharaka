"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiRequest } from "@/lib/api";
import type { AuthResponse, User } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  setSession: (session: AuthResponse) => void;
  loginWithToken: (accessToken: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = "taraka_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const setSession = useCallback((session: AuthResponse) => {
    setToken(session.accessToken);
    setUser(session.user);
    window.localStorage.setItem(TOKEN_KEY, session.accessToken);
  }, []);

  const loginWithToken = useCallback(async (accessToken: string) => {
    window.localStorage.setItem(TOKEN_KEY, accessToken);
    setToken(accessToken);
    const me = await apiRequest<User>("/users/me", { token: accessToken });
    setUser(me);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    window.localStorage.removeItem(TOKEN_KEY);
  }, []);

  const refreshMe = useCallback(async () => {
    const stored = window.localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }
    setToken(stored);
    try {
      const me = await apiRequest<User>("/users/me", { token: stored });
      setUser(me);
    } catch {
      window.localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  const value = useMemo(
    () => ({ user, token, loading, setSession, loginWithToken, logout, refreshMe }),
    [user, token, loading, setSession, loginWithToken, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
