import type { ModuleDef } from "../types";

export default function StatusCardModule({ module }: { module: ModuleDef }) {
  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="status-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </span>
        <span className="text-sm font-medium text-emerald-300 light:text-emerald-700">
          All systems operational
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Uptime 30d", value: "99.98%" },
          { label: "p95 latency", value: "184ms" },
          { label: "Queue depth", value: "12" },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-2 light:border-slate-200 light:bg-slate-50"
          >
            <div className="text-[10px] uppercase tracking-wide text-slate-500">{m.label}</div>
            <div className="mt-0.5 font-mono text-sm text-slate-200 light:text-slate-800">
              {m.value}
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        {[
          ["api.fluxprompt.ai", "ok"],
          ["agents.enhancedai.com", "ok"],
          ["supabase pooler", "ok"],
          ["fal.ai queue", "degraded"],
        ].map(([name, state]) => (
          <div key={name} className="flex items-center justify-between text-[11px]">
            <span className="font-mono text-slate-400 light:text-slate-600">{name}</span>
            <span
              className={
                state === "ok"
                  ? "text-emerald-400 light:text-emerald-600"
                  : "text-amber-400 light:text-amber-600"
              }
            >
              {state === "ok" ? "● 200 OK" : "◐ slow"}
            </span>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-slate-600 light:text-slate-400">
        {module.description ?? "status · refreshed 12s ago"}
      </div>
    </div>
  );
}
