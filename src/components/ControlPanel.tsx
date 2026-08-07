import { Activity, Bug, CircleHelp, Globe, Hammer, Terminal } from "lucide-react";
import { useState } from "react";
import type { ModeKey } from "../types";

const MODES: Array<{ key: ModeKey; label: string; icon: typeof Activity; hotkey: string }> = [
  { key: "ops", label: "Ops mode", icon: Activity, hotkey: "1" },
  { key: "debug", label: "Debug mode", icon: Bug, hotkey: "2" },
  { key: "build", label: "Build mode", icon: Hammer, hotkey: "3" },
];

interface ControlPanelProps {
  mode: ModeKey;
  onModeChange: (mode: ModeKey) => void;
  bgIntensity: number;
  onBgIntensity: (v: number) => void;
  inspectorOpen: boolean;
  onToggleInspector: () => void;
  onToggleHelp: () => void;
  windowCount: number;
  onAddLiveWindow: (url: string) => void;
}

/** Top control surface: mode presets, live-URL spawner, canvas intensity, inspector. */
export default function ControlPanel({
  mode,
  onModeChange,
  bgIntensity,
  onBgIntensity,
  inspectorOpen,
  onToggleInspector,
  onToggleHelp,
  windowCount,
  onAddLiveWindow,
}: ControlPanelProps) {
  const [liveOpen, setLiveOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const submitLive = () => {
    const url = draft.trim();
    if (!url) return;
    onAddLiveWindow(url);
    setDraft("");
    setLiveOpen(false);
  };

  return (
    <div className="flex items-center gap-4 px-3 py-2">
      <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/80 p-1 light:border-slate-300 light:bg-white/85">
        {MODES.map(({ key, label, icon: Icon, hotkey }) => (
          <button
            key={key}
            onClick={() => onModeChange(key)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
              mode === key
                ? "bg-emerald-500/15 text-emerald-300 shadow-[0_0_12px_-2px_rgba(52,211,153,0.4)] light:text-emerald-700"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200 light:text-slate-500 light:hover:bg-slate-100 light:hover:text-slate-800"
            }`}
          >
            <Icon size={12} />
            {label}
            <kbd
              className={`rounded border px-1 font-mono text-[9px] ${
                mode === key
                  ? "border-emerald-500/40 text-emerald-500 light:text-emerald-600"
                  : "border-slate-700 text-slate-600 light:border-slate-300 light:text-slate-400"
              }`}
            >
              {hotkey}
            </kbd>
          </button>
        ))}
      </div>

      {/* Spawn a live-URL window */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setLiveOpen((v) => !v)}
          title="Open a live URL in a new floating window"
          className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10.5px] transition-colors ${
            liveOpen
              ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300 light:text-cyan-700"
              : "border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200 light:border-slate-300 light:bg-white/85 light:text-slate-500 light:hover:text-slate-800"
          }`}
        >
          <Globe size={11} />
          live URL
        </button>
        {liveOpen && (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitLive();
              if (e.key === "Escape") setLiveOpen(false);
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
