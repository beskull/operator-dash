import type { ModuleDef } from "../types";

const MESSAGES = [
  { from: "op", text: "why did scrape-legacy spike to 2h runtime?" },
  { from: "ai", text: "Circuit breaker opened on the legacy endpoint at 14:02. 3 retries burned ~9min. Recommend pausing it until the scraper is migrated." },
  { from: "op", text: "pause it and page me if the queue backs up" },
  { from: "ai", text: "Done — scrape-legacy paused. Watch set on queue depth > 50. Anything else?" },
] as const;

export default function ChatModule({ module }: { module: ModuleDef }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {MESSAGES.map((m, i) => (
          <div key={i} className={`flex ${m.from === "op" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl border px-2.5 py-1.5 text-[11px] leading-relaxed ${
                m.from === "op"
                  ? "border-violet-500/30 bg-violet-500/20 text-violet-100 light:border-violet-300 light:bg-violet-100 light:text-violet-900"
                  : "border-slate-700/60 bg-slate-800/70 text-slate-200 light:border-slate-200 light:bg-slate-100 light:text-slate-700"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-800 p-2 light:border-slate-200">
        <div className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-950/60 px-2.5 py-1.5 light:border-slate-300 light:bg-white">
          <input
            className="w-full bg-transparent text-[11px] text-slate-200 outline-none placeholder:text-slate-600 light:text-slate-800 light:placeholder:text-slate-400"
            placeholder={`Ask ${module.title}…`}
          />
          <kbd className="rounded border border-slate-700 px-1 font-mono text-[9px] text-slate-500 light:border-slate-300 light:text-slate-400">
            ⏎
          </kbd>
        </div>
      </div>
    </div>
  );
}
