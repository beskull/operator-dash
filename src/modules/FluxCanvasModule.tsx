import type { ModuleDef } from "../types";

const NODES = [
  { x: 24, y: 88, w: 92, label: "Trigger", sub: "cron · 5m", tone: "cyan" },
  { x: 156, y: 40, w: 104, label: "Router", sub: "classify intent", tone: "emerald" },
  { x: 156, y: 140, w: 104, label: "Research", sub: "websearch ×4", tone: "emerald" },
  { x: 300, y: 88, w: 110, label: "Synthesize", sub: "opus-4 · 32k", tone: "violet" },
  { x: 448, y: 88, w: 96, label: "Deliver", sub: "slack + email", tone: "amber" },
] as const;

const EDGES: Array<[number, number]> = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
  [3, 4],
];

const TONE: Record<string, { stroke: string; fill: string; text: string }> = {
  cyan: { stroke: "#155e75", fill: "rgba(8,145,178,0.12)", text: "#67e8f9" },
  emerald: { stroke: "#065f46", fill: "rgba(16,185,129,0.10)", text: "#6ee7b7" },
  violet: { stroke: "#5b21b6", fill: "rgba(139,92,246,0.12)", text: "#c4b5fd" },
  amber: { stroke: "#92400e", fill: "rgba(245,158,11,0.10)", text: "#fcd34d" },
};

const center = (n: (typeof NODES)[number]) => ({ x: n.x + n.w / 2, y: n.y + 21 });

function edgePath(a: (typeof NODES)[number], b: (typeof NODES)[number]) {
  const p1 = { x: a.x + a.w, y: a.y + 21 };
  const p2 = { x: b.x, y: b.y + 21 };
  const mx = (p1.x + p2.x) / 2;
  return `M ${p1.x} ${p1.y} C ${mx} ${p1.y}, ${mx} ${p2.y}, ${p2.x} ${p2.y}`;
}

export default function FluxCanvasModule({ module }: { module: ModuleDef }) {
  // Canvas surface stays dark in both themes — node palette is tuned for it.
  return (
    <div className="flex h-full flex-col bg-[#0b0e14]">
      <div className="flex items-center justify-between px-3 pt-2.5">
        <span className="text-[11px] font-medium text-slate-300">{module.title}</span>
        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">
          ▶ running · 4/5 nodes
        </span>
      </div>
      <div className="min-h-[190px] flex-1 p-2">
        <svg viewBox="0 0 570 220" className="h-full w-full">
          <defs>
            <pattern id="flux-grid" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#1e2433" />
            </pattern>
          </defs>
          <rect width="570" height="220" fill="url(#flux-grid)" rx="8" />
          {EDGES.map(([a, b]) => (
            <path
              key={`${a}-${b}`}
              d={edgePath(NODES[a], NODES[b])}
              fill="none"
              stroke="#2dd4bf"
              strokeOpacity="0.45"
              strokeWidth="1.5"
              className="flux-edge"
            />
          ))}
          {NODES.map((n) => {
            const t = TONE[n.tone];
            const c = center(n);
            return (
              <g key={n.label}>
                <rect
                  x={n.x}
                  y={n.y}
                  width={n.w}
                  height="42"
                  rx="9"
                  fill={t.fill}
                  stroke={t.stroke}
                  strokeWidth="1.5"
                />
                <circle cx={n.x + 12} cy={c.y} r="3" fill={t.text} />
                <text x={n.x + 21} y={n.y + 18} fill={t.text} fontSize="10.5" fontWeight="600">
                  {n.label}
                </text>
                <text x={n.x + 21} y={n.y + 32} fill="#64748b" fontSize="9">
                  {n.sub}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
