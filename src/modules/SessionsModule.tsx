import type { ModuleDef } from "../types";

const SESSIONS = [
  { name: "builder-07", tool: "ClaudeCode", runtime: "42m", state: "ok" },
  { name: "research-02", tool: "FluxPrompt", runtime: "18m", state: "ok" },
  { name: "scrape-legacy", tool: "OpenCode", runtime: "2h 04m", state: "warn" },
  { name: "ops-copilot", tool: "FluxiInsighter", runtime: "6m", state: "ok" },
  { name: "patent-indexer", tool: "Custom", runtime: "3h 51m", state: "error" },
] as const;

const DOT: Record<string, string> = {
  ok: "bg-emerald-400",
  warn: "bg-amber-400",
  error: "bg-rose-400",
};

export default function SessionsModule({ module }: { module: ModuleDef }) {
  return (
    <div className="p-2">
      <div className="mb-1 flex items-center justify-between px-1.5 pt-1">
        <span className="text-[11px] font-medium text-slate-300 light:text-slate-700">
          {module.title}
        </span>
        <span className="font-mono text-[10px] text-slate-500">{SESSIONS.length} live</span>
      </div>
      {SESSIONS.map((s) => (
        <div
          key={s.name}
          className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 text-[11px] hover:bg-slate-800/40 light:hover:bg-slate-100"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${DOT[s.state]}`} />
          <span className="font-mono text-slate-200 light:text-slate-700">{s.name}</span>
          <span className="text-slate-500">{s.tool}</span>
          <span className="ml-auto font-mono text-slate-400 light:text-slate-500">{s.runtime}</span>
        </div>
      ))}
    </div>
  );
}
