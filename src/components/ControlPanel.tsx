import {
  Activity,
  BarChart3,
  Bug,
  CircleHelp,
  Code2,
  FileText,
  Globe,
  Hammer,
  HeartPulse,
  MessageSquare,
  Minus,
  Move,
  Plus,
  ScrollText,
  Terminal,
  Users,
  Workflow,
} from "lucide-react";
import { useState } from "react";
import type { ModuleType, SlotDef } from "../types";

const SLOT_ICONS = [Activity, Bug, Hammer];

const ADD_MENU: Array<{ type: ModuleType; label: string; icon: typeof Globe }> = [
  { type: "live", label: "Live URL…", icon: Globe },
  { type: "logs", label: "Log stream", icon: ScrollText },
  { type: "statusCard", label: "Status card", icon: HeartPulse },
  { type: "dashboard", label: "Metrics", icon: BarChart3 },
  { type: "chat", label: "Chat console", icon: MessageSquare },
  { type: "docs", label: "Notes / docs", icon: FileText },
  { type: "sessions", label: "Sessions", icon: Users },
  { type: "canvas", label: "Flux canvas", icon: Workflow },
  { type: "webapp", label: "Code editor", icon: Code2 },
];

interface ControlPanelProps {
  /** The workspace's saved layout slots (max 3). */
  slots: SlotDef[];
  activeSlot: number;
  onSlotChange: (slot: number) => void;
  onRenameSlot: (slot: number, name: string) => void;
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

/** Top control surface: layout slots, add-window, canvas glow, inspector, help. */
export default function ControlPanel({
  slots,
  activeSlot,
  onSlotChange,
  onRenameSlot,
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

      <div className="flex items-center gap-2">
        <span
          className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-600 light:text-slate-400"
          title="Your saved arrangements of THIS workspace. Arranging auto-saves into the active slot. Double-click a slot to rename it."
        >
          layout slots
        </span>
        <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/80 p-1 light:border-slate-300 light:bg-white/85">
          {slots.map((slot, i) => (
            <SlotButton
              key={i}
              name={slot.name}
              icon={SLOT_ICONS[i % SLOT_ICONS.length]}
              hotkey={String(i + 1)}
              active={i === activeSlot}
              onClick={() => onSlotChange(i)}
              onRename={(name) => onRenameSlot(i, name)}
            />
          ))}
        </div>
      </div>

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
        <button
          onClick={onToggleMinimalHeaders}
          title="Minimal window headers (h): chrome collapses to a slim strip, controls appear on hover"
          className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10.5px] transition-colors ${
            minimalHeaders
              ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300 light:text-cyan-700"
              : "border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200 light:border-slate-300 light:bg-white/85 light:text-slate-500 light:hover:text-slate-800"
          }`}
        >
          <Minus size={11} />
          minimal
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

/** A layout-slot button: click switches, double-click renames inline. */
function SlotButton({
  name,
  icon: Icon,
  hotkey,
  active,
  onClick,
  onRename,
}: {
  name: string;
  icon: typeof Activity;
  hotkey: string;
  active: boolean;
  onClick: () => void;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && draft.trim()) {
            onRename(draft);
            setEditing(false);
          }
          if (e.key === "Escape") setEditing(false);
        }}
        onBlur={() => setEditing(false)}
        className="w-20 rounded-md border border-emerald-500/50 bg-slate-900 px-1.5 py-1 text-[10.5px] text-slate-200 outline-none light:bg-white light:text-slate-800"
      />
    );
  }

  return (
    <button
      onClick={onClick}
      onDoubleClick={() => {
        setDraft(name);
        setEditing(true);
      }}
      title={`${name} layout · key ${hotkey} · double-click to rename`}
      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
        active
          ? "bg-emerald-500/15 text-emerald-300 shadow-[0_0_12px_-2px_rgba(52,211,153,0.4)] light:text-emerald-700"
          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200 light:text-slate-500 light:hover:bg-slate-100 light:hover:text-slate-800"
      }`}
    >
      <Icon size={12} />
      {name}
      <kbd
        className={`rounded border px-1 font-mono text-[9px] ${
          active
            ? "border-emerald-500/40 text-emerald-500 light:text-emerald-600"
            : "border-slate-700 text-slate-600 light:border-slate-300 light:text-slate-400"
        }`}
      >
        {hotkey}
      </kbd>
    </button>
  );
}
