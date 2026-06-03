"use client";
import { useState } from "react";
import { Smartphone, Target } from "lucide-react";
import type { ProfileFormData } from "../types";

const APP_OPTIONS = ["Omiai", "Pairs", "with", "タップル", "Tinder", "その他"];

interface ProfileFormProps {
  onSubmit: (data: ProfileFormData) => void;
  loading: boolean;
  hasResult: boolean;
}

export default function ProfileForm({ onSubmit, loading, hasResult }: ProfileFormProps) {
  const [form, setForm] = useState<ProfileFormData>({
    age: "",
    job: "",
    area: "",
    hobbies: "",
    personality: "",
    weekends: "",
    strengths: "",
    idealPartner: "",
    app: "Pairs",
  });

  const set = (key: keyof ProfileFormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const canSubmit = form.age.trim() || form.job.trim() || form.hobbies.trim();

  return (
    <div className="space-y-4 mb-4">
      {/* アプリ選択 */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5"><Smartphone className="w-3.5 h-3.5" aria-hidden="true" />使うアプリ</label>
        <div className="flex gap-2 flex-wrap">
          {APP_OPTIONS.map((a) => (
            <button
              key={a}
              onClick={() => set("app", a)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                form.app === a
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-white text-slate-500 border-slate-200 hover:border-amber-300"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* 基本情報 */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">年齢</label>
          <input
            type="text"
            value={form.age}
            onChange={(e) => set("age", e.target.value)}
            placeholder="例：30歳"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">職業</label>
          <input
            type="text"
            value={form.job}
            onChange={(e) => set("job", e.target.value)}
            placeholder="例：商社"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">エリア</label>
          <input
            type="text"
            value={form.area}
            onChange={(e) => set("area", e.target.value)}
            placeholder="例：横浜"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 shadow-sm"
          />
        </div>
      </div>

      {/* 趣味・好きなこと */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
          <Target className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
          趣味・好きなこと
          <span className="text-amber-500">ここが一番大事！具体的に書くほど良くなります</span>
        </label>
        <textarea
          value={form.hobbies}
          onChange={(e) => set("hobbies", e.target.value)}
          placeholder={"例：\n・スノーボード（小学生からやってます。去年は長野に3回行きました）\n・ジグソーパズル（今2016ピースに挑戦中）\n・甘いもの（チョコとケーキが大好き）"}
          rows={5}
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 shadow-sm"
        />
      </div>

      {/* 性格・休日 */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">性格</label>
          <input
            type="text"
            value={form.personality}
            onChange={(e) => set("personality", e.target.value)}
            placeholder="例：明るい、冗談多め"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">休日の過ごし方</label>
          <input
            type="text"
            value={form.weekends}
            onChange={(e) => set("weekends", e.target.value)}
            placeholder="例：山登り、カフェ巡り"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 shadow-sm"
          />
        </div>
      </div>

      {/* 自慢・理想 */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">自慢・エピソード</label>
          <input
            type="text"
            value={form.strengths}
            onChange={(e) => set("strengths", e.target.value)}
            placeholder="例：料理が得意、旅行は10カ国"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">理想の相手</label>
          <input
            type="text"
            value={form.idealPartner}
            onChange={(e) => set("idealPartner", e.target.value)}
            placeholder="例：一緒に笑える人"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 shadow-sm"
          />
        </div>
      </div>

      <button
        onClick={() => onSubmit(form)}
        disabled={loading || !canSubmit}
        className="w-full py-4 rounded-xl font-semibold text-sm text-white bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-sm"
      >
        {loading ? "生成中..." : hasResult ? "再生成" : "プロフィール文を生成する"}
      </button>
    </div>
  );
}
