import type { ModuleDef } from "../types";

export default function DocsModule({ module }: { module: ModuleDef }) {
  return (
    <div className="space-y-3 p-4">
      <div>
        <div className="text-sm font-semibold text-slate-100 light:text-slate-800">{module.title}</div>
        <div className="mt-0.5 text-[11px] text-slate-500">
          {module.description ?? "operator runbook · updated 2d ago"}
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-2.5 w-3/4 rounded bg-slate-800 light:bg-slate-200" />
        <div className="h-2.5 w-full rounded bg-slate-800/80 light:bg-slate-200/80" />
        <div className="h-2.5 w-5/6 rounded bg-slate-800/60 light:bg-slate-200/60" />
      </div>
      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 font-mono text-[10.5px] leading-5 text-slate-400 light:border-slate-200 light:bg-slate-100 light:text-slate-600">
        <div className="text-emerald-400 light:text-emerald-700"># deploy checklist</div>
        <div>1. flux validate prod.flow</div>
        <div>2. run smoke suite (n=12)</div>
        <div>3. ship --canary 10%</div>
      </div>
      <div className="space-y-2">
        <div className="h-2.5 w-full rounded bg-slate-800/80 light:bg-slate-200/80" />
        <div className="h-2.5 w-2/3 rounded bg-slate-800/60 light:bg-slate-200/60" />
        <div className="h-2.5 w-4/5 rounded bg-slate-800/70 light:bg-slate-200/70" />
      </div>
    </div>
  );
}
