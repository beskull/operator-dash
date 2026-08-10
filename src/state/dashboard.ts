import type { BoardState, GridPos, ModuleType, WindowState, WorkspaceState } from "../types";
import { createEmptyWorkspace, MAX_BOARDS, MAX_WORKSPACES } from "../data/boards";
import { normalizeUrl, persistOverlay, urlHost } from "./liveWindows";

export interface DashboardState {
  boards: BoardState[];
  activeBoardId: string;
  activeWorkspaceId: string;
}

export type DashboardAction =
  | { type: "selectBoard"; boardId: string }
  | { type: "selectWorkspace"; workspaceId: string }
  | { type: "setSlot"; slot: number }
  | { type: "renameSlot"; slot: number; name: string }
  | { type: "setGrid"; layout: GridPos[] }
  | { type: "bringToFront"; windowId: string }
  | { type: "resizePush"; windowId: string; rect: { x: number; y: number; w: number; h: number }; axis: "h" | "v" }
  | { type: "updateWindow"; windowId: string; updater: (w: WindowState) => WindowState }
  | { type: "addBoard"; name: string }
  | { type: "addWorkspace"; name: string }
  | { type: "addWindow"; moduleType: ModuleType; url?: string }
  | { type: "setLiveUrl"; windowId: string; url: string; moduleId?: string }
  | { type: "removeWindow"; windowId: string }
  | { type: "attachWindow"; sourceId: string; targetId: string }
  | { type: "detachModule"; windowId: string; moduleId: string }
  | { type: "restoreWindow"; windowId: string };

/** Mode switch: return assigned windows to the grid, apply tab presets. */
export function applySlot(ws: WorkspaceState, slotIndex: number): WorkspaceState {
  const slot = ws.slots[slotIndex];
  if (!slot) return ws;
  const assigned = new Map(slot.grid.map((g) => [g.i, g]));

  const windows: Record<string, WindowState> = {};
  for (const [id, w] of Object.entries(ws.windows)) {
    let next = w;
    const entry = assigned.get(id);
    // Windows in this slot return to their saved rects/tabs; on-grid windows
    // the slot doesn't know park in the bottom dock (recoverable).
    if (entry) {
      if (next.layoutState !== "normal") next = { ...next, layoutState: "normal" };
      if (entry.tab && next.modules.some((m) => m.id === entry.tab)) {
        next = { ...next, activeModuleId: entry.tab };
      }
    } else if (next.layoutState === "normal") {
      next = { ...next, layoutState: "flattenedBottom" };
    }
    windows[id] = next;
  }

  return { ...ws, activeSlot: slotIndex, windows };
}

/** Default title/description for user-spawned windows, by module type. */
const MODULE_META: Record<string, { title: string; desc: string }> = {
  live: { title: "Live view", desc: "embedded URL" },
  chatbot: { title: "Chatbot", desc: "FluxPrompt chatbot" },
  logs: { title: "Log Stream", desc: "streaming output" },
  statusCard: { title: "Status Card", desc: "service health" },
  dashboard: { title: "Metrics", desc: "throughput + rates" },
  chat: { title: "Console", desc: "quick chat surface" },
  docs: { title: "Notes", desc: "docs surface" },
  sessions: { title: "Sessions", desc: "active sessions" },
  canvas: { title: "Flux Canvas", desc: "workflow graph" },
  webapp: { title: "Code Editor", desc: "editor surface" },
  generic: { title: "Window", desc: "empty module" },
};

/** Drop a window id from every slot's grid (used by remove/attach). */
function stripFromGrids(ws: WorkspaceState, windowId: string): WorkspaceState["slots"] {
  return ws.slots.map((s) => ({ ...s, grid: s.grid.filter((g) => g.i !== windowId) }));
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
    case "setSlot":
      return updateActiveWorkspace(state, (ws) => applySlot(ws, action.slot));
    case "renameSlot":
      return updateActiveWorkspace(state, (ws) => {
        const name = action.name.trim();
        if (!name || !ws.slots[action.slot]) return ws;
        return {
          ...ws,
          slots: ws.slots.map((s, i) => (i === action.slot ? { ...s, name } : s)),
        };
      });
    case "setGrid":
      // RGL reports only currently-rendered items; merge them over the stored
      // layout so flattened/floating windows keep their last rects.
      return updateActiveWorkspace(state, (ws) => {
        const slot = ws.slots[ws.activeSlot];
        if (!slot) return ws;
        const prev = slot.grid.filter(Boolean);
        const incoming = new Set(action.layout.filter(Boolean).map((l) => l.i));
        const merged: GridPos[] = [
          ...action.layout.filter(Boolean).map((l) => ({
            i: l.i,
            x: l.x,
            y: l.y,
            w: l.w,
            h: l.h,
            tab: prev.find((p) => p.i === l.i)?.tab,
          })),
          ...prev.filter((p) => !incoming.has(p.i)),
        ];
        return {
          ...ws,
          slots: ws.slots.map((s, i) => (i === ws.activeSlot ? { ...s, grid: merged } : s)),
        };
      });
    case "bringToFront":
      // With preventCollision, deliberate overlaps are allowed — so the last
      // window touched repaints on top. RGL paints in array order.
      return updateActiveWorkspace(state, (ws) => {
        const layout = ws.slots[ws.activeSlot].grid;
        const entry = layout.find((g) => g.i === action.windowId);
        if (!entry || layout[layout.length - 1]?.i === action.windowId) return ws;
        return {
          ...ws,
          slots: ws.slots.map((s, i) =>
            i === ws.activeSlot
              ? { ...s, grid: [...layout.filter((g) => g.i !== action.windowId), entry] }
              : s
          ),
        };
      });
    case "resizePush":
      // After a resize gesture ends, resolve overlaps it created:
      //  - vertical-dominant resize → overlapped windows move DOWN
      //  - horizontal-dominant resize → neighbors shift RIGHT, wrapping to a
      //    new line under the resized window when the row runs out of columns
      // Only windows overlapped by something that already moved are touched.
      return updateActiveWorkspace(state, (ws) => {
        const slot = ws.slots[ws.activeSlot];
        if (!slot) return ws;
        const grid = slot.grid.filter(Boolean).map((g) => ({ ...g }));
        const mine = grid.find((g) => g.i === action.windowId);
        if (!mine) return ws;
        Object.assign(mine, action.rect);

        const moved = new Set<string>([mine.i]);
        const queue = [mine.i];
        while (queue.length) {
          const m = grid.find((g) => g.i === queue.shift()!);
          if (!m) break;
          for (const o of grid) {
            if (!o || moved.has(o.i)) continue;
            const overlapX = m.x < o.x + o.w && o.x < m.x + m.w;
            const overlapY = m.y < o.y + o.h && o.y < m.y + m.h;
            if (!overlapX || !overlapY) continue;
            if (action.axis === "h") {
              const newX = m.x + m.w;
              if (newX + o.w <= 12) {
                o.x = newX; // shift right
              } else {
                o.x = m.x; // wrap to a new line under the widened window
                o.y = m.y + m.h;
              }
            } else {
              o.y = m.y + m.h; // push down
            }
            moved.add(o.i);
            queue.push(o.i);
          }
        }
        return {
          ...ws,
          slots: ws.slots.map((s, i) => (i === ws.activeSlot ? { ...s, grid } : s)),
        };
      });
    case "restoreWindow":
      // Dock-strip restore: back to "normal" AND guaranteed a rect in the
      // active slot — without one, the window would render nowhere.
      return updateActiveWorkspace(state, (ws) => {
        const w = ws.windows[action.windowId];
        if (!w) return ws;
        const windows: Record<string, WindowState> = {
          ...ws.windows,
          [action.windowId]: { ...w, layoutState: "normal" },
        };
        const slot = ws.slots[ws.activeSlot];
        if (!slot || slot.grid.some((g) => g && g.i === action.windowId)) {
          return { ...ws, windows };
        }
        // No rect in this slot: reuse its size from any other slot, place it
        // at the bottom of the current grid.
        const known = ws.slots
          .map((s) => s.grid.find((g) => g && g.i === action.windowId))
          .find(Boolean);
        const w_ = known?.w ?? 6;
        const h_ = known?.h ?? 6;
        const maxY = Math.max(0, ...slot.grid.filter(Boolean).map((g) => g.y + g.h));
        const entry: GridPos = {
          i: action.windowId,
          x: Math.max(0, Math.min(known?.x ?? 0, 12 - w_)),
          y: maxY,
          w: w_,
          h: h_,
        };
        return {
          ...ws,
          windows,
          slots: ws.slots.map((s, i) =>
            i === ws.activeSlot ? { ...s, grid: [...slot.grid.filter(Boolean), entry] } : s
          ),
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
    case "addBoard": {
      if (state.boards.length >= MAX_BOARDS) return state;
      const boardId = `board-${Date.now()}`;
      const ws = createEmptyWorkspace(`ws-${Date.now()}`, "Main");
      const board: BoardState = {
        id: boardId,
        name: action.name.trim() || "New board",
        workspaces: [ws],
      };
      return {
        ...state,
        boards: [...state.boards, board],
        activeBoardId: board.id,
        activeWorkspaceId: ws.id,
      };
    }
    case "addWorkspace": {
      const board = state.boards.find((b) => b.id === state.activeBoardId);
      if (!board || board.workspaces.length >= MAX_WORKSPACES) return state;
      const ws = createEmptyWorkspace(`ws-${Date.now()}`, action.name.trim() || "Workspace");
      return {
        ...state,
        boards: state.boards.map((b) =>
          b.id === board.id ? { ...b, workspaces: [...b.workspaces, ws] } : b
        ),
        activeWorkspaceId: ws.id,
      };
    }
    case "addWindow": {
      return updateActiveWorkspace(state, (ws) => {
        const id = `live-${Date.now()}`;
        const url = action.url ? normalizeUrl(action.url) : undefined;
        const meta = MODULE_META[action.moduleType] ?? MODULE_META.generic;
        const title = action.moduleType === "live" && url ? urlHost(url) : meta.title;
        const moduleId = `${id}-mod`;
        const win: WindowState = {
          id,
          title,
          status: "ok",
          layoutState: "floating",
          floatPos: { x: 280, y: 160 },
          modules: [
            {
              id: moduleId,
              type: action.moduleType,
              title,
              description: url ?? meta.desc,
              ...(url ? { url } : {}),
            },
          ],
          activeModuleId: moduleId,
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
        return { ...ws, windows, slots: stripFromGrids(ws, action.windowId) };
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
        // Attached modules arrive as TABS — the target keeps its view mode;
        // the user switches to scroll explicitly via the tabs|scroll toggle.
        const windows: Record<string, WindowState> = {
          ...ws.windows,
          [action.targetId]: { ...target, modules: merged },
        };
        delete windows[action.sourceId];
        persistOverlay(ws.id, windows);
        return { ...ws, windows, slots: stripFromGrids(ws, action.sourceId) };
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
