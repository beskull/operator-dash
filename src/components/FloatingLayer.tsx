import { useEffect, useRef, useState } from "react";
import type { WindowState } from "../types";
import { edgeFromPoint, EDGE_TO_LAYOUT, type Edge } from "../utils/edges";
import WindowFrame from "./WindowFrame";

const DEFAULT_SIZE = { w: 380, h: 320 };
const MIN_SIZE = { w: 260, h: 180 };

interface FloatingLayerProps {
  windows: WindowState[];
  onWindowUpdate: (id: string, updater: (w: WindowState) => WindowState) => void;
  onSetLiveUrl: (id: string, url: string, moduleId?: string) => void;
  onRemoveWindow: (id: string) => void;
  onDetachModule: (id: string, moduleId: string) => void;
  /** Live drop-target reporting while dragging (null when over nothing). */
  onHoverDropTarget: (id: string | null) => void;
  /** Drag ended over a target — attach source into target's scroll stack. */
  onAttachWindow: (sourceId: string, targetId: string) => void;
  dropTargetId: string | null;
  /** Edge-drop reporting: which screen edge the cursor is over (or null). */
  onEdgeHover: (edge: Edge | null) => void;
  /** Drag started/ended — drives edge-zone visibility. */
  onDragActive: (active: boolean) => void;
}

/** Renders floating windows as a draggable, resizable overlay above panels. */
export default function FloatingLayer({
  windows,
  onWindowUpdate,
  onSetLiveUrl,
  onRemoveWindow,
  onDetachModule,
  onHoverDropTarget,
  onAttachWindow,
  dropTargetId,
  onEdgeHover,
  onDragActive,
}: FloatingLayerProps) {
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const resizeRef = useRef<{ id: string; startX: number; startY: number; startW: number; startH: number } | null>(null);
  const dropRef = useRef<string | null>(null);
  const edgeRef = useRef<Edge | null>(null);
  // Attach arms only after the cursor *pauses* over a target — hovering in
  // passing never triggers it. still = accumulated near-stationary ms.
  const hoverRef = useRef({ id: null as string | null, x: 0, y: 0, t: 0, still: 0 });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (drag) {
        const x = Math.max(8, Math.min(e.clientX - drag.dx, window.innerWidth - 200));
        const y = Math.max(56, Math.min(e.clientY - drag.dy, window.innerHeight - 120));
        onWindowUpdate(drag.id, (w) => ({ ...w, floatPos: { x, y } }));

        // Edge zones take priority: over an edge = dock intent, not attach.
        const edge = edgeFromPoint(e.clientX, e.clientY);
        if (edge !== edgeRef.current) {
          edgeRef.current = edge;
          onEdgeHover(edge);
        }
        if (edge) {
          if (dropRef.current) {
            dropRef.current = null;
            onHoverDropTarget(null);
          }
          hoverRef.current.still = 0;
          return;
        }

        // Hit-test what's under the cursor (the dragged window itself is
        // pointer-events-none while dragging, so we see through it).
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const host = el instanceof Element ? el.closest("[data-window-id]") : null;
        const hostId = host?.getAttribute("data-window-id") ?? null;
        const next = hostId && hostId !== drag.id ? hostId : null;

        const h = hoverRef.current;
        const now = performance.now();
        if (next !== h.id) {
          h.id = next;
          h.still = 0;
        }
        const dt = now - h.t;
        h.t = now;
        const moved = Math.hypot(e.clientX - h.x, e.clientY - h.y);
        h.x = e.clientX;
        h.y = e.clientY;
        h.still = moved < 6 ? h.still + dt : 0;

        const armed = next !== null && h.still > 400;
        const armedId = armed ? next : null;
        if (armedId !== dropRef.current) {
          dropRef.current = armedId;
          onHoverDropTarget(armedId);
        }
        return;
      }
      const resize = resizeRef.current;
      if (resize) {
        const w = Math.max(MIN_SIZE.w, Math.min(resize.startW + (e.clientX - resize.startX), window.innerWidth - 32));
        const h = Math.max(MIN_SIZE.h, Math.min(resize.startH + (e.clientY - resize.startY), window.innerHeight - 96));
        onWindowUpdate(resize.id, (win) => ({ ...win, floatSize: { w, h } }));
      }
    };

    const up = () => {
      const drag = dragRef.current;
      if (drag && edgeRef.current) {
        // Released on a screen edge → dock the window to that edge.
        const layoutState = EDGE_TO_LAYOUT[edgeRef.current];
        onWindowUpdate(drag.id, (w) => ({ ...w, layoutState }));
      } else if (drag && dropRef.current) {
        onAttachWindow(drag.id, dropRef.current);
      }
      dragRef.current = null;
      resizeRef.current = null;
      dropRef.current = null;
      edgeRef.current = null;
      hoverRef.current = { id: null, x: 0, y: 0, t: 0, still: 0 };
      setDraggingId(null);
      setResizingId(null);
      onHoverDropTarget(null);
      onEdgeHover(null);
      onDragActive(false);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [onWindowUpdate, onHoverDropTarget, onAttachWindow, onEdgeHover, onDragActive]);

  const floating = windows.filter((w) => w.layoutState === "floating");
  if (floating.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {floating.map((w, i) => {
        const size = w.floatSize ?? DEFAULT_SIZE;
        const raw = w.floatPos ?? { x: 120 + i * 48, y: 120 + i * 48 };
        const pos = {
          x: Math.max(8, Math.min(raw.x, window.innerWidth - size.w - 16)),
          y: Math.max(56, Math.min(raw.y, window.innerHeight - 160)),
        };
        const isDragged = draggingId === w.id;
        const isResized = resizingId === w.id;
        return (
          <div
            key={w.id}
            className={`absolute ${isDragged ? "pointer-events-none" : "pointer-events-auto"} ${
              isResized ? "[&_iframe]:pointer-events-none" : ""
            }`}
            style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
          >
            <WindowFrame
              win={w}
              fill
              onUpdate={(updater) => onWindowUpdate(w.id, updater)}
              onSetLiveUrl={(url, moduleId) => onSetLiveUrl(w.id, url, moduleId)}
              onRemoveWindow={() => onRemoveWindow(w.id)}
              onDetachModule={(moduleId) => onDetachModule(w.id, moduleId)}
              isDropTarget={dropTargetId === w.id}
              onHeaderPointerDown={(e) => {
                // Only drag from empty header space, not the control buttons.
                if ((e.target as HTMLElement).closest("button")) return;
                dragRef.current = { id: w.id, dx: e.clientX - pos.x, dy: e.clientY - pos.y };
                setDraggingId(w.id);
                onDragActive(true);
              }}
            />
            {/* Corner resize grip */}
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                resizeRef.current = {
                  id: w.id,
                  startX: e.clientX,
                  startY: e.clientY,
                  startW: size.w,
                  startH: size.h,
                };
                setResizingId(w.id);
                onDragActive(true); // kills iframe hit-testing during resize
              }}
              title="Drag to resize"
              className={`absolute bottom-0.5 right-0.5 flex h-4 w-4 cursor-nwse-resize items-end justify-end p-0.5 ${
                isResized ? "opacity-100" : "opacity-40 hover:opacity-100"
              }`}
            >
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path d="M 9 1 L 1 9 M 9 5 L 5 9 M 9 9 L 9 9" stroke="#64748b" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}
