import { X } from "lucide-react";
import type { LayoutState, WorkspaceState } from "../types";

const STATE_CLS: Record<LayoutState, string> = {
  normal: "text-slate-400 border-slate-700 light:text-slate-500 light:border-slate-300",
  flattenedLeft: "text-cyan-300 border-cyan-500/40 light:text-cyan-700",
  flattenedRight: "text-cyan-300 border-cyan-500/40 light:text-cyan-700",
  flattenedTop: "text-cyan-300 border-cyan-500/40 light:text-cyan-700",
  flattenedBottom: "text-cyan-300 border-cyan-500/40 light:text-cyan-700",
  floating: "text-violet-300 border-violet-500/40 light:text-violet-700",
  focused: "text-emerald-300 border-emerald-500/40 light:text-emerald-700",
  backdrop: "text-amber-300 border-amber-500/40 light:text-amber-700",
};

interface DebugInspectorProps {
  workspace: WorkspaceState;
  boardName: string;
  onClose: () => void;
}

/** Live dump of the layout state — every window and its layoutState. */
export default function DebugInspector({ workspace, boardName, onClose }: DebugInspectorProps) {
  const windows = Object.values(workspace.windows);
  const count = (pred: (w: (typeof windows)[number]) => boolean) => windows.filter(pred).length;

  return (
    <aside className="anim-fade-in absolute bottom-3 right-3 z-50 w-72 rounded-xl border border-slate-700/80 bg-[#0d1017]/95 shadow-2xl backdrop-blur light:border-slate-300 light:bg-white/95">
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 light:border-slate-200">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-cyan-400 light:text-cyan-700">
          layout inspector
        </span>
        <button
          onClick={onClose}
          className="rounded p-0.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200 light:hover:bg-slate-200 light:hover:text-slate-700"
        >
          <X size={12} />
        </button>
      </div>
      <div className="space-y-2 px-3 py-2.5 font-mono text-[10.5px]">
        <div className="flex justify-between text-slate-500">
          <span>board</span>
          <span className="text-slate-300 light:text-slate-700">{boardName}</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>workspace</span>
          <span className="text-slate-300 light:text-slate-700">{workspace.name}</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>layout slot</span>
          <span className="text-emerald-300 light:text-emerald-700">
            {workspace.slots[workspace.activeSlot]?.name ?? workspace.activeSlot + 1}
          </span>
        </div>
        <div className="my-1.5 h-px bg-slate-800 light:bg-slate-200" />
        {windows.map((w) => (
          <div key={w.id} className="flex items-center justify-between gap-2">
            <span className="truncate text-slate-400 light:text-slate-600">{w.title}</span>
            <span className={`shrink-0 rounded border px-1 py-px text-[9px] ${STATE_CLS[w.layoutState]}`}>
              {w.layoutState}
            </span>
          </div>
        ))}
        <div className="my-1.5 h-px bg-slate-800 light:bg-slate-200" />
        <div className="flex justify-between text-slate-600 light:text-slate-400">
          <span>
            {count((w) => w.layoutState.startsWith("flattened"))} flattened ·{" "}
            {count((w) => w.layoutState === "floating")} floating ·{" "}
            {count((w) => w.layoutState === "backdrop")} backdrop
          </span>
          <span>{windows.length} total</span>
        </div>
      </div>
    </aside>
  );
}
