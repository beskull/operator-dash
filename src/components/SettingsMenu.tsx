import { Keyboard, Settings2, Terminal } from "lucide-react";
import { useState } from "react";
import RendererStatus from "./RendererStatus";

interface SettingsMenuProps {
  bgIntensity: number;
  onBgIntensity: (v: number) => void;
  inspectorOpen: boolean;
  onToggleInspector: () => void;
  onToggleHelp: () => void;
  windowCount: number;
}

/**
 * The overflow drawer for everything that isn't a per-second action: canvas
 * glow, the layout inspector, renderer health, shortcuts. Keeping these out of
 * the bar is what collapsed the old two-row chrome into one (v2.14).
 */
export default function SettingsMenu({
  bgIntensity,
  onBgIntensity,
  inspectorOpen,
  onToggleInspector,
  onToggleHelp,
  windowCount,
}: SettingsMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Settings — canvas, developer tools, shortcuts"
        className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
          open
            ? "border-slate-600 bg-slate-800 text-slate-100 light:border-slate-400 light:bg-slate-200 light:text-slate-900"
            : "border-slate-800 bg-slate-900/70 text-slate-400 hover:text-slate-200 light:border-slate-300 light:bg-white light:text-slate-500 light:hover:text-slate-800"
        }`}
      >
        <Settings2 size={13} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[45]" onClick={() => setOpen(false)} />
          <div className="anim-fade-in absolute right-0 top-full z-[46] mt-1.5 w-72 overflow-hidden rounded-xl border border-slate-700/80 bg-[#12151d]/98 shadow-2xl backdrop-blur light:border-slate-300 light:bg-white/98">
            {/* Canvas */}
            <div className="px-3 pb-2 pt-2.5">
              <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500 light:text-slate-400">
                Canvas
              </div>
              <label className="mt-2 flex items-center gap-2.5">
                <span className="text-[11.5px] text-slate-300 light:text-slate-700">Glow</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(bgIntensity * 100)}
                  onChange={(e) => onBgIntensity(Number(e.target.value) / 100)}
                  className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-slate-800 accent-emerald-400 light:bg-slate-300"
                />
                <span className="w-8 shrink-0 text-right font-mono text-[9.5px] text-slate-500 light:text-slate-400">
                  {Math.round(bgIntensity * 100)}%
                </span>
              </label>
            </div>

            {/* Developer */}
            <div className="border-t border-slate-800/80 px-3 pb-2.5 pt-2 light:border-slate-200">
              <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500 light:text-slate-400">
                Developer
              </div>
              <button
                onClick={onToggleInspector}
                className="mt-1.5 flex w-full items-center gap-2 rounded-md py-1 text-left transition-colors hover:bg-slate-800/60 light:hover:bg-slate-100"
              >
                <Terminal size={12} className="shrink-0 text-slate-500" />
                <span className="text-[11.5px] text-slate-300 light:text-slate-700">
                  Layout inspector
                </span>
                <span className="ml-auto flex items-center gap-1.5">
                  <kbd className="rounded border border-slate-700 px-1 font-mono text-[9px] text-slate-500 light:border-slate-300 light:text-slate-400">
                    `
                  </kbd>
                  <span
                    className={`relative h-3.5 w-6 shrink-0 rounded-full transition-colors ${
                      inspectorOpen ? "bg-emerald-500/70" : "bg-slate-700 light:bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-all ${
                        inspectorOpen ? "left-3" : "left-0.5"
                      }`}
                    />
                  </span>
                </span>
              </button>
              <div className="mt-2">
                <RendererStatus variant="row" />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 border-t border-slate-800/80 px-3 py-2 light:border-slate-200">
              <span className="font-mono text-[9.5px] text-slate-600 light:text-slate-400">
                {windowCount} windows open
              </span>
              <button
                onClick={() => {
                  onToggleHelp();
                  setOpen(false);
                }}
                className="ml-auto flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-200 light:text-slate-500 light:hover:bg-slate-100 light:hover:text-slate-800"
              >
                <Keyboard size={12} />
                Shortcuts
                <kbd className="rounded border border-slate-700 px-1 font-mono text-[9px] text-slate-500 light:border-slate-300 light:text-slate-400">
                  ?
                </kbd>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
