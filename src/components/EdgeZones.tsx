import { PanelBottomClose, PanelLeftClose, PanelRightClose, PanelTopClose } from "lucide-react";
import type { Edge } from "../utils/edges";

interface EdgeZonesProps {
  /** A window drag is in progress — show the zones. */
  visible: boolean;
  /** The edge currently under the cursor. */
  active: Edge | null;
}

const ZONES: Array<{ edge: Edge; label: string; icon: typeof PanelLeftClose }> = [
  { edge: "left", label: "Dock left", icon: PanelLeftClose },
  { edge: "right", label: "Dock right", icon: PanelRightClose },
  { edge: "top", label: "Dock top", icon: PanelTopClose },
  { edge: "bottom", label: "Dock bottom", icon: PanelBottomClose },
];

/**
 * Drop targets shown at the screen edges while any window is being dragged.
 * Purely visual — hit detection is geometric (utils/edges).
 */
export default function EdgeZones({ visible, active }: EdgeZonesProps) {
  if (!visible) return null;

  const cls = (edge: Edge) => {
    const isActive = active === edge;
    const base =
      "pointer-events-none absolute z-50 flex items-center justify-center gap-2 rounded-xl border border-dashed transition-all duration-150 anim-fade-in";
    const tone = isActive
      ? "border-emerald-400 bg-emerald-500/15 text-emerald-300 light:text-emerald-700"
      : "border-slate-600/50 bg-slate-900/50 text-slate-500 backdrop-blur-sm light:border-slate-400/60 light:bg-white/60 light:text-slate-500";
    const pos =
      edge === "left"
        ? "left-1 top-1 bottom-1 w-11 flex-col"
        : edge === "right"
          ? "right-1 top-1 bottom-1 w-11 flex-col"
          : edge === "top"
            ? "top-1 left-14 right-14 h-10 flex-row"
            : "bottom-1 left-14 right-14 h-10 flex-row";
    return `${base} ${tone} ${pos}`;
  };

  return (
    <>
      {ZONES.map(({ edge, label, icon: Icon }) => (
        <div key={edge} className={cls(edge)}>
          <Icon size={13} />
          <span
            className={`font-mono text-[9.5px] uppercase tracking-[0.12em] ${
              edge === "left" || edge === "right" ? "vertical-text" : ""
            }`}
          >
            {label}
          </span>
        </div>
      ))}
    </>
  );
}
