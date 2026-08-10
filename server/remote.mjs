#!/usr/bin/env node
// Remote renderer for sites that refuse to be iframed.
// Local dev companion to the dashboard (port 5199) — binds localhost only.
//
//   GET  /api/check?url=&origin=   → { embeddable, reason? }  header probe
//   GET  /api/shot?session=&url=&w=&h= → one-off JPEG frame (debug / fallback)
//   WS   /api/stream?session=&url=&w=&h= → CDP screencast: JPEG frames pushed
//                                      when the page repaints (+ meta msgs)
//   POST /api/input {session,type,x|y|deltaY|key} → click/scroll/key forward
//
// All sessions share ONE persistent Chromium profile (server/.chrome-profile):
// one cookie jar across every remote window, preserved on disk across restarts.
// Log in once (or via `npm run remote:login` for a headed window) and every
// remote window is authenticated.

import express from "express";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { launchShared } from "./launch.mjs";

const PORT = Number(process.env.PORT) || 5198;
const HOST = process.env.HOST || "127.0.0.1"; // containers set HOST=0.0.0.0
const TOKEN = process.env.RENDERER_TOKEN || null; // set in hosted deploys
const IDLE_TIMEOUT_MS = 5 * 60_000;

const app = express();
app.use(express.json({ limit: "64kb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // token-gated anyway
  res.setHeader("Access-Control-Allow-Headers", "content-type, authorization");
  res.setHeader("Access-Control-Expose-Headers", "x-remote-url, x-remote-title");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Token gate (hosted only — local dev leaves RENDERER_TOKEN unset).
const tokenOf = (req) =>
  (req.headers.authorization || "").replace(/^Bearer\s+/i, "") ||
  String(req.query.token || "");
app.use((req, res, next) => {
  if (!TOKEN) return next();
  if (tokenOf(req) !== TOKEN) return res.status(401).json({ error: "unauthorized" });
  next();
});

app.get("/api/health", (_req, res) => res.json({ ok: true, version: 1 }));

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

// ── Embed probe ─────────────────────────────────────────────────────────────

app.get("/api/check", async (req, res) => {
  const target = String(req.query.url || "");
  const origin = String(req.query.origin || "");
  try {
    const u = new URL(target);
    if (u.origin === origin) return res.json({ embeddable: true });

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const resp = await fetch(u, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "user-agent": UA },
    });
    clearTimeout(t);

    const xfo = (resp.headers.get("x-frame-options") || "").toLowerCase();
    const csp = resp.headers.get("content-security-policy") || "";
    const fa = /frame-ancestors\s+([^;]+)/i.exec(csp)?.[1]?.trim() ?? null;

    let embeddable = true;
    let reason = null;
    if (fa) {
      const tokens = fa.split(/\s+/);
      if (tokens.includes("'none'")) {
        embeddable = false;
        reason = "csp frame-ancestors 'none'";
      } else if (tokens.includes("*")) {
        embeddable = true;
      } else if (tokens.includes("'self'")) {
        embeddable = u.origin === origin;
        if (!embeddable) reason = "csp frame-ancestors 'self'";
      } else {
        embeddable = tokens.some((tok) => {
          try {
            return new URL(tok.includes("://") ? tok : `https://${tok}`).origin === origin;
          } catch {
            return false;
          }
        });
        if (!embeddable) reason = `csp frame-ancestors ${tokens.join(" ")}`;
      }
    } else if (xfo.includes("deny")) {
      embeddable = false;
      reason = "x-frame-options: deny";
    } else if (xfo.includes("sameorigin")) {
      embeddable = u.origin === origin;
      if (!embeddable) reason = "x-frame-options: sameorigin";
    }
    res.json({ embeddable, reason });
  } catch {
    // Can't verify (network/DNS/etc.) — let the iframe try rather than assume blocked.
    res.json({ embeddable: true, unchecked: true });
  }
});

// ── Browser sessions ────────────────────────────────────────────────────────

// Single persistent context = shared cookie jar. Launch identity (real Chrome,
// headed-equivalent UA, automation flags hidden) lives in ./launch.mjs and is
// shared with scripts/login.mjs so Cloudflare clearance stays valid.
let contextPromise = null;
const getContext = () =>
  (contextPromise ??= launchShared({ headless: process.env.REMOTE_HEADLESS !== "0" }));

const sessions = new Map(); // id → { page, lastUsed, cdp? }
const pending = new Map(); // id → Promise<page>

async function getPage(id, url, w, h) {
  const existing = sessions.get(id);
  if (existing) {
    existing.lastUsed = Date.now();
    const vp = existing.page.viewportSize();
    if (vp && (Math.abs(vp.width - w) > 40 || Math.abs(vp.height - h) > 40)) {
      await existing.page.setViewportSize({ width: w, height: h }).catch(() => {});
    }
    return existing.page;
  }
  if (pending.has(id)) return pending.get(id);

  const p = (async () => {
    const context = await getContext();
    const page = await context.newPage();
    await page.setViewportSize({ width: w, height: h });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    sessions.set(id, { page, lastUsed: Date.now() });
    pending.delete(id);
    return page;
  })();
  pending.set(id, p);
  try {
    return await p;
  } catch (e) {
    pending.delete(id);
    throw e;
  }
}

setInterval(() => {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (now - s.lastUsed > IDLE_TIMEOUT_MS) {
      sessions.delete(id);
      s.page.close().catch(() => {}); // page only — the shared profile stays open
    }
  }
}, 60_000);

// ── Frames + input ──────────────────────────────────────────────────────────

app.get("/api/shot", async (req, res) => {
  try {
    const session = String(req.query.session || "");
    const url = String(req.query.url || "");
    const w = Math.max(320, Math.min(1920, Number(req.query.w) || 800));
    const h = Math.max(240, Math.min(1200, Number(req.query.h) || 500));
    if (!session || !url) return res.status(400).json({ error: "session and url required" });

    const page = await getPage(session, url, w, h);
    const buf = await page.screenshot({ type: "jpeg", quality: 60 });
    res.setHeader("content-type", "image/jpeg");
    res.setHeader("x-remote-url", page.url());
    res.setHeader("x-remote-title", (await page.title()) || "");
    res.end(buf);
  } catch (e) {
    res.status(503).json({ error: String(e?.message || e) });
  }
});

app.post("/api/input", async (req, res) => {
  try {
    const { session, type } = req.body || {};
    const s = sessions.get(String(session || ""));
    if (!s) return res.status(404).json({ error: "unknown session" });
    s.lastUsed = Date.now();
    const page = s.activePage ?? s.page; // popup gets input while it's streamed

    if (type === "click") {
      await page.mouse.click(Number(req.body.x) || 0, Number(req.body.y) || 0);
    } else if (type === "scroll") {
      await page.mouse.wheel(0, Number(req.body.deltaY) || 0);
    } else if (type === "key") {
      const key = String(req.body.key || "");
      if (key.length === 1) await page.keyboard.type(key);
      else await page.keyboard.press(key);
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// ── CDP screencast streaming ────────────────────────────────────────────────

const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  if (!req.url?.startsWith("/api/stream")) return socket.destroy();
  if (TOKEN) {
    const q = new URL(req.url, "http://localhost").searchParams;
    if (q.get("token") !== TOKEN) return socket.destroy();
  }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
});

wss.on("connection", async (ws, req) => {
  const q = new URL(req.url, "http://localhost").searchParams;
  const session = String(q.get("session") || "");
  const url = String(q.get("url") || "");
  const w = Math.max(320, Math.min(1920, Number(q.get("w")) || 800));
  const h = Math.max(240, Math.min(1200, Number(q.get("h")) || 500));
  if (!session || !url) {
    ws.send(JSON.stringify({ t: "error", message: "session and url required" }));
    return ws.close();
  }

  let metaTimer = null;
  // The page currently being streamed — switches to OAuth popups and back.
  let current = { page: null, cdp: null };
  try {
    const page = await getPage(session, url, w, h);
    const rec = sessions.get(session);

    // One screencast per session: a new viewer supersedes the old one.
    if (rec?.cdp) {
      try {
        await rec.cdp.send("Page.stopScreencast");
        await rec.cdp.detach();
      } catch {}
      rec.cdp = null;
    }

    const sendMeta = async () => {
      if (ws.readyState !== 1 || !current.page) return;
      const title = await current.page.title().catch(() => "");
      ws.send(JSON.stringify({ t: "meta", url: current.page.url(), title }));
      const s = sessions.get(session);
      if (s) s.lastUsed = Date.now(); // watching keeps the session alive
    };

    const streamTo = async (targetPage) => {
      if (current.cdp) {
        try {
          await current.cdp.send("Page.stopScreencast");
          await current.cdp.detach();
        } catch {}
      }
      await targetPage.setViewportSize({ width: w, height: h }).catch(() => {});
      const cdp = await targetPage.context().newCDPSession(targetPage);
      cdp.on("Page.screencastFrame", (ev) => {
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({ t: "frame", data: ev.data, url: targetPage.url() }));
        }
        // Frames stop flowing without the ack.
        cdp.send("Page.screencastFrameAck", { sessionId: ev.sessionId }).catch(() => {});
      });
      await cdp.send("Page.startScreencast", {
        format: "jpeg",
        quality: 60,
        maxWidth: w,
        maxHeight: h,
        everyNthFrame: 1,
      });
      current = { page: targetPage, cdp };
      if (rec) {
        rec.cdp = cdp;
        rec.activePage = targetPage;
      }
      sendMeta();
    };

    await streamTo(page);

    // OAuth flows open popups — follow them, then return to the opener.
    page.on("popup", async (popup) => {
      try {
        await streamTo(popup);
        popup.on("close", () => streamTo(page).catch(() => {}));
      } catch {}
    });

    metaTimer = setInterval(sendMeta, 3000);

    ws.on("close", async () => {
      clearInterval(metaTimer);
      try {
        await current.cdp?.send("Page.stopScreencast");
        await current.cdp?.detach();
      } catch {}
      const s = sessions.get(session);
      if (s?.cdp === current.cdp) s.cdp = null;
    });
  } catch (e) {
    clearInterval(metaTimer);
    ws.send(JSON.stringify({ t: "error", message: String(e?.message || e) }));
    ws.close();
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[remote] renderer listening on http://${HOST}:${PORT} (http + ws${TOKEN ? " + token" : ""})`);
});
