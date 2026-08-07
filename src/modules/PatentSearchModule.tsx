import type { ModuleDef } from "../types";

const RESULTS = [
  { id: "US 11,942,113 B2", title: "Adaptive game-balance engine for card-based systems", score: 94 },
  { id: "EP 4 118 442 A1", title: "Method for simultaneous turn resolution in tabletop play", score: 88 },
  { id: "WO 2024/088114", title: "Dual-resource conflict resolution via hidden commitment", score: 81 },
  { id: "US 2024/0115523 A1", title: "Procedural deck construction with constraint solver", score: 72 },
  { id: "EP 3 902 114 B1", title: "Spectator-linked wagering overlay for strategy games", score: 61 },
];

export default function PatentSearchModule({
  module,
  configLabel,
}: {
  module: ModuleDef;
  configLabel?: string;
}) {
  return (
    <div className="flex h-full flex-col p-3">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-950/60 px-2.5 py-1.5 light:border-slate-300 light:bg-white">
          <span className="font-mono text-[11px] text-amber-300/90 light:text-amber-600">⌕</span>
          <span className="text-[11px] text-slate-300 light:text-slate-700">
            "simultaneous turn resolution card game duel"
          </span>
        </div>
        <span className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 font-mono text-[10px] text-amber-300 light:text-amber-700">
          {configLabel ?? "All Offices"}
        </span>
      </div>
      <div className="mt-1 font-mono text-[10px] text-slate-600 light:text-slate-400">
        1,204 results · semantic + CPC · 380ms
      </div>
      <div className="mt-2 flex-1 space-y-1.5 overflow-y-auto">
        {RESULTS.map((r) => (
          <div
            key={r.id}
            className="rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-2 hover:border-slate-700 light:border-slate-200 light:bg-slate-50 light:hover:border-slate-300"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] text-cyan-400 light:text-cyan-700">{r.id}</span>
              <span className="font-mono text-[10px] text-slate-500">{r.score}%</span>
            </div>
            <div className="mt-0.5 text-[11px] leading-snug text-slate-300 light:text-slate-700">
              {r.title}
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded bg-slate-800 light:bg-slate-200">
              <div
                className="h-full rounded bg-gradient-to-r from-amber-500/60 to-amber-400/90"
                style={{ width: `${r.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="pt-1 text-[10px] text-slate-600 light:text-slate-400">{module.description}</div>
    </div>
  );
}
