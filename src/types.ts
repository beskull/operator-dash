// ── Core data model ─────────────────────────────────────────────────────────
// Board → Workspace → Panel → Window → Module. Everything is plain state;
// no backends. Layout mutations happen by immutably updating WindowState.

export type LayoutState =
  | "normal"
  | "flattenedLeft"
  | "flattenedRight"
  | "flattenedTop"
  | "flattenedBottom"
  | "floating"
  | "focused"
  | "backdrop";

export type ModuleType =
  | "webapp"
  | "statusCard"
  | "logs"
  | "canvas"
  | "dashboard"
  | "docs"
  | "chat"
  | "sessions"
  | "patent"
  | "marketing"
  | "live"
  | "generic";

export type ModeKey = "ops" | "debug" | "build";

export interface ModuleDef {
  id: string;
  type: ModuleType;
  title: string;
  description?: string;
  /** For type "live": the URL embedded in the iframe. */
  url?: string;
}

export interface TwoSidedConfig {
  id: string;
  label: string;
}

export interface TwoSidedState {
  isTwoSided: boolean;
  side: "front" | "back";
  configs?: TwoSidedConfig[];
  activeConfigId?: string;
}

export type WindowHealth = "ok" | "warn" | "error";

export interface WindowState {
  id: string;
  title: string;
  modules: ModuleDef[];
  activeModuleId: string;
  layoutState: LayoutState;
  /** Accent hex color used for the active-window glow. */
  accent?: string;
  /** Health dot shown in headers and dock strips. */
  status?: WindowHealth;
  /** Position when layoutState === "floating" (px from top-left of canvas). */
  floatPos?: { x: number; y: number };
  /** Size when floating (px). Defaults applied by the floating layer. */
  floatSize?: { w: number; h: number };
  /** tabs = one module visible; stack = all modules in a scroll column. */
  viewMode?: "tabs" | "stack";
  twoSided?: TwoSidedState;
}

/** One tiled window's rect on the 12-col grid (react-grid-layout terms). */
export interface GridPos {
  i: string; // window id
  x: number;
  y: number;
  w: number;
  h: number;
  /** Module tab to activate when the mode engages. */
  tab?: string;
}

export interface WorkspaceState {
  id: string;
  name: string;
  mode: ModeKey;
  windows: Record<string, WindowState>;
  /**
   * Tiled layout per mode, in react-grid-layout units. Windows whose
   * layoutState is "normal" render on the grid at these rects; everything
   * else (flattened/floating/backdrop/focused) renders outside the grid.
   */
  grids: Record<ModeKey, GridPos[]>;
}

export interface BoardState {
  id: string;
  name: string;
  workspaces: WorkspaceState[];
}
