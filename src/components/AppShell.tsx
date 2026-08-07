import { LayoutGrid, Moon, Plus, Search, Sun } from "lucide-react";
import { forwardRef, useState } from "react";
import type { BoardState } from "../types";

interface AppShellProps {
  boards: BoardState[];
  activeBoardId: string;
  activeWorkspaceId: string;
  isLight: boolean;
  onToggleTheme: () => void;
  onSelectBoard: (id: string) => void;
  onSelectWorkspace: (id: string) => void;
  onAddBoard: (name: string) => void;
  onAddWorkspace: (name: string) => void;
  boardsFull: boolean;
  workspacesFull: boolean;
}

/** Top bar: board pills + workspace chips (both user-extendable), search, theme. */
const AppShell = forwardRef<HTMLInputElement, AppShellProps>(function AppShell(
  {
    boards,
    activeBoardId,
    activeWorkspaceId,
    isLight,
    onToggleTheme,
    onSelectBoard,
    onSelectWorkspace,
    onAddBoard,
    onAddWorkspace,
    boardsFull,
    workspacesFull,
  },
  searchRef
) {
  const activeBoard = boards.find((b) => b.id === activeBoardId) ?? boards[0];
  const [addingBoard, setAddingBoard] = useState(false);
  const [addingWorkspace, setAddingWorkspace] = useState(false);

  return (
    <header className="relative z-30 flex h-12 items-center gap-3 border-b border-slate-800/80 bg-[#0e1118]/90 px-3 backdrop-blur light:border-slate-200 light:bg-white/85">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400/30 to-cyan-400/20 text-emerald-300 light:text-emerald-600">
          <LayoutGrid size={13} />
        </div>
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300 light:text-slate-700">
          Operator
        </span>
      </div>

      <div className="h-5 w-px bg-slate-800 light:bg-slate-200" />

      {/* Board pills — the major areas */}
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-600 light:text-slate-400">
          board
        </span>
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
        {!boardsFull &&
          (addingBoard ? (
            <InlineNameInput
              placeholder="Board name ⏎"
              onSubmit={(name) => {
                onAddBoard(name);
                setAddingBoard(false);
              }}
              onCancel={() => setAddingBoard(false)}
            />
          ) : (
            <button
              title="Add a board (max 7)"
              onClick={() => setAddingBoard(true)}
              className="flex items-center gap-1 rounded-md border border-dashed border-slate-700 px-2 py-1 text-[10.5px] text-slate-500 transition-colors hover:border-emerald-500/50 hover:text-emerald-300 light:border-slate-300 light:hover:text-emerald-600"
            >
              <Plus size={11} />
              board
            </button>
          ))}
      </div>

      <div className="h-5 w-px bg-slate-800 light:bg-slate-200" />

      {/* Workspace chips — saved layouts inside the active board */}
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-600 light:text-slate-400">
          workspace
        </span>
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
        {!workspacesFull &&
          (addingWorkspace ? (
            <InlineNameInput
              placeholder="Workspace name ⏎"
              onSubmit={(name) => {
                onAddWorkspace(name);
                setAddingWorkspace(false);
              }}
              onCancel={() => setAddingWorkspace(false)}
            />
          ) : (
            <button
              title="Add a workspace to this board (max 7)"
              onClick={() => setAddingWorkspace(true)}
              className="flex items-center gap-1 rounded-full border border-dashed border-slate-700 px-2 py-0.5 text-[10px] text-slate-500 transition-colors hover:border-emerald-500/50 hover:text-emerald-300 light:border-slate-300 light:hover:text-emerald-600"
            >
              <Plus size={10} />
              workspace
            </button>
          ))}
      </div>

      {/* Command input */}
      <div className="ml-auto flex w-64 items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-2.5 py-1.5 transition-colors focus-within:border-emerald-500/50 light:border-slate-300 light:bg-white">
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

/** Tiny inline name field used by the + board / + workspace buttons. */
function InlineNameInput({
  placeholder,
  onSubmit,
  onCancel,
}: {
  placeholder: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");
  return (
    <input
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && value.trim()) onSubmit(value);
        if (e.key === "Escape") onCancel();
      }}
      onBlur={onCancel}
      placeholder={placeholder}
      className="w-32 rounded-md border border-emerald-500/50 bg-slate-900 px-2 py-1 text-[10.5px] text-slate-200 outline-none placeholder:text-slate-600 light:bg-white light:text-slate-800"
    />
  );
}
