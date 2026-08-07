import { LayoutGrid, Moon, Search, Sun } from "lucide-react";
import { forwardRef } from "react";
import type { BoardState } from "../types";

interface AppShellProps {
  boards: BoardState[];
  activeBoardId: string;
  activeWorkspaceId: string;
  isLight: boolean;
  onToggleTheme: () => void;
  onSelectBoard: (id: string) => void;
  onSelectWorkspace: (id: string) => void;
}

/** Top bar: board pills, workspace chips, command input, theme toggle. */
const AppShell = forwardRef<HTMLInputElement, AppShellProps>(function AppShell(
  { boards, activeBoardId, activeWorkspaceId, isLight, onToggleTheme, onSelectBoard, onSelectWorkspace },
  searchRef
) {
  const activeBoard = boards.find((b) => b.id === activeBoardId) ?? boards[0];

  return (
    <header className="relative z-30 flex h-12 items-center gap-4 border-b border-slate-800/80 bg-[#0e1118]/90 px-3 backdrop-blur light:border-slate-200 light:bg-white/85">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400/30 to-cyan-400/20 text-emerald-300 light:text-emerald-600">
          <LayoutGrid size={13} />
        </div>
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300 light:text-slate-700">
          Operator
        </span>
      </div>

      <div className="h-5 w-px bg-slate-800 light:bg-slate-200" />

      {/* Board pills */}
      <nav className="flex items-center gap-1">
        {boards.map((b) => (
          <button
            key={b.id}
            onClick={() => onSelectBoard(b.id)}
            className={`rounded-md px-2.5 py-1 text-[11.5px] font-medium transition-colors ${
              b.id === activeBoardId
                ? "bg-slate-800 text-slate-100 light:bg-slate-200 light:text-slate-900"
                : "text-slate-500 hover:bg-slate-800/60 hover:text-slate-300 light:hover:bg-slate-200/70 light:hover:text-slate-700"
            }`}
          >
            {b.name}
          </button>
        ))}
      </nav>

      <div className="h-5 w-px bg-slate-800 light:bg-slate-200" />

      {/* Workspace chips */}
      <nav className="flex items-center gap-1.5">
        {activeBoard.workspaces.map((w) => (
          <button
            key={w.id}
            onClick={() => onSelectWorkspace(w.id)}
            className={`rounded-full border px-2.5 py-0.5 text-[10.5px] transition-colors ${
              w.id === activeWorkspaceId
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300 light:text-emerald-700"
                : "border-slate-700/80 text-slate-500 hover:border-slate-600 hover:text-slate-300 light:border-slate-300 light:hover:border-slate-400 light:hover:text-slate-700"
            }`}
          >
            {w.name}
          </button>
        ))}
      </nav>

      {/* Command input */}
      <div className="ml-auto flex w-72 items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-2.5 py-1.5 transition-colors focus-within:border-emerald-500/50 light:border-slate-300 light:bg-white">
        <Search size={12} className="shrink-0 text-slate-600 light:text-slate-400" />
        <input
          ref={searchRef}
          type="text"
          placeholder="Command or search…"
          className="w-full bg-transparent text-[11.5px] text-slate-200 outline-none placeholder:text-slate-600 light:text-slate-800 light:placeholder:text-slate-400"
        />
        <kbd className="shrink-0 rounded border border-slate-700 px-1.5 py-px font-mono text-[9px] text-slate-500 light:border-slate-300 light:text-slate-400">
          ⌘K
        </kbd>
      </div>

      {/* Theme toggle */}
      <button
        onClick={onToggleTheme}
        title="Toggle light/dark (t)"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/70 text-slate-400 transition-colors hover:text-slate-200 light:border-slate-300 light:bg-white light:text-slate-500 light:hover:text-slate-800"
      >
        {isLight ? <Moon size={13} /> : <Sun size={13} />}
      </button>
    </header>
  );
});

export default AppShell;
