import type { LayoutState } from "../types";

export type Edge = "left" | "right" | "top" | "bottom";

export const EDGE_TO_LAYOUT: Record<Edge, LayoutState> = {
  left: "flattenedLeft",
  right: "flattenedRight",
  top: "flattenedTop",
  bottom: "flattenedBottom",
};

const STRIP = 40; // px from viewport edge that counts as "the edge"
const CHROME_TOP = 88; // top bar + control panel — not a drop zone
const TOP_ZONE_BOTTOM = 136; // top drop zone lower bound

/** Which screen edge (if any) a viewport point is over. */
export function edgeFromPoint(x: number, y: number): Edge | null {
  const W = window.innerWidth;
  const H = window.innerHeight;
  if (x <= STRIP) return "left";
  if (x >= W - STRIP) return "right";
  if (y >= H - STRIP) return "bottom";
  if (y > CHROME_TOP && y <= TOP_ZONE_BOTTOM) return "top";
  return null;
}
