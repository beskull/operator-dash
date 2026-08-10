import { Bot, Send } from "lucide-react";
import { useState } from "react";
import type { ModuleDef } from "../types";

// Mock FluxPrompt chatbots — in production this module type binds to a real
// chatbot id and streams from the FluxPrompt chat API.
const BOTS = [
  {
    id: "support",
    name: "Support Bot",
    model: "claude-sonnet-4",
    tone: "#34d399",
    greeting:
      "Hi — Support Bot here. I can check order status, escalate tickets, or pull runbooks. What's going on?",
  },
  {
    id: "sales",
    name: "Sales Assistant",
    model: "gpt-5",
    tone: "#22d3ee",
    greeting:
      "Sales Assistant ready. I can draft outreach, pull pipeline stats, or prep a follow-up sequence.",
  },
  {
    id: "ops",
    name: "Ops Copilot",
    model: "claude-opus-4",
    tone: "#a78bfa",
    greeting: "Ops Copilot online. Ask me about agent runs, queue health, or last night's deploy.",
  },
] as const;

const REPLIES = [
  "On it — pulling that up now. Anything else you want alongside it?",
  "Done. Summary: 3 items need attention, rest are green. Details in the thread above.",
  "Good question — checking with the workflow and back in a sec.",
];

export default function ChatbotModule({ module }: { module: ModuleDef }) {
  const [botId, setBotId] = useState<(typeof BOTS)[number]["id"]>("support");
  const [messages, setMessages] = useState<Array<{ from: "me" | "bot"; text: string }>>([]);
  const [draft, setDraft] = useState("");
  const bot = BOTS.find((b) => b.id === botId) ?? BOTS[0];

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [
      ...m,
      { from: "me", text },
      { from: "bot", text: REPLIES[m.length % REPLIES.length] },
    ]);
    setDraft("");
  };

  return (
    <div className="flex h-full min-h-[240px] flex-col">
      {/* Bot switcher — maps to picking a FluxPrompt chatbot in production */}
      <div className="flex shrink-0 items-center gap-1.5 border-b border-slate-800/70 bg-slate-950/30 px-2 py-1.5 light:border-slate-200 light:bg-slate-100/70">
        <Bot size={12} style={{ color: bot.tone }} />
        {BOTS.map((b) => (
          <button
            key={b.id}
            onClick={() => setBotId(b.id)}
            className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
              b.id === botId
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300 light:text-emerald-700"
                : "border-slate-700/80 text-slate-500 hover:text-slate-300 light:border-slate-300 light:hover:text-slate-700"
            }`}
          >
            {b.name}
          </button>
        ))}
        <span className="ml-auto font-mono text-[9px] text-slate-600 light:text-slate-400">
          {bot.model} · via FluxPrompt
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-xl border border-slate-700/60 bg-slate-800/70 px-2.5 py-1.5 text-[11px] leading-relaxed text-slate-200 light:border-slate-200 light:bg-slate-100 light:text-slate-700">
            <span className="mb-0.5 block font-mono text-[9px]" style={{ color: bot.tone }}>
              {bot.name}
            </span>
            {bot.greeting}
          </div>
        </div>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl border px-2.5 py-1.5 text-[11px] leading-relaxed ${
                m.from === "me"
                  ? "border-violet-500/30 bg-violet-500/20 text-violet-100 light:border-violet-300 light:bg-violet-100 light:text-violet-900"
                  : "border-slate-700/60 bg-slate-800/70 text-slate-200 light:border-slate-200 light:bg-slate-100 light:text-slate-700"
              }`}
            >
              {m.from === "bot" && (
                <span className="mb-0.5 block font-mono text-[9px]" style={{ color: bot.tone }}>
                  {bot.name}
                </span>
              )}
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-slate-800 p-2 light:border-slate-200">
        <div className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-950/60 px-2.5 py-1.5 light:border-slate-300 light:bg-white">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            className="w-full bg-transparent text-[11px] text-slate-200 outline-none placeholder:text-slate-600 light:text-slate-800 light:placeholder:text-slate-400"
            placeholder={`Message ${bot.name}…`}
          />
          <button
            onClick={send}
            className="rounded p-0.5 text-slate-500 hover:text-emerald-300 light:hover:text-emerald-600"
            title="Send"
          >
            <Send size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
