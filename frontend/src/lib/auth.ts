const KEY = "ffws_token";
const ROLE_KEY = "ffws_role";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export function getRole(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ROLE_KEY);
}

export function saveSession(token: string, role: string) {
  localStorage.setItem(KEY, token);
  localStorage.setItem(ROLE_KEY, role);
}

export function clearSession() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(ROLE_KEY);
}

export function isAdmin(): boolean {
  return !!getToken() && getRole() === "admin";
}