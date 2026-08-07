import type { ModuleDef } from "../types";

const CHANNELS = [
  { name: "LinkedIn · Enhanced AI", spend: "$4,120", roas: "3.8×", trend: "+14%" },
  { name: "X · build-in-public", spend: "$1,940", roas: "2.1×", trend: "+6%" },
  { name: "Newsletter · operator list", spend: "$860", roas: "5.4×", trend: "+31%" },
  { name: "Product Labs retargeting", spend: "$2,610", roas: "4.2×", trend: "-3%" },
];

export default function MarketingModule({ module }: { module: ModuleDef }) {
  return (
    <div className="space-y-3 p-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Pipeline", value: "$86.4k" },
          { label: "Blended ROAS", value: "3.6×" },
          { label: "SQLs · 7d", value: "19" },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-2 light:border-slate-200 light:bg-slate-50"
          >
            <div className="text-[10px] uppercase tracking-wide text-slate-500">{m.label}</div>
            <div className="mt-0.5 font-mono text-sm text-rose-200 light:text-rose-700">{m.value}</div>
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-800 light:border-slate-200">
        <div className="grid grid-cols-4 gap-2 border-b border-slate-800 bg-slate-950/80 px-2.5 py-1.5 text-[10px] uppercase tracking-wide text-slate-500 light:border-slate-200 light:bg-slate-100">
          <span>channel</span>
          <span className="text-right">spend</span>
          <span className="text-right">roas</span>
          <span className="text-right">7d trend</span>
        </div>
        {CHANNELS.map((c) => (
          <div
            key={c.name}
            className="grid grid-cols-4 gap-2 border-b border-slate-800/50 px-2.5 py-2 text-[11px] last:border-0 hover:bg-slate-800/30 light:border-slate-100 light:hover:bg-slate-50"
          >
            <span className="text-slate-300 light:text-slate-700">{c.name}</span>
            <span className="text-right font-mono text-slate-400 light:text-slate-500">{c.spend}</span>
            <span className="text-right font-mono text-emerald-300 light:text-emerald-700">
              {c.roas}
            </span>
            <span
              className={`text-right font-mono ${
                c.trend.startsWith("-")
                  ? "text-rose-400 light:text-rose-600"
                  : "text-emerald-400 light:text-emerald-600"
              }`}
            >
              {c.trend}
            </span>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-slate-600 light:text-slate-400">
        {module.description} · martech-weaver sync 8m ago
      </div>
    </div>
  );
}
