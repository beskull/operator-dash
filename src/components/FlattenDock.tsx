import type { LayoutState, WindowState } from "../types";

const STATUS_DOT: Record<string, string> = {
  ok: "bg-emerald-400",
  warn: "bg-amber-400",
  error: "bg-rose-400",
};

type Edge = "left" | "right" | "top" | "bottom";

const EDGE_STATE: Record<Edge, LayoutState> = {
  left: "flattenedLeft",
  right: "flattenedRight",
  top: "flattenedTop",
  bottom: "flattenedBottom",
};

const EDGE_ANIM: Record<Edge, string> = {
  left: "anim-dock-left",
  right: "anim-dock-right",
  top: "anim-dock-top",
  bottom: "anim-dock-bottom",
};

interface FlattenDockProps {
  edge: Edge;
  windows: WindowState[];
  onRestore: (id: string) => void;
}

/** Edge dock that renders slim strips for flattened windows. Click restores. */
export default function FlattenDock({ edge, windows, onRestore }: FlattenDockProps) {
  const docked = windows.filter((w) => w.layoutState === EDGE_STATE[edge]);
  if (docked.length === 0) return null;

  const vertical = edge === "left" || edge === "right";

  return (
    <div
      className={`flex shrink-0 gap-1.5 ${EDGE_ANIM[edge]} ${
        vertical ? "w-11 flex-col items-center py-1" : "h-9 flex-row items-center px-1"
      }`}
    >
      {docked.map((w) => (
        <button
          key={w.id}
          onClick={() => onRestore(w.id)}
          title={`Restore ${w.title}`}
          className={`group flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-900/90 transition-all hover:border-emerald-500/50 hover:bg-slate-800 light:border-slate-300 light:bg-white/90 light:hover:bg-slate-100 ${
            vertical ? "h-28 w-8 flex-col py-2" : "h-7 flex-row px-2.5"
          }`}
        >
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[w.status ?? "ok"]}`} />
          <span
            className={`truncate font-mono text-[9.5px] tracking-wide text-slate-400 group-hover:text-slate-200 light:text-slate-500 light:group-hover:text-slate-800 ${
              vertical ? "vertical-text" : ""
            }`}
          >
            {w.title}
          </span>
        </button>
      ))}
    </div>
  );
}
