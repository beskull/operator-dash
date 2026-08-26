# Operator Workspace Dashboard — Prototype

An operator "mission control" UI where multiple apps/tools/webpages live together in **one space**. React + TypeScript + Tailwind v4 (Vite). Mock data only — no backends.

**Tiled windows run on `react-grid-layout`** (same engine as the previous internal system) so the interaction model maps 1:1 for engineering handoff. Everything RGL doesn't cover — flatten docks, floating windows, focus/zen, backdrop, scroll stacks — is a state machine layered on top (`WindowState.layoutState`), not a competing layout system.

## Run

**Hosted (team):** https://operator-dash-one.vercel.app — deploys from this repo via `vercel --prod` (Vite static build, no server pieces).

```bash
npm install
npm run dev        # dashboard only → http://localhost:5199 (pinned, strictPort)
npm run dev:full   # dashboard + remote renderer (for frame-blocked sites)
npm run build      # typecheck + production build
vercel --prod      # redeploy the hosted dashboard
```

Hosted-instance note: the remote renderer runs on **each user's own machine** — no server to host, no shared credentials. The hosted app defaults to `localhost:5198`; teammates start their local renderer with one command (also shown under ⚙ → Developer → Renderer):

```bash
npx -y github:beskull/operator-dash
```

(needs Node.js; first run downloads Chromium once). ⚙ → Developer → Renderer shows the connection state and has a `test` button (it only prints the setup command when disconnected). For a centrally hosted renderer instead, run `server/remote.mjs` on a container host (Fly.io packaging included: `Dockerfile` + `fly.toml`), set `RENDERER_TOKEN`, and configure `VITE_REMOTE_URL` + `VITE_REMOTE_TOKEN` in Vercel.

### Remote renderer (for sites that block iframes)

`server/remote.mjs` (Express + Playwright, port 5198, localhost-only) handles sites that refuse framing:

1. LiveModule first probes `GET /api/check?url=…` — reads the site's `X-Frame-Options` / CSP `frame-ancestors`. Clean sites stay **plain iframes** (untouched path).
2. Blocked sites route to a headless Chromium session — a **CDP screencast** (`ws …/api/stream`) pushes JPEG frames whenever the page repaints (~16fps observed; no polling), while clicks/scroll/keys forward over `POST /api/input`. Each session is an isolated browser context (own cookie jar → logins persist while the renderer runs). Navigation is tracked into localStorage, so sub-pages restore on reload. Resizing the window renegotiates the remote viewport (debounced).
3. If even the renderer fails (bot walls etc.), the window shows: *"external restrictions — this site is undisplayable in this format."*

If the renderer isn't running, everything silently falls back to plain iframes. Verified: google.com and cnn.com (both frame-blocked) render and accept input. Security note: no auth, binds 127.0.0.1 — dev tool only.

**Bot checks (Cloudflare etc.):** the renderer drives your installed Google Chrome via **patchright** (a Playwright drop-in with the CDP-layer `Runtime.enable` detection leak patched — that leak, not the JS fingerprints, is what heavily protected sites key on; switching to Puppeteer would not have helped since it exposes the same signal). This clears most "verify you are human" loops. For the hardest cases (claude.ai, perplexity.ai run interactive Turnstile that scores the environment, not just the driver), run `npm run remote:login` once and click the checkbox in the visible window — clearance persists in the shared profile and headless runs ride it (the UA is matched headed-equivalent). Note: stop the renderer first — Chrome refuses to share the profile between two instances.

## Concepts

| Primitive | Meaning |
|---|---|
| **Dashboard** | High-level context (Enhanced AI Ops, Patent Workflows, Marketing). Top-left picker with access scope (Organization / Workspaces / Private). Code model still says `Board`. |
| **Workspace** | A saved layout within a dashboard. Chips nested inside the dashboard's container in the top bar; shareable (public / invite only / org). |
| **Grid** | The tiled floor (RGL, 12-col). The active layout slot holds the stored layout (`WorkspaceState.slots[activeSlot].grid`, RGL `Layout[]` shape). |
| **Panel** | Capsule hosting one or more modules — an agent, a chatbot, a website, a Builder view, a log stream. States: `normal` (on grid), `flattened{Left,Right,Top,Bottom}` (edge docks), `floating` (custom overlay layer), `focused` (zen overlay). (`backdrop` exists in the model but is disabled — see Versions.) **Code model still says `Window`** — see Vocabulary. |
| **Module** | A view inside a panel — mock (ClaudeCode, FluxPrompt canvas, logs…) or `live` (a real URL in an iframe). |

### The top bar

One 48px row (`AppShell.tsx`), left to right:

```
[◧ OPERATOR] [+ Panel] │ Dashboard ▾ › (ws)(ws)(ws)(+N ▾)(+ workspace) ⤴  ···  [arrange ⏻] │ [▰ Chat ⌘K] │ [work mode] [⚙]
```

Left is identity and creation, middle is *where you are*, right is *what you do to the floor*. In work mode the whole row is removed and a single restore pill remains.

### Vocabulary

The UI says **panel**; the code says `Window` (`WindowState`, `WindowFrame`, `windows`). This is deliberate, not drift. "Window" was renamed in v2.15 because these things are not windows: they flatten into edge strips and stack as tabs inside each other, and their content is as often a website or a log stream as an agent. "Panel" is content-agnostic and survives every layout state. Type identifiers were left alone until the term has been lived with — renaming them is churn with no user-visible benefit. If the term sticks, `WindowState → PanelState` is a mechanical rename.

## Handoff notes for engineering

- **Grid windows**: `GridCanvas.tsx` — plain `WidthProvider(GridLayout)`, `compactType={null}`, **`preventCollision`**, `isBounded`, drag handle = window header (`.win-drag-handle`), buttons/inputs excluded via `draggableCancel`. Collision policy: nothing ever moves another window — a dragged window overlaps on drop instead of pushing, and the last-touched window repaints to front (`bringToFront` reorders the layout array). Grid positions persist to workspace state on `onLayoutChange` (merged so off-grid windows keep their rects).
- **Window states vs. grid**: a window leaves the grid by changing `layoutState`, not by unmounting data. Flatten = dock strip; the grid entry survives, so restore pops it back at its last rect. RGL only ever sees `normal` windows.
- **Attach gesture**: floating windows only. Hit-test + **dwell gate** (~400ms near-stationary hover arms the drop target) in `FloatingLayer.tsx` — dragging across windows never accidentally attaches. On attach, modules merge into the target and `viewMode: "stack"` renders them as one scroll column.
- **Iframe gotcha**: pointer events get swallowed by embedded live content mid-drag; the `.ptr-off` class kills iframe hit-testing during grid drags, floating moves, and resizes.
- **The renderer is also the fastest way to *verify* UI work** (useful for agents with no browser). With `server/remote.mjs` running and a build being served, screenshot and drive the app over HTTP:

  ```bash
  npx vite preview --port 4173 --strictPort &        # serve the build
  curl "localhost:5198/api/shot?session=ui&url=http://localhost:4173&w=1728&h=520" -o /tmp/ui.jpg
  curl -X POST localhost:5198/api/input -H 'content-type: application/json' \
       -d '{"session":"ui","type":"click","x":157,"y":23}'     # also: scroll, key
  ```

  Two gotchas: the first shot of a cold session catches the fade-in animations mid-flight (shoot twice), and **stray letters typed while no field is focused hit the app's hotkeys** — `t` flips the theme, `m` arrange, `h` work mode. Hover states can be captured by clicking the target and pressing `Escape`: the cursor stays parked on the element.

## Versions

- **`v1` (git tag)** — the original baseline. Restore with `git checkout v1`; return with `git checkout main`.
- **v2 (main)** — top edge dock removed (collided with chrome); user-addable boards/workspaces (max 7 each); "+ window" module picker; board/workspace/layout-mode labels.
- **v2.15.1** (current, production) — `+ Panel` popover was still right-anchored from when the button sat on the right of the bar, so it hung off the left edge of the page → anchored left. **Chat** hover set `text-indigo-100` with no light-mode override (pale-on-pale = invisible label in light theme) → hover now inverts to a solid indigo fill with white text.
- **v2.15** — **`+ Window` → `+ Panel`**, moved to first position and given a **solid orange** fill as the single primary action (see Color language for why not emerald). **Workspace chips collapse past 3** behind a `+N` dropdown — the *active* workspace is always kept on the bar, displacing a chip rather than hiding inside the menu. Superchat: AI-sparkles → **FluxPrompt mark**, "Ask" → **"Chat"**, violet → indigo (bar + overlay). User-facing "window" copy swept to "panel" throughout (help sheet, ⋯ menu, tooltips, empty-grid message, settings count); code identifiers unchanged (see Vocabulary).
- **v2.14** — **two-row chrome collapsed into one 48px bar.** `ControlPanel.tsx` **deleted** (not hidden); `AppShell.tsx` is now the whole top row. `+ window` and `arrange` promoted into the bar. Superchat stopped being an inline search input and became a button (⌘K equivalent) that pops the overlay, with a real empty state for a cold open. **Theme toggle removed** from the bar (`t` still works). Canvas glow, layout inspector, renderer health, shortcuts and the panel count folded into a new **`SettingsMenu.tsx`** (⚙) drawer; `RendererStatus` gained `variant="row"` for embedding there. Work mode now hides one bar instead of two, and the canvas gained ~40px of height.
- **v2.13.1** — zen/focus overlay was `p-3 pt-14`, a leftover from when it floated beneath header chrome; that 56px was a visible gap above the focused panel, worst in work mode where the headers are already hidden. Now full-bleed `inset-0`, with `.window-capsule.focused` squared off (`border-radius: 0`).
- **v2.13** — Board renamed to **Dashboard** (picker dropdown w/ access scopes: Organization / Workspaces / Private); workspaces visually nested in the dashboard's top-bar cluster + share scopes (public / invite only / org); **layout slots UI hidden** (data model kept); **backdrop disabled** (windows got stuck behind panels — revisit as non-interactive pinning for images/meters/logs); **+window trimmed** to the FluxPrompt trio (Chatbot / Add URL / Agent flow); **superchat overlay** (search field, Enter opens); live-URL chrome auto-hides after load (slim reveal strip); one-click minimize-to-bottom-dock button in every header; shrink-resize pulls pushed-down windows back up (upward compaction); renderer switched to **patchright** for CDP stealth.

## Mental model: dashboard → workspace → layout slots

- **Dashboard** = a major area (top-left picker). Up to 7, user-addable, each with an access scope.
- **Workspace** = the What AND the Where: its own set of windows **and** their layouts. Up to 7 per dashboard, user-addable. Chips nest inside the dashboard's container — workspaces inherit from the dashboard.
- **Layout slots** (data model; UI hidden in v2.13) = the user's saved arrangements *of that workspace's windows*. The active slot auto-captures arrangements. Slot switching/renaming is dormant until the UX is rethought.

## Live iframe persistence

- **Sub-page tracking (same-origin only):** when an embedded app is same-origin with the dashboard (e.g. your localhost dev servers), the frame's current URL is polled (2s) and written to localStorage *without* remounting the iframe — so a reload restores the sub-page you were on. Cross-origin frames can't be read (browser security); those restore to the URL you set.
- **Cookies/logins (remote windows):** the renderer uses ONE persistent Chromium profile (`server/.chrome-profile`, gitignored) shared by every remote window — log in once and all remote windows are authenticated; credentials survive renderer restarts. For sign-in flows that block headless browsers (Google sometimes does), run `npm run remote:login` once: a visible browser opens on the same profile — sign in there, close it, done. The renderer never touches your daily-driver Chrome profile (Chrome refuses profile sharing while running, and that's your real life in there).
- **Cookies in plain iframes:** embedded sites use their own cookies — but cross-origin iframes are *third-party* cookie contexts, which Safari/Chrome increasingly restrict. Best when the app is same-origin or same parent domain.
- **Embed blocking:** sites sending `X-Frame-Options` / CSP `frame-ancestors` refuse to embed anywhere (google/cnn/espn…). Their policy, not this app — those go through the remote renderer.

## Interaction model (press `?` in-app for the cheat sheet)

| Gesture | Result |
|---|---|
| **arrange switch (`m`)** — **OFF by default** | unlocks grid dragging + attach; canvas and window headers tint emerald while ON. Resize is always available, ON or OFF. |
| Drag window header | move (grid tiles need arrange ON; floating windows always move) |
| Drag window to a **screen edge** | dock to left / right / bottom — emerald zones light up during any drag (no top edge on purpose) |
| While dragging, **pause ~0.4s** on another window | arm attach — **violet** highlight — release merges its modules in as **tabs** (never forced into scroll; toggle to `scroll` if you want the stack) |
| Drag corner handle | resize (grid SE handle / floating corner grip) — always on |
| **Double-click header** | zen focus (fill canvas); again to exit |
| **Resize past a neighbor** | the resize drag IS the expand: vertical growth pushes windows below down; horizontal growth shifts right-side neighbors right, wrapping to a new line when columns run out — works with arrange ON or OFF. **Shrinking back pulls pushed-down windows up** — everything re-nestles. |
| **Minimize icon (header)** | one-click flatten to the bottom dock |
| **work mode (`h`)** | hides the entire top bar and slims panel headers — restore via the floating pill or `h` |
| Hover a tab → **pop-out icon** | detach that module into its own floating window (also: ⋯ menu → "Pop out current tab"; scroll view has per-section detach buttons) |
| Click dock strip | restore window to its grid rect |
| `⋯` menu in header | every action, labeled: dock ×3, float/dock, zen, pop out, flip, remove |
| **Chat** button → or `⌘K` | pops the **superchat** overlay — one thread across every agent (mock routing — FluxPrompt fan-out comes later) |
| `m` `h` `⌘K` `` ` `` `t` `?` `Esc` | arrange · work mode · superchat · inspector · theme · help · exit zen/overlays |

Color language: **orange = the action you take** (`+ Panel` — the only solid-filled button in the app), **emerald = state that is on or healthy** (arrange ON, active workspace, zen badge, status dots, move placeholder, dock zones), **violet = merge** (attach overlay), **indigo = superchat**, **amber = warning**, **cyan = live/float**. Orange exists because emerald was doing double duty as both "healthy" and "press me"; the primary action now shares a hue with nothing else, and amber stays reserved for warnings so a deeper orange never reads as one.

During any drag or resize, pointer events on all embedded iframes are disabled globally so live pages can't swallow the gesture.

## What's implemented

- **Multi-module windows** with tab switching
- **Flattening in 4 directions** — window leaves its panel and docks as a slim strip on the matching edge (left dock = the left side panel). Click a strip to restore it home.
- **Floating windows** — draggable overlay (drag the header); dock button returns it home. Ops Copilot starts floated as a demo.
- **Focus / zen mode** — window fills the main panel, side panels dim and shrink. `Esc` exits.
- **Two-sided windows** — Patent Search: front = config buttons (US PTO / EPO / WIPO / All), flips to the module view with the selected config. 3D CSS flip.
- **Mode reconfiguration** — Ops / Debug / Build presets per workspace (`modeLayouts` in `src/data/boards.ts`): reassigns which windows live in main vs. right panel and which tab is active.
- **Keyboard shortcuts** — `m` arrange mode, `h` work mode, `⌘K`/`Ctrl+K` pops superchat, `` ` `` toggles the inspector, `t` toggles theme, `Esc` exits zen/overlays.
- **Debug inspector** — bottom-right live dump of every window and its `layoutState`.
- **Background canvas** — system-map SVG + ambient blobs; the glow slider (⚙ → Canvas) adjusts intensity live.
- **Light mode** — `t` toggles it (the sun/moon button was removed from the bar in v2.14 — theme belongs in the real settings home, wherever that lands), persisted in localStorage, applied pre-paint. Dark is the base theme; light is a `light:` variant layered on top. Terminal-style modules (logs, code editor, flux canvas) intentionally keep dark surfaces in both themes.
- **Live URL linking, everywhere** — every window header has a link button (Link2 icon) that binds the *active tab* to any URL; the view becomes a live iframe. Once a URL loads, the mini browser chrome **auto-hides** — hover/click the slim strip at the top of the frame to bring it back (edit / reload / open-in-tab / hide). "Clear" reverts to the built-in mock view. URLs persist per-workspace in localStorage as bindings layered over the mock data, so factory windows never go stale.
  - **Embed caveat:** sites sending `X-Frame-Options` / CSP `frame-ancestors` (google.com, cnn.com, espn.com, most big properties) refuse to render in *any* iframe on *any* host — it's the remote site's policy, not this app or localhost. Your own apps, dev servers, and internal dashboards embed fine; use open-in-tab for the rest.
- **Add anything** — **`+ Panel`**, first position in the top bar and the only solid-filled button in the app. The FluxPrompt trio only: **Chatbot**, **Agent flow**, **Add URL…**. Panels spawn floating, are removable via ✕, and persist. Dashboards are created from the top-left picker (name + access scope); workspaces via `+ workspace` in the chip row (max 7 each).
  - Handoff note: module type `chatbot` is the binding point for real FluxPrompt chatbots (picker chips = bot selection; swap the mock replies for the chat API). Type `canvas` = the agent-flow visual.
- **Superchat overlay** — the **Chat** button (or `⌘K`) pops a centered chat overlay; opening it cold shows an empty state, and the old top-bar search field seeds it with a query if one is passed. Mock routing for now (the copy says so); the wired-up build fans the message out through FluxPrompt to the right agents and streams answers back into the one thread.
- **Sharing scopes (mock)** — dashboards carry an access scope (Organization / Workspaces / Private, shown in the picker and chosen at create time); workspaces have a share popover (Open to public / Invite only / Members of your org). Prototype state only — no real ACLs.
- ~~**Backdrop windows**~~ — disabled in v2.13: windows sent behind the panels were hard to recover. The `backdrop` layout state stays in the model; the entry points (menu item, layer) are commented out. Likely returns scoped to non-interactive content (pinned images, meters, logs).
- **Resizing** — grid windows resize via RGL's corner handle; floating windows have a corner grip (bottom-right, drag). Both persist in state.
- **Drag-to-attach (scroll stacks)** — float a window, drag it over another window, and **pause ~0.4s**: the target arms with "release to attach". Dropping merges the dragged window's modules into the target as a **scroll stack** — sticky section headers, one long scroll. Stack section headers have an Unlink button to detach a module back into its own floating window. Multi-module windows get a `tabs | scroll` toggle in the tab strip to switch views any time.

## Structure

```
src/
  types.ts              data model (Board → Workspace → Slot/grid → Window → Module)
                        Board = Dashboard in the UI; Window = Panel in the UI
  data/boards.ts        3 boards, 4 workspaces, per-mode layout presets
  state/dashboard.ts    reducer + applyModeLayout
  hooks/useHotkeys.ts
  components/           AppShell (the single top bar), AddPanelButton, SettingsMenu,
                        BackgroundCanvas, GridCanvas, WindowFrame, WindowMenu,
                        FlattenDock, FloatingLayer, SuperchatOverlay, HelpOverlay,
                        RendererStatus, DebugInspector, ModuleHost
                        icons/FluxSuperchatIcon (traced brand mark — swap in the real SVG)
  modules/              one mock view per module type (logs stream live,
                        flux canvas has animated edges, chat, patent search…)
```

## Extending

- **New module:** add a component in `src/modules/`, register it in `ModuleHost`, reference it from a window in `src/data/boards.ts`.
- **New workspace/board:** add a factory in `src/data/boards.ts` with its own `modeLayouts`.
- **Persistence:** `DashboardState` is a plain serializable object — snapshot it from the reducer to save layouts later.

## Design direction

Dark operator theme (Linear × finance terminal): `#0b0d12` base, capsule panels with light borders and depth shadows, emerald/cyan accents, a single orange primary action, JetBrains Mono for readouts. Background stays subtle; foreground panels are primary.

Chrome is **one row**. The rule that keeps it there: the bar holds only what an operator touches while working — create a panel, arrange the floor, ask, hide the chrome. Anything ambient (display preferences, dev tools, service health, shortcuts) goes in ⚙. When something new wants a place in the bar, it has to displace one of those four, or it goes in the drawer.
