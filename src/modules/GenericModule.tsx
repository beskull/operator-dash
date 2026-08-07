import type { ModuleDef } from "../types";

export default function GenericModule({ module }: { module: ModuleDef }) {
  return (
    <div className="space-y-2 p-3">
      <div className="text-[11px] text-slate-400 light:text-slate-600">
        {module.type.toUpperCase()} — {module.title}
      </div>
      <div className="text-[11px] text-slate-300 light:text-slate-700">
        {module.description ?? "Module placeholder content."}
      </div>
      <div className="mt-2 flex h-24 items-center justify-center rounded-lg border border-dashed border-slate-800 bg-slate-950/60 text-[11px] text-slate-600 light:border-slate-300 light:bg-slate-50 light:text-slate-400">
        visual content area
      </div>
    </div>
  );
}
