import type {
  ChatMessage,
  StreamEvent,
  UserProfile,
  Machine,
  MemoryEntry,
  FileEntry,
  AIModel,
  APIError,
} from "@shogun/shared/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("shogun_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as APIError | null;
    throw {
      code: body?.code ?? "UNKNOWN",
      message: body?.message ?? res.statusText,
      status: res.status,
    } satisfies APIError;
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// SSE stream helper
// ---------------------------------------------------------------------------

export async function streamChat(
  conversationId: string,
  message: string,
  model: AIModel,
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/chat/${conversationId}/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, model }),
    signal,
  });

  if (!res.ok || !res.body) {
    throw { code: "STREAM_ERROR", message: "Failed to open stream", status: res.status } satisfies APIError;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return;
      try {
        const event = JSON.parse(data) as StreamEvent;
        onEvent(event);
      } catch {
        // skip malformed lines
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const api = {
  auth: {
    login(email: string, password: string) {
      return request<{ token: string; user: UserProfile }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    },
    signup(email: string, password: string) {
      return request<{ token: string; user: UserProfile }>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    },
    me() {
      return request<UserProfile>("/api/auth/me");
    },
    checkHandle(handle: string) {
      return request<{ available: boolean }>(`/api/auth/check-handle?handle=${encodeURIComponent(handle)}`);
    },
    completeOnboarding(data: {
      handle: string;
      apiKeys?: Record<string, string>;
    }) {
      return request<UserProfile>("/api/auth/onboarding", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },

  // -------------------------------------------------------------------------
  // Profile
  // -------------------------------------------------------------------------
  profile: {
    get() {
      return request<UserProfile>("/api/profile");
    },
    update(data: Partial<UserProfile>) {
      return request<UserProfile>("/api/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    deleteAccount() {
      return request<void>("/api/profile", { method: "DELETE" });
    },
  },

  // -------------------------------------------------------------------------
  // Chat
  // -------------------------------------------------------------------------
  chat: {
    listConversations() {
      return request<{ id: string; title: string; pinned: boolean; lastMessageAt: string; preview?: string }[]>(
        "/api/chat/conversations",
      );
    },
    createConversation(title?: string) {
      return request<{ id: string; title: string }>("/api/chat/conversations", {
        method: "POST",
        body: JSON.stringify({ title }),
      });
    },
    getConversation(id: string) {
      return request<{ id: string; title: string; messages: ChatMessage[] }>(`/api/chat/conversations/${id}`);
    },
    renameConversation(id: string, title: string) {
      return request<void>(`/api/chat/conversations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      });
    },
    deleteConversation(id: string) {
      return request<void>(`/api/chat/conversations/${id}`, { method: "DELETE" });
    },
    pinConversation(id: string, pinned: boolean) {
      return request<void>(`/api/chat/conversations/${id}/pin`, {
        method: "PATCH",
        body: JSON.stringify({ pinned }),
      });
    },
    stream: streamChat,
  },

  // -------------------------------------------------------------------------
  // Machine
  // -------------------------------------------------------------------------
  machine: {
    get() {
      return request<Machine>("/api/machine");
    },
    wake() {
      return request<Machine>("/api/machine/wake", { method: "POST" });
    },
    stop() {
      return request<Machine>("/api/machine/stop", { method: "POST" });
    },
  },

  // -------------------------------------------------------------------------
  // Files
  // -------------------------------------------------------------------------
  files: {
    list(path: string) {
      return request<FileEntry[]>(`/api/files?path=${encodeURIComponent(path)}`);
    },
    createFolder(path: string) {
      return request<void>("/api/files/folder", {
        method: "POST",
        body: JSON.stringify({ path }),
      });
    },
    delete(path: string) {
      return request<void>(`/api/files?path=${encodeURIComponent(path)}`, { method: "DELETE" });
    },
    rename(oldPath: string, newPath: string) {
      return request<void>("/api/files/rename", {
        method: "POST",
        body: JSON.stringify({ oldPath, newPath }),
      });
    },
    getUploadUrl(path: string) {
      return request<{ url: string }>("/api/files/upload-url", {
        method: "POST",
        body: JSON.stringify({ path }),
      });
    },
    getDownloadUrl(path: string) {
      return request<{ url: string }>(`/api/files/download-url?path=${encodeURIComponent(path)}`);
    },
    read(path: string) {
      return request<{ content: string; encoding: string }>(`/api/files/read?path=${encodeURIComponent(path)}`);
    },
    write(path: string, content: string) {
      return request<void>("/api/files/write", {
        method: "POST",
        body: JSON.stringify({ path, content }),
      });
    },
  },

  // -------------------------------------------------------------------------
  // Memory
  // -------------------------------------------------------------------------
  memory: {
    list(params?: { source?: string; cursor?: string; limit?: number }) {
      const qs = new URLSearchParams();
      if (params?.source) qs.set("source", params.source);
      if (params?.cursor) qs.set("cursor", params.cursor);
      if (params?.limit) qs.set("limit", String(params.limit));
      return request<{ entries: MemoryEntry[]; nextCursor?: string }>(`/api/memory?${qs}`);
    },
    search(query: string) {
      return request<MemoryEntry[]>(`/api/memory/search?q=${encodeURIComponent(query)}`);
    },
    delete(id: string) {
      return request<void>(`/api/memory/${id}`, { method: "DELETE" });
    },
    exportUrl(format: "json" | "csv", from?: string, to?: string) {
      const qs = new URLSearchParams({ format });
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      const token = getToken();
      return `${API_BASE}/api/memory/export?${qs}${token ? `&token=${token}` : ""}`;
    },
    updateSettings(settings: { captureEnabled: boolean; intervalSeconds: number; retentionDays: number; excludedApps: string[] }) {
      return request<void>("/api/memory/settings", {
        method: "PATCH",
        body: JSON.stringify(settings),
      });
    },
  },

  // -------------------------------------------------------------------------
  // Services
  // -------------------------------------------------------------------------
  services: {
    list() {
      return request<{ id: string; name: string; status: string; domain?: string; createdAt: string }[]>("/api/services");
    },
    deploy(config: { name: string; port: number }) {
      return request<{ id: string }>("/api/services", {
        method: "POST",
        body: JSON.stringify(config),
      });
    },
    stop(id: string) {
      return request<void>(`/api/services/${id}/stop`, { method: "POST" });
    },
    delete(id: string) {
      return request<void>(`/api/services/${id}`, { method: "DELETE" });
    },
  },

  // -------------------------------------------------------------------------
  // Automations
  // -------------------------------------------------------------------------
  automations: {
    list() {
      return request<{ id: string; name: string; trigger: string; status: string; lastRunAt?: string; createdAt: string }[]>(
        "/api/automations",
      );
    },
    create(data: { name: string; trigger: string; config: Record<string, unknown> }) {
      return request<{ id: string }>("/api/automations", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    update(id: string, data: Partial<{ name: string; status: string; config: Record<string, unknown> }>) {
      return request<void>(`/api/automations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    delete(id: string) {
      return request<void>(`/api/automations/${id}`, { method: "DELETE" });
    },
  },

  // -------------------------------------------------------------------------
  // Billing
  // -------------------------------------------------------------------------
  billing: {
    getUsage() {
      return request<{
        tier: string;
        billingInterval: string;
        demoCreditsCents: number;
        connectedKeys: string[];
      }>("/api/billing/usage");
    },
    createCheckout(interval: "monthly" | "annual") {
      return request<{ url: string }>("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ interval }),
      });
    },
    getPortalUrl() {
      return request<{ url: string }>("/api/billing/portal");
    },
  },

  // -------------------------------------------------------------------------
  // Teams
  // -------------------------------------------------------------------------
  teams: {
    list() {
      return request<{ id: string; name: string; slug: string; memberCount: number; createdAt: string }[]>(
        "/api/teams",
      );
    },
    create(data: { name: string; slug: string }) {
      return request<{ id: string; name: string; slug: string; memberCount: number; createdAt: string }>(
        "/api/teams",
        { method: "POST", body: JSON.stringify(data) },
      );
    },
    get(id: string) {
      return request<{ id: string; name: string; slug: string; memberCount: number; createdAt: string }>(
        `/api/teams/${id}`,
      );
    },
    update(id: string, data: { name?: string; slug?: string }) {
      return request<void>(`/api/teams/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    delete(id: string) {
      return request<void>(`/api/teams/${id}`, { method: "DELETE" });
    },
    getMembers(id: string) {
      return request<{
        id: string;
        userId: string;
        displayName: string;
        email: string;
        avatarUrl?: string;
        role: string;
        joinedAt: string;
      }[]>(`/api/teams/${id}/members`);
    },
    invite(id: string, data: { email: string; role: string }) {
      return request<{ id: string; email: string; role: string; createdAt: string }>(
        `/api/teams/${id}/invites`,
        { method: "POST", body: JSON.stringify(data) },
      );
    },
    removeMember(id: string, userId: string) {
      return request<void>(`/api/teams/${id}/members/${userId}`, { method: "DELETE" });
    },
    updateRole(id: string, userId: string, role: string) {
      return request<void>(`/api/teams/${id}/members/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
    },
    getInvites(id: string) {
      return request<{ id: string; email: string; role: string; createdAt: string }[]>(
        `/api/teams/${id}/invites`,
      );
    },
    cancelInvite(id: string, inviteId: string) {
      return request<void>(`/api/teams/${id}/invites/${inviteId}`, { method: "DELETE" });
    },
    shareConversation(teamId: string, conversationId: string) {
      return request<{
        id: string;
        conversationId: string;
        title: string;
        sharedBy: string;
        sharedAt: string;
      }>(`/api/teams/${teamId}/shared/conversations`, {
        method: "POST",
        body: JSON.stringify({ conversationId }),
      });
    },
    getSharedConversations(teamId: string) {
      return request<{
        id: string;
        conversationId: string;
        title: string;
        sharedBy: string;
        sharedAt: string;
      }[]>(`/api/teams/${teamId}/shared/conversations`);
    },
    shareMemory(teamId: string, entryId: string) {
      return request<{
        id: string;
        entryId: string;
        content: string;
        source: string;
        sharedBy: string;
        sharedAt: string;
      }>(`/api/teams/${teamId}/shared/memory`, {
        method: "POST",
        body: JSON.stringify({ entryId }),
      });
    },
    getSharedMemory(teamId: string) {
      return request<{
        id: string;
        entryId: string;
        content: string;
        source: string;
        sharedBy: string;
        sharedAt: string;
      }[]>(`/api/teams/${teamId}/shared/memory`);
    },
    getAuditLogs(
      teamId: string,
      params?: { action?: string; user?: string; from?: string; to?: string; limit?: number; offset?: number },
    ) {
      const qs = new URLSearchParams();
      if (params?.action) qs.set("action", params.action);
      if (params?.user) qs.set("user", params.user);
      if (params?.from) qs.set("from", params.from);
      if (params?.to) qs.set("to", params.to);
      if (params?.limit) qs.set("limit", String(params.limit));
      if (params?.offset) qs.set("offset", String(params.offset));
      return request<{
        entries: {
          id: string;
          userId: string;
          userName: string;
          action: string;
          resource: string;
          details: string;
          createdAt: string;
        }[];
      }>(`/api/teams/${teamId}/audit?${qs}`);
    },
    getSSOConfig(teamId: string) {
      return request<{ enabled: boolean; entityId: string; ssoUrl: string; certificate: string }>(
        `/api/teams/${teamId}/sso`,
      );
    },
    setSSOConfig(
      teamId: string,
      config: { enabled: boolean; entityId: string; ssoUrl: string; certificate: string },
    ) {
      return request<void>(`/api/teams/${teamId}/sso`, {
        method: "PUT",
        body: JSON.stringify(config),
      });
    },
    deleteSSOConfig(teamId: string) {
      return request<void>(`/api/teams/${teamId}/sso`, { method: "DELETE" });
    },
  },

  // -------------------------------------------------------------------------
  // API Keys (BYOK)
  // -------------------------------------------------------------------------
  apiKeys: {
    list() {
      return request<{ id: string; provider: string; maskedKey: string; createdAt: string }[]>("/api/keys");
    },
    add(provider: string, key: string) {
      return request<{ id: string }>("/api/keys", {
        method: "POST",
        body: JSON.stringify({ provider, key }),
      });
    },
    delete(id: string) {
      return request<void>(`/api/keys/${id}`, { method: "DELETE" });
    },
  },
};
