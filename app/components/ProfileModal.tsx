"use client";
import { useState } from "react";
import { ClipboardList, Sparkles, Check } from "lucide-react";
import type { Profile, ProfileOutput } from "../types";

const APP_OPTIONS = ["Omiai", "Pairs", "with", "タップル", "Tinder", "その他"];

const FIELDS: { key: keyof Profile; label: string; placeholder: string; multiline?: boolean }[] = [
  { key: "name", label: "名前・ニックネーム", placeholder: "ゆうき、けん など" },
  { key: "firstPerson", label: "一人称", placeholder: "俺 / 僕 / 私" },
  { key: "dialect", label: "話し方・口調", placeholder: "関西弁、フランク、丁寧 など" },
  { key: "age", label: "年齢", placeholder: "32歳" },
  { key: "job", label: "職業", placeholder: "商社、エンジニア など" },
  { key: "area", label: "住んでるエリア", placeholder: "横浜、大阪 など" },
  { key: "likes", label: "趣味・好きなこと", placeholder: "フットサル、旅行、料理など\n具体的なエピソードがあると返信精度が上がります", multiline: true },
  { key: "values", label: "性格", placeholder: "明るい、冗談多め、のんびり など" },
  { key: "weekends", label: "休日の過ごし方", placeholder: "山登り、カフェ巡り、家でまったり など" },
  { key: "strengths", label: "自慢・エピソード", placeholder: "料理が得意、旅行10カ国 など" },
  { key: "idealPartner", label: "理想の相手", placeholder: "一緒に笑える人、好奇心旺盛な人 など" },
  { key: "pets", label: "犬・猫への好感度", placeholder: "例：犬も猫も大好き / 実家で柴犬を飼ってた / 猫派です" },
  {
    key: "sampleReplies",
    label: "自分の返信サンプル（複数可）",
    placeholder: "実際に送ったメッセージを複数貼ってください。多いほど精度が上がります。\n---\nそれ面白そうやん！どこ行ったん？\n---\nわかるわーそれ笑　俺もよくあるわ",
    multiline: true,
  },
  { key: "freeText", label: "その他・自由記述", placeholder: "AIに伝えたいことがあれば何でも", multiline: true },
];

interface ProfileModalProps {
  profile: Profile;
  onFieldChange: (field: keyof Profile, value: string) => void;
  onSave: () => void;
  onClose: () => void;
  storedKey: string;
}

export default function ProfileModal({ profile, onFieldChange, onSave, onClose, storedKey }: ProfileModalProps) {
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedProfiles, setGeneratedProfiles] = useState<ProfileOutput[]>([]);
  const [genError, setGenError] = useState<string | null>(null);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);

  const generate = async () => {
    setGenerating(true);
    setGenError(null);
    setGeneratedProfiles([]);
    setPickedIndex(null);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (storedKey) headers["Authorization"] = `Bearer ${storedKey}`;
      const res = await fetch("/api/profile", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: profile.name,
          firstPerson: profile.firstPerson,
          dialect: profile.dialect,
          age: profile.age,
          job: profile.job,
          area: profile.area,
          hobbies: profile.likes,
          personality: profile.values,
          weekends: profile.weekends,
          strengths: profile.strengths,
          idealPartner: profile.idealPartner,
          app: profile.app,
        }),
      });
      const data = await res.json() as { profiles?: ProfileOutput[]; error?: string };
      if (data.error) throw new Error(data.error);
      setGeneratedProfiles(data.profiles ?? []);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setGenerating(false);
    }
  };

  const useThisProfile = (text: string, index: number) => {
    onFieldChange("profileText", text);
    setPickedIndex(index);
  };

  const copyProfileText = async () => {
    if (!profile.profileText) return;
    try {
      await navigator.clipboard.writeText(profile.profileText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const BADGE_COLORS: Record<string, string> = {
    "誠実系": "bg-blue-100 text-blue-700",
    "親しみやすい系": "bg-amber-100 text-amber-700",
    "フレンドリー系": "bg-green-100 text-green-700",
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain">
        <h2 className="text-base font-semibold text-slate-900 mb-1">プロフィール設定</h2>
        <p className="text-xs text-slate-500 mb-4">入力した内容をもとに返信のキャラを合わせます。</p>

        {/* プロフィール文セクション */}
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700"><ClipboardList className="w-3.5 h-3.5" aria-hidden="true" />プロフィール文</p>
            <button
              onClick={generate}
              disabled={generating}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 px-3 py-1.5 rounded-lg transition-colors"
            >
              {!generating && <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />}
              {generating ? "生成中..." : generatedProfiles.length > 0 ? "再生成" : "生成する"}
            </button>
          </div>

          {genError && <p className="text-xs text-red-500 mb-2">{genError}</p>}

          {/* 生成結果（3パターン） */}
          {generatedProfiles.length > 0 && (
            <div className="space-y-2 mb-3">
              {generatedProfiles.map((p, i) => (
                <div key={i} className="bg-white rounded-xl p-3 border border-amber-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${BADGE_COLORS[p.type] ?? "bg-slate-100 text-slate-600"}`}>
                      {p.type}
                    </span>
                    <button
                      onClick={() => useThisProfile(p.text, i)}
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                        pickedIndex === i
                          ? "bg-amber-500 text-white"
                          : "text-amber-600 hover:bg-amber-50 border border-amber-200"
                      }`}
                    >
                      {pickedIndex === i && <Check className="w-3 h-3" aria-hidden="true" />}
                      {pickedIndex === i ? "使用中" : "これを使う"}
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{p.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* 保存済みプロフィール文 */}
          {profile.profileText ? (
            <>
              <div className="flex items-center justify-between mb-1.5">
                {generatedProfiles.length > 0 && (
                  <p className="text-xs font-semibold text-slate-500">保存中のプロフィール文</p>
                )}
                <button
                  onClick={copyProfileText}
                  className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium px-2.5 py-1 rounded-lg hover:bg-amber-100 transition-colors ml-auto"
                >
                  {copied && <Check className="w-3 h-3" aria-hidden="true" />}
                  {copied ? "コピー済み" : "コピー"}
                </button>
              </div>
              <textarea
                value={profile.profileText}
                onChange={(e) => onFieldChange("profileText", e.target.value)}
                rows={6}
                className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 leading-relaxed resize-none focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </>
          ) : (
            generatedProfiles.length === 0 && !generating && (
              <p className="inline-flex items-center gap-1 text-xs text-slate-400">「<Sparkles className="w-3 h-3" aria-hidden="true" />生成する」でプロフィール文を作れます。</p>
            )
          )}
        </div>

        {/* 使うアプリ */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">使うアプリ</label>
          <div className="flex gap-2 flex-wrap">
            {APP_OPTIONS.map((a) => (
              <button
                key={a}
                onClick={() => onFieldChange("app", a)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                  profile.app === a
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-slate-50 text-slate-500 border-slate-200 hover:border-amber-300"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* その他フィールド */}
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
