import { Bot, Globe, Plus, Workflow } from "lucide-react";
import { useState } from "react";
import type { ModuleType } from "../types";

// The FluxPrompt production trio only — mock surfaces were trimmed (v2.13).
const ADD_MENU: Array<{ type: ModuleType; label: string; hint: string; icon: typeof Globe }> = [
  { type: "chatbot", label: "Chatbot", hint: "FluxPrompt", icon: Bot },
  { type: "canvas", label: "Agent flow", hint: "FluxPrompt", icon: Workflow },
  { type: "live", label: "Add URL…", hint: "live view", icon: Globe },
];

/**
 * The primary creation action. Styled as the one filled button in the bar —
 * spawning a window is the most common thing an operator does.
 */
export default function AddWindowButton({
  onAddWindow,
}: {
  onAddWindow: (moduleType: ModuleType, url?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [draft, setDraft] = useState("");

  const close = () => {
    setOpen(false);
    setUrlMode(false);
    setDraft("");
  };

  const submitUrl = () => {
    const url = draft.trim();
    if (!url) return;
    onAddWindow("live", url);
    close();
  };

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => (open ? close() : setOpen(true))}
        title="Add a window to this workspace"
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold transition-all ${
          open
            ? "bg-emerald-500/30 text-emerald-100 light:bg-emerald-500/25 light:text-emerald-800"
            : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 hover:text-emerald-100 light:text-emerald-700 light:hover:bg-emerald-500/25"
        }`}
      >
        <Plus size={13} className="shrink-0" />
        Window
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[45]" onClick={close} />
          <div className="anim-fade-in absolute right-0 top-full z-[46] mt-1.5 w-56 overflow-hidden rounded-xl border border-slate-700/80 bg-[#12151d]/98 shadow-2xl backdrop-blur light:border-slate-300 light:bg-white/98">
            {urlMode ? (
              <div className="p-2.5">
                <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500 light:text-slate-400">
                  Live URL
                </div>
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitUrl();
                    if (e.key === "Escape") close();
                  }}
                  placeholder="localhost:3000 ⏎"
                  className="w-full rounded-md border border-cyan-500/40 bg-slate-900 px-2 py-1.5 font-mono text-[10.5px] text-slate-200 outline-none placeholder:text-slate-600 light:border-cyan-600/40 light:bg-white light:text-slate-800 light:placeholder:text-slate-400"
                />
                <div className="mt-1.5 font-mono text-[9px] text-slate-600 light:text-slate-400">
                  frame-blocked sites route through the renderer
                </div>
              </div>
            ) : (
              <div className="py-1">
                {ADD_MENU.map(({ type, label, hint, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => {
                      if (type === "live") {
                        setUrlMode(true);
                      } else {
                        onAddWindow(type);
                        close();
                      }
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-slate-700/60 light:hover:bg-slate-100"
                  >
                    <Icon size={13} className="shrink-0 text-slate-500" />
                    <span className="text-[11.5px] font-medium text-slate-200 light:text-slate-700">
                      {label}
                    </span>
                    <span className="ml-auto font-mono text-[9px] uppercase tracking-wide text-slate-600 light:text-slate-400">
                      {hint}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
