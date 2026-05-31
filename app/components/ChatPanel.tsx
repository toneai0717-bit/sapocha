"use client";
import { useState, useRef, useEffect } from "react";

export type ChatMessage = { role: "user" | "assistant"; content: string };

interface ChatPanelProps {
  messages: ChatMessage[];
  loading: boolean;
  onSend: (text: string) => void;
}

export default function ChatPanel({ messages, loading, onSend }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-500">💬 さらに相談する</p>
      </div>

      {messages.length > 0 && (
        <div className="px-4 py-3 space-y-3 max-h-72 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-amber-500 text-white rounded-br-md"
                    : "bg-slate-100 text-slate-700 rounded-bl-md"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-slate-400">
                考え中...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      <div className={`flex items-end gap-2 px-3 py-3 ${messages.length > 0 ? "border-t border-slate-100" : ""}`}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="「もっとカジュアルに」「この状況どうしたら？」など..."
          rows={3}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="shrink-0 w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 text-white flex items-center justify-center transition-colors"
          aria-label="送信"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
