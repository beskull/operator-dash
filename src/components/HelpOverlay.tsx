import { X } from "lucide-react";

const GESTURES: Array<[string, string]> = [
  ["arrange switch (m) — OFF by default", "unlock grid dragging/attaching — headers + canvas tint emerald while ON"],
  ["Drag panel header", "move (grid needs arrange ON; floating always moves)"],
  ["Pause on a panel while dragging", "attach its views as TABS — violet highlight (~0.4s)"],
  ["Drag to a screen edge", "dock it — left / right / bottom (emerald zones)"],
  ["Corner handle, drag", "resize — always available, arrange ON or OFF"],
  ["Resize taller, then shorter", "growing pushes panels below down; shrinking pulls them back up"],
  ["Double-click panel header", "zen focus (fills the canvas)"],
  ["Minimize icon (header)", "one-click flatten to the bottom dock"],
  ["work mode (h)", "hides the top bar entirely + slims panel headers"],
  ["Hover a tab → pop-out icon", "detach that view into its own floating panel"],
  ["Click a dock strip", "restore the panel"],
  ["tabs | scroll toggle", "switch a multi-view panel's layout"],
];

const ADDING: Array<[string, string]> = [
  ["+ Panel (top left)", "new panel — Chatbot, Agent flow, or a live URL"],
  ["Dashboard picker (top left)", "switch dashboards, see access scopes, create new"],
  ["+ workspace (top bar)", "what panels exist + their layouts — up to 7, extras collapse behind +N"],
  ["Share icon (workspace chips)", "share this workspace — public / invite only / org"],
  ["Chat (⌘K)", "pops superchat — one thread across every agent"],
  ["Settings (⚙)", "canvas glow · layout inspector · renderer health"],
];

const MENU_ACTIONS: Array<[string, string]> = [
  ["Dock to … edge ×3", "flatten left / right / bottom (same as drag-to-edge)"],
  ["Float / Dock", "pop out as a draggable overlay, or return to grid"],
  ["Zen focus", "fill the canvas, dim everything else"],
  ["Flip side", "two-sided panels: config surface ↔ view"],
  ["Remove panel", "only on live panels you spawned"],
];

const SHORTCUTS: Array<[string, string]> = [
  ["m", "arrange mode on/off (default off)"],
  ["h", "work mode on/off — hide all top chrome"],
  ["⌘K", "pop superchat"],
  ["`", "layout inspector"],
  ["t", "light / dark theme (no button — lives elsewhere later)"],
  ["?", "this sheet"],
  ["Esc", "exit zen focus / close overlays"],
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
            Panel interactions
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
          <Section title="Panel menu (⋯ in every header)" rows={MENU_ACTIONS} />
          <Section title="Keyboard" rows={SHORTCUTS} />
        </div>
      </div>
    </div>
  );
}
