# Operator Workspace Dashboard — Prototype

An operator "mission control" UI where multiple apps/tools/webpages live together in **one space**. React + TypeScript + Tailwind v4 (Vite). Mock data only — no backends.

**Tiled windows run on `react-grid-layout`** (same engine as the previous internal system) so the interaction model maps 1:1 for engineering handoff. Everything RGL doesn't cover — flatten docks, floating windows, focus/zen, backdrop, scroll stacks — is a state machine layered on top (`WindowState.layoutState`), not a competing layout system.

## Run

```bash
npm install
npm run dev        # dashboard only → http://localhost:5199 (pinned, strictPort)
npm run dev:full   # dashboard + remote renderer (for frame-blocked sites)
npm run build      # typecheck + production build
```

### Remote renderer (for sites that block iframes)

`server/remote.mjs` (Express + Playwright, port 5198, localhost-only) handles sites that refuse framing:

1. LiveModule first probes `GET /api/check?url=…` — reads the site's `X-Frame-Options` / CSP `frame-ancestors`. Clean sites stay **plain iframes** (untouched path).
2. Blocked sites route to a headless Chromium session — the server polls JPEG frames into the window and forwards clicks, scroll, and keystrokes back. Each session is an isolated browser context (own cookie jar → logins persist while the renderer runs). Navigation is tracked into localStorage, so sub-pages restore on reload.
3. If even the renderer fails (bot walls etc.), the window shows: *"external restrictions — this site is undisplayable in this format."*

If the renderer isn't running, everything silently falls back to plain iframes. Verified: google.com and cnn.com (both frame-blocked) render and accept input. Security note: no auth, binds 127.0.0.1 — dev tool only.

## Concepts

| Primitive | Meaning |
|---|---|
| **Board** | High-level context (Enhanced AI Ops, Patent Workflows, Marketing). Top-bar pills. |
| **Workspace** | A saved layout within a board. Top-bar chips. |
| **Grid** | The tiled floor (RGL, 12-col). Each mode has its own stored layout (`WorkspaceState.grids[mode]`, RGL `Layout[]` shape). |
| **Window** | Capsule hosting one or more modules. States: `normal` (on grid), `flattened{Left,Right,Top,Bottom}` (edge docks), `floating` (custom overlay layer), `focused` (zen overlay), `backdrop` (behind grid). |
| **Module** | An app surface — mock (ClaudeCode, FluxPrompt canvas, logs…) or `live` (a real URL in an iframe). |

## Handoff notes for engineering

- **Grid windows**: `GridCanvas.tsx` — plain `WidthProvider(GridLayout)`, `compactType={null}`, **`preventCollision`**, `isBounded`, drag handle = window header (`.win-drag-handle`), buttons/inputs excluded via `draggableCancel`. Collision policy: nothing ever moves another window — a dragged window overlaps on drop instead of pushing, and the last-touched window repaints to front (`bringToFront` reorders the layout array). Grid positions persist to workspace state on `onLayoutChange` (merged so off-grid windows keep their rects).
- **Window states vs. grid**: a window leaves the grid by changing `layoutState`, not by unmounting data. Flatten = dock strip; the grid entry survives, so restore pops it back at its last rect. RGL only ever sees `normal` windows.
- **Attach gesture**: floating windows only. Hit-test + **dwell gate** (~400ms near-stationary hover arms the drop target) in `FloatingLayer.tsx` — dragging across windows never accidentally attaches. On attach, modules merge into the target and `viewMode: "stack"` renders them as one scroll column.
- **Iframe gotcha**: pointer events get swallowed by embedded live content mid-drag; the `.ptr-off` class kills iframe hit-testing during grid drags, floating moves, and resizes.

## Versions

- **`v1` (git tag)** — the original baseline. Restore with `git checkout v1`; return with `git checkout main`.
- **v2 (main)** — top edge dock removed (collided with chrome); user-addable boards/workspaces (max 7 each); "+ window" module picker; board/workspace/layout-mode labels.

## Mental model: board → workspace → layout slots

- **Board** = a major area (top-bar pills). Up to 7, user-addable.
- **Workspace** = the What AND the Where: its own set of windows **and** their layouts. Up to 7 per board, user-addable.
- **Layout slots** (the `1/2/3` buttons) = the user's saved arrangements *of that workspace's windows*. There is no preset behavior: arranging windows writes into the active slot automatically, each slot remembers its own state, double-click a slot to rename it (seeded as Ops/Debug/Build on the factory workspaces).

Switching slots: windows in the slot's grid return to their saved rects/tabs; on-grid windows the slot doesn't know park in the bottom dock; floating/backdrop windows are untouched.

## Live iframe persistence

- **Sub-page tracking (same-origin only):** when an embedded app is same-origin with the dashboard (e.g. your localhost dev servers), the frame's current URL is polled (2s) and written to localStorage *without* remounting the iframe — so a reload restores the sub-page you were on. Cross-origin frames can't be read (browser security); those restore to the URL you set.
- **Cookies/logins:** embedded sites use their own cookies as normal — but cross-origin iframes are *third-party* cookie contexts, which Safari (ITP) and Chrome increasingly restrict. Logins persist best when the app is same-origin, or same parent domain (e.g. dashboard on `ops.yourdomain.com`, apps on `app.yourdomain.com`).
- **Embed blocking:** sites sending `X-Frame-Options` / CSP `frame-ancestors` refuse to embed anywhere (google/cnn/espn…). Their policy, not this app.

## Interaction model (press `?` in-app for the cheat sheet)

| Gesture | Result |
|---|---|
| **arrange switch (`m`)** | unlocks grid dragging + attach; canvas and window headers tint emerald while ON. Resize is always available, ON or OFF. |
| Drag window header | move (grid tiles need arrange ON; floating windows always move) |
| Drag window to a **screen edge** | dock to left / right / bottom — emerald zones light up during any drag (no top edge on purpose) |
| While dragging, **pause ~0.4s** on another window | arm attach — **violet** highlight — release merges into its scroll stack (works from grid tiles AND floating windows) |
| Drag corner handle | resize (grid SE handle / floating corner grip) — always on |
| **Double-click header** | zen focus (fill canvas); again to exit |
| Click dock strip | restore window to its grid rect |
| `⋯` menu in header | every action, labeled: dock ×3, float/dock, zen, backdrop, flip, remove |
| `1/2/3` `m` `⌘K` `` ` `` `t` `?` `Esc` | slots · arrange · search · inspector · theme · help · exit zen |

Color language: **emerald = position** (move placeholder, dock zones), **violet = merge** (attach overlay).

During any drag or resize, pointer events on all embedded iframes are disabled globally so live pages can't swallow the gesture.

## What's implemented

- **Multi-module windows** with tab switching
- **Flattening in 4 directions** — window leaves its panel and docks as a slim strip on the matching edge (left dock = the left side panel). Click a strip to restore it home.
- **Floating windows** — draggable overlay (drag the header); dock button returns it home. Ops Copilot starts floated as a demo.
- **Focus / zen mode** — window fills the main panel, side panels dim and shrink. `Esc` exits.
- **Two-sided windows** — Patent Search: front = config buttons (US PTO / EPO / WIPO / All), flips to the module view with the selected config. 3D CSS flip.
- **Mode reconfiguration** — Ops / Debug / Build presets per workspace (`modeLayouts` in `src/data/boards.ts`): reassigns which windows live in main vs. right panel and which tab is active.
- **Keyboard shortcuts** — `1/2/3` switch modes, `⌘K`/`Ctrl+K` focuses command input, `` ` `` toggles the inspector, `t` toggles theme, `Esc` exits zen.
- **Debug inspector** — bottom-right live dump of every window and its `layoutState`.
- **Background canvas** — system-map SVG + ambient blobs; "canvas glow" slider on the control panel adjusts intensity live.
- **Light mode** — sun/moon toggle in the top bar (or `t`), persisted in localStorage, applied pre-paint. Dark is the base theme; light is a `light:` variant layered on top. Terminal-style modules (logs, code editor, flux canvas) intentionally keep dark surfaces in both themes.
- **Live URL linking, everywhere** — every window header has a link button (Link2 icon) that binds the *active tab* to any URL; the view becomes a live iframe (mini browser chrome: edit / reload / open-in-tab). "Clear" reverts to the built-in mock view. URLs persist per-workspace in localStorage as bindings layered over the mock data, so factory windows never go stale.
  - **Embed caveat:** sites sending `X-Frame-Options` / CSP `frame-ancestors` (google.com, cnn.com, espn.com, most big properties) refuse to render in *any* iframe on *any* host — it's the remote site's policy, not this app or localhost. Your own apps, dev servers, and internal dashboards embed fine; use open-in-tab for the rest.
- **Add anything** — `+ window` on the control panel (module picker: live URL, logs, status, metrics, chat, docs, sessions, canvas, code editor — spawned floating, removable via ✕, persisted). `+ board` / `+ workspace` in the top bar (max 7 each, inline name fields).
- **Backdrop windows** — the Layers button on any window sends it behind all panels (above the background canvas). Still interactive where panels don't cover it. "Bring to front" (ArrowUpFromLine) restores it.
- **Resizing** — grid windows resize via RGL's corner handle; floating windows have a corner grip (bottom-right, drag). Both persist in state.
- **Drag-to-attach (scroll stacks)** — float a window, drag it over another window, and **pause ~0.4s**: the target arms with "release to attach". Dropping merges the dragged window's modules into the target as a **scroll stack** — sticky section headers, one long scroll. Stack section headers have an Unlink button to detach a module back into its own floating window. Multi-module windows get a `tabs | scroll` toggle in the tab strip to switch views any time.

## Structure

```
src/
  types.ts              data model (Board → Workspace → Panel → Window → Module)
  data/boards.ts        3 boards, 4 workspaces, per-mode layout presets
  state/dashboard.ts    reducer + applyModeLayout
  hooks/useHotkeys.ts
  components/           AppShell, BackgroundCanvas, ControlPanel, Panel,
                        WindowFrame, FlattenDock, FloatingLayer, DebugInspector,
                        ModuleHost
  modules/              one mock view per module type (logs stream live,
                        flux canvas has animated edges, chat, patent search…)
```

## Extending

- **New module:** add a component in `src/modules/`, register it in `ModuleHost`, reference it from a window in `src/data/boards.ts`.
- **New workspace/board:** add a factory in `src/data/boards.ts` with its own `modeLayouts`.
- **Persistence:** `DashboardState` is a plain serializable object — snapshot it from the reducer to save layouts later.

## Design direction

Dark operator theme (Linear × finance terminal): `#0b0d12` base, capsule windows with light borders and depth shadows, emerald/cyan accents, JetBrains Mono for readouts. Background stays subtle; foreground windows are primary.
