// Remote renderer for sites that refuse to be iframed.
// Local dev companion to the dashboard (port 5199) — binds localhost only.
//
//   GET  /api/check?url=&origin=   → { embeddable, reason? }  header probe
//   GET  /api/shot?session=&url=&w=&h= → latest JPEG frame (headers carry
//                                      x-remote-url / x-remote-title)
//   POST /api/input {session,type,x|y|deltaY|key} → click/scroll/key forward
//
// Each session = an isolated headless Chromium context (its own cookie jar,
// so logins inside a remote window persist while this process runs).

import express from "express";
import { chromium } from "playwright";

const PORT = 5198;
const IDLE_TIMEOUT_MS = 5 * 60_000;

const app = express();
app.use(express.json({ limit: "64kb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // local dev tool
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Expose-Headers", "x-remote-url, x-remote-title");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

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

let browserPromise = null;
const getBrowser = () => (browserPromise ??= chromium.launch({ headless: true }));

const sessions = new Map(); // id → { page, lastUsed }
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
    const browser = await getBrowser();
    const context = await browser.newContext({ viewport: { width: w, height: h }, userAgent: UA });
    const page = await context.newPage();
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
      s.page
        .context()
        .close()
        .catch(() => {});
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

    if (type === "click") {
      await s.page.mouse.click(Number(req.body.x) || 0, Number(req.body.y) || 0);
    } else if (type === "scroll") {
      await s.page.mouse.wheel(0, Number(req.body.deltaY) || 0);
    } else if (type === "key") {
      const key = String(req.body.key || "");
      if (key.length === 1) await s.page.keyboard.type(key);
      else await s.page.keyboard.press(key);
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`[remote] renderer listening on http://localhost:${PORT}`);
});
