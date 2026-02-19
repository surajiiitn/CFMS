import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, authStorage, HttpError } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import type { User } from "@/types/cfms";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  sendRegistrationOtp: (name: string, email: string, password: string) => Promise<{ resendAfter: number }>;
  verifyRegistrationOtp: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  switchRole: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(authStorage.getToken());
  const [loading, setLoading] = useState(true);

  const applySession = (nextToken: string, nextUser: User) => {
    authStorage.setToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
    connectSocket(nextToken);
  };

  const clearSession = () => {
    authStorage.clearToken();
    setToken(null);
    setUser(null);
    disconnectSocket();
  };

  const refreshUser = async () => {
    if (!authStorage.getToken()) {
      clearSession();
      return;
    }

    const data = await api.auth.me();
    setUser(data.user);
  };

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const existingToken = authStorage.getToken();
      if (!existingToken) {
        if (mounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const data = await api.auth.me();
        if (!mounted) return;
        setToken(existingToken);
        setUser(data.user);
        connectSocket(existingToken);
      } catch {
        if (!mounted) return;
        clearSession();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    bootstrap();

    const unauthorizedHandler = () => {
      if (mounted) {
        clearSession();
      }
    };

    window.addEventListener("cfms:unauthorized", unauthorizedHandler);

    return () => {
      mounted = false;
      window.removeEventListener("cfms:unauthorized", unauthorizedHandler);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.auth.login({ email, password });
    applySession(data.token, data.user);
  };

  const sendRegistrationOtp = async (name: string, email: string, password: string) => {
    const data = await api.auth.sendOtp({ name, email, password });
    return {
      resendAfter: data.resendAfter,
    };
  };

  const verifyRegistrationOtp = async (email: string, otp: string) => {
    const data = await api.auth.verifyOtp({ email, otp });
    applySession(data.token, data.user);
  };

  const logout = () => {
    clearSession();
  };

  const switchRole = async () => {
    if (!token) return;

    try {
      const data = await api.auth.switchRole();
      setUser(data.user);
    } catch (error) {
      if (error instanceof HttpError && error.status === 401) {
        clearSession();
      }
      throw error;
    }
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      sendRegistrationOtp,
      verifyRegistrationOtp,
      logout,
      switchRole,
      refreshUser,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
