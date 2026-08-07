import type { WindowState } from "../types";
import WindowFrame from "./WindowFrame";

interface BackdropLayerProps {
  windows: WindowState[];
  onWindowUpdate: (id: string, updater: (w: WindowState) => WindowState) => void;
  onSetLiveUrl: (id: string, url: string, moduleId?: string) => void;
  onRemoveWindow: (id: string) => void;
  onDetachModule: (id: string, moduleId: string) => void;
  dropTargetId?: string | null;
}

/**
 * Windows with layoutState "backdrop" render here — behind all panels,
 * above the background canvas. Still interactive where panels don't cover
 * them; dimmed slightly so foreground panels stay primary.
 */
export default function BackdropLayer({
  windows,
  onWindowUpdate,
  onSetLiveUrl,
  onRemoveWindow,
  onDetachModule,
  dropTargetId,
}: BackdropLayerProps) {
  const backdrop = windows.filter((w) => w.layoutState === "backdrop");
  if (backdrop.length === 0) return null;

  return (
    <div className="absolute inset-0 z-0 flex gap-3 p-4 pt-14">
      {backdrop.map((w) => (
        <div key={w.id} className="flex min-h-0 min-w-0 flex-1 opacity-85 saturate-[0.8]">
          <WindowFrame
            win={w}
            fill
            onUpdate={(updater) => onWindowUpdate(w.id, updater)}
            onSetLiveUrl={(url, moduleId) => onSetLiveUrl(w.id, url, moduleId)}
            onRemoveWindow={() => onRemoveWindow(w.id)}
            onDetachModule={(moduleId) => onDetachModule(w.id, moduleId)}
            isDropTarget={dropTargetId === w.id}
          />
        </div>
      ))}
    </div>
  );
}
