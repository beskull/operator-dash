// Shared launcher for the renderer's persistent profile — used by both
// server/remote.mjs (headless) and scripts/login.mjs (headed), so the browser
// identity is IDENTICAL across modes. Cloudflare's cf_clearance is bound to
// the user-agent; if headed login and headless runs send different UAs, the
// clearance is rejected and the challenge loops. Headless Chrome reports
// "HeadlessChrome/..." by default — we probe the exact binary version and
// send the headed-equivalent UA instead.

import path from "node:path";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

export const PROFILE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), ".chrome-profile");

// First-run friendliness for npx installs: if neither a system Chrome nor the
// bundled Chromium exists, download Chromium once.
let browserChecked = false;
function ensureBrowser() {
  if (browserChecked) return;
  browserChecked = true;
  const MAC_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (existsSync(MAC_CHROME)) return; // channel:"chrome" will use the real browser
  if (existsSync(chromium.executablePath())) return;
  console.log("[remote] first run — downloading Chromium (~150MB, one time)…");
  spawnSync("npx", ["-y", "playwright", "install", "chromium"], { stdio: "inherit" });
}

// Fingerprint surface cleanup applied to every page before any script runs.
const INIT_SCRIPT = () => {
  Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  Object.defineProperty(navigator, "languages", { get: () => ["en-US", "en"] });
  Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
  window.chrome = window.chrome || { runtime: {} };
  // Headless reports zero outer window size — a known tell.
  Object.defineProperty(window, "outerWidth", { get: () => window.innerWidth });
  Object.defineProperty(window, "outerHeight", { get: () => window.innerHeight + 88 });
  // Headless returns "denied" for notifications where headed prompts.
  const permissions = window.navigator.permissions;
  const origQuery = permissions?.query?.bind(permissions);
  if (origQuery) {
    permissions.query = (p) =>
      p && p.name === "notifications"
        ? Promise.resolve({ state: Notification.permission })
        : origQuery(p);
  }
};

let cachedUa = null;

/** Real Chrome version → headed-equivalent UA (no "Headless" marker). */
async function chromeUA() {
  if (cachedUa) return cachedUa;
  let version = null;
  for (const opts of [{ channel: "chrome" }, {}]) {
    try {
      const probe = await chromium.launch({ ...opts, headless: true });
      version = probe.version();
      await probe.close();
      break;
    } catch {
      /* try next binary */
    }
  }
  cachedUa = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${
    version ?? "131.0.0.0"
  } Safari/537.36`;
  return cachedUa;
}

export async function launchShared({ headless, profileDir } = {}) {
  ensureBrowser();
  const userAgent = await chromeUA();
  const base = {
    headless,
    viewport: { width: 1280, height: 800 },
    userAgent,
    extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
    args: [
      "--disable-blink-features=AutomationControlled",
      // Real GPU/WebGL in headless (SwiftShader software GL is a bot tell).
      "--enable-gpu",
      "--use-angle=metal",
      "--enable-webgl",
      "--ignore-gpu-blocklist",
    ],
  };
  const dir = profileDir ?? PROFILE_DIR;
  let context;
  try {
    context = await chromium.launchPersistentContext(dir, { ...base, channel: "chrome" });
  } catch {
    context = await chromium.launchPersistentContext(dir, base);
  }
  await context.addInitScript(INIT_SCRIPT);
  return context;
}
