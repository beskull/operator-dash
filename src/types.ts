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
  | "chatbot"
  | "generic";

/** A user-owned saved arrangement of a workspace's windows. */
export interface SlotDef {
  name: string;
  grid: GridPos[];
}

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

/** Dashboard access scope — mirrors the production dashboard's create dialog. */
export type DashboardScope = "organization" | "workspaces" | "private";

/** Workspace sharing scope. */
export type ShareScope = "public" | "invite" | "org";

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
  /** Module tab to activate when the slot engages. */
  tab?: string;
}

export interface WorkspaceState {
  id: string;
  name: string;
  /** Who this workspace is shared with. Defaults to "invite" when unset. */
  share?: ShareScope;
  /**
   * The workspace IS the layout: `windows` is the What, slots are the
   * user-saved arrangements of those windows. Arranging while a slot is
   * active writes into that slot automatically.
   */
  activeSlot: number;
  slots: SlotDef[];
  windows: Record<string, WindowState>;
}

export interface BoardState {
  id: string;
  name: string;
  /** Access scope, shown in the dashboard picker. Defaults to "organization". */
  scope?: DashboardScope;
  workspaces: WorkspaceState[];
}
