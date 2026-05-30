"use client";
import { useState, useEffect } from "react";
import type { ProfileOutput } from "../types";

interface ProfileResultCardsProps {
  profiles: ProfileOutput[];
  onSave?: (text: string) => void;
  savedText?: string;
}

export default function ProfileResultCards({ profiles, onSave, savedText }: ProfileResultCardsProps) {
  const [editedTexts, setEditedTexts] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [savedIndex, setSavedIndex] = useState<number | null>(null);

  useEffect(() => {
    setEditedTexts(profiles.map((p) => p.text));
  }, [profiles]);

  const copy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      // ignore
    }
  };

  const TYPE_COLORS: Record<string, string> = {
    "誠実系": "bg-blue-50 border-blue-200",
    "親しみやすい系": "bg-amber-50 border-amber-200",
    "フレンドリー系": "bg-green-50 border-green-200",
  };

  const BADGE_COLORS: Record<string, string> = {
    "誠実系": "bg-blue-100 text-blue-700",
    "親しみやすい系": "bg-amber-100 text-amber-700",
    "フレンドリー系": "bg-green-100 text-green-700",
  };

  return (
    <div className="mt-5 space-y-4">
      {profiles.map((profile, i) => (
        <div
          key={i}
          className={`rounded-xl border p-4 shadow-sm ${TYPE_COLORS[profile.type] ?? "bg-white border-slate-200"}`}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${BADGE_COLORS[profile.type] ?? "bg-slate-100 text-slate-600"}`}>
              {profile.type}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                {(editedTexts[i] ?? profile.text).length}文字
              </span>
              {onSave && (
                <button
                  onClick={() => {
                    onSave(editedTexts[i] ?? profile.text);
                    setSavedIndex(i);
                    setTimeout(() => setSavedIndex(null), 2000);
                  }}
                  className="text-xs text-slate-400 hover:text-green-600 transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-green-50 active:bg-green-100"
                >
                  {savedIndex === i ? "✓ 保存済み" : "保存する"}
                </button>
              )}
              <button
                onClick={() => copy(editedTexts[i] ?? profile.text, i)}
                className="text-xs text-slate-400 hover:text-amber-600 transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-white/60 active:bg-white"
              >
                {copiedIndex === i ? "✓ コピー済み" : "コピー"}
              </button>
            </div>
          </div>

          {/* 本文（編集可能・高さ自動） */}
          <textarea
            value={editedTexts[i] ?? profile.text}
            onChange={(e) => {
              const updated = [...editedTexts];
              updated[i] = e.target.value;
              setEditedTexts(updated);
              // auto-resize
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            ref={(el) => {
              // 初期高さを内容に合わせる
              if (el) {
                el.style.height = "auto";
                el.style.height = `${el.scrollHeight}px`;
              }
            }}
            rows={1}
            className="w-full text-sm text-slate-700 leading-relaxed whitespace-pre-wrap resize-none focus:outline-none bg-transparent focus:bg-white/50 rounded-lg px-1 -mx-1 transition-colors overflow-hidden"
          />

          {/* 話しかけやすいポイント */}
          {profile.hooks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/60">
              <p className="text-xs font-semibold text-slate-500 mb-1.5">💬 話しかけやすいポイント</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.hooks.map((hook, j) => (
                  <span key={j} className="text-xs bg-white/70 text-slate-600 px-2 py-1 rounded-lg border border-white/80">
                    {hook}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
