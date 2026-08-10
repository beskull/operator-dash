import { ExternalLink, Globe, Pencil, RotateCw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { REMOTE } from "../config";
import { trackLiveUrl } from "../state/liveWindows";
import type { ModuleDef } from "../types";
import RemoteView from "./RemoteView";

interface LiveModuleProps {
  module: ModuleDef;
  /** Owning window id — used for same-origin sub-page tracking. */
  winId?: string;
  /** Persist a new URL for this live module. */
  onSetUrl?: (url: string) => void;
  /** Remove the whole live window (only live windows are removable). */
  onRemove?: () => void;
}

/** Embeds a live URL via iframe — point a window at any running app. */
export default function LiveModule({ module, winId, onSetUrl, onRemove }: LiveModuleProps) {
  const [editing, setEditing] = useState(!module.url);
  const [draft, setDraft] = useState(module.url ?? "");
  const [reloadKey, setReloadKey] = useState(0);
  const [embedMode, setEmbedMode] = useState<"checking" | "iframe" | "remote">("checking");
  const frameRef = useRef<HTMLIFrameElement>(null);
  const lastTracked = useRef<string | null>(null);

  // Probe the URL's framing policy: clean sites stay plain iframes; blocked
  // sites route to the local Playwright renderer. If the renderer isn't
  // running, fall back to the iframe (previous behavior).
  useEffect(() => {
    if (!module.url) return;
    let dead = false;
    setEmbedMode("checking");
    fetch(
      `${REMOTE}/api/check?url=${encodeURIComponent(module.url)}&origin=${encodeURIComponent(location.origin)}`
    )
      .then((r) => r.json())
      .then((j) => !dead && setEmbedMode(j.embeddable ? "iframe" : "remote"))
      .catch(() => !dead && setEmbedMode("iframe"));
    return () => {
      dead = true;
    };
  }, [module.url, reloadKey]);

  // Same-origin frames only: remember which sub-page the user navigates to,
  // so a reload restores it. Cross-origin access throws — skipped silently.
  useEffect(() => {
    if (!module.url || !winId || embedMode !== "iframe") return;
    lastTracked.current = module.url;
    const t = setInterval(() => {
      try {
        const href = frameRef.current?.contentWindow?.location?.href;
        if (href && href !== "about:blank" && href !== lastTracked.current) {
          lastTracked.current = href;
          trackLiveUrl(winId, module.id, href);
        }
      } catch {
        /* cross-origin — nothing we can read, nothing to do */
      }
    }, 2000);
    return () => clearInterval(t);
  }, [module.url, module.id, winId, embedMode]);

  const save = () => {
    const url = draft.trim();
    if (!url) return;
    onSetUrl?.(/^[a-z]+:\/\//i.test(url) ? url : `https://${url}`);
    setEditing(false);
  };

  return (
    <div className="flex h-full min-h-[280px] flex-col">
      {/* Mini browser chrome */}
      <div className="flex shrink-0 items-center gap-1.5 border-b border-slate-800/80 bg-slate-950/40 px-2 py-1.5 light:border-slate-200 light:bg-slate-100">
        <Globe size={11} className="shrink-0 text-slate-500" />
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") setEditing(false);
            }}
            placeholder="https://localhost:3000 or any URL — Enter to load"
            className="w-full rounded border border-emerald-500/50 bg-slate-900 px-1.5 py-0.5 font-mono text-[10.5px] text-slate-200 outline-none placeholder:text-slate-600 light:bg-white light:text-slate-800"
          />
        ) : (
          <button
            onClick={() => {
              setDraft(module.url ?? "");
              setEditing(true);
            }}
            title="Edit URL"
            className="w-full truncate rounded px-1.5 py-0.5 text-left font-mono text-[10.5px] text-cyan-300 hover:bg-slate-800/70 light:text-cyan-700 light:hover:bg-slate-200"
          >
            {module.url ?? "set a URL…"}
          </button>
        )}
        <button
          title="Reload"
          onClick={() => setReloadKey((k) => k + 1)}
          className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200 light:hover:bg-slate-200 light:hover:text-slate-700"
        >
          <RotateCw size={11} />
        </button>
        {editing ? (
          <button
            title="Load URL"
            onClick={save}
            className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300 hover:bg-emerald-500/30"
          >
            Load
          </button>
        ) : (
          <button
            title="Edit URL"
            onClick={() => {
              setDraft(module.url ?? "");
              setEditing(true);
            }}
            className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200 light:hover:bg-slate-200 light:hover:text-slate-700"
          >
            <Pencil size={11} />
          </button>
        )}
        {module.url && (
          <a
            title="Open in new tab"
            href={module.url}
            target="_blank"
            rel="noreferrer"
            className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200 light:hover:bg-slate-200 light:hover:text-slate-700"
          >
            <ExternalLink size={11} />
          </a>
        )}
        {onRemove && (
          <button
            title="Remove this live window"
            onClick={onRemove}
            className="rounded p-1 text-slate-500 hover:bg-rose-500/20 hover:text-rose-300"
          >
            <X size={11} />
          </button>
        )}
      </div>

      {/* Frame */}
      {module.url ? (
        embedMode === "remote" ? (
          <RemoteView
            key={`${module.url}-${reloadKey}`}
            url={module.url}
            winId={winId}
            moduleId={module.id}
            sessionSeed={reloadKey}
          />
        ) : embedMode === "checking" ? (
          <div className="flex flex-1 items-center justify-center font-mono text-[10.5px] text-slate-500">
            <span className="animate-pulse">checking embed policy…</span>
          </div>
        ) : (
          <iframe
            ref={frameRef}
            key={`${module.url}-${reloadKey}`}
            src={module.url}
            title={module.title}
            className="min-h-0 w-full flex-1 bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        )
      ) : (
        <div className="flex flex-1 items-center justify-center p-6 text-center font-mono text-[10.5px] leading-relaxed text-slate-600 light:text-slate-400">
          <div className="max-w-[260px] space-y-2">
            <div>paste a URL above to embed a live app here</div>
            <div className="text-[9.5px] text-slate-700 light:text-slate-400">
              note: big sites (google, cnn, espn…) send X-Frame-Options / CSP frame-ancestors and
              refuse to embed anywhere — it's their policy, not this app. your own apps, dev
              servers, and dashboards embed fine.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
