import type { WindowState } from "../types";

// URL state persists across reloads, keyed per workspace. Two shapes:
//   live     — fully user-created windows (factories don't know them)
//   bindings — url overrides applied onto factory windows' modules, so mock
//              data can keep evolving without stored windows going stale.

export interface PersistedOverlay {
  live: WindowState[];
  /** windowId → moduleId → url */
  bindings: Record<string, Record<string, string>>;
}

const key = (wsId: string) => `opdash:live:${wsId}`;

const EMPTY: PersistedOverlay = { live: [], bindings: {} };

export function loadOverlay(wsId: string): PersistedOverlay {
  try {
    const raw = localStorage.getItem(key(wsId));
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    // Migrate the v1 shape (a bare array of live windows).
    if (Array.isArray(parsed)) return { live: parsed, bindings: {} };
    return {
      live: Array.isArray(parsed.live) ? parsed.live : [],
      bindings: parsed.bindings && typeof parsed.bindings === "object" ? parsed.bindings : {},
    };
  } catch {
    return EMPTY;
  }
}

export function saveOverlay(wsId: string, overlay: PersistedOverlay): void {
  try {
    localStorage.setItem(key(wsId), JSON.stringify(overlay));
  } catch {
    /* storage full / unavailable — non-fatal for a prototype */
  }
}

/** Derive and persist the overlay for a workspace's current window map. */
export function persistOverlay(wsId: string, windows: Record<string, WindowState>): void {
  const live = Object.values(windows).filter((w) => w.id.startsWith("live-"));
  const bindings: Record<string, Record<string, string>> = {};
  for (const w of Object.values(windows)) {
    if (w.id.startsWith("live-")) continue;
    for (const m of w.modules) {
      if (m.url) (bindings[w.id] ??= {})[m.id] = m.url;
    }
  }
  saveOverlay(wsId, { live, bindings });
}

// ── Same-origin sub-page tracking ────────────────────────────────────────────
// Live iframes poll their own location (same-origin only; cross-origin throws
// and is skipped). Tracked URLs write straight to the overlay — never through
// React state, so the iframe doesn't remount/reload mid-session.

let trackingWsId: string | null = null;

export function setTrackingWorkspace(wsId: string): void {
  trackingWsId = wsId;
}

export function trackLiveUrl(windowId: string, moduleId: string, url: string): void {
  if (!trackingWsId) return;
  const overlay = loadOverlay(trackingWsId);
  const live = overlay.live.find((w) => w.id === windowId);
  if (live) {
    live.modules = live.modules.map((m) => (m.id === moduleId ? { ...m, url } : m));
  } else {
    (overlay.bindings[windowId] ??= {})[moduleId] = url;
  }
  saveOverlay(trackingWsId, overlay);
}

export function urlHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  return /^[a-z]+:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
