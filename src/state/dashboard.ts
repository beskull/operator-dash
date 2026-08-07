import type { BoardState, GridPos, ModeKey, WindowState, WorkspaceState } from "../types";
import { normalizeUrl, persistOverlay, urlHost } from "./liveWindows";

export interface DashboardState {
  boards: BoardState[];
  activeBoardId: string;
  activeWorkspaceId: string;
}

export type DashboardAction =
  | { type: "selectBoard"; boardId: string }
  | { type: "selectWorkspace"; workspaceId: string }
  | { type: "setMode"; mode: ModeKey }
  | { type: "setGrid"; layout: GridPos[] }
  | { type: "bringToFront"; windowId: string }
  | { type: "updateWindow"; windowId: string; updater: (w: WindowState) => WindowState }
  | { type: "addLiveWindow"; url: string }
  | { type: "setLiveUrl"; windowId: string; url: string; moduleId?: string }
  | { type: "removeWindow"; windowId: string }
  | { type: "attachWindow"; sourceId: string; targetId: string }
  | { type: "detachModule"; windowId: string; moduleId: string };

/** Mode switch: return assigned windows to the grid, apply tab presets. */
export function applyModeLayout(ws: WorkspaceState, mode: ModeKey): WorkspaceState {
  const grid = ws.grids[mode];
  const assigned = new Map(grid.map((g) => [g.i, g]));

  const windows: Record<string, WindowState> = {};
  for (const [id, w] of Object.entries(ws.windows)) {
    let next = w;
    const entry = assigned.get(id);
    // Windows on this mode's grid return home; unassigned ones keep whatever
    // docked/floating/backdrop state they had (those layers still render them).
    if (entry && next.layoutState !== "normal") {
      next = { ...next, layoutState: "normal" };
    }
    if (entry?.tab && next.modules.some((m) => m.id === entry.tab)) {
      next = { ...next, activeModuleId: entry.tab };
    }
    windows[id] = next;
  }

  return { ...ws, mode, windows };
}

/** Drop a window id from every mode's grid (used by remove/attach). */
function stripFromGrids(ws: WorkspaceState, windowId: string): WorkspaceState["grids"] {
  return Object.fromEntries(
    Object.entries(ws.grids).map(([mode, layout]) => [
      mode,
      layout.filter((g) => g.i !== windowId),
    ])
  ) as WorkspaceState["grids"];
}

function updateActiveWorkspace(
  state: DashboardState,
  fn: (ws: WorkspaceState) => WorkspaceState
): DashboardState {
  return {
    ...state,
    boards: state.boards.map((b) =>
      b.id !== state.activeBoardId
        ? b
        : {
            ...b,
            workspaces: b.workspaces.map((ws) =>
              ws.id === state.activeWorkspaceId ? fn(ws) : ws
            ),
          }
    ),
  };
}

export function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case "selectBoard": {
      const board = state.boards.find((b) => b.id === action.boardId);
      if (!board) return state;
      return { ...state, activeBoardId: board.id, activeWorkspaceId: board.workspaces[0].id };
    }
    case "selectWorkspace":
      return { ...state, activeWorkspaceId: action.workspaceId };
    case "setMode":
      return updateActiveWorkspace(state, (ws) => applyModeLayout(ws, action.mode));
    case "setGrid":
      // RGL reports only currently-rendered items; merge them over the stored
      // layout so flattened/floating windows keep their last rects.
      return updateActiveWorkspace(state, (ws) => {
        const prev = ws.grids[ws.mode];
        const incoming = new Set(action.layout.map((l) => l.i));
        const merged: GridPos[] = [
          ...action.layout.map((l) => ({
            i: l.i,
            x: l.x,
            y: l.y,
            w: l.w,
            h: l.h,
            tab: prev.find((p) => p.i === l.i)?.tab,
          })),
          ...prev.filter((p) => !incoming.has(p.i)),
        ];
        return { ...ws, grids: { ...ws.grids, [ws.mode]: merged } };
      });
    case "bringToFront":
      // With preventCollision, deliberate overlaps are allowed — so the last
      // window touched repaints on top. RGL paints in array order.
      return updateActiveWorkspace(state, (ws) => {
        const layout = ws.grids[ws.mode];
        const entry = layout.find((g) => g.i === action.windowId);
        if (!entry || layout[layout.length - 1]?.i === action.windowId) return ws;
        return {
          ...ws,
          grids: {
            ...ws.grids,
            [ws.mode]: [...layout.filter((g) => g.i !== action.windowId), entry],
          },
        };
      });
    case "updateWindow":
      return updateActiveWorkspace(state, (ws) =>
        ws.windows[action.windowId]
          ? {
              ...ws,
              windows: {
                ...ws.windows,
                [action.windowId]: action.updater(ws.windows[action.windowId]),
              },
            }
          : ws
      );
    case "addLiveWindow": {
      return updateActiveWorkspace(state, (ws) => {
        const id = `live-${Date.now()}`;
        const host = urlHost(action.url);
        const win: WindowState = {
          id,
          title: host || "Live view",
          status: "ok",
          layoutState: "floating",
          floatPos: { x: 260, y: 150 },
          modules: [
            { id: `${id}-mod`, type: "live", title: host || "Live view", description: action.url, url: action.url },
          ],
          activeModuleId: `${id}-mod`,
        };
        const windows = { ...ws.windows, [id]: win };
        persistOverlay(ws.id, windows);
        return { ...ws, windows };
      });
    }
    case "setLiveUrl":
      // Sets (or clears, when url is "") a live URL on a module — the active
      // one unless moduleId is given. Any module can go live; clearing
      // reverts it to its mock view.
      return updateActiveWorkspace(state, (ws) => {
        const w = ws.windows[action.windowId];
        if (!w) return ws;
        const url = action.url ? normalizeUrl(action.url) : "";
        const targetModuleId = action.moduleId ?? w.activeModuleId;
        const isLiveSpawn = w.id.startsWith("live-");
        const windows = {
          ...ws.windows,
          [action.windowId]: {
            ...w,
            title: isLiveSpawn && url ? urlHost(url) : w.title,
            modules: w.modules.map((m) =>
              m.id === targetModuleId
                ? url
                  ? { ...m, url }
                  : (({ url: _drop, ...rest }) => rest)(m)
                : m
            ),
          },
        };
        persistOverlay(ws.id, windows);
        return { ...ws, windows };
      });
    case "removeWindow":
      return updateActiveWorkspace(state, (ws) => {
        if (!ws.windows[action.windowId]) return ws;
        const windows = { ...ws.windows };
        delete windows[action.windowId];
        persistOverlay(ws.id, windows);
        return { ...ws, windows, grids: stripFromGrids(ws, action.windowId) };
      });
    case "attachWindow":
      // Move the source window's modules into the target as a scroll stack,
      // then remove the source window (from windows and every grid).
      return updateActiveWorkspace(state, (ws) => {
        const source = ws.windows[action.sourceId];
        const target = ws.windows[action.targetId];
        if (!source || !target || action.sourceId === action.targetId) return ws;
        const merged = [
          ...target.modules,
          ...source.modules.filter((m) => !target.modules.some((x) => x.id === m.id)),
        ];
        const windows: Record<string, WindowState> = {
          ...ws.windows,
          [action.targetId]: { ...target, modules: merged, viewMode: "stack" },
        };
        delete windows[action.sourceId];
        persistOverlay(ws.id, windows);
        return { ...ws, windows, grids: stripFromGrids(ws, action.sourceId) };
      });
    case "detachModule":
      // Pull one module out of a stack into its own floating window.
      return updateActiveWorkspace(state, (ws) => {
        const w = ws.windows[action.windowId];
        if (!w || w.modules.length < 2) return ws;
        const m = w.modules.find((x) => x.id === action.moduleId);
        if (!m) return ws;
        const remaining = w.modules.filter((x) => x.id !== action.moduleId);
        const newId = `live-detach-${Date.now()}`;
        const windows: Record<string, WindowState> = {
          ...ws.windows,
          [action.windowId]: {
            ...w,
            modules: remaining,
            activeModuleId: w.activeModuleId === m.id ? remaining[0].id : w.activeModuleId,
            viewMode: remaining.length > 1 ? w.viewMode : "tabs",
          },
          [newId]: {
            id: newId,
            title: m.title,
            status: w.status,
            layoutState: "floating",
            floatPos: { x: 320, y: 200 },
            modules: [m],
            activeModuleId: m.id,
          },
        };
        persistOverlay(ws.id, windows);
        return { ...ws, windows };
      });
    default:
      return state;
  }
}

export function selectActive(state: DashboardState) {
  const board =
    state.boards.find((b) => b.id === state.activeBoardId) ?? state.boards[0];
  const workspace =
    board.workspaces.find((w) => w.id === state.activeWorkspaceId) ?? board.workspaces[0];
  return { board, workspace };
}
