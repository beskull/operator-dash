import { useRef, useState } from "react";
import GridLayout, { WidthProvider, type Layout } from "react-grid-layout";
import type { GridPos, WindowState } from "../types";
import { edgeFromPoint, EDGE_TO_LAYOUT, type Edge } from "../utils/edges";
import WindowFrame from "./WindowFrame";

const Grid = WidthProvider(GridLayout);

interface GridCanvasProps {
  /** Grid entries for the active slot (all windows; filtered internally). */
  grid: GridPos[];
  windows: Record<string, WindowState>;
  /** Arrange mode: grid dragging/attaching unlocked. Resize is always on. */
  arrangeMode: boolean;
  onGridChange: (layout: GridPos[]) => void;
  onWindowUpdate: (id: string, updater: (w: WindowState) => WindowState) => void;
  onSetLiveUrl: (id: string, url: string, moduleId?: string) => void;
  onRemoveWindow: (id: string) => void;
  onDetachModule: (id: string, moduleId: string) => void;
  /** Raise a window's paint order after a deliberate drag/resize. */
  onBringToFront: (id: string) => void;
  /** Edge-drop reporting: which screen edge the cursor is over (or null). */
  onEdgeHover: (edge: Edge | null) => void;
  /** Drag or resize started/ended — drives edge zones + the iframe guard. */
  onDragActive: (active: boolean) => void;
  /** Live attach-target reporting while dragging (null when not armed). */
  onHoverDropTarget: (id: string | null) => void;
  /** Grid drag ended over an armed target — attach into its scroll stack. */
  onAttachWindow: (sourceId: string, targetId: string) => void;
  dropTargetId: string | null;
  /** Another window is in zen mode — dim the grid behind the focus overlay. */
  dimmed?: boolean;
}

/**
 * The tiled workspace floor. react-grid-layout owns drag/resize of docked
 * windows (header is the drag handle); anything non-"normal" is filtered off
 * the grid and rendered by the dock/floating/backdrop/focus layers instead.
 */
export default function GridCanvas({
  grid,
  windows,
  arrangeMode,
  onGridChange,
  onWindowUpdate,
  onSetLiveUrl,
  onRemoveWindow,
  onDetachModule,
  onBringToFront,
  onEdgeHover,
  onDragActive,
  onHoverDropTarget,
  onAttachWindow,
  dropTargetId,
  dimmed,
}: GridCanvasProps) {
  const [gridDragging, setGridDragging] = useState(false);
  // Pre-drag rect, so an edge-drop or attach leaves the grid entry untouched.
  const dragOrigin = useRef<GridPos | null>(null);
  // Attach dwell tracking — same rule as floating: pause ~0.4s to arm.
  const hoverRef = useRef({ id: null as string | null, x: 0, y: 0, t: 0, still: 0 });
  const armedRef = useRef<string | null>(null);

  const items = grid.filter((g) => {
    const w = windows[g.i];
    return w && w.layoutState === "normal";
  });

  const clearDrag = () => {
    setGridDragging(false);
    onDragActive(false);
    onEdgeHover(null);
    armedRef.current = null;
    hoverRef.current = { id: null, x: 0, y: 0, t: 0, still: 0 };
    onHoverDropTarget(null);
    dragOrigin.current = null;
  };

  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-800 font-mono text-[11px] text-slate-600 light:border-slate-300 light:text-slate-400">
        no windows on the grid — add one with "+ window", or restore from a dock
      </div>
    );
  }

  return (
    <div
      className={`h-full overflow-y-auto transition-opacity duration-300 ${
        dimmed ? "pointer-events-none opacity-30 saturate-50" : ""
      } ${gridDragging ? "ptr-off" : ""}`}
    >
      <Grid
        layout={items.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }))}
        cols={12}
        rowHeight={36}
        margin={[8, 8]}
        compactType={null}
        preventCollision
        isBounded
        isDraggable={arrangeMode}
        draggableHandle=".win-drag-handle"
        draggableCancel="button, input, a, select, textarea"
        onLayoutChange={(layout: Layout[]) => onGridChange(layout as GridPos[])}
        onDragStart={(_l, oldItem) => {
          setGridDragging(true);
          onDragActive(true);
          dragOrigin.current = { i: oldItem.i, x: oldItem.x, y: oldItem.y, w: oldItem.w, h: oldItem.h };
        }}
        onDrag={(_l, _old, item, _ph, e) => {
          const me = e as MouseEvent;

          // Screen edges first: dock intent.
          const edge = edgeFromPoint(me.clientX, me.clientY);
          onEdgeHover(edge);
          if (edge) {
            if (armedRef.current) {
              armedRef.current = null;
              onHoverDropTarget(null);
            }
            hoverRef.current.still = 0;
            return;
          }

          // Attach hit-test (the dragged tile is pointer-events-none via CSS,
          // so elementFromPoint sees the windows underneath it).
          const el = document.elementFromPoint(me.clientX, me.clientY);
          const host = el instanceof Element ? el.closest("[data-window-id]") : null;
          const hostId = host?.getAttribute("data-window-id") ?? null;
          const next = hostId && hostId !== item.i ? hostId : null;

          const h = hoverRef.current;
          const now = performance.now();
          if (next !== h.id) {
            h.id = next;
            h.still = 0;
          }
          const dt = now - h.t;
          h.t = now;
          const moved = Math.hypot(me.clientX - h.x, me.clientY - h.y);
          h.x = me.clientX;
          h.y = me.clientY;
          h.still = moved < 6 ? h.still + dt : 0;

          const armed = next !== null && h.still > 400;
          const armedId = armed ? next : null;
          if (armedId !== armedRef.current) {
            armedRef.current = armedId;
            onHoverDropTarget(armedId);
          }
        }}
        onDragStop={(layout, _old, item, _ph, e) => {
          const me = e as MouseEvent;
          const edge = edgeFromPoint(me.clientX, me.clientY);
          const attachTarget = armedRef.current;
          const origin = dragOrigin.current;

          if (edge || attachTarget) {
            // Dock or attach: the tile leaves the grid — restore its rect so
            // a later restore lands where it was, not where it was dragged.
            if (origin) {
              onGridChange(
                (layout as GridPos[]).map((l) => (l.i === item.i ? { ...l, ...origin } : l))
              );
            }
            if (edge) {
              onWindowUpdate(item.i, (w) => ({ ...w, layoutState: EDGE_TO_LAYOUT[edge] }));
            } else if (attachTarget) {
              onAttachWindow(item.i, attachTarget);
            }
          } else {
            onBringToFront(item.i);
          }
          clearDrag();
        }}
        onResizeStart={() => {
          setGridDragging(true);
          onDragActive(true);
        }}
        onResizeStop={(_l, _old, item) => {
          setGridDragging(false);
          onDragActive(false);
          onBringToFront(item.i);
        }}
      >
        {items.map((g) => {
          const w = windows[g.i];
          return (
            <div key={g.i} className="min-h-0">
              <WindowFrame
                win={w}
                fill
                gridHandle={arrangeMode}
                onUpdate={(updater) => onWindowUpdate(w.id, updater)}
                onSetLiveUrl={(url, moduleId) => onSetLiveUrl(w.id, url, moduleId)}
                onRemoveWindow={() => onRemoveWindow(w.id)}
                onDetachModule={(moduleId) => onDetachModule(w.id, moduleId)}
                isDropTarget={dropTargetId === w.id}
              />
            </div>
          );
        })}
      </Grid>
    </div>
  );
}
