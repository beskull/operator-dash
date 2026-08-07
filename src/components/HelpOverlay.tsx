import { X } from "lucide-react";

const GESTURES: Array<[string, string]> = [
  ["Drag window header", "move (grid tile or floating)"],
  ["Drag window to a screen edge", "dock it — left / right / bottom"],
  ["While dragging, pause on a window", "attach into its scroll stack (~0.4s)"],
  ["Corner handle, drag", "resize (grid + floating)"],
  ["Double-click window header", "zen focus (fills the canvas)"],
  ["Click a dock strip", "restore the window"],
  ["tabs | scroll toggle", "switch a multi-module window's view"],
];

const ADDING: Array<[string, string]> = [
  ["+ window (control panel)", "new floating window — live URL, logs, chat, canvas…"],
  ["+ board (top bar)", "a major area — up to 7"],
  ["+ workspace (top bar)", "a saved layout inside a board — up to 7 per board"],
  ["1 / 2 / 3 modes", "rearrange THIS workspace's windows into presets"],
];

const MENU_ACTIONS: Array<[string, string]> = [
  ["Dock to … edge ×3", "flatten left / right / bottom (same as drag-to-edge)"],
  ["Float / Dock", "pop out as a draggable overlay, or return to grid"],
  ["Zen focus", "fill the canvas, dim everything else"],
  ["Send to background", "live behind all panels (backdrop)"],
  ["Flip side", "two-sided windows: config surface ↔ module"],
  ["Remove window", "only on live windows you spawned"],
];

const SHORTCUTS: Array<[string, string]> = [
  ["1 / 2 / 3", "Ops · Debug · Build mode"],
  ["⌘K", "focus command input"],
  ["`", "layout inspector"],
  ["t", "light / dark theme"],
  ["?", "this sheet"],
  ["Esc", "exit zen focus"],
];

function Section({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <div>
      <div className="mb-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-cyan-400 light:text-cyan-700">
        {title}
      </div>
      <div className="space-y-1">
        {rows.map(([a, b]) => (
          <div key={a} className="flex items-baseline gap-3 text-[11px]">
            <span className="w-44 shrink-0 font-medium text-slate-200 light:text-slate-800">{a}</span>
            <span className="text-slate-500 light:text-slate-500">{b}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Interaction cheat sheet — toggled with the ? key. */
export default function HelpOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="anim-fade-in fixed inset-0 z-[70] flex items-center justify-center p-6" role="dialog">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] light:bg-slate-500/30" onClick={onClose} />
      <div className="window-capsule relative w-[560px] max-w-full rounded-xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200 light:text-slate-800">
            Window interactions
          </span>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:bg-slate-700/70 hover:text-slate-200 light:hover:bg-slate-200 light:hover:text-slate-700"
          >
            <X size={13} />
          </button>
        </div>
        <div className="space-y-5">
          <Section title="Gestures" rows={GESTURES} />
          <Section title="Adding things" rows={ADDING} />
          <Section title="Window menu (⋯ in every header)" rows={MENU_ACTIONS} />
          <Section title="Keyboard" rows={SHORTCUTS} />
        </div>
      </div>
    </div>
  );
}
