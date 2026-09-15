import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import * as authApi from "../api/auth";
import { clearToken, getToken, setToken } from "../api/client";
import type { CurrentUser } from "../types";

interface AuthContextValue {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: authApi.RegisterInput) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [hasToken, setHasToken] = useState(() => Boolean(getToken()));
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await authApi.getMe()).data,
    enabled: hasToken,
    retry: false,
  });

  useEffect(() => {
    // A stored token that the backend rejects (expired, or the user was
    // deleted) shouldn't leave the app stuck "loading forever" — treat it
    // as logged out.
    if (hasToken && isError) {
      clearToken();
      setHasToken(false);
    }
  }, [hasToken, isError]);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    setToken(data.token);
    setHasToken(true);
    await queryClient.invalidateQueries({ queryKey: ["me"] });
  };

  const register = async (input: authApi.RegisterInput) => {
    const { data } = await authApi.register(input);
    setToken(data.token);
    setHasToken(true);
    await queryClient.invalidateQueries({ queryKey: ["me"] });
  };

  const loginWithGoogle = async (credential: string) => {
    const { data } = await authApi.googleLogin(credential);
    setToken(data.token);
    setHasToken(true);
    await queryClient.invalidateQueries({ queryKey: ["me"] });
  };

  const logout = () => {
    clearToken();
    setHasToken(false);
    queryClient.clear();
  };

  const value: AuthContextValue = {
    user: user ?? null,
    isAuthenticated: hasToken && Boolean(user),
    isLoading: hasToken && isLoading,
    login,
    register,
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
