import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronsUpDown,
  Crosshair,
  FlipHorizontal2,
  Layers,
  Minimize2,
  MoreHorizontal,
  PanelBottomClose,
  PanelLeftClose,
  PanelRightClose,
  PictureInPicture2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";

export type WindowMenuAction =
  | "flattenLeft"
  | "flattenRight"
  | "flattenBottom"
  | "float"
  | "focus"
  | "backdrop"
  | "flip"
  | "popOut"
  | "expand"
  | "remove";

interface WindowMenuProps {
  isFloating: boolean;
  isFocused: boolean;
  isTwoSided: boolean;
  removable: boolean;
  /** Window has multiple modules — the active one can be popped out. */
  canPopOut: boolean;
  /** Grid window — can expand taller / restore. */
  canExpand: boolean;
  isExpanded: boolean;
  onAction: (a: WindowMenuAction) => void;
}

/** The ⋯ menu: every window action, labeled. Rendered in a portal — grid
    tiles are CSS-transformed, which hijacks position:fixed and would clip
    the menu inside the window capsule. */
export default function WindowMenu({
  isFloating,
  isFocused,
  isTwoSided,
  removable,
  canPopOut,
  canExpand,
  isExpanded,
  onAction,
}: WindowMenuProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const open = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ x: r.right, y: r.bottom + 6 });
  };

  const items: Array<{
    key: WindowMenuAction;
    label: string;
    icon: typeof PanelLeftClose;
    danger?: boolean;
    hidden?: boolean;
  }> = [
    { key: "flattenLeft", label: "Dock to left edge", icon: PanelLeftClose },
    { key: "flattenRight", label: "Dock to right edge", icon: PanelRightClose },
    { key: "flattenBottom", label: "Dock to bottom edge", icon: PanelBottomClose },
    isFloating
      ? { key: "float", label: "Dock back to grid", icon: ArrowDownToLine }
      : { key: "float", label: "Float window", icon: PictureInPicture2 },
    isFocused
      ? { key: "focus", label: "Exit zen focus", icon: Minimize2 }
      : { key: "focus", label: "Zen focus", icon: Crosshair },
    { key: "backdrop", label: "Send to background", icon: Layers },
    {
      key: "expand",
      label: isExpanded ? "Restore size" : "Expand (pushes below down)",
      icon: ChevronsUpDown,
      hidden: !canExpand,
    },
    { key: "popOut", label: "Pop out current tab", icon: PictureInPicture2, hidden: !canPopOut },
    { key: "flip", label: "Flip side", icon: FlipHorizontal2, hidden: !isTwoSided },
    { key: "remove", label: "Remove window", icon: X, danger: true, hidden: !removable },
  ];

  return (
    <>
      <button
        ref={btnRef}
        title="Window actions"
        onClick={open}
        className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-700/70 hover:text-slate-200 light:text-slate-400 light:hover:bg-slate-200 light:hover:text-slate-700"
      >
        <MoreHorizontal size={12} />
      </button>
      {pos &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[55]" onClick={() => setPos(null)} />
            <div
              className="anim-fade-in fixed z-[60] w-48 overflow-hidden rounded-lg border border-slate-700/80 bg-[#12151d]/98 py-1 shadow-2xl backdrop-blur light:border-slate-300 light:bg-white/98"
              style={{
                left: Math.max(8, Math.min(pos.x - 192, window.innerWidth - 200)),
                top: pos.y,
              }}
            >
              {items
                .filter((i) => !i.hidden)
                .map(({ key, label, icon: Icon, danger }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setPos(null);
                      onAction(key);
                    }}
                    className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[11px] transition-colors ${
                      danger
                        ? "text-rose-400 hover:bg-rose-500/15"
                        : "text-slate-300 hover:bg-slate-700/60 light:text-slate-700 light:hover:bg-slate-100"
                    }`}
                  >
                    <Icon size={12} className="shrink-0 opacity-70" />
                    {label}
                  </button>
                ))}
              <div className="mt-1 border-t border-slate-700/60 px-2.5 py-1.5 font-mono text-[9px] leading-relaxed text-slate-600 light:border-slate-200 light:text-slate-400">
                tip: drag the header to a screen edge to dock · double-click header for zen
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
