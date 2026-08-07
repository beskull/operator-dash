import type { ModuleDef } from "../types";

const BARS = [42, 58, 45, 70, 64, 82, 76, 91, 68, 84, 96, 88, 74, 99];
const SPARK = "0,34 20,30 40,32 60,24 80,26 100,18 120,22 140,12 160,16 180,8";

export default function DashboardModule({ module }: { module: ModuleDef }) {
  return (
    <div className="space-y-3 p-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Runs today", value: "1,284", delta: "+12%" },
          { label: "Success", value: "97.4%", delta: "+0.6%" },
          { label: "Tokens", value: "8.2M", delta: "+21%" },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-2 light:border-slate-200 light:bg-slate-50"
          >
            <div className="text-[10px] uppercase tracking-wide text-slate-500">{m.label}</div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="font-mono text-sm text-slate-100 light:text-slate-800">{m.value}</span>
              <span className="text-[10px] text-emerald-400 light:text-emerald-600">{m.delta}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 light:border-slate-200 light:bg-slate-50">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wide text-slate-500">
            {module.title} · hourly throughput
          </span>
          <span className="font-mono text-[10px] text-cyan-400 light:text-cyan-700">peak 99/min</span>
        </div>
        <div className="flex h-16 items-end gap-1">
          {BARS.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-gradient-to-t from-cyan-500/25 to-cyan-400/70 transition-all hover:from-cyan-400/40 hover:to-cyan-300/90 light:from-cyan-600/25 light:to-cyan-500/70"
              style={{ height: `${v}%` }}
            />
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 light:border-slate-200 light:bg-slate-50">
        <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">error rate trend</div>
        <svg viewBox="0 0 180 40" className="h-9 w-full">
          <polyline
            points={SPARK}
            fill="none"
            stroke="#34d399"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="180" cy="8" r="2.5" fill="#34d399" />
        </svg>
      </div>
    </div>
  );
}
