import {
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Globe,
  LayoutGrid,
  Lock,
  Mail,
  Moon,
  Plus,
  Search,
  Share2,
  Sun,
} from "lucide-react";
import { forwardRef, useState } from "react";
import type { BoardState, DashboardScope, ShareScope } from "../types";

interface AppShellProps {
  boards: BoardState[];
  activeBoardId: string;
  activeWorkspaceId: string;
  isLight: boolean;
  onToggleTheme: () => void;
  onSelectBoard: (id: string) => void;
  onSelectWorkspace: (id: string) => void;
  onAddBoard: (name: string, scope: DashboardScope) => void;
  onAddWorkspace: (name: string) => void;
  /** Active workspace's sharing scope + setter. */
  workspaceShare: ShareScope;
  onShareWorkspace: (scope: ShareScope) => void;
  /** Search/command submitted (Enter) — opens the superchat overlay. */
  onSubmitSearch: (query: string) => void;
  boardsFull: boolean;
  workspacesFull: boolean;
}

const DASHBOARD_SCOPES: Array<{
  id: DashboardScope;
  label: string;
  desc: string;
  icon: typeof Globe;
}> = [
  {
    id: "organization",
    label: "Organization",
    desc: "All members of your organization can view this dashboard.",
    icon: Globe,
  },
  {
    id: "workspaces",
    label: "Workspaces",
    desc: "Only members of selected workspaces can access this dashboard.",
    icon: Building2,
  },
  {
    id: "private",
    label: "Private",
    desc: "Only you can see and access this dashboard.",
    icon: Lock,
  },
];

const SHARE_SCOPES: Array<{ id: ShareScope; label: string; desc: string; icon: typeof Globe }> = [
  {
    id: "public",
    label: "Open to public",
    desc: "Anyone with the link can view this workspace.",
    icon: Globe,
  },
  {
    id: "invite",
    label: "Invite only",
    desc: "Only people you invite can access this workspace.",
    icon: Mail,
  },
  {
    id: "org",
    label: "Members of your org",
    desc: "Everyone in your organization can access this workspace.",
    icon: Building2,
  },
];

function scopeMeta(scope?: DashboardScope) {
  return DASHBOARD_SCOPES.find((s) => s.id === scope) ?? DASHBOARD_SCOPES[0];
}

/** Top bar: dashboard picker + nested workspace chips, search, theme. */
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
    workspaceShare,
    onShareWorkspace,
    onSubmitSearch,
    boardsFull,
    workspacesFull,
  },
  searchRef
) {
  const activeBoard = boards.find((b) => b.id === activeBoardId) ?? boards[0];
  const [pickerOpen, setPickerOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
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

      {/* ── Dashboard ▸ Workspace cluster — one connected unit: the workspace
          chips live INSIDE the active dashboard's container, so the hierarchy
          reads at a glance. ── */}
      <div className="flex min-w-0 items-center rounded-lg border border-slate-800/90 bg-slate-900/50 light:border-slate-300 light:bg-white/60">
        {/* Dashboard picker */}
        <div className="relative">
          <button
            onClick={() => {
              setPickerOpen((v) => !v);
              setCreating(false);
            }}
            title="Switch dashboard"
            className={`flex items-center gap-1.5 rounded-l-md px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${
              pickerOpen
                ? "bg-slate-800 text-slate-100 light:bg-slate-200 light:text-slate-900"
                : "text-slate-200 hover:bg-slate-800/70 light:text-slate-800 light:hover:bg-slate-200/70"
            }`}
          >
            <LayoutGrid size={12} className="shrink-0 text-emerald-400 light:text-emerald-600" />
            <span className="max-w-44 truncate">{activeBoard.name}</span>
            <ChevronDown
              size={11}
              className={`shrink-0 text-slate-500 transition-transform ${pickerOpen ? "rotate-180" : ""}`}
            />
          </button>

          {pickerOpen && (
            <>
              <div
                className="fixed inset-0 z-[45]"
                onClick={() => {
                  setPickerOpen(false);
                  setCreating(false);
                }}
              />
              <div className="anim-fade-in absolute left-0 top-full z-[46] mt-1.5 w-80 overflow-hidden rounded-xl border border-slate-700/80 bg-[#12151d]/98 shadow-2xl backdrop-blur light:border-slate-300 light:bg-white/98">
                {creating ? (
                  <CreateDashboardForm
                    onCancel={() => setCreating(false)}
                    onCreate={(name, scope) => {
                      onAddBoard(name, scope);
                      setCreating(false);
                      setPickerOpen(false);
                    }}
                  />
                ) : (
                  <>
                    <div className="px-3 pb-1 pt-2.5 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500 light:text-slate-400">
                      Your dashboards
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                      {boards.map((b) => {
                        const meta = scopeMeta(b.scope);
                        const ScopeIcon = meta.icon;
                        return (
                          <button
                            key={b.id}
                            onClick={() => {
                              onSelectBoard(b.id);
                              setPickerOpen(false);
                            }}
                            className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                              b.id === activeBoardId
                                ? "bg-emerald-500/10 light:bg-emerald-500/10"
                                : "hover:bg-slate-700/50 light:hover:bg-slate-100"
                            }`}
                          >
                            <LayoutGrid
                              size={13}
                              className={`shrink-0 ${
                                b.id === activeBoardId
                                  ? "text-emerald-400 light:text-emerald-600"
                                  : "text-slate-500"
                              }`}
                            />
                            <span
                              className={`truncate text-[12px] font-medium ${
                                b.id === activeBoardId
                                  ? "text-emerald-200 light:text-emerald-700"
                                  : "text-slate-300 light:text-slate-700"
                              }`}
                            >
                              {b.name}
                            </span>
                            <span className="ml-auto flex shrink-0 items-center gap-1 font-mono text-[9px] uppercase tracking-wide text-slate-500 light:text-slate-400">
                              <ScopeIcon size={10} />
                              {meta.label}
                            </span>
                            {b.id === activeBoardId && (
                              <Check size={12} className="shrink-0 text-emerald-400 light:text-emerald-600" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {!boardsFull && (
                      <button
                        onClick={() => setCreating(true)}
                        className="flex w-full items-center gap-2 border-t border-slate-700/60 px-3 py-2.5 text-left text-[12px] font-medium text-slate-300 transition-colors hover:bg-slate-700/50 light:border-slate-200 light:text-slate-700 light:hover:bg-slate-100"
                      >
                        <Plus size={13} className="text-slate-500" />
                        Create New
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <ChevronRight size={11} className="shrink-0 text-slate-600 light:text-slate-400" />

        {/* Workspace chips — nested inside the active dashboard */}
        <nav className="flex min-w-0 items-center gap-1.5 px-1.5 py-1">
          {activeBoard.workspaces.map((w) => (
            <button
              key={w.id}
              onClick={() => onSelectWorkspace(w.id)}
              className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10.5px] transition-colors ${
                w.id === activeWorkspaceId
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300 light:text-emerald-700"
                  : "border-slate-700/80 text-slate-500 hover:border-slate-600 hover:text-slate-300 light:border-slate-300 light:hover:border-slate-400 light:hover:text-slate-700"
              }`}
            >
              {w.name}
            </button>
          ))}
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
                title="Add a workspace to this dashboard (max 7)"
                onClick={() => setAddingWorkspace(true)}
                className="flex items-center gap-1 rounded-full border border-dashed border-slate-700 px-2 py-0.5 text-[10px] text-slate-500 transition-colors hover:border-emerald-500/50 hover:text-emerald-300 light:border-slate-300 light:hover:text-emerald-600"
              >
                <Plus size={10} />
                workspace
              </button>
            ))}

          {/* Share this workspace */}
          <div className="relative">
            <button
              title="Share this workspace"
              onClick={() => setShareOpen((v) => !v)}
              className={`flex items-center rounded-full p-1 transition-colors ${
                shareOpen
                  ? "bg-cyan-500/15 text-cyan-300 light:text-cyan-700"
                  : "text-slate-500 hover:bg-slate-800/60 hover:text-slate-300 light:hover:bg-slate-200 light:hover:text-slate-700"
              }`}
            >
              <Share2 size={11} />
            </button>
            {shareOpen && (
              <>
                <div className="fixed inset-0 z-[45]" onClick={() => setShareOpen(false)} />
                <div className="anim-fade-in absolute right-0 top-full z-[46] mt-1.5 w-72 overflow-hidden rounded-xl border border-slate-700/80 bg-[#12151d]/98 py-1.5 shadow-2xl backdrop-blur light:border-slate-300 light:bg-white/98">
                  <div className="px-3 pb-1.5 pt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500 light:text-slate-400">
                    Share this workspace
                  </div>
                  {SHARE_SCOPES.map(({ id, label, desc, icon: Icon }) => {
                    const selected = workspaceShare === id;
                    return (
                      <button
                        key={id}
                        onClick={() => {
                          onShareWorkspace(id);
                          setShareOpen(false);
                        }}
                        className={`flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors ${
                          selected
                            ? "bg-emerald-500/10 light:bg-emerald-500/10"
                            : "hover:bg-slate-700/50 light:hover:bg-slate-100"
                        }`}
                      >
                        <span
                          className={`mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                            selected
                              ? "border-emerald-400 light:border-emerald-600"
                              : "border-slate-600 light:border-slate-400"
                          }`}
                        >
                          {selected && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 light:bg-emerald-600" />
                          )}
                        </span>
                        <Icon
                          size={13}
                          className={`mt-0.5 shrink-0 ${
                            selected
                              ? "text-emerald-400 light:text-emerald-600"
                              : "text-slate-500 light:text-slate-400"
                          }`}
                        />
                        <span>
                          <span
                            className={`block text-[11.5px] font-medium ${
                              selected
                                ? "text-emerald-200 light:text-emerald-700"
                                : "text-slate-300 light:text-slate-700"
                            }`}
                          >
                            {label}
                          </span>
                          <span className="block text-[10px] leading-snug text-slate-500 light:text-slate-400">
                            {desc}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </nav>
      </div>

      {/* Command input — Enter opens the superchat overlay */}
      <div className="ml-auto flex w-64 items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-2.5 py-1.5 transition-colors focus-within:border-emerald-500/50 light:border-slate-300 light:bg-white">
        <Search size={12} className="shrink-0 text-slate-600 light:text-slate-400" />
        <input
          ref={searchRef}
          type="text"
          placeholder="Ask superchat…"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const q = e.currentTarget.value.trim();
              if (q) {
                onSubmitSearch(q);
                e.currentTarget.value = "";
                e.currentTarget.blur();
              }
            }
          }}
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

/** Create-dashboard form — mirrors the production dialog: name + access scope. */
function CreateDashboardForm({
  onCreate,
  onCancel,
}: {
  onCreate: (name: string, scope: DashboardScope) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [scope, setScope] = useState<DashboardScope>("organization");

  return (
    <div className="p-3">
      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500 light:text-slate-400">
        Create dashboard
      </div>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) onCreate(name, scope);
          if (e.key === "Escape") onCancel();
        }}
        placeholder="e.g. Q2 Marketing Hub"
        className="mt-2 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[12px] text-slate-200 outline-none placeholder:text-slate-600 focus:border-emerald-500/50 light:border-slate-300 light:bg-white light:text-slate-800"
      />
      <div className="mb-1.5 mt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500 light:text-slate-400">
        Access permission
      </div>
      <div className="space-y-1.5">
        {DASHBOARD_SCOPES.map(({ id, label, desc, icon: Icon }) => {
          const selected = scope === id;
          return (
            <button
              key={id}
              onClick={() => setScope(id)}
              className={`flex w-full items-start gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-all ${
                selected
                  ? "border-emerald-500/60 bg-emerald-500/10 light:border-emerald-600/50 light:bg-emerald-500/10"
                  : "border-slate-700/80 hover:border-slate-600 light:border-slate-300 light:hover:border-slate-400"
              }`}
            >
              <span
                className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                  selected
                    ? "border-emerald-400 light:border-emerald-600"
                    : "border-slate-600 light:border-slate-400"
                }`}
              >
                {selected && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 light:bg-emerald-600" />
                )}
              </span>
              <Icon
                size={14}
                className={`mt-0.5 shrink-0 ${
                  selected ? "text-emerald-400 light:text-emerald-600" : "text-slate-500"
                }`}
              />
              <span>
                <span
                  className={`block text-[11.5px] font-medium ${
                    selected
                      ? "text-emerald-200 light:text-emerald-700"
                      : "text-slate-300 light:text-slate-700"
                  }`}
                >
                  {label}
                </span>
                <span className="block text-[10px] leading-snug text-slate-500 light:text-slate-400">
                  {desc}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex justify-end gap-2 border-t border-slate-700/60 pt-2.5 light:border-slate-200">
        <button
          onClick={onCancel}
          className="rounded-md px-2.5 py-1 text-[11px] text-slate-400 transition-colors hover:bg-slate-700/60 light:text-slate-500 light:hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          onClick={() => name.trim() && onCreate(name, scope)}
          className="rounded-md bg-emerald-500/20 px-3 py-1 text-[11px] font-medium text-emerald-300 transition-colors hover:bg-emerald-500/30 light:text-emerald-700"
        >
          + Create
        </button>
      </div>
    </div>
  );
}

/** Tiny inline name field used by the + workspace button. */
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
