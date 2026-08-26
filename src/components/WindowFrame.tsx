import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Crosshair,
  FlipHorizontal2,
  Link2,
  Minimize2,
  PanelBottomClose,
  PictureInPicture2,
  Unlink,
} from "lucide-react";
import { useState } from "react";
import type { LayoutState, WindowState } from "../types";
import ModuleHost from "./ModuleHost";
import WindowMenu, { type WindowMenuAction } from "./WindowMenu";

const STATUS_DOT: Record<string, string> = {
  ok: "bg-emerald-400",
  warn: "bg-amber-400",
  error: "bg-rose-400",
};

interface WindowFrameProps {
  win: WindowState;
  onUpdate: (updater: (w: WindowState) => WindowState) => void;
  /** Stretch to fill the parent (main panel / backdrop / sized floating). */
  fill?: boolean;
  /** Pointer-down handler on the header — used by the floating layer for drag. */
  onHeaderPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  /** Live-URL plumbing; moduleId targets a specific module (stack view). */
  onSetLiveUrl?: (url: string, moduleId?: string) => void;
  onRemoveWindow?: () => void;
  /** Detach one module out of a stack into its own floating window. */
  onDetachModule?: (moduleId: string) => void;
  /** Another window is being dragged over this one — show the attach overlay. */
  isDropTarget?: boolean;
  /** Rendered inside the react-grid-layout grid — header becomes the RGL drag handle. */
  gridHandle?: boolean;
}

export default function WindowFrame({
  win,
  onUpdate,
  fill,
  onHeaderPointerDown,
  onSetLiveUrl,
  onRemoveWindow,
  onDetachModule,
  isDropTarget,
  gridHandle,
}: WindowFrameProps) {
  const { layoutState, modules, activeModuleId, twoSided, viewMode } = win;
  const activeModule = modules.find((m) => m.id === activeModuleId) ?? modules[0];

  const setLayout = (layoutState: LayoutState) => onUpdate((w) => ({ ...w, layoutState }));
  const toggleFloat = () =>
    onUpdate((w) => ({
      ...w,
      layoutState: w.layoutState === "floating" ? "normal" : "floating",
    }));
  const toggleFocus = () =>
    onUpdate((w) => ({
      ...w,
      layoutState: w.layoutState === "focused" ? "normal" : "focused",
    }));
  const flip = () =>
    onUpdate((w) =>
      w.twoSided
        ? { ...w, twoSided: { ...w.twoSided, side: w.twoSided.side === "front" ? "back" : "front" } }
        : w
    );
  const pickConfig = (configId: string) =>
    onUpdate((w) =>
      w.twoSided
        ? { ...w, twoSided: { ...w.twoSided, activeConfigId: configId, side: "back" } }
        : w
    );

  const isFloating = layoutState === "floating";
  const isFocused = layoutState === "focused";
  const isBackdrop = layoutState === "backdrop";
  const isStack = viewMode === "stack" && modules.length > 1;
  const activeConfigLabel = twoSided?.configs?.find((c) => c.id === twoSided.activeConfigId)?.label;

  const [linkOpen, setLinkOpen] = useState(false);
  // Only user-spawned live windows may be removed outright.
  const removable = win.id.startsWith("live-") ? onRemoveWindow : undefined;

  const handleMenuAction = (a: WindowMenuAction) => {
    switch (a) {
      case "flattenLeft":
        setLayout("flattenedLeft");
        break;
      case "flattenRight":
        setLayout("flattenedRight");
        break;
      case "flattenBottom":
        setLayout("flattenedBottom");
        break;
      case "float":
        toggleFloat();
        break;
      case "focus":
        toggleFocus();
        break;
      // v2.13: backdrop (send-to-background) is disabled — windows got stuck
      // behind the panels with no obvious way back. Revisit as a pin-able
      // surface for non-interactive content (images, meters, logs).
      // case "backdrop":
      //   setLayout("backdrop");
      //   break;
      case "flip":
        flip();
        break;
      case "popOut":
        onDetachModule?.(activeModuleId);
        break;
      case "remove":
        removable?.();
        break;
    }
  };

  const iconBtn =
    "rounded p-1 text-slate-500 transition-colors hover:bg-slate-700/70 hover:text-slate-200 light:text-slate-400 light:hover:bg-slate-200 light:hover:text-slate-700";

  return (
    <section
      data-window-id={win.id}
      className={`window-capsule anim-window-pop relative flex min-h-0 flex-col overflow-hidden rounded-xl ${
        isFocused ? "focused" : ""
      } ${fill ? "h-full flex-1" : ""}`}
      style={win.accent && isFocused ? { borderColor: `${win.accent}55` } : undefined}
    >
      {/* ── Attach drop-target overlay (violet = merge; emerald = move/dock) ── */}
      {isDropTarget && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-xl border-2 border-dashed border-violet-400 bg-violet-500/15">
          <span className="rounded-md bg-violet-500/95 px-2.5 py-1 font-mono text-[10.5px] font-semibold text-violet-50">
            release to attach · scroll stack
          </span>
        </div>
      )}

      {/* ── Header ── */}
      <header
        onPointerDown={onHeaderPointerDown}
        onDoubleClick={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          if (isBackdrop) setLayout("normal");
          else toggleFocus();
        }}
        title="Drag to move · drag to a screen edge to dock · double-click for zen"
        className={`win-drag-handle win-header group/header flex h-9 shrink-0 items-center gap-2 border-b border-slate-800/80 px-2.5 light:border-slate-200 ${
          isFloating ? "cursor-grab active:cursor-grabbing" : ""
        } ${gridHandle ? "cursor-move" : ""}`}
      >
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[win.status ?? "ok"]}`} />
        <span className="win-title truncate text-[11.5px] font-semibold tracking-wide text-slate-200 light:text-slate-800">
          {win.title}
        </span>
        {isFocused && (
          <span className="rounded bg-emerald-500/15 px-1 py-px font-mono text-[9px] uppercase text-emerald-400 light:text-emerald-600">
            zen
          </span>
        )}
        {isFloating && (
          <span className="rounded bg-cyan-500/15 px-1 py-px font-mono text-[9px] uppercase text-cyan-400 light:text-cyan-600">
            float
          </span>
        )}
        {isBackdrop && (
          <span className="rounded bg-amber-500/15 px-1 py-px font-mono text-[9px] uppercase text-amber-400 light:text-amber-600">
            backdrop
          </span>
        )}

        <div className="win-controls ml-auto flex items-center gap-0.5">
          {isBackdrop ? (
            // Backdrop windows keep it minimal: flip (if two-sided) + bring forward.
            <>
              {twoSided?.isTwoSided && (
                <button title="Flip side" onClick={flip} className={iconBtn}>
                  <FlipHorizontal2 size={12} />
                </button>
              )}
              <button title="Bring to front" onClick={() => setLayout("normal")} className={iconBtn}>
                <ArrowUpFromLine size={12} />
              </button>
            </>
          ) : (
            <>
              {twoSided?.isTwoSided && (
                <button title="Flip side" onClick={flip} className={iconBtn}>
                  <FlipHorizontal2 size={12} />
                </button>
              )}
              <button
                title={activeModule.url ? `Linked: ${activeModule.url}` : "Link a live URL to this view"}
                onClick={() => setLinkOpen((v) => !v)}
                className={`${iconBtn} ${activeModule.url ? "text-cyan-400 light:text-cyan-600" : ""} ${
                  linkOpen ? "bg-slate-700/70 light:bg-slate-200" : ""
                }`}
              >
                <Link2 size={12} />
              </button>
              <div className="mx-0.5 h-3 w-px bg-slate-700/70 light:bg-slate-300" />
              <button
                title="Minimize to bottom dock"
                onClick={() => setLayout("flattenedBottom")}
                className={iconBtn}
              >
                <PanelBottomClose size={12} />
              </button>
              {isFloating ? (
                <button title="Dock back to grid" onClick={toggleFloat} className={iconBtn}>
                  <ArrowDownToLine size={12} />
                </button>
              ) : (
                <button title="Float panel" onClick={toggleFloat} className={iconBtn}>
                  <PictureInPicture2 size={12} />
                </button>
              )}
              <button
                title={isFocused ? "Exit zen (or double-click header)" : "Zen focus (or double-click header)"}
                onClick={toggleFocus}
                className={`${iconBtn} ${isFocused ? "text-emerald-400 light:text-emerald-600" : ""}`}
              >
                {isFocused ? <Minimize2 size={12} /> : <Crosshair size={12} />}
              </button>
              <WindowMenu
                isFloating={isFloating}
                isFocused={isFocused}
                isTwoSided={Boolean(twoSided?.isTwoSided)}
                removable={Boolean(removable)}
                canPopOut={modules.length > 1}
                onAction={handleMenuAction}
              />
            </>
          )}
        </div>
      </header>

      {/* ── URL link bar (toggled by the link button) ── */}
      {linkOpen && !isBackdrop && (
        <LinkUrlBar
          key={`${win.id}:${activeModuleId}`}
          current={activeModule.url}
          onSave={(url) => {
            onSetLiveUrl?.(url);
            setLinkOpen(false);
          }}
          onClear={() => {
            onSetLiveUrl?.("");
            setLinkOpen(false);
          }}
          onClose={() => setLinkOpen(false)}
        />
      )}

      {/* ── Tabs / stack anchor strip (multi-module windows) ── */}
      {!twoSided?.isTwoSided && modules.length > 1 && (
        <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-slate-800/70 bg-slate-950/30 px-2 py-1 light:border-slate-200 light:bg-slate-100/70">
          {modules.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                if (isStack) {
                  document
                    .getElementById(`sec-${win.id}-${m.id}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }
                onUpdate((w) => ({ ...w, activeModuleId: m.id }));
              }}
              className={`group/tab flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-[10.5px] transition-colors ${
                m.id === activeModuleId
                  ? "bg-emerald-500/15 text-emerald-300 light:text-emerald-700"
                  : "text-slate-500 hover:bg-slate-800/60 hover:text-slate-300 light:hover:bg-slate-200 light:hover:text-slate-700"
              }`}
            >
              {m.title}
              <span
                role="button"
                title="Pop out into its own floating panel"
                onClick={(e) => {
                  e.stopPropagation();
                  onDetachModule?.(m.id);
                }}
                className="ml-1 hidden rounded-sm p-px opacity-70 hover:bg-slate-600/60 hover:opacity-100 group-hover/tab:inline-block light:hover:bg-slate-300"
              >
                <PictureInPicture2 size={9} />
              </span>
            </button>
          ))}
          {/* tabs | scroll view toggle */}
          <div className="ml-auto flex shrink-0 items-center gap-0.5 rounded border border-slate-700/70 p-px light:border-slate-300">
            {(["tabs", "stack"] as const).map((v) => (
              <button
                key={v}
                onClick={() => onUpdate((w) => ({ ...w, viewMode: v }))}
                className={`rounded px-1.5 py-px font-mono text-[9px] transition-colors ${
                  (viewMode ?? "tabs") === v
                    ? "bg-slate-700 text-slate-100 light:bg-slate-300 light:text-slate-800"
                    : "text-slate-500 hover:text-slate-300 light:hover:text-slate-700"
                }`}
              >
                {v === "stack" ? "scroll" : "tabs"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Body ── */}
      {twoSided?.isTwoSided ? (
        <div className={`flip-container shrink-0 ${fill ? "flex-1 min-h-0" : "h-72"}`}>
          <div className={`flip-inner ${twoSided.side === "back" ? "flipped" : ""} h-full`}>
            {/* Front: config control surface */}
            <div className="flip-face flex flex-col justify-center gap-3 p-4">
              <div className="text-[11px] font-medium text-slate-400 light:text-slate-600">
                Select search configuration
              </div>
              <div className="grid grid-cols-2 gap-2">
                {twoSided.configs?.map((cfg) => (
                  <button
                    key={cfg.id}
                    onClick={() => pickConfig(cfg.id)}
                    className={`rounded-lg border px-3 py-2.5 text-[11.5px] font-medium transition-all ${
                      cfg.id === twoSided.activeConfigId
                        ? "border-amber-500/60 bg-amber-500/10 text-amber-200 light:text-amber-700"
                        : "border-slate-700 bg-slate-900/70 text-slate-300 hover:border-slate-500 hover:bg-slate-800 light:border-slate-300 light:bg-white light:text-slate-700 light:hover:border-slate-400 light:hover:bg-slate-100"
                    }`}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
              <div className="font-mono text-[9.5px] text-slate-600 light:text-slate-400">
                picking a config flips this window to its module view
              </div>
            </div>
            {/* Back: module with selected config */}
            <div className="flip-face flip-back">
              <ModuleHost
                module={activeModule}
                winId={win.id}
                configLabel={activeConfigLabel}
                onSetLiveUrl={onSetLiveUrl}
                onRemoveWindow={removable}
              />
            </div>
          </div>
        </div>
      ) : isStack ? (
        /* ── Stack view: all modules in one scroll column ── */
        <div className={`min-h-0 ${fill ? "flex-1 overflow-y-auto" : "max-h-[340px] overflow-y-auto"}`}>
          {modules.map((m) => (
            <section
              key={m.id}
              id={`sec-${win.id}-${m.id}`}
              className="border-b border-slate-800/60 last:border-b-0 light:border-slate-200"
            >
              <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-800/60 bg-slate-900/85 px-2.5 py-1 backdrop-blur light:border-slate-200 light:bg-white/90">
                <span className="font-mono text-[10px] text-slate-400 light:text-slate-600">
                  {m.title}
                </span>
                {m.url && (
                  <span className="truncate font-mono text-[9px] text-cyan-400 light:text-cyan-600">
                    {m.url}
                  </span>
                )}
                <button
                  title="Detach into floating panel"
                  onClick={() => onDetachModule?.(m.id)}
                  className="ml-auto rounded p-0.5 text-slate-500 hover:bg-slate-700/70 hover:text-slate-200 light:hover:bg-slate-200 light:hover:text-slate-700"
                >
                  <Unlink size={10} />
                </button>
              </div>
              <div className="h-72">
                <ModuleHost
                  module={m}
                  winId={win.id}
                  onSetLiveUrl={(url) => onSetLiveUrl?.(url, m.id)}
                  onRemoveWindow={removable}
                />
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className={`min-h-0 ${fill ? "flex-1 overflow-y-auto" : "max-h-[340px] overflow-y-auto"}`}>
          <ModuleHost
            module={activeModule}
            winId={win.id}
            onSetLiveUrl={onSetLiveUrl}
            onRemoveWindow={removable}
          />
        </div>
      )}
    </section>
  );
}

/** Inline bar for linking the active module to a live URL (or unlinking it). */
function LinkUrlBar({
  current,
  onSave,
  onClear,
  onClose,
}: {
  current?: string;
  onSave: (url: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(current ?? "");
  const save = () => {
    const url = draft.trim();
    if (url) onSave(url);
  };

  return (
    <div className="flex shrink-0 items-center gap-1.5 border-b border-slate-800/70 bg-slate-950/30 px-2 py-1.5 light:border-slate-200 light:bg-slate-100/80">
      <Link2 size={11} className="shrink-0 text-cyan-400 light:text-cyan-600" />
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") onClose();
        }}
        placeholder="https://… or localhost:3000 — Enter to link this view"
        className="w-full rounded border border-cyan-500/40 bg-slate-900 px-1.5 py-0.5 font-mono text-[10.5px] text-slate-200 outline-none placeholder:text-slate-600 light:bg-white light:text-slate-800 light:placeholder:text-slate-400"
      />
      <button
        onClick={save}
        className="shrink-0 rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-medium text-cyan-300 hover:bg-cyan-500/30 light:text-cyan-700"
      >
        Link
      </button>
      {current && (
        <button
          onClick={onClear}
          title="Remove link — back to the built-in view"
          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-slate-500 hover:bg-rose-500/20 hover:text-rose-300"
        >
          Clear
        </button>
      )}
    </div>
  );
}
