import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import AppShell from "./components/AppShell";
// v2.13: backdrop disabled — see WindowFrame note.
// import BackdropLayer from "./components/BackdropLayer";
import BackgroundCanvas from "./components/BackgroundCanvas";
import ControlPanel from "./components/ControlPanel";
import DebugInspector from "./components/DebugInspector";
import EdgeZones from "./components/EdgeZones";
import FlattenDock from "./components/FlattenDock";
import FloatingLayer from "./components/FloatingLayer";
import GridCanvas from "./components/GridCanvas";
import HelpOverlay from "./components/HelpOverlay";
import SuperchatOverlay from "./components/SuperchatOverlay";
import WindowFrame from "./components/WindowFrame";
import { initialBoards, MAX_BOARDS, MAX_WORKSPACES } from "./data/boards";
import { useHotkeys } from "./hooks/useHotkeys";
import { dashboardReducer, selectActive, type DashboardState } from "./state/dashboard";
import { setTrackingWorkspace } from "./state/liveWindows";
import type { DashboardScope, GridPos, ModuleType, ShareScope, WindowState } from "./types";
import type { Edge } from "./utils/edges";

const initialState: DashboardState = {
  boards: initialBoards,
  activeBoardId: initialBoards[0].id,
  activeWorkspaceId: initialBoards[0].workspaces[0].id,
};

export default function App() {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const [bgIntensity, setBgIntensity] = useState(0.55);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [activeEdge, setActiveEdge] = useState<Edge | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [arrangeMode, setArrangeMode] = useState(false);
  const [minimalHeaders, setMinimalHeaders] = useState(false);
  const [superchatQuery, setSuperchatQuery] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    typeof localStorage !== "undefined" && localStorage.getItem("opdash:theme") === "light"
      ? "light"
      : "dark"
  );
  const searchRef = useRef<HTMLInputElement>(null);

  const { board, workspace } = selectActive(state);

  // Debug bridge (prototype): lets tests/inspector read the live state.
  useEffect(() => {
    (window as unknown as { __opdash: unknown }).__opdash = state;
  }, [state]);

  // Theme: .light class on <html> drives all light: variants + CSS overrides.
  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    try {
      localStorage.setItem("opdash:theme", theme);
    } catch {}
  }, [theme]);

  // Live iframes report same-origin sub-page navigation against this workspace.
  useEffect(() => {
    setTrackingWorkspace(workspace.id);
  }, [workspace.id]);

  const updateWindow = useCallback(
    (windowId: string, updater: (w: WindowState) => WindowState) =>
      dispatch({ type: "updateWindow", windowId, updater }),
    []
  );
  // v2.13: layout-slot UI hidden — slots remain in the data model.
  // const setSlot = useCallback((slot: number) => dispatch({ type: "setSlot", slot }), []);
  // const renameSlot = useCallback(
  //   (slot: number, name: string) => dispatch({ type: "renameSlot", slot, name }),
  //   []
  // );
  const setLiveUrl = useCallback(
    (windowId: string, url: string, moduleId?: string) =>
      dispatch({ type: "setLiveUrl", windowId, url, moduleId }),
    []
  );
  const removeWindow = useCallback(
    (windowId: string) => dispatch({ type: "removeWindow", windowId }),
    []
  );
  const addWindow = useCallback(
    (moduleType: ModuleType, url?: string) => dispatch({ type: "addWindow", moduleType, url }),
    []
  );
  const addBoard = useCallback(
    (name: string, scope: DashboardScope) => dispatch({ type: "addBoard", name, scope }),
    []
  );
  const shareWorkspace = useCallback(
    (share: ShareScope) => dispatch({ type: "setWorkspaceShare", share }),
    []
  );
  const addWorkspace = useCallback(
    (name: string) => dispatch({ type: "addWorkspace", name }),
    []
  );
  const attachWindow = useCallback(
    (sourceId: string, targetId: string) => dispatch({ type: "attachWindow", sourceId, targetId }),
    []
  );
  const detachModule = useCallback(
    (windowId: string, moduleId: string) => dispatch({ type: "detachModule", windowId, moduleId }),
    []
  );
  const setGrid = useCallback(
    (layout: GridPos[]) => dispatch({ type: "setGrid", layout }),
    []
  );
  const bringToFront = useCallback(
    (windowId: string) => dispatch({ type: "bringToFront", windowId }),
    []
  );


  // ── Derived layout ──
  const windows = useMemo(() => Object.values(workspace.windows), [workspace.windows]);
  const focused = windows.find((w) => w.layoutState === "focused");
  const grid = workspace.slots[workspace.activeSlot]?.grid ?? [];

  // ── Hotkeys: ⌘K search · ` inspector · t theme · ? help · Esc exit zen ──
  // (1/2/3 slot keys removed in v2.13 — slot UI hidden.)
  useHotkeys({
    onToggleArrange: () => setArrangeMode((v) => !v),
    onToggleMinimalHeaders: () => setMinimalHeaders((v) => !v),
    onFocusSearch: () => searchRef.current?.select(),
    onToggleInspector: () => setInspectorOpen((v) => !v),
    onToggleTheme: () => setTheme((t) => (t === "light" ? "dark" : "light")),
    onToggleHelp: () => setHelpOpen((v) => !v),
    onExitFocus: () => focused && updateWindow(focused.id, (w) => ({ ...w, layoutState: "normal" })),
  });

  const restoreWindow = useCallback((id: string) => {
    dispatch({ type: "restoreWindow", windowId: id });
    // If it landed below the fold, bring it into view.
    requestAnimationFrame(() => {
      document
        .querySelector(`[data-window-id="${id}"]`)
        ?.closest(".react-grid-item")
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, []);
  const exitFocus = useCallback(() => {
    if (focused) updateWindow(focused.id, (w) => ({ ...w, layoutState: "normal" }));
  }, [focused, updateWindow]);

  return (
    <div
      className={`flex h-full flex-col ${arrangeMode ? "arrange-on" : ""} ${
        dragActive ? "ptr-off" : ""
      } ${minimalHeaders ? "minimal-headers" : ""}`}
    >
      {!minimalHeaders && (
        <AppShell
          ref={searchRef}
          boards={state.boards}
          activeBoardId={board.id}
          activeWorkspaceId={workspace.id}
          isLight={theme === "light"}
          onToggleTheme={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
          onSelectBoard={(boardId) => dispatch({ type: "selectBoard", boardId })}
          onSelectWorkspace={(workspaceId) => dispatch({ type: "selectWorkspace", workspaceId })}
          onAddBoard={addBoard}
          onAddWorkspace={addWorkspace}
          workspaceShare={workspace.share ?? "invite"}
          onShareWorkspace={shareWorkspace}
          onSubmitSearch={(q) => setSuperchatQuery(q)}
          boardsFull={state.boards.length >= MAX_BOARDS}
          workspacesFull={board.workspaces.length >= MAX_WORKSPACES}
        />
      )}

      {/* ── Workspace canvas ── */}
      <div className="relative min-h-0 flex-1">
        <BackgroundCanvas intensity={bgIntensity} />

        {/* Arrange-mode wash — a constant signal that grid windows are movable */}
        <div
          className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
            arrangeMode ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="absolute inset-0 bg-emerald-500/[0.11] light:bg-emerald-500/[0.13]" />
        </div>

        {/* Backdrop windows live behind the grid — disabled in v2.13
            (windows got stuck back there; revisit as non-interactive pinning) */}
        {/* <BackdropLayer
          windows={windows}
          onWindowUpdate={updateWindow}
          onSetLiveUrl={setLiveUrl}
          onRemoveWindow={removeWindow}
          onDetachModule={detachModule}
          dropTargetId={dropTargetId}
        /> */}

        <div className="relative z-10 flex h-full flex-col">
          {!minimalHeaders && (
            <ControlPanel
              arrangeMode={arrangeMode}
              onToggleArrange={() => setArrangeMode((v) => !v)}
              minimalHeaders={minimalHeaders}
              onToggleMinimalHeaders={() => setMinimalHeaders((v) => !v)}
              bgIntensity={bgIntensity}
              onBgIntensity={setBgIntensity}
              inspectorOpen={inspectorOpen}
              onToggleInspector={() => setInspectorOpen((v) => !v)}
              onToggleHelp={() => setHelpOpen(true)}
              windowCount={windows.length}
              onAddWindow={addWindow}
            />
          )}

          <div className="flex min-h-0 flex-1 gap-2 px-3 pb-1">
            {/* Left edge: flatten dock */}
            <FlattenDock edge="left" windows={windows} onRestore={restoreWindow} />

            {/* Tiled window floor (react-grid-layout) */}
            <main className="min-w-0 flex-1">
              <GridCanvas
                grid={grid}
                windows={workspace.windows}
                arrangeMode={arrangeMode}
                onGridChange={setGrid}
                onWindowUpdate={updateWindow}
                onSetLiveUrl={setLiveUrl}
                onRemoveWindow={removeWindow}
                onDetachModule={detachModule}
                onBringToFront={bringToFront}
                onEdgeHover={setActiveEdge}
                onDragActive={setDragActive}
                onHoverDropTarget={setDropTargetId}
                onAttachWindow={attachWindow}
                dropTargetId={dropTargetId}
                dimmed={Boolean(focused)}
              />
            </main>

            {/* Right edge: flatten dock */}
            <FlattenDock edge="right" windows={windows} onRestore={restoreWindow} />
          </div>

          <FlattenDock edge="bottom" windows={windows} onRestore={restoreWindow} />
          <div className="h-2 shrink-0" />
        </div>

        {/* Zen / focus overlay — above the grid, below floating windows.
            Full bleed: no padding, the window runs edge to edge (work-mode safe). */}
        {focused && (
          <div className="anim-fade-in absolute inset-0 z-20">
            <div
              className="absolute inset-0 bg-black/50 light:bg-slate-400/30"
              onClick={exitFocus}
            />
            <div className="relative h-full">
              <WindowFrame
                win={focused}
                fill
                onUpdate={(updater) => updateWindow(focused.id, updater)}
                onSetLiveUrl={(url, moduleId) => setLiveUrl(focused.id, url, moduleId)}
                onRemoveWindow={() => removeWindow(focused.id)}
                onDetachModule={(moduleId) => detachModule(focused.id, moduleId)}
              />
            </div>
          </div>
        )}

        <FloatingLayer
          windows={windows}
          onWindowUpdate={updateWindow}
          onSetLiveUrl={setLiveUrl}
          onRemoveWindow={removeWindow}
          onDetachModule={detachModule}
          onHoverDropTarget={setDropTargetId}
          onAttachWindow={attachWindow}
          dropTargetId={dropTargetId}
          onEdgeHover={setActiveEdge}
          onDragActive={setDragActive}
        />

        {/* Edge dock zones, visible during any window drag */}
        <EdgeZones visible={dragActive} active={activeEdge} />

        {/* Work-mode restore pill — the only visible chrome when everything's hidden */}
        {minimalHeaders && (
          <button
            onClick={() => setMinimalHeaders(false)}
            title="Exit work mode (h)"
            className="anim-fade-in fixed right-3 top-2 z-50 flex items-center gap-1.5 rounded-full border border-slate-700/70 bg-slate-900/85 px-2.5 py-1 font-mono text-[9.5px] text-slate-400 opacity-50 backdrop-blur transition-opacity hover:opacity-100 light:border-slate-300 light:bg-white/85 light:text-slate-500"
          >
            work mode · h
          </button>
        )}

        {inspectorOpen && (
          <DebugInspector
            workspace={workspace}
            boardName={board.name}
            onClose={() => setInspectorOpen(false)}
          />
        )}

        {helpOpen && <HelpOverlay onClose={() => setHelpOpen(false)} />}

        {superchatQuery !== null && (
          <SuperchatOverlay initialQuery={superchatQuery} onClose={() => setSuperchatQuery(null)} />
        )}
      </div>
    </div>
  );
}
