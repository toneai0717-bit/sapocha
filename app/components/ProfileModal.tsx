"use client";
import type { Profile } from "../types";

const FIELDS: { key: keyof Profile; label: string; placeholder: string; multiline?: boolean }[] = [
  { key: "firstPerson", label: "一人称", placeholder: "俺 / 僕 / 私" },
  { key: "likes", label: "好きなこと", placeholder: "フットサル、旅行、料理など" },
  { key: "values", label: "価値観", placeholder: "誠実さを大事にする、自由を重視 など" },
  { key: "dialect", label: "方言・話し方", placeholder: "関西弁、標準語、テンポ早め など" },
  {
    key: "sampleReplies",
    label: "自分の返信サンプル（複数可）",
    placeholder: "実際に送ったメッセージを複数貼ってください。多いほど精度が上がります。\n---\nそれ面白そうやん！どこ行ったん？\n---\nわかるわーそれ笑　俺もよくあるわ\n---\nへえ、意外やな。もっと教えて",
    multiline: true,
  },
  { key: "freeText", label: "自由記述", placeholder: "その他、AIに伝えたいことなんでも", multiline: true },
];

interface ProfileModalProps {
  profile: Profile;
  onFieldChange: (field: keyof Profile, value: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function ProfileModal({ profile, onFieldChange, onSave, onClose }: ProfileModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-base font-semibold text-slate-900 mb-1">自分について</h2>
        <p className="text-xs text-slate-500 mb-5">入力した内容をもとに返信のキャラを合わせます。</p>
        <div className="space-y-4">
          {FIELDS.map(({ key, label, placeholder, multiline }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
              {multiline ? (
                <textarea
                  value={profile[key]}
                  onChange={(e) => onFieldChange(key, e.target.value)}
                  placeholder={placeholder}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
              ) : (
                <input
                  type="text"
                  value={profile[key]}
                  onChange={(e) => onFieldChange(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={onSave}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-white transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
