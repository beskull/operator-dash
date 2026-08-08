// One-time headed login for the remote renderer's shared profile.
// Opens a visible Chrome window using server/.chrome-profile — sign in to
// whatever you need (Google, Cloudflare checks, etc.), then close the window.
// Uses the SAME launch identity as the headless renderer (see server/launch.mjs)
// so cf_clearance and friends stay valid when the headless windows reuse them.
import { launchShared } from "../server/launch.mjs";

const ctx = await launchShared({ headless: false });

const page = ctx.pages()[0] ?? (await ctx.newPage());
await page.goto("https://accounts.google.com/");
console.log("[login] Browser open on the shared renderer profile.");
console.log("[login] Sign in to whatever you need, then close the browser window — credentials persist.");
await new Promise((resolve) => ctx.on("close", resolve));
console.log("[login] Profile saved. Headless renderer will use it from now on.");
