import { Bot, CircleHelp, Globe, Minus, Move, Plus, Terminal, Workflow } from "lucide-react";
import { useState } from "react";
import type { ModuleType } from "../types";
import RendererStatus from "./RendererStatus";

// The FluxPrompt production trio only — mock surfaces were trimmed (v2.13).
const ADD_MENU: Array<{ type: ModuleType; label: string; icon: typeof Globe }> = [
  { type: "chatbot", label: "Chatbot (FluxPrompt)", icon: Bot },
  { type: "live", label: "Add URL…", icon: Globe },
  { type: "canvas", label: "Agent flow (FluxPrompt)", icon: Workflow },
];

interface ControlPanelProps {
  arrangeMode: boolean;
  onToggleArrange: () => void;
  minimalHeaders: boolean;
  onToggleMinimalHeaders: () => void;
  bgIntensity: number;
  onBgIntensity: (v: number) => void;
  inspectorOpen: boolean;
  onToggleInspector: () => void;
  onToggleHelp: () => void;
  windowCount: number;
  /** Spawn a new floating window of the given module type. */
  onAddWindow: (moduleType: ModuleType, url?: string) => void;
}

/** Top control surface: arrange, add-window, canvas glow, inspector, help.
    (Layout slots UI hidden in v2.13 — slots still exist in the data model.) */
export default function ControlPanel({
  arrangeMode,
  onToggleArrange,
  minimalHeaders,
  onToggleMinimalHeaders,
  bgIntensity,
  onBgIntensity,
  inspectorOpen,
  onToggleInspector,
  onToggleHelp,
  windowCount,
  onAddWindow,
}: ControlPanelProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [draft, setDraft] = useState("");

  const submitUrl = () => {
    const url = draft.trim();
    if (!url) return;
    onAddWindow("live", url);
    setDraft("");
    setUrlMode(false);
    setAddOpen(false);
  };

  return (
    <div className="flex items-center gap-4 px-3 py-2">
      {/* Arrange mode: unlocks grid dragging + attach. Resize is always on. */}
      <button
        onClick={onToggleArrange}
        title="Arrange mode (m): drag grid windows to move them, pause on a window to attach. Off = grid is locked against accidental moves; resize still works."
        className={`flex items-center gap-2 rounded-lg border px-2.5 py-1 text-[10.5px] font-medium transition-all ${
          arrangeMode
            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300 light:text-emerald-700"
            : "border-slate-800 bg-slate-900/80 text-slate-500 hover:text-slate-300 light:border-slate-300 light:bg-white/85 light:hover:text-slate-700"
        }`}
      >
        <Move size={11} />
        arrange
        <span
          className={`relative h-3.5 w-6 rounded-full transition-colors ${
            arrangeMode ? "bg-emerald-500/70" : "bg-slate-700 light:bg-slate-300"
          }`}
        >
          <span
            className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-all ${
              arrangeMode ? "left-3" : "left-0.5"
            }`}
          />
        </span>
      </button>

      {/* Add a new window (its own button — module picker) */}
      <div className="relative flex items-center gap-1.5">
        <button
          onClick={() => {
            setAddOpen((v) => !v);
            setUrlMode(false);
          }}
          title="Add a new floating window"
          className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10.5px] transition-colors ${
            addOpen
              ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300 light:text-cyan-700"
              : "border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200 light:border-slate-300 light:bg-white/85 light:text-slate-500 light:hover:text-slate-800"
          }`}
        >
          <Plus size={11} />
          window
        </button>
        {addOpen && (
          <>
            <div
              className="fixed inset-0 z-[45]"
              onClick={() => {
                setAddOpen(false);
                setUrlMode(false);
              }}
            />
            <div className="anim-fade-in absolute left-0 top-full z-[46] mt-1 w-44 overflow-hidden rounded-lg border border-slate-700/80 bg-[#12151d]/98 py-1 shadow-2xl backdrop-blur light:border-slate-300 light:bg-white/98">
              {ADD_MENU.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => {
                    if (type === "live") {
                      setUrlMode(true);
                    } else {
                      onAddWindow(type);
                      setAddOpen(false);
                    }
                  }}
                  className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[11px] text-slate-300 transition-colors hover:bg-slate-700/60 light:text-slate-700 light:hover:bg-slate-100"
                >
                  <Icon size={12} className="shrink-0 opacity-70" />
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
        {addOpen && urlMode && (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitUrl();
              if (e.key === "Escape") {
                setUrlMode(false);
                setAddOpen(false);
              }
            }}
            placeholder="localhost:3000 ⏎"
            className="w-52 rounded-md border border-cyan-500/40 bg-slate-900 px-2 py-1 font-mono text-[10.5px] text-slate-200 outline-none placeholder:text-slate-600 light:border-cyan-600/40 light:bg-white light:text-slate-800 light:placeholder:text-slate-400"
          />
        )}
      </div>

      <label className="flex items-center gap-2 text-[10.5px] text-slate-500">
        canvas glow
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(bgIntensity * 100)}
          onChange={(e) => onBgIntensity(Number(e.target.value) / 100)}
          className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-slate-800 accent-emerald-400 light:bg-slate-300"
        />
      </label>

      <div className="ml-auto flex items-center gap-3">
        <RendererStatus />
        <button
          onClick={onToggleMinimalHeaders}
          title="Work mode (h): hide dashboard/workspace chrome and slim the window headers — everything but your windows goes away"
          className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10.5px] transition-colors ${
            minimalHeaders
              ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300 light:text-cyan-700"
              : "border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200 light:border-slate-300 light:bg-white/85 light:text-slate-500 light:hover:text-slate-800"
          }`}
        >
          <Minus size={11} />
          work mode
        </button>
        <span className="font-mono text-[10px] text-slate-600 light:text-slate-400">
          {windowCount} windows
        </span>
        <button
          onClick={onToggleInspector}
          title="Toggle layout inspector (`)"
          className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10.5px] transition-colors ${
            inspectorOpen
              ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300 light:text-cyan-700"
              : "border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200 light:border-slate-300 light:bg-white/85 light:text-slate-500 light:hover:text-slate-800"
          }`}
        >
          <Terminal size={11} />
          inspector
        </button>
        <button
          onClick={onToggleHelp}
          title="Window interactions cheat sheet (?)"
          className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900/80 px-2 py-1 text-[10.5px] text-slate-400 transition-colors hover:text-slate-200 light:border-slate-300 light:bg-white/85 light:text-slate-500 light:hover:text-slate-800"
        >
          <CircleHelp size={11} />?
        </button>
      </div>
    </div>
  );
}
