import { useEffect, useRef, useState } from "react";
import { trackLiveUrl, urlHost } from "../state/liveWindows";

const REMOTE = "http://localhost:5198";
const REMOTE_WS = REMOTE.replace(/^http/, "ws");

interface RemoteViewProps {
  /** Starting URL (the server navigates once per session; links then drive it). */
  url: string;
  winId?: string;
  moduleId: string;
  /** Bump to force a fresh remote session (reload button). */
  sessionSeed: number;
}

/**
 * Renders a frame-blocked site via the local Playwright renderer over a CDP
 * screencast: Chromium pushes JPEG frames when the page repaints — no polling.
 * Clicks, scroll, and keystrokes forward over a separate POST channel.
 */
export default function RemoteView({ url, winId, moduleId, sessionSeed }: RemoteViewProps) {
  const [img, setImg] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [disconnected, setDisconnected] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(url);
  const boxRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const sessionRef = useRef("");
  const currentUrlRef = useRef(url);
  const lastWheel = useRef(0);
  const [sizeNonce, setSizeNonce] = useState(0);

  // Fresh session per URL + explicit reload.
  sessionRef.current = `${winId ?? "remote"}-${moduleId}-${sessionSeed}`;

  // Reconnect (with new viewport) when the window is resized — debounced.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    let t = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(t);
      t = window.setTimeout(() => setSizeNonce((n) => n + 1), 500);
    });
    ro.observe(el);
    return () => {
      window.clearTimeout(t);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    setFailed(null);
    setDisconnected(false);
    setImg(null);

    const w = Math.max(320, Math.floor(boxRef.current?.clientWidth ?? 800));
    const h = Math.max(240, Math.floor(boxRef.current?.clientHeight ?? 500));
    const ws = new WebSocket(
      `${REMOTE_WS}/api/stream?session=${encodeURIComponent(
        sessionRef.current
      )}&url=${encodeURIComponent(url)}&w=${w}&h=${h}`
    );

    const onUrl = (newUrl: string) => {
      if (newUrl && newUrl !== "about:blank" && newUrl !== currentUrlRef.current) {
        currentUrlRef.current = newUrl;
        setCurrentUrl(newUrl);
        // Remote navigation is visible server-side, so sub-page restore works
        // even for cross-origin sites.
        if (winId) trackLiveUrl(winId, moduleId, newUrl);
      }
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(String(ev.data));
        if (msg.t === "frame") {
          setImg(`data:image/jpeg;base64,${msg.data}`);
          if (msg.url) onUrl(msg.url);
        } else if (msg.t === "meta") {
          if (msg.url) onUrl(msg.url);
        } else if (msg.t === "error") {
          setFailed(msg.message || "renderer error");
        }
      } catch {
        /* malformed frame — skip */
      }
    };
    ws.onerror = () => setFailed("renderer unreachable — is `npm run remote` up?");
    ws.onclose = () => {
      setImg((have) => {
        if (!have) setFailed("stream closed before first frame");
        else setDisconnected(true);
        return have;
      });
    };

    return () => ws.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, moduleId, winId, sessionSeed, sizeNonce]);

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
    if (now - lastWheel.current < 80) return;
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
          {failed}
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
            <span className="animate-pulse">connecting to renderer…</span>
          </div>
        )}
        {disconnected && (
          <div className="absolute inset-x-0 bottom-0 flex justify-center pb-2">
            <span className="rounded bg-amber-500/90 px-2 py-0.5 font-mono text-[9px] text-amber-950">
              stream disconnected — reload to resume
            </span>
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2 border-t border-slate-800/70 bg-slate-950/40 px-2 py-1 light:border-slate-200 light:bg-slate-100">
        <span className="rounded bg-violet-500/15 px-1 py-px font-mono text-[8.5px] uppercase tracking-wide text-violet-300 light:text-violet-700">
          remote · live
        </span>
        <span className="truncate font-mono text-[9.5px] text-slate-500 light:text-slate-500">
          {urlHost(currentUrl)}
          {currentUrl !== url ? " · navigated" : ""}
        </span>
      </div>
    </div>
  );
}
