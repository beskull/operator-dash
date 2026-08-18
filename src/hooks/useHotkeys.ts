import { useEffect } from "react";

interface HotkeyHandlers {
  onFocusSearch: () => void;
  onToggleInspector: () => void;
  onToggleTheme: () => void;
  onToggleHelp: () => void;
  onToggleArrange: () => void;
  onToggleMinimalHeaders: () => void;
  onExitFocus: () => void;
}

export function useHotkeys({
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

      // Everything else is ignored while typing in a field — including the
      // remote-rendered view, whose focusable div forwards keys to the page.
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable], [data-no-hotkeys]")) {
        if (e.key === "Escape") target.blur();
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
    onFocusSearch,
    onToggleInspector,
    onToggleTheme,
    onToggleHelp,
    onToggleArrange,
    onToggleMinimalHeaders,
    onExitFocus,
  ]);
}
