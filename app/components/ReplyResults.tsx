"use client";
import { type ReplyResult } from "../types";

interface ReplyResultsProps {
  result: ReplyResult;
  editedReplies: string[];
  onEditReply: (index: number, value: string) => void;
  copiedIndex: number | null;
  onCopy: (text: string, index: number) => void;
  onToggleSave: (message: string, reason?: string) => void;
  isSaved: (message: string) => boolean;
}

export default function ReplyResults({
  result,
  editedReplies,
  onEditReply,
  copiedIndex,
  onCopy,
  onToggleSave,
  isSaved,
}: ReplyResultsProps) {
  return (
    <>
      <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
        <p className="text-xs text-slate-500 leading-relaxed">{result.situation}</p>
      </div>
      {result.replies.map((reply, i) => {
        const currentText = editedReplies[i] ?? reply.message;
        const saved = isSaved(currentText);
        return (
          <div key={i} className="rounded-xl border border-slate-200 p-4 shadow-sm bg-white">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                {reply.reason ?? `案 ${i + 1}`}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onToggleSave(currentText, reply.reason)}
                  className={`text-base px-2 py-1 rounded-lg transition-colors ${saved ? "text-rose-400 hover:text-rose-500" : "text-slate-300 hover:text-rose-400"}`}
                  aria-label={saved ? "お気に入りから削除" : "お気に入りに追加"}
                >
                  {saved ? "♥" : "♡"}
                </button>
                <button
                  onClick={() => onCopy(currentText, i)}
                  className="text-xs text-slate-400 hover:text-amber-600 transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-amber-50 active:bg-amber-100"
                >
                  {copiedIndex === i ? "✓ コピー済み" : "コピー"}
                </button>
              </div>
            </div>
            <textarea
              value={currentText}
              onChange={(e) => onEditReply(i, e.target.value)}
              rows={3}
              className="w-full text-sm text-slate-700 leading-relaxed resize-none focus:outline-none bg-transparent focus:bg-amber-50/30 rounded-lg px-1 -mx-1 transition-colors"
            />
          </div>
        );
      })}
    </>
  );
}
