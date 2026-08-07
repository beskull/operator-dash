import { useEffect } from "react";
import type { ModeKey } from "../types";

interface HotkeyHandlers {
  onMode: (mode: ModeKey) => void;
  onFocusSearch: () => void;
  onToggleInspector: () => void;
  onToggleTheme: () => void;
  onToggleHelp: () => void;
  onExitFocus: () => void;
}

const MODE_BY_KEY: Record<string, ModeKey> = { "1": "ops", "2": "debug", "3": "build" };

export function useHotkeys({
  onMode,
  onFocusSearch,
  onToggleInspector,
  onToggleTheme,
  onToggleHelp,
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

      const mode = MODE_BY_KEY[e.key];
      if (mode) {
        onMode(mode);
        return;
      }
      if (e.key === "`") onToggleInspector();
      if (e.key.toLowerCase() === "t") onToggleTheme();
      if (e.key === "?") onToggleHelp();
      if (e.key === "Escape") onExitFocus();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onMode, onFocusSearch, onToggleInspector, onToggleTheme, onToggleHelp, onExitFocus]);
}
