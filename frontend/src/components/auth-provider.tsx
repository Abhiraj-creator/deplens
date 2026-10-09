"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, setAccessToken } from "../lib/api";

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: "user" | "admin";
  createdAt: string;
  updatedAt: string;
};
type AuthContext = {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};
const Context = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hydrate = async () => {
    try {
      const refreshed = await api<{ accessToken: string }>(
        "/api/v1/auth/refresh",
        { method: "POST" },
      );
      setAccessToken(refreshed.accessToken);
      const data = await api<{ user: User }>("/api/v1/auth/me");
      setUser(data.user);
    } catch {
      setAccessToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: hydration intentionally runs once on mount
  useEffect(() => {
    void hydrate();
  }, []);
  const value = useMemo<AuthContext>(
    () => ({
      user,
      loading,
      error,
      login: async (email, password) => {
        setError(null);
        try {
          const data = await api<{ user: User; accessToken: string }>(
            "/api/v1/auth/login",
            { method: "POST", body: JSON.stringify({ email, password }) },
          );
          setAccessToken(data.accessToken);
          setUser(data.user);
        } catch (e) {
          const message = e instanceof Error ? e.message : "Unable to sign in";
          setError(message);
          throw e;
        }
      },
      register: async (name, email, password) => {
        setError(null);
        try {
          const data = await api<{ user: User; accessToken: string }>(
            "/api/v1/auth/register",
            { method: "POST", body: JSON.stringify({ name, email, password }) },
          );
          setAccessToken(data.accessToken);
          setUser(data.user);
        } catch (e) {
          const message = e instanceof Error ? e.message : "Unable to register";
          setError(message);
          throw e;
        }
      },
      logout: async () => {
        await api("/api/v1/auth/logout", { method: "POST" });
        setAccessToken(null);
        setUser(null);
      },
    }),
    [user, loading, error],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
