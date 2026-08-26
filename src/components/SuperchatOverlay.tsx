import { Bot, SendHorizonal, Sparkles, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  text: string;
}

interface SuperchatOverlayProps {
  /** The query that opened the overlay — empty when popped from the Ask button / ⌘K. */
  initialQuery: string;
  onClose: () => void;
}

/**
 * Superchat — one conversation across every agent. Prototype shell: the
 * overlay and message flow are real; routing is mocked. In the wired-up
 * build each message fans out through FluxPrompt to the relevant chatbots,
 * agent flows and interfaces, and streams back here.
 */
export default function SuperchatOverlay({ initialQuery, onClose }: SuperchatOverlayProps) {
  const [messages, setMessages] = useState<Message[]>(() =>
    initialQuery.trim()
      ? [
          { role: "user", text: initialQuery },
          { role: "assistant", text: mockReply(initialQuery) },
        ]
      : []
  );
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Esc closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Keep the latest message in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const send = () => {
    const q = draft.trim();
    if (!q) return;
    setDraft("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    // Mock routing latency, then the shell reply.
    setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant", text: mockReply(q) }]);
    }, 450);
  };

  return (
    <div className="anim-fade-in fixed inset-0 z-[65] flex items-start justify-center p-6 pt-[12vh]" role="dialog">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] light:bg-slate-500/30" onClick={onClose} />
      <div className="window-capsule relative flex max-h-[70vh] w-[600px] max-w-full flex-col rounded-xl">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-2 border-b border-slate-800/80 px-4 py-3 light:border-slate-200">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-violet-400/30 to-cyan-400/20 text-violet-300 light:text-violet-600">
            <Sparkles size={13} />
          </span>
          <div className="min-w-0">
            <div className="text-[12.5px] font-semibold text-slate-100 light:text-slate-800">
              Superchat
            </div>
            <div className="truncate font-mono text-[9px] text-slate-500 light:text-slate-400">
              one conversation across every agent · routes to: chatbots · agent flows · interfaces
            </div>
          </div>
          <button
            onClick={onClose}
            title="Close (Esc)"
            className="ml-auto rounded p-1 text-slate-500 hover:bg-slate-700/70 hover:text-slate-200 light:hover:bg-slate-200 light:hover:text-slate-700"
          >
            <X size={13} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300 light:text-violet-600">
                <Sparkles size={15} />
              </span>
              <div className="text-[12px] text-slate-400 light:text-slate-600">
                Ask anything — it fans out across your agents.
              </div>
              <div className="font-mono text-[9.5px] text-slate-600 light:text-slate-400">
                chatbots · agent flows · live interfaces
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-violet-500/15 text-violet-300 light:text-violet-600">
                  <Bot size={11} />
                </span>
              )}
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-[12px] leading-relaxed ${
                  m.role === "user"
                    ? "bg-emerald-500/15 text-emerald-100 light:bg-emerald-500/15 light:text-emerald-900"
                    : "bg-slate-800/70 text-slate-200 light:bg-slate-100 light:text-slate-700"
                }`}
              >
                {m.text}
              </div>
              {m.role === "user" && (
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-300 light:text-emerald-600">
                  <User size={11} />
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex shrink-0 items-center gap-2 border-t border-slate-800/80 px-3 py-2.5 light:border-slate-200">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder="Ask across your agents…"
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[12px] text-slate-200 outline-none placeholder:text-slate-600 focus:border-violet-500/50 light:border-slate-300 light:bg-white light:text-slate-800 light:placeholder:text-slate-400"
          />
          <button
            onClick={send}
            title="Send"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-violet-500/20 text-violet-300 transition-colors hover:bg-violet-500/30 light:text-violet-700"
          >
            <SendHorizonal size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function mockReply(q: string): string {
  return `This is the superchat shell — in the wired-up build, "${q}" fans out through FluxPrompt routing to the right agents (chatbots, agent flows, live interfaces) and their answers stream back into this one thread. Prototype only: no backend connected yet.`;
}
