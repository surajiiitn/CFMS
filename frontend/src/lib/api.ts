import type {
  ChatMsg,
  Job,
  NotificationItem,
  Proposal,
  Review,
  User,
  Workspace,
} from "@/types/cfms";
import { markBackendReachable, markBackendUnreachable } from "@/lib/connection";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

const isLoopbackHost = (hostname: string) => LOOPBACK_HOSTS.has(hostname);

const resolveDefaultApiBaseUrl = () => {
  if (typeof window === "undefined") return "http://localhost:5000/api";

  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  const hostname = window.location.hostname || "localhost";
  return `${protocol}//${hostname}:5000/api`;
};

const resolveApiBaseUrl = () => {
  const configuredApiUrl = import.meta.env.VITE_API_URL;
  if (!configuredApiUrl) return resolveDefaultApiBaseUrl();
  if (typeof window === "undefined") return configuredApiUrl;

  try {
    const configuredUrl = new URL(configuredApiUrl);
    const runtimeHostname = window.location.hostname;
    if (isLoopbackHost(configuredUrl.hostname) && !isLoopbackHost(runtimeHostname)) {
      configuredUrl.hostname = runtimeHostname;
      return configuredUrl.toString();
    }
  } catch {
    return configuredApiUrl;
  }

  return configuredApiUrl;
};

const API_BASE_URL = resolveApiBaseUrl();
const TOKEN_KEY = "cfms_token";
const MAX_RETRIES = 2;
const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
const BASE_RETRY_DELAY_MS = 300;
const URL_PATTERN = /https?:\/\/[^\s)]+/gi;
const SENSITIVE_MESSAGE_PATTERN =
  /(localhost|127\.0\.0\.1|backend|stack|exception|trace|mongodb|postgres|redis|econn|enotfound|cors|vite_api_url)/i;

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  token?: string | null;
  skipAuthRedirect?: boolean;
};

export class HttpError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data: unknown = null) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
};

const buildUrl = (path: string, params?: Record<string, string | number | boolean | undefined>) => {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
};

const sleep = (ms: number) => new Promise((resolve) => globalThis.setTimeout(resolve, ms));

const sanitizeBackendMessage = (rawMessage?: string | null) => {
  const cleaned = String(rawMessage || "")
    .trim()
    .replace(URL_PATTERN, "[redacted]");

  if (!cleaned) return "";
  if (SENSITIVE_MESSAGE_PATTERN.test(cleaned)) return "";
  return cleaned;
};

const toUserFacingErrorMessage = ({
  path,
  status,
  rawMessage,
  network = false,
}: {
  path: string;
  status: number;
  rawMessage?: string | null;
  network?: boolean;
}) => {
  if (network) {
    return "Unable to connect to the server. Please try again.";
  }

  if (path === "/auth/login") {
    if (status === 401) return "Invalid email or password.";
    if (status === 429) return "Too many login attempts. Please wait and try again.";
    return sanitizeBackendMessage(rawMessage) || "Unable to sign in right now. Please try again.";
  }

  const sanitized = sanitizeBackendMessage(rawMessage);
  if (sanitized) return sanitized;

  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You are not allowed to perform this action.";
  if (status === 404) return "Requested resource was not found.";
  if (status >= 500) return "Something went wrong on the server. Please try again.";
  return "Request failed. Please try again.";
};

const request = async <T>(
  path: string,
  { method = "GET", body, token, skipAuthRedirect = false }: RequestOptions = {},
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> => {
  const resolvedToken = token ?? authStorage.getToken();
  const requestUrl = buildUrl(path, params);
  const maxAttempts = MAX_RETRIES + 1;
  const canRetryThisRequest = method === "GET";

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    let response: Response;

    try {
      response = await fetch(requestUrl, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      markBackendReachable();
    } catch {
      markBackendUnreachable();

      if (canRetryThisRequest && attempt < maxAttempts - 1) {
        await sleep(BASE_RETRY_DELAY_MS * (attempt + 1));
        continue;
      }

      throw new HttpError(
        0,
        toUserFacingErrorMessage({
          path,
          status: 0,
          network: true,
        })
      );
    }

    let payload: ApiEnvelope<T> | null = null;
    try {
      payload = (await response.json()) as ApiEnvelope<T>;
    } catch {
      payload = null;
    }

    if (response.status >= 500) {
      markBackendUnreachable();
    }

    const failedRequest = !response.ok || !payload?.success;
    const canRetry =
      canRetryThisRequest && RETRYABLE_STATUSES.has(response.status) && attempt < maxAttempts - 1;
    if (failedRequest && canRetry) {
      await sleep(BASE_RETRY_DELAY_MS * (attempt + 1));
      continue;
    }

    if (failedRequest) {
      const message = toUserFacingErrorMessage({
        path,
        status: response.status,
        rawMessage: payload?.message,
      });

      if (response.status === 401 && !skipAuthRedirect) {
        authStorage.clearToken();
        window.dispatchEvent(new CustomEvent("cfms:unauthorized"));
      }

      throw new HttpError(response.status, message, payload?.data ?? null);
    }

    return payload.data;
  }

  throw new HttpError(0, "Request failed after multiple retries. Please try again.");
};

export const pingBackend = async (signal?: AbortSignal) => {
  const healthUrl = buildUrl("/health");

  try {
    const response = await fetch(healthUrl, {
      method: "GET",
      signal,
    });

    if (!response.ok) {
      markBackendUnreachable();
      return false;
    }

    const payload = (await response.json().catch(() => null)) as ApiEnvelope<{ uptime: number }> | null;
    if (!payload?.success) {
      markBackendUnreachable();
      return false;
    }

    markBackendReachable();
    return true;
  } catch {
    markBackendUnreachable();
    return false;
  }
};

export const api = {
  auth: {
    sendOtp: (input: { name: string; email: string; password: string }) =>
      request<{ email: string; expiresIn: number; resendAfter: number }>("/auth/send-otp", {
        method: "POST",
        body: input,
        skipAuthRedirect: true,
      }),

    verifyOtp: (input: { email: string; otp: string }) =>
      request<{ token: string; user: User }>("/auth/verify-otp", {
        method: "POST",
        body: input,
        skipAuthRedirect: true,
      }),

    login: (input: { email: string; password: string }) =>
      request<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: input,
        skipAuthRedirect: true,
      }),

    me: () => request<{ user: User }>("/auth/me"),

    switchRole: (role?: "poster" | "freelancer") =>
      request<{ user: User }>("/auth/switch-role", {
        method: "PATCH",
        body: role ? { role } : {},
      }),
  },

  dashboard: {
    summary: () =>
      request<{
        role: "poster" | "freelancer";
        stats: Record<string, number>;
        recentJobs: Job[];
      }>("/dashboard/summary"),
  },

  jobs: {
    list: (params?: {
      search?: string;
      status?: string;
      skills?: string;
      page?: number;
      limit?: number;
      mine?: boolean;
      assignedToMe?: boolean;
    }) => request<{ items: Job[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>("/jobs", {}, params),

    getById: (jobId: string) => request<{ job: Job }>(`/jobs/${jobId}`),

    create: (input: {
      title: string;
      description: string;
      skills: string[];
      budget: number;
      deadline: string;
      deliverables: string;
      referenceLinks?: string[];
    }) => request<{ job: Job }>("/jobs", { method: "POST", body: input }),

    update: (
      jobId: string,
      input: Partial<{
        title: string;
        description: string;
        skills: string[];
        budget: number;
        deadline: string;
        deliverables: string;
        referenceLinks: string[];
      }>
    ) => request<{ job: Job }>(`/jobs/${jobId}`, { method: "PATCH", body: input }),

    remove: (jobId: string) => request<null>(`/jobs/${jobId}`, { method: "DELETE" }),

    apply: (jobId: string, input: { approach: string; timeline: string; quote: number }) =>
      request<{ proposal: Proposal }>(`/jobs/${jobId}/proposals`, { method: "POST", body: input }),

    listProposals: (jobId: string) => request<{ proposals: Proposal[] }>(`/jobs/${jobId}/proposals`),

    updateProposalStatus: (jobId: string, proposalId: string, action: "accept" | "reject") =>
      request<{ proposal: Proposal; workspaceId?: string }>(`/jobs/${jobId}/proposals/${proposalId}/status`, {
        method: "PATCH",
        body: { action },
      }),

    myProposals: () =>
      request<{
        proposals: Array<
          Proposal & {
            jobId: string;
            jobTitle: string;
            jobStatus: string;
          }
        >;
      }>("/jobs/my-proposals"),
  },

  users: {
    getMe: () => request<{ user: User }>("/users/me"),
    updateMe: (input: Partial<User>) => request<{ user: User }>("/users/me", { method: "PATCH", body: input }),
    getReviews: (userId: string) => request<{ reviews: Review[] }>(`/users/${userId}/reviews`),
  },

  workspaces: {
    listMine: () => request<{ workspaces: Workspace[] }>("/workspaces"),
    getById: (workspaceId: string) => request<{ workspace: Workspace; messages: ChatMsg[] }>(`/workspaces/${workspaceId}`),
    messages: (workspaceId: string) => request<{ messages: ChatMsg[] }>(`/workspaces/${workspaceId}/messages`),
    sendMessage: (workspaceId: string, text: string) =>
      request<{ message: ChatMsg }>(`/workspaces/${workspaceId}/messages`, { method: "POST", body: { text } }),
    addResource: (workspaceId: string, url: string) =>
      request<{ resources: Workspace["resources"] }>(`/workspaces/${workspaceId}/resources`, {
        method: "POST",
        body: { url },
      }),
    start: (workspaceId: string) =>
      request<{ jobStatus: string }>(`/workspaces/${workspaceId}/start`, { method: "POST", body: {} }),
    submit: (workspaceId: string, input: { link: string; notes?: string }) =>
      request<{ submission: Workspace["submission"]; jobStatus: string }>(`/workspaces/${workspaceId}/submit`, {
        method: "POST",
        body: input,
      }),
    reopen: (workspaceId: string) =>
      request<{ jobStatus: string; submission: Workspace["submission"] }>(`/workspaces/${workspaceId}/reopen`, {
        method: "POST",
        body: {},
      }),
    approve: (workspaceId: string) =>
      request<{ approvedAt: string; jobStatus: string; workspaceRemoved?: boolean }>(`/workspaces/${workspaceId}/approve`, {
        method: "POST",
        body: {},
      }),
    review: (workspaceId: string, input: { toUserId?: string; rating: number; comment?: string }) =>
      request<{ review: Review; workspaceRemoved?: boolean }>(`/workspaces/${workspaceId}/reviews`, {
        method: "POST",
        body: input,
      }),
  },

  notifications: {
    list: () => request<{ notifications: NotificationItem[]; unreadCount: number }>("/notifications"),
    markRead: (notificationId: string) =>
      request<null>(`/notifications/${notificationId}/read`, { method: "PATCH", body: {} }),
    markAllRead: () => request<null>("/notifications/read-all", { method: "PATCH", body: {} }),
  },
};
