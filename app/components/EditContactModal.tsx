"use client";
import { useState } from "react";
import type { Contact } from "../types";

interface EditContactModalProps {
  contact: Contact;
  onSave: (contact: Contact) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function EditContactModal({ contact, onSave, onDelete, onClose }: EditContactModalProps) {
  const [editing, setEditing] = useState<Contact>({ ...contact });
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-xl">
        <h2 className="text-base font-semibold text-slate-900 mb-4">相手の設定</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">名前</label>
            <input
              type="text"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">プロフィール情報</label>
            <textarea
              value={editing.profile}
              onChange={(e) => setEditing({ ...editing, profile: e.target.value })}
              placeholder={"年齢・職業・出身・趣味・性格など\n例：25歳・看護師・神戸出身・猫好き・料理上手"}
              rows={5}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
            <p className="text-xs text-slate-400 mt-1">ここに入れた情報をAIが参考にして返信・話題を提案します。</p>
          </div>
          {editing.situationHistory.length > 0 && (
            <p className="text-xs text-slate-400">会話履歴：{editing.situationHistory.length}回分保存中</p>
          )}
        </div>
        {confirmDelete ? (
          <div className="mt-5 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-600 font-semibold mb-3">本当に削除しますか？会話履歴もすべて消えます。</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-xl text-sm text-slate-500 border border-slate-200 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => onDelete(editing.id)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-400 text-white transition-colors"
              >
                削除する
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => onSave(editing)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-white transition-colors"
              >
                保存
              </button>
            </div>
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full py-2 rounded-xl text-xs text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              この相手を削除する
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
