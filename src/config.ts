/**
 * Remote renderer connection. Local dev defaults to localhost:5198 with no
 * token; hosted deployments set VITE_REMOTE_URL + VITE_REMOTE_TOKEN. When
 * unset/unreachable, frame-blocked sites silently fall back to plain iframes.
 */
export const REMOTE: string = import.meta.env.VITE_REMOTE_URL ?? "http://localhost:5198";
export const REMOTE_WS = REMOTE.replace(/^http/, "ws");

const TOKEN: string = import.meta.env.VITE_REMOTE_TOKEN ?? "";

/** Append the renderer token as a query param (WS can't set headers). */
export function withToken(url: string): string {
  if (!TOKEN) return url;
  return `${url}${url.includes("?") ? "&" : "?"}token=${encodeURIComponent(TOKEN)}`;
}
