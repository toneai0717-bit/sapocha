"use client";
import { useState } from "react";

interface AddContactModalProps {
  onAdd: (name: string, profile: string) => void;
  onClose: () => void;
}

export default function AddContactModal({ onAdd, onClose }: AddContactModalProps) {
  const [name, setName] = useState("");
  const [profileText, setProfileText] = useState("");

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), profileText.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg px-6 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-xl max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain">
        <h2 className="text-base font-semibold text-slate-900 mb-1">相手を追加</h2>
        <p className="text-xs text-slate-500 mb-4">会話の流れを相手ごとに記憶します。</p>
        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && handleAdd()}
            placeholder="名前（例：ひなちゃん）"
            autoFocus
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />
          <textarea
            value={profileText}
            onChange={(e) => setProfileText(e.target.value)}
            placeholder={"相手のプロフィール（任意）\n例：25歳・看護師・神戸出身・猫好き・料理上手"}
            rows={3}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleAdd}
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 text-white transition-colors"
          >
            追加
          </button>
        </div>
      </div>
    </div>
  );
}
