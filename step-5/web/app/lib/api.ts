const API_BASE = "/backend";

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Item {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? res.statusText);
  }
  return res.json();
}

export function signup(email: string, password: string): Promise<AuthResponse> {
  return request("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function signin(email: string, password: string): Promise<AuthResponse> {
  return request("/auth/signin", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getMe(accessToken: string): Promise<User> {
  return request("/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function refreshTokens(refreshToken: string): Promise<AuthResponse> {
  return request("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export async function deleteAccount(accessToken: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/account`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? res.statusText);
  }
}

export function getItems(accessToken: string): Promise<Item[]> {
  return request("/items", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function createItem(accessToken: string, name: string): Promise<Item> {
  return request("/items", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ name }),
  });
}

export async function deleteItem(accessToken: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/items/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? res.statusText);
  }
}
