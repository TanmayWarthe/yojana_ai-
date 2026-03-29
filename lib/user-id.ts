/**
 * lib/user-id.ts
 * Client-side helper to ensure each browser has a unique yojana_uid cookie.
 * The cookie is also generated server-side in the API, but this ensures
 * it exists before the first API call on client-rendered pages.
 */

export function ensureUserId(): string {
  if (typeof document === "undefined") return "default";

  // Check if cookie already exists
  const match = document.cookie.match(/(?:^|;\s*)yojana_uid=([^;]+)/);
  if (match && match[1] && match[1].length >= 8) {
    return match[1];
  }

  // Generate a UUID-like ID
  const uid = crypto.randomUUID
    ? crypto.randomUUID()
    : "u-" + Math.random().toString(36).slice(2) + Date.now().toString(36);

  // Set cookie for 5 years
  const maxAge = 60 * 60 * 24 * 365 * 5;
  document.cookie = `yojana_uid=${uid}; path=/; max-age=${maxAge}; SameSite=Lax`;

  return uid;
}
