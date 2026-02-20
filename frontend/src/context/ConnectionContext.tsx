import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { pingBackend } from "@/lib/api";
import {
  ConnectionSnapshot,
  getConnectionSnapshot,
  setBrowserOnline,
  subscribeConnection,
} from "@/lib/connection";

type ConnectionContextValue = ConnectionSnapshot & {
  checking: boolean;
  lastCheckedAt: number | null;
  checkNow: () => Promise<void>;
};

const ConnectionContext = createContext<ConnectionContextValue | undefined>(undefined);

export const ConnectionProvider = ({ children }: { children: React.ReactNode }) => {
  const [snapshot, setSnapshot] = useState<ConnectionSnapshot>(getConnectionSnapshot());
  const [checking, setChecking] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);

  const checkNow = useCallback(async () => {
    setChecking(true);

    try {
      await pingBackend();
    } finally {
      setChecking(false);
      setLastCheckedAt(Date.now());
    }
  }, []);

  useEffect(() => subscribeConnection(setSnapshot), []);

  useEffect(() => {
    const onOnline = () => {
      setBrowserOnline(true);
      checkNow().catch(() => null);
    };

    const onOffline = () => {
      setBrowserOnline(false);
    };

    setBrowserOnline(typeof navigator !== "undefined" ? navigator.onLine : true);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [checkNow]);

  useEffect(() => {
    checkNow().catch(() => null);

    const interval = window.setInterval(() => {
      checkNow().catch(() => null);
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [checkNow]);

  const value = useMemo(
    () => ({
      ...snapshot,
      checking,
      lastCheckedAt,
      checkNow,
    }),
    [snapshot, checking, lastCheckedAt, checkNow]
  );

  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
};

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (!context) throw new Error("useConnection must be used within ConnectionProvider");
  return context;
};
