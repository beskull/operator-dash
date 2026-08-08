// One-time headed login for the remote renderer's shared profile.
// Opens a visible Chromium window using server/.chrome-profile — sign in to
// whatever you need (Google, etc.), then close the window. Every headless
// remote window reuses those credentials from then on.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const profileDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../server/.chrome-profile");

const base = {
  headless: false,
  viewport: { width: 1200, height: 850 },
  args: ["--disable-blink-features=AutomationControlled"],
};
let ctx;
try {
  ctx = await chromium.launchPersistentContext(profileDir, { ...base, channel: "chrome" });
} catch {
  ctx = await chromium.launchPersistentContext(profileDir, base);
}

const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto("https://accounts.google.com/");
console.log("[login] Browser open on the shared renderer profile.");
console.log("[login] Sign in to whatever you need, then close the browser window — credentials persist.");
await new Promise((resolve) => ctx.on("close", resolve));
console.log("[login] Profile saved. Headless renderer will use it from now on.");
