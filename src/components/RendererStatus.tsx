import { Check, Copy, Radio } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { REMOTE, withToken } from "../config";

const SETUP_CMD = "npx -y github:beskull/operator-dash";

type Status = "checking" | "local" | "offline";

/**
 * Renderer status pill + setup popover. The renderer runs on the USER'S own
 * machine (localhost:5198 by default) — the popover hands them a one-command
 * setup and a connection test.
 */
export default function RendererStatus() {
  const [status, setStatus] = useState<Status>("checking");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const check = useCallback(async () => {
    try {
      const r = await fetch(withToken(`${REMOTE}/api/health`), { signal: AbortSignal.timeout(3000) });
      setStatus(r.ok ? "local" : "offline");
    } catch {
      setStatus("offline");
    }
  }, []);

  useEffect(() => {
    check();
    const t = setInterval(check, 20000);
    return () => clearInterval(t);
  }, [check]);

  const copy = () => {
    navigator.clipboard.writeText(SETUP_CMD).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const dot =
    status === "local" ? "bg-emerald-400" : status === "checking" ? "bg-amber-400" : "bg-slate-500";

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) check();
        }}
        title="Remote-render service status — run it on your own machine"
        className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10.5px] transition-colors ${
          status === "local"
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 light:text-emerald-700"
            : "border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200 light:border-slate-300 light:bg-white/85 light:text-slate-500 light:hover:text-slate-800"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        renderer
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[45]" onClick={() => setOpen(false)} />
          <div className="anim-fade-in absolute right-0 top-full z-[46] mt-1 w-80 rounded-lg border border-slate-700/80 bg-[#12151d]/98 p-3 shadow-2xl backdrop-blur light:border-slate-300 light:bg-white/98">
            <div className="flex items-center gap-2 text-[11.5px] font-medium text-slate-200 light:text-slate-800">
              <Radio size={12} className={status === "local" ? "text-emerald-400" : "text-slate-500"} />
              {status === "local"
                ? "Renderer connected — running on this machine"
                : "Renderer not detected"}
            </div>

            <p className="mt-2 text-[10.5px] leading-relaxed text-slate-400 light:text-slate-600">
              Remote windows (sites that block embedding) are rendered by a tiny service that runs
              on <span className="text-slate-200 light:text-slate-800">your own machine</span>. One
              command, no server needed — your logins never leave your hardware:
            </p>

            <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-950/70 px-2 py-1.5 light:border-slate-300 light:bg-slate-50">
              <code className="flex-1 truncate font-mono text-[10px] text-cyan-300 light:text-cyan-700">
                {SETUP_CMD}
              </code>
              <button
                onClick={copy}
                title="Copy setup command"
                className="shrink-0 rounded p-1 text-slate-500 hover:bg-slate-700/60 hover:text-slate-200 light:hover:bg-slate-200 light:hover:text-slate-700"
              >
                {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              </button>
            </div>

            <ol className="mt-2 list-inside list-decimal space-y-0.5 font-mono text-[9.5px] leading-relaxed text-slate-500 light:text-slate-500">
              <li>paste it in any terminal (needs Node.js)</li>
              <li>first run downloads Chromium once (~150MB)</li>
              <li>leave it running; it sleeps when idle</li>
            </ol>

            <button
              onClick={check}
              className="mt-2.5 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-[10.5px] text-slate-300 transition-colors hover:border-emerald-500/50 hover:text-emerald-300 light:border-slate-300 light:bg-slate-100 light:text-slate-700"
            >
              Test connection
            </button>
          </div>
        </>
      )}
    </div>
  );
}
