/**
 * Remote renderer base URL. Local dev defaults to localhost:5198; hosted
 * deployments set VITE_REMOTE_URL to wherever the renderer lives (Railway /
 * Fly / etc.). When unset/unreachable, frame-blocked sites silently fall back
 * to plain iframes.
 */
export const REMOTE: string = import.meta.env.VITE_REMOTE_URL ?? "http://localhost:5198";
export const REMOTE_WS = REMOTE.replace(/^http/, "ws");
