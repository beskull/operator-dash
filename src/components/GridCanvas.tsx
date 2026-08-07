import { useRef, useState } from "react";
import GridLayout, { WidthProvider, type Layout } from "react-grid-layout";
import type { GridPos, WindowState } from "../types";
import { edgeFromPoint, EDGE_TO_LAYOUT, type Edge } from "../utils/edges";
import WindowFrame from "./WindowFrame";

const Grid = WidthProvider(GridLayout);

interface GridCanvasProps {
  /** Grid entries for the active mode (all windows; filtered internally). */
  grid: GridPos[];
  windows: Record<string, WindowState>;
  onGridChange: (layout: GridPos[]) => void;
  onWindowUpdate: (id: string, updater: (w: WindowState) => WindowState) => void;
  onSetLiveUrl: (id: string, url: string, moduleId?: string) => void;
  onRemoveWindow: (id: string) => void;
  onDetachModule: (id: string, moduleId: string) => void;
  /** Raise a window's paint order after a deliberate drag/resize. */
  onBringToFront: (id: string) => void;
  /** Edge-drop reporting: which screen edge the cursor is over (or null). */
  onEdgeHover: (edge: Edge | null) => void;
  /** Drag started/ended — drives edge-zone visibility. */
  onDragActive: (active: boolean) => void;
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
  onGridChange,
  onWindowUpdate,
  onSetLiveUrl,
  onRemoveWindow,
  onDetachModule,
  onBringToFront,
  onEdgeHover,
  onDragActive,
  dropTargetId,
  dimmed,
}: GridCanvasProps) {
  // Shield iframes during grid drags so pointer events aren't swallowed.
  const [gridDragging, setGridDragging] = useState(false);
  // Pre-drag rect, so an edge-drop can leave the grid entry untouched.
  const dragOrigin = useRef<GridPos | null>(null);

  const items = grid.filter((g) => {
    const w = windows[g.i];
    return w && w.layoutState === "normal";
  });

  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-800 font-mono text-[11px] text-slate-600 light:border-slate-300 light:text-slate-400">
        no windows on the grid — switch mode or restore from a dock
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
        draggableHandle=".win-drag-handle"
        draggableCancel="button, input, a, select, textarea"
        onLayoutChange={(layout: Layout[]) => onGridChange(layout as GridPos[])}
        onDragStart={(_l, oldItem) => {
          setGridDragging(true);
          onDragActive(true);
          dragOrigin.current = { i: oldItem.i, x: oldItem.x, y: oldItem.y, w: oldItem.w, h: oldItem.h };
        }}
        onDrag={(_l, _old, _new, _ph, e) => {
          const me = e as MouseEvent;
          onEdgeHover(edgeFromPoint(me.clientX, me.clientY));
        }}
        onDragStop={(layout, _old, item, _ph, e) => {
          setGridDragging(false);
          onDragActive(false);
          onEdgeHover(null);
          const me = e as MouseEvent;
          const edge = edgeFromPoint(me.clientX, me.clientY);
          if (edge) {
            // Dock to the edge; revert the grid rect to its pre-drag origin.
            const origin = dragOrigin.current;
            if (origin) {
              onGridChange(
                (layout as GridPos[]).map((l) => (l.i === item.i ? { ...l, ...origin } : l))
              );
            }
            onWindowUpdate(item.i, (w) => ({ ...w, layoutState: EDGE_TO_LAYOUT[edge] }));
          } else {
            onBringToFront(item.i);
          }
          dragOrigin.current = null;
        }}
        onResizeStart={() => setGridDragging(true)}
        onResizeStop={(_l, _old, item) => {
          setGridDragging(false);
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
                gridHandle
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
