import type {
  BoardState,
  GridPos,
  ModeKey,
  ModuleDef,
  ModuleType,
  WindowState,
  WorkspaceState,
} from "../types";
import { loadOverlay } from "../state/liveWindows";

// ── Small factories ──────────────────────────────────────────────────────────

const mod = (id: string, type: ModuleType, title: string, description?: string): ModuleDef => ({
  id,
  type,
  title,
  description,
});

const win = (w: Partial<WindowState> & Pick<WindowState, "id" | "title" | "modules">): WindowState => ({
  activeModuleId: w.modules[0].id,
  layoutState: "normal",
  status: "ok",
  ...w,
});

const collect = (wins: WindowState[]): Record<string, WindowState> =>
  Object.fromEntries(wins.map((w) => [w.id, w]));

/** Apply persisted URL state: bindings onto factory windows + user's live windows. */
const withLive = (ws: WorkspaceState): WorkspaceState => {
  const overlay = loadOverlay(ws.id);
  const windows = { ...ws.windows };
  for (const [winId, mods] of Object.entries(overlay.bindings)) {
    const w = windows[winId];
    if (!w) continue;
    windows[winId] = {
      ...w,
      modules: w.modules.map((m) => (mods[m.id] ? { ...m, url: mods[m.id] } : m)),
    };
  }
  return { ...ws, windows: { ...windows, ...collect(overlay.live) } };
};

// Grid units: 12 columns, rowHeight 36px, 8px margins. `tab` sets the active
// module tab when the mode engages. Windows listed but starting flattened are
// not rendered until restored — the entry reserves their restore rect.

// ── Enhanced AI Ops · Mission Control ────────────────────────────────────────

function createMissionControl(): WorkspaceState {
  const main = win({
    id: "win-main",
    title: "Operator Console",
    accent: "#34d399",
    modules: [
      mod("mod-flux", "canvas", "FluxPrompt Workflow", "Agent orchestration canvas"),
      mod("mod-claude", "webapp", "ClaudeCode", "editor · agent session"),
      mod("mod-logs", "logs", "Live Logs", "streaming agent output"),
      mod("mod-docs", "docs", "Docs", "runbook + references"),
    ],
  });

  const status = win({
    id: "win-status",
    title: "Service Status",
    accent: "#22d3ee",
    modules: [mod("mod-status", "statusCard", "Enhanced AI Status", "All systems operational")],
  });

  const uptime = win({
    id: "win-uptime",
    title: "Uptime & Throughput",
    modules: [mod("mod-uptime", "dashboard", "Uptime", "30-day availability")],
  });

  const sessions = win({
    id: "win-sessions",
    title: "Active Sessions",
    status: "warn",
    modules: [mod("mod-sessions", "sessions", "Agent Sessions", "live operator sessions")],
  });

  const errors = win({
    id: "win-errors",
    title: "Error Stream",
    status: "error",
    layoutState: "flattenedLeft",
    modules: [mod("mod-errors", "logs", "Errors", "exceptions + failed runs")],
  });

  const chat = win({
    id: "win-chat",
    title: "Ops Copilot",
    accent: "#a78bfa",
    layoutState: "floating",
    floatPos: { x: 940, y: 420 },
    modules: [mod("mod-chat", "chat", "Ops Copilot", "quick console")],
  });

  const flux = win({
    id: "win-flux",
    title: "FluxPrompt Canvas",
    accent: "#22d3ee",
    modules: [mod("mod-flux-big", "canvas", "Workflow Canvas", "build mode · full canvas")],
  });

  const grids: Record<ModeKey, GridPos[]> = {
    ops: [
      { i: main.id, x: 0, y: 0, w: 8, h: 14, tab: "mod-flux" },
      { i: status.id, x: 8, y: 0, w: 4, h: 6 },
      { i: uptime.id, x: 8, y: 6, w: 4, h: 4 },
      { i: sessions.id, x: 8, y: 10, w: 4, h: 5 },
      { i: errors.id, x: 8, y: 15, w: 4, h: 5 }, // starts flattenedLeft
    ],
    debug: [
      { i: main.id, x: 0, y: 0, w: 7, h: 9, tab: "mod-logs" },
      { i: errors.id, x: 0, y: 9, w: 7, h: 6 },
      { i: status.id, x: 7, y: 0, w: 5, h: 6 },
      { i: sessions.id, x: 7, y: 6, w: 5, h: 9 },
    ],
    build: [
      { i: flux.id, x: 0, y: 0, w: 8, h: 9 },
      { i: main.id, x: 0, y: 9, w: 8, h: 6, tab: "mod-claude" },
      { i: status.id, x: 8, y: 0, w: 4, h: 7 },
      { i: uptime.id, x: 8, y: 7, w: 4, h: 8 },
    ],
  };

  return {
    id: "ws-mission-control",
    name: "Mission Control",
    mode: "ops",
    windows: collect([main, status, uptime, sessions, errors, chat, flux]),
    grids,
  };
}

// ── Enhanced AI Ops · Agent Fleet ────────────────────────────────────────────

function createAgentFleet(): WorkspaceState {
  const fleet = win({
    id: "win-fleet",
    title: "Fleet Overview",
    accent: "#34d399",
    modules: [
      mod("mod-fleet-dash", "dashboard", "Fleet Metrics", "runs, tokens, success rate"),
      mod("mod-fleet-sessions", "sessions", "Fleet Sessions", "per-agent drill-down"),
    ],
  });

  const status = win({
    id: "win-fleet-status",
    title: "Service Status",
    modules: [mod("mod-fleet-status", "statusCard", "Enhanced AI Status")],
  });

  const logs = win({
    id: "win-fleet-logs",
    title: "Fleet Logs",
    modules: [mod("mod-fleet-logs", "logs", "Fleet Logs")],
  });

  const grids: Record<ModeKey, GridPos[]> = {
    ops: [
      { i: fleet.id, x: 0, y: 0, w: 8, h: 14 },
      { i: status.id, x: 8, y: 0, w: 4, h: 6 },
      { i: logs.id, x: 8, y: 6, w: 4, h: 9 },
    ],
    debug: [
      { i: logs.id, x: 0, y: 0, w: 8, h: 10 },
      { i: fleet.id, x: 0, y: 10, w: 8, h: 5 },
      { i: status.id, x: 8, y: 0, w: 4, h: 15 },
    ],
    build: [
      { i: fleet.id, x: 0, y: 0, w: 9, h: 14 },
      { i: status.id, x: 9, y: 0, w: 3, h: 14 },
    ],
  };

  return {
    id: "ws-agent-fleet",
    name: "Agent Fleet",
    mode: "ops",
    windows: collect([fleet, status, logs]),
    grids,
  };
}

// ── Patent Workflows ─────────────────────────────────────────────────────────

function createPatentWorkspace(): WorkspaceState {
  const patent = win({
    id: "win-patent",
    title: "Patent Search",
    accent: "#f59e0b",
    modules: [mod("mod-patent", "patent", "Patent Search", "prior-art search console")],
    twoSided: {
      isTwoSided: true,
      side: "front",
      activeConfigId: "all",
      configs: [
        { id: "uspto", label: "US PTO" },
        { id: "epo", label: "EPO" },
        { id: "wipo", label: "WIPO" },
        { id: "all", label: "All Offices" },
      ],
    },
  });

  const status = win({
    id: "win-patent-status",
    title: "Indexer Status",
    modules: [mod("mod-patent-status", "statusCard", "Patent Indexer", "indexing healthy")],
  });

  const research = win({
    id: "win-patent-research",
    title: "Research Notes",
    layoutState: "flattenedRight",
    modules: [mod("mod-patent-notes", "docs", "Research Notes", "claim drafts + citations")],
  });

  const grids: Record<ModeKey, GridPos[]> = {
    ops: [
      { i: patent.id, x: 0, y: 0, w: 8, h: 12 },
      { i: status.id, x: 8, y: 0, w: 4, h: 6 },
      { i: research.id, x: 8, y: 6, w: 4, h: 6 }, // starts flattenedRight
    ],
    debug: [
      { i: patent.id, x: 0, y: 0, w: 9, h: 12 },
      { i: status.id, x: 9, y: 0, w: 3, h: 12 },
    ],
    build: [
      { i: patent.id, x: 0, y: 0, w: 7, h: 12 },
      { i: research.id, x: 7, y: 0, w: 5, h: 8 },
      { i: status.id, x: 7, y: 8, w: 5, h: 4 },
    ],
  };

  return {
    id: "ws-patent-search",
    name: "Patent Search",
    mode: "ops",
    windows: collect([patent, status, research]),
    grids,
  };
}

// ── Marketing ────────────────────────────────────────────────────────────────

function createMarketingWorkspace(): WorkspaceState {
  const campaigns = win({
    id: "win-campaigns",
    title: "Campaign Command",
    accent: "#fb7185",
    modules: [
      mod("mod-mkt-dash", "marketing", "Campaign Performance", "spend · ROAS · pipeline"),
      mod("mod-mkt-logs", "logs", "Automation Logs", "martech-weaver runs"),
    ],
  });

  const status = win({
    id: "win-mkt-status",
    title: "Pipeline Status",
    modules: [mod("mod-mkt-status", "statusCard", "Marketing Pipeline", "syncs healthy")],
  });

  const chat = win({
    id: "win-mkt-chat",
    title: "Copy Copilot",
    layoutState: "flattenedBottom",
    modules: [mod("mod-mkt-chat", "chat", "Copy Copilot", "ad copy drafts")],
  });

  const grids: Record<ModeKey, GridPos[]> = {
    ops: [
      { i: campaigns.id, x: 0, y: 0, w: 8, h: 12 },
      { i: status.id, x: 8, y: 0, w: 4, h: 12 },
      { i: chat.id, x: 0, y: 12, w: 8, h: 5 }, // starts flattenedBottom
    ],
    debug: [
      { i: campaigns.id, x: 0, y: 0, w: 8, h: 12, tab: "mod-mkt-logs" },
      { i: status.id, x: 8, y: 0, w: 4, h: 12 },
      { i: chat.id, x: 0, y: 12, w: 8, h: 5 },
    ],
    build: [
      { i: campaigns.id, x: 0, y: 0, w: 8, h: 7 },
      { i: chat.id, x: 0, y: 7, w: 8, h: 5 },
      { i: status.id, x: 8, y: 0, w: 4, h: 12 },
    ],
  };

  return {
    id: "ws-campaigns",
    name: "Campaigns",
    mode: "ops",
    windows: collect([campaigns, status, chat]),
    grids,
  };
}

// ── Boards ───────────────────────────────────────────────────────────────────

export const initialBoards: BoardState[] = [
  {
    id: "board-ops",
    name: "Enhanced AI Ops",
    workspaces: [createMissionControl(), createAgentFleet()].map(withLive),
  },
  {
    id: "board-patent",
    name: "Patent Workflows",
    workspaces: [createPatentWorkspace()].map(withLive),
  },
  {
    id: "board-marketing",
    name: "Marketing",
    workspaces: [createMarketingWorkspace()].map(withLive),
  },
];
