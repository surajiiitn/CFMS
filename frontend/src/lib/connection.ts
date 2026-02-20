export type ConnectionStatus = "connected" | "degraded" | "offline";

export type ConnectionSnapshot = {
  browserOnline: boolean;
  backendReachable: boolean;
  socketExpected: boolean;
  socketConnected: boolean;
  lastSuccessfulAt: number | null;
  lastErrorAt: number | null;
  status: ConnectionStatus;
};

type Listener = (snapshot: ConnectionSnapshot) => void;

const getInitialBrowserOnline = () => {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
};

let state: ConnectionSnapshot = {
  browserOnline: getInitialBrowserOnline(),
  backendReachable: true,
  socketExpected: false,
  socketConnected: false,
  lastSuccessfulAt: null,
  lastErrorAt: null,
  status: "degraded",
};

const listeners = new Set<Listener>();

const deriveStatus = (snapshot: ConnectionSnapshot): ConnectionStatus => {
  if (!snapshot.browserOnline) return "offline";
  if (!snapshot.backendReachable) return "offline";
  if (snapshot.socketExpected && !snapshot.socketConnected) return "degraded";
  return "connected";
};

const emit = () => {
  for (const listener of listeners) {
    listener(state);
  }
};

const updateState = (next: Partial<ConnectionSnapshot>) => {
  state = {
    ...state,
    ...next,
  };
  state.status = deriveStatus(state);
  emit();
};

export const getConnectionSnapshot = () => state;

export const subscribeConnection = (listener: Listener) => {
  listeners.add(listener);
  listener(state);

  return () => {
    listeners.delete(listener);
  };
};

export const setBrowserOnline = (online: boolean) => {
  updateState({
    browserOnline: online,
    ...(online ? {} : { backendReachable: false, socketConnected: false, lastErrorAt: Date.now() }),
  });
};

export const markBackendReachable = () => {
  updateState({
    backendReachable: true,
    lastSuccessfulAt: Date.now(),
  });
};

export const markBackendUnreachable = () => {
  updateState({
    backendReachable: false,
    lastErrorAt: Date.now(),
  });
};

export const setSocketConnected = (connected: boolean) => {
  updateState({ socketConnected: connected });
};

export const setSocketExpected = (expected: boolean) => {
  updateState({
    socketExpected: expected,
    ...(expected ? {} : { socketConnected: false }),
  });
};
