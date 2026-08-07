import type { LayoutState } from "../types";

export type Edge = "left" | "right" | "top" | "bottom";

export const EDGE_TO_LAYOUT: Record<Edge, LayoutState> = {
  left: "flattenedLeft",
  right: "flattenedRight",
  top: "flattenedTop",
  bottom: "flattenedBottom",
};

const STRIP = 40; // px from viewport edge that counts as "the edge"

/** Which screen edge (if any) a viewport point is over.
    No top edge — it collides with the board/workspace/mode chrome. */
export function edgeFromPoint(x: number, y: number): Edge | null {
  const W = window.innerWidth;
  const H = window.innerHeight;
  if (x <= STRIP) return "left";
  if (x >= W - STRIP) return "right";
  if (y >= H - STRIP) return "bottom";
  return null;
}
