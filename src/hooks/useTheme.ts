import { useSyncExternalStore } from "react";

/** Reactive read of the theme class on <html> (toggled by App). */
export function useIsLight(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const obs = new MutationObserver(cb);
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
      return () => obs.disconnect();
    },
    () => document.documentElement.classList.contains("light")
  );
}
