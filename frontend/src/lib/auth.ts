const KEY = "ffws_token";
const ROLE_KEY = "ffws_role";
const NAME_KEY = "ffws_name";
const EVENT = "ffws-auth";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export function getRole(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ROLE_KEY);
}

export function getName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(NAME_KEY);
}

export function saveSession(token: string, role: string, name: string) {
  localStorage.setItem(KEY, token);
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(NAME_KEY, name);
  window.dispatchEvent(new Event(EVENT));
}

export function clearSession() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(NAME_KEY);
  window.dispatchEvent(new Event(EVENT));
}

export function isAdmin(): boolean {
  return !!getToken() && getRole() === "admin";
}

export function onAuthChange(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}