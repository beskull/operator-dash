import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import AppShell from "./components/AppShell";
import BackdropLayer from "./components/BackdropLayer";
import BackgroundCanvas from "./components/BackgroundCanvas";
import ControlPanel from "./components/ControlPanel";
import DebugInspector from "./components/DebugInspector";
import EdgeZones from "./components/EdgeZones";
import FlattenDock from "./components/FlattenDock";
import FloatingLayer from "./components/FloatingLayer";
import GridCanvas from "./components/GridCanvas";
import HelpOverlay from "./components/HelpOverlay";
import WindowFrame from "./components/WindowFrame";
import { initialBoards, MAX_BOARDS, MAX_WORKSPACES } from "./data/boards";
import { useHotkeys } from "./hooks/useHotkeys";
import { dashboardReducer, selectActive, type DashboardState } from "./state/dashboard";
import { setTrackingWorkspace } from "./state/liveWindows";
import type { GridPos, ModuleType, WindowState } from "./types";
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
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    typeof localStorage !== "undefined" && localStorage.getItem("opdash:theme") === "light"
      ? "light"
      : "dark"
  );
  const searchRef = useRef<HTMLInputElement>(null);

  const { board, workspace } = selectActive(state);

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
  const setSlot = useCallback((slot: number) => dispatch({ type: "setSlot", slot }), []);
  const renameSlot = useCallback(
    (slot: number, name: string) => dispatch({ type: "renameSlot", slot, name }),
    []
  );
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
  const addBoard = useCallback((name: string) => dispatch({ type: "addBoard", name }), []);
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

  // ── Hotkeys: 1/2/3 slots · ⌘K search · ` inspector · t theme · ? help · Esc exit zen ──
  useHotkeys({
    onSlot: setSlot,
    onFocusSearch: () => searchRef.current?.select(),
    onToggleInspector: () => setInspectorOpen((v) => !v),
    onToggleTheme: () => setTheme((t) => (t === "light" ? "dark" : "light")),
    onToggleHelp: () => setHelpOpen((v) => !v),
    onExitFocus: () => focused && updateWindow(focused.id, (w) => ({ ...w, layoutState: "normal" })),
  });

  const restoreWindow = useCallback(
    (id: string) => updateWindow(id, (w) => ({ ...w, layoutState: "normal" })),
    [updateWindow]
  );
  const exitFocus = useCallback(() => {
    if (focused) updateWindow(focused.id, (w) => ({ ...w, layoutState: "normal" }));
  }, [focused, updateWindow]);

  return (
    <div className="flex h-full flex-col">
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
        boardsFull={state.boards.length >= MAX_BOARDS}
        workspacesFull={board.workspaces.length >= MAX_WORKSPACES}
      />

      {/* ── Workspace canvas ── */}
      <div className="relative min-h-0 flex-1">
        <BackgroundCanvas intensity={bgIntensity} />

        {/* Backdrop windows live behind the grid */}
        <BackdropLayer
          windows={windows}
          onWindowUpdate={updateWindow}
          onSetLiveUrl={setLiveUrl}
          onRemoveWindow={removeWindow}
          onDetachModule={detachModule}
          dropTargetId={dropTargetId}
        />

        <div className="relative z-10 flex h-full flex-col">
          <ControlPanel
            slots={workspace.slots}
            activeSlot={workspace.activeSlot}
            onSlotChange={setSlot}
            onRenameSlot={renameSlot}
            bgIntensity={bgIntensity}
            onBgIntensity={setBgIntensity}
            inspectorOpen={inspectorOpen}
            onToggleInspector={() => setInspectorOpen((v) => !v)}
            onToggleHelp={() => setHelpOpen(true)}
            windowCount={windows.length}
            onAddWindow={addWindow}
          />

          <div className="flex min-h-0 flex-1 gap-2 px-3 pb-1">
            {/* Left edge: flatten dock */}
            <FlattenDock edge="left" windows={windows} onRestore={restoreWindow} />

            {/* Tiled window floor (react-grid-layout) */}
            <main className="min-w-0 flex-1">
              <GridCanvas
                grid={grid}
                windows={workspace.windows}
                onGridChange={setGrid}
                onWindowUpdate={updateWindow}
                onSetLiveUrl={setLiveUrl}
                onRemoveWindow={removeWindow}
                onDetachModule={detachModule}
                onBringToFront={bringToFront}
                onEdgeHover={setActiveEdge}
                onDragActive={setDragActive}
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

        {/* Zen / focus overlay — above the grid, below floating windows */}
        {focused && (
          <div className="anim-fade-in absolute inset-0 z-20 p-3 pt-14">
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

        {inspectorOpen && (
          <DebugInspector
            workspace={workspace}
            boardName={board.name}
            onClose={() => setInspectorOpen(false)}
          />
        )}

        {helpOpen && <HelpOverlay onClose={() => setHelpOpen(false)} />}
      </div>
    </div>
  );
}
