import { io, Socket } from "socket.io-client";
import type { ChatMsg } from "@/types/cfms";
import {
  markBackendReachable,
  markBackendUnreachable,
  setSocketConnected,
  setSocketExpected,
} from "@/lib/connection";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

const isLoopbackHost = (hostname: string) => LOOPBACK_HOSTS.has(hostname);

const rewriteLoopbackUrlForRuntimeHost = (value: string) => {
  if (typeof window === "undefined") return value;

  try {
    const url = new URL(value);
    const runtimeHostname = window.location.hostname;
    if (isLoopbackHost(url.hostname) && !isLoopbackHost(runtimeHostname)) {
      url.hostname = runtimeHostname;
      return url.toString();
    }
  } catch {
    return value;
  }

  return value;
};

const resolveDefaultSocketUrl = () => {
  if (typeof window === "undefined") return "http://localhost:5000";

  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  const hostname = window.location.hostname || "localhost";
  return `${protocol}//${hostname}:5000`;
};

const resolveSocketUrl = () => {
  const configuredSocketUrl = import.meta.env.VITE_SOCKET_URL;
  if (configuredSocketUrl) return rewriteLoopbackUrlForRuntimeHost(configuredSocketUrl);

  const configuredApiUrl = import.meta.env.VITE_API_URL;
  if (configuredApiUrl) {
    const derivedUrl = configuredApiUrl.endsWith("/api")
      ? configuredApiUrl.slice(0, -4)
      : configuredApiUrl;
    return rewriteLoopbackUrlForRuntimeHost(derivedUrl);
  }

  return resolveDefaultSocketUrl();
};

const socketUrl = resolveSocketUrl();

let socket: Socket | null = null;

const bindConnectionEvents = (targetSocket: Socket) => {
  targetSocket.off("connect");
  targetSocket.off("disconnect");
  targetSocket.off("connect_error");

  targetSocket.on("connect", () => {
    setSocketConnected(true);
    markBackendReachable();
  });

  targetSocket.on("disconnect", () => {
    setSocketConnected(false);
  });

  targetSocket.on("connect_error", () => {
    setSocketConnected(false);
    markBackendUnreachable();
  });
};

export const getSocket = () => socket;

export const connectSocket = (token: string) => {
  setSocketExpected(true);

  if (socket) {
    socket.auth = { token };

    if (!socket.connected) {
      socket.connect();
    }

    return socket;
  }

  socket = io(socketUrl, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 15000,
  });

  bindConnectionEvents(socket);

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    setSocketExpected(false);
    socket = null;
  }
};

export const joinWorkspaceRoom = (workspaceId: string) =>
  new Promise<void>((resolve, reject) => {
    if (!socket) return reject(new Error("Socket not connected"));

    socket.emit("workspace:join", { workspaceId }, (response: { success: boolean; message?: string }) => {
      if (!response?.success) {
        reject(new Error(response?.message || "Unable to join workspace"));
        return;
      }
      resolve();
    });
  });

export const leaveWorkspaceRoom = (workspaceId: string) => {
  if (!socket) return;
  socket.emit("workspace:leave", { workspaceId });
};

export const sendWorkspaceSocketMessage = (workspaceId: string, text: string) =>
  new Promise<ChatMsg>((resolve, reject) => {
    if (!socket) return reject(new Error("Socket not connected"));

    socket.emit(
      "workspace:message",
      { workspaceId, text },
      (response: { success: boolean; data?: ChatMsg; message?: string }) => {
        if (!response?.success || !response.data) {
          reject(new Error(response?.message || "Unable to send message"));
          return;
        }
        resolve(response.data);
      }
    );
  });
