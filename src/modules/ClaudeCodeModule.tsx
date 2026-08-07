import type { ModuleDef } from "../types";

// Fake editor surface — hardcoded token spans give a syntax-highlighted feel
// without pulling in a real highlighter.
const LINES: React.ReactNode[] = [
  <>
    <span className="text-purple-400">import</span> <span className="text-slate-300">{"{ runAgent }"}</span>{" "}
    <span className="text-purple-400">from</span> <span className="text-amber-300">"@flux/core"</span>
    <span className="text-slate-500">;</span>
  </>,
  <>
    <span className="text-purple-400">import</span> <span className="text-slate-300">{"{ tools }"}</span>{" "}
    <span className="text-purple-400">from</span> <span className="text-amber-300">"./tools"</span>
    <span className="text-slate-500">;</span>
  </>,
  <>&nbsp;</>,
  <>
    <span className="text-slate-500">{"// entry: build-mode agent session"}</span>
  </>,
  <>
    <span className="text-purple-400">export async function</span>{" "}
    <span className="text-sky-300">main</span>
    <span className="text-slate-300">() {"{"}</span>
  </>,
  <>
    <span className="text-slate-300">{"  "}</span>
    <span className="text-purple-400">const</span> <span className="text-slate-200">session</span>{" "}
    <span className="text-slate-500">=</span> <span className="text-purple-400">await</span>{" "}
    <span className="text-sky-300">runAgent</span>
    <span className="text-slate-300">({"{"}</span>
  </>,
  <>
    <span className="text-slate-300">{"    "}model: </span>
    <span className="text-amber-300">"claude-opus-4"</span>
    <span className="text-slate-500">,</span>
  </>,
  <>
    <span className="text-slate-300">{"    "}tools: tools.</span>
    <span className="text-sky-300">for</span>
    <span className="text-slate-300">(</span>
    <span className="text-amber-300">"operator"</span>
    <span className="text-slate-300">),</span>
  </>,
  <>
    <span className="text-slate-300">{"    "}budget: {"{ tokens: "} </span>
    <span className="text-emerald-300">200_000</span>
    <span className="text-slate-300">{" }"},</span>
  </>,
  <>
    <span className="text-slate-300">{"  }"});</span>
  </>,
  <>
    <span className="text-slate-300">{"  "}session.</span>
    <span className="text-sky-300">on</span>
    <span className="text-slate-300">(</span>
    <span className="text-amber-300">"tool"</span>
    <span className="text-slate-500">,</span> <span className="text-slate-300">(e) </span>
    <span className="text-purple-400">=&gt;</span> <span className="text-slate-300">console.</span>
    <span className="text-sky-300">log</span>
    <span className="text-slate-300">(e.name));</span>
  </>,
  <>
    <span className="text-slate-300">{"  "}</span>
    <span className="text-purple-400">return</span> <span className="text-slate-300">session.</span>
    <span className="text-sky-300">result</span>
    <span className="text-slate-300">();</span>
  </>,
  <>
    <span className="text-slate-300">{"}"}</span>
  </>,
];

export default function ClaudeCodeModule({ module }: { module: ModuleDef }) {
  // Editor surface stays dark in both themes (like a real terminal/editor).
  return (
    <div className="flex h-full flex-col bg-[#0b0e14]">
      <div className="flex items-center gap-1 border-b border-slate-800/80 bg-slate-950/40 px-2 pt-1.5">
        {["agent.ts", "tools.ts", "runbook.md"].map((f, i) => (
          <span
            key={f}
            className={`rounded-t-md px-2.5 py-1 font-mono text-[10px] ${
              i === 0
                ? "bg-slate-900 text-slate-200 border-x border-t border-slate-800"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {f}
          </span>
        ))}
        <span className="ml-auto pb-1 pr-1 font-mono text-[10px] text-slate-600">claude-code · opus-4</span>
      </div>
      <div className="flex-1 overflow-auto p-3 font-mono text-[11px] leading-5">
        {LINES.map((line, i) => (
          <div key={i} className="flex">
            <span className="w-8 select-none pr-3 text-right text-slate-700">{i + 1}</span>
            <span className="whitespace-pre">{line}</span>
          </div>
        ))}
        <div className="flex">
          <span className="w-8 select-none pr-3 text-right text-slate-700">{LINES.length + 1}</span>
          <span className="inline-block h-4 w-2 animate-pulse bg-emerald-400/80" />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-slate-800/80 bg-slate-950/40 px-3 py-1 font-mono text-[10px] text-slate-500">
        <span>⎇ main*</span>
        <span>{module.description ?? "typescript · utf-8"}</span>
      </div>
    </div>
  );
}
