import { useEffect } from "react";

interface HotkeyHandlers {
  onSlot: (slot: number) => void;
  onFocusSearch: () => void;
  onToggleInspector: () => void;
  onToggleTheme: () => void;
  onToggleHelp: () => void;
  onToggleArrange: () => void;
  onToggleMinimalHeaders: () => void;
  onExitFocus: () => void;
}

const SLOT_BY_KEY: Record<string, number> = { "1": 0, "2": 1, "3": 2 };

export function useHotkeys({
  onSlot,
  onFocusSearch,
  onToggleInspector,
  onToggleTheme,
  onToggleHelp,
  onToggleArrange,
  onToggleMinimalHeaders,
  onExitFocus,
}: HotkeyHandlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ⌘K / Ctrl+K always focuses the command input.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onFocusSearch();
        return;
      }

      // Everything else is ignored while typing in a field.
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable]")) {
        if (e.key === "Escape") target.blur();
        return;
      }

      const slot = SLOT_BY_KEY[e.key];
      if (slot !== undefined) {
        onSlot(slot);
        return;
      }
      if (e.key === "`") onToggleInspector();
      if (e.key.toLowerCase() === "t") onToggleTheme();
      if (e.key.toLowerCase() === "m") onToggleArrange();
      if (e.key.toLowerCase() === "h") onToggleMinimalHeaders();
      if (e.key === "?") onToggleHelp();
      if (e.key === "Escape") onExitFocus();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    onSlot,
    onFocusSearch,
    onToggleInspector,
    onToggleTheme,
    onToggleHelp,
    onToggleArrange,
    onToggleMinimalHeaders,
    onExitFocus,
  ]);
}
