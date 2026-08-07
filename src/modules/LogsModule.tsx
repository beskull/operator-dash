import { useEffect, useRef, useState } from "react";
import type { ModuleDef } from "../types";

const LEVELS = [
  { tag: "INFO", cls: "text-cyan-400" },
  { tag: "DEBUG", cls: "text-slate-500" },
  { tag: "WARN", cls: "text-amber-400" },
  { tag: "ERROR", cls: "text-rose-400" },
  { tag: "AGENT", cls: "text-emerald-400" },
] as const;

const TEMPLATES = [
  "run 8f42c1 completed in 3.2s · 12 tool calls",
  "flux:node[router] → branch 'research' taken",
  "tool websearch fetch ok · 184ms",
  "agent builder-07 claimed task #4821",
  "retrying fal.run request (attempt 2/3)",
  "supabase: upsert runs row id=92e1",
  "context window 61% · summarizing",
  "queue depth normal · 12 pending",
  "session operator-3 attached to ws-mission-control",
  "warn: token budget 82% consumed",
  "error: ECONNRESET from legacy scraper — circuit open",
  "checkpoint saved → s3://flux-runs/8f42c1",
];

let counter = 0;
const nextLine = () => {
  const t = new Date();
  const hh = String(t.getHours()).padStart(2, "0");
  const mm = String(t.getMinutes()).padStart(2, "0");
  const ss = String(t.getSeconds()).padStart(2, "0");
  const level = LEVELS[counter % LEVELS.length === 10 ? 3 : counter % LEVELS.length === 7 ? 2 : counter % 5];
  const msg = TEMPLATES[counter % TEMPLATES.length];
  counter += 1;
  return { id: counter, time: `${hh}:${mm}:${ss}`, level, msg };
};

export default function LogsModule({ module }: { module: ModuleDef }) {
  const isErrorStream = /error/i.test(module.title);
  const [lines, setLines] = useState(() => Array.from({ length: 14 }, nextLine));
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setLines((prev) => [...prev.slice(-40), nextLine()]), 1500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  // Terminal surface stays dark in both themes.
  return (
    <div className="flex h-full flex-col p-2">
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-800 bg-[#0a0d13]">
        <div ref={scrollRef} className="h-full overflow-y-auto p-3 font-mono text-[11px] leading-5">
          {lines.map((l) => {
            const error = isErrorStream || l.level.tag === "ERROR";
            return (
              <div key={l.id} className="flex gap-2 whitespace-nowrap">
                <span className="text-slate-600">{l.time}</span>
                <span className={error ? "text-rose-400" : l.level.cls}>
                  {(isErrorStream ? "ERROR" : l.level.tag).padEnd(5)}
                </span>
                <span className="text-slate-300">{l.msg}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
