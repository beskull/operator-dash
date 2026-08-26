import { useEffect } from "react";

interface HotkeyHandlers {
  onOpenSuperchat: () => void;
  onToggleInspector: () => void;
  onToggleTheme: () => void;
  onToggleHelp: () => void;
  onToggleArrange: () => void;
  onToggleMinimalHeaders: () => void;
  onExitFocus: () => void;
}

export function useHotkeys({
  onOpenSuperchat,
  onToggleInspector,
  onToggleTheme,
  onToggleHelp,
  onToggleArrange,
  onToggleMinimalHeaders,
  onExitFocus,
}: HotkeyHandlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ⌘K / Ctrl+K always pops superchat.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenSuperchat();
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
    onOpenSuperchat,
    onToggleInspector,
    onToggleTheme,
    onToggleHelp,
    onToggleArrange,
    onToggleMinimalHeaders,
    onExitFocus,
  ]);
}
