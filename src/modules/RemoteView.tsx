import { useEffect, useRef, useState } from "react";
import { trackLiveUrl, urlHost } from "../state/liveWindows";

const REMOTE = "http://localhost:5198";
const POLL_MS = 1600;

interface RemoteViewProps {
  /** Starting URL (the server navigates once per session; links then drive it). */
  url: string;
  winId?: string;
  moduleId: string;
  /** Bump to force a fresh remote session (reload button). */
  sessionSeed: number;
}

/**
 * Renders a frame-blocked site via the local Playwright renderer:
 * JPEG frame polling + click/scroll/keyboard forwarding. Only used for sites
 * that refuse iframing — everything else stays a plain iframe.
 */
export default function RemoteView({ url, winId, moduleId, sessionSeed }: RemoteViewProps) {
  const [img, setImg] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState(url);
  const boxRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const sessionRef = useRef<string>("");
  const lastWheel = useRef(0);

  // Fresh session per URL + explicit reload.
  sessionRef.current = `${winId ?? "remote"}-${moduleId}-${sessionSeed}`;

  useEffect(() => {
    let stopped = false;
    let timer = 0;

    const tick = async () => {
      const el = boxRef.current;
      const w = Math.max(320, Math.floor(el?.clientWidth ?? 800));
      const h = Math.max(240, Math.floor(el?.clientHeight ?? 500));
      try {
        const r = await fetch(
          `${REMOTE}/api/shot?session=${encodeURIComponent(sessionRef.current)}&url=${encodeURIComponent(
            url
          )}&w=${w}&h=${h}`
        );
        if (!r.ok) throw new Error(`renderer ${r.status}`);
        const newUrl = r.headers.get("x-remote-url");
        const blob = await r.blob();
        if (stopped) return;
        setImg((old) => {
          if (old) URL.revokeObjectURL(old);
          return URL.createObjectURL(blob);
        });
        if (newUrl && newUrl !== "about:blank" && newUrl !== currentUrl) {
          setCurrentUrl(newUrl);
          // Remote navigation is fully visible server-side, so sub-page
          // restore works even for cross-origin sites.
          if (winId) trackLiveUrl(winId, moduleId, newUrl);
        }
      } catch (e) {
        if (!stopped) setFailed(String(e instanceof Error ? e.message : e));
        return; // stop polling — reload retries
      }
      if (!stopped) timer = window.setTimeout(tick, POLL_MS);
    };

    tick();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, moduleId, winId, sessionSeed]);

  const post = (body: Record<string, unknown>) =>
    fetch(`${REMOTE}/api/input`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ session: sessionRef.current, ...body }),
    }).catch(() => {});

  const handleClick = (e: React.MouseEvent) => {
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    post({
      type: "click",
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    const now = performance.now();
    if (now - lastWheel.current < 120) return;
    lastWheel.current = now;
    post({ type: "scroll", deltaY: Math.round(e.deltaY) });
  };

  const handleKey = (e: React.KeyboardEvent) => {
    const key = e.key;
    if (["Shift", "Control", "Meta", "Alt"].includes(key)) return;
    if (key.length > 1 || key === " ") e.preventDefault();
    post({ type: "key", key });
  };

  if (failed) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <div className="font-mono text-[11px] text-rose-400">
          external restrictions — this site is undisplayable in this format
        </div>
        <div className="max-w-[280px] font-mono text-[9.5px] leading-relaxed text-slate-600 light:text-slate-400">
          the remote renderer couldn't load it either ({failed}). it may be blocking automated
          browsers.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[240px] flex-col">
      <div
        ref={boxRef}
        tabIndex={0}
        onClick={handleClick}
        onWheel={handleWheel}
        onKeyDown={handleKey}
        className="relative min-h-0 flex-1 cursor-text overflow-hidden bg-[#0a0d13] outline-none focus:ring-1 focus:ring-inset focus:ring-cyan-500/40"
        title="Remote-rendered — clicks, scroll, and keys are forwarded"
      >
        {img ? (
          <img
            ref={imgRef}
            src={img}
            alt="remote page"
            className="absolute inset-0 h-full w-full"
            draggable={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-[10.5px] text-slate-500">
            <span className="animate-pulse">rendering remotely…</span>
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2 border-t border-slate-800/70 bg-slate-950/40 px-2 py-1 light:border-slate-200 light:bg-slate-100">
        <span className="rounded bg-violet-500/15 px-1 py-px font-mono text-[8.5px] uppercase tracking-wide text-violet-300 light:text-violet-700">
          remote
        </span>
        <span className="truncate font-mono text-[9.5px] text-slate-500 light:text-slate-500">
          {urlHost(currentUrl)}
          {currentUrl !== url ? " · navigated" : ""}
        </span>
      </div>
    </div>
  );
}
