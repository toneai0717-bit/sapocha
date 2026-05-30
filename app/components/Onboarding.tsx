"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { Profile, ProfileFormData, ProfileOutput } from "../types";

// Lottie はクライアントのみ（SSR除外）
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

const LOTTIE_URL = "/sparkle.json";

function LottieHero() {
  const [data, setData] = useState<unknown>(null);
  useEffect(() => {
    fetch(LOTTIE_URL)
      .then((r) => r.json())
      .then((json) => setData(json))
      .catch(() => {}); // 取得失敗しても表示に影響なし
  }, []);
  if (!data) return <div style={{ height: 180 }} />;
  return (
    <Lottie
      animationData={data}
      loop
      autoplay
      style={{ height: 180, width: 180, margin: "0 auto" }}
    />
  );
}

const APP_OPTIONS = ["Omiai", "Pairs", "with", "タップル", "Tinder", "その他"];

type OnboardingStep = "welcome" | "form" | "result";

type FormState = ProfileFormData & { firstPerson: string; dialect: string };

function mapToProfile(form: FormState): Profile {
  return {
    firstPerson: form.firstPerson,
    dialect: form.dialect,
    age: form.age,
    job: form.job,
    area: form.area,
    likes: form.hobbies,
    values: form.personality,
    weekends: form.weekends,
    strengths: form.strengths,
    idealPartner: form.idealPartner,
    sampleReplies: "",
    freeText: "",
  };
}

const DEV_TEST_DATA: FormState = {
  firstPerson: "僕",
  dialect: "関西弁だが、仲良くなるまでは丁寧語",
  age: "32歳",
  job: "自動車関連の商社",
  area: "横浜",
  hobbies: "・フットサル（職場の人と定期的に）\n・読書（本屋大賞の作品をよく読みます）\n・U-NEXTでプレミアリーグと映画（お風呂で入浴剤入れてスマホ防水して見るのがマイブーム）",
  personality: "明るい、冗談多め",
  weekends: "フットサル、山登り、公園散歩、お風呂で映画鑑賞",
  strengths: "お風呂で映画を見る技術（入浴剤＋防水スマホで最高の環境を構築済み）",
  idealPartner: "前向きな方、笑顔が多い方、好奇心旺盛な方",
  app: "Omiai",
};

interface OnboardingProps {
  storedKey: string;
  onComplete: (profile: Profile) => void;
  onSkip: () => void;
}

export default function Onboarding({ storedKey, onComplete, onSkip }: OnboardingProps) {
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [form, setForm] = useState<FormState>({
    firstPerson: "", dialect: "", age: "", job: "", area: "",
    hobbies: "", personality: "", weekends: "", strengths: "", idealPartner: "", app: "Pairs",
  });
  const [profiles, setProfiles] = useState<ProfileOutput[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const generateAndProceed = async () => {
    setLoading(true);
    setError(null);
    setStep("result");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (storedKey) headers["Authorization"] = `Bearer ${storedKey}`;
      const res = await fetch("/api/profile", {
        method: "POST",
        headers,
        body: JSON.stringify(form),
      });
      const data = await res.json() as { profiles?: ProfileOutput[]; error?: string };
      if (data.error) throw new Error(data.error);
      setProfiles(data.profiles ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  // ── STEP: WELCOME ──────────────────────────────────────────────────
  if (step === "welcome") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <LottieHero />
          <h1 className="text-5xl font-black tracking-tight text-slate-900 mb-2">
            サポ<span className="text-amber-500">チャ</span>
          </h1>
          <p className="text-slate-500 text-sm mb-10">プロフィールから返信、デートまで全部サポート。</p>

          <div className="space-y-2.5 mb-10 text-left">
            {[
              { icon: "✨", text: "マッチングアプリのプロフィール文を作れる" },
              { icon: "💬", text: "スクショを貼るだけで返信案を3つ提案" },
              { icon: "🎯", text: "あなたの話し方に合わせた返信文" },
              { icon: "💡", text: "デートの話題・コースもサポート" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 bg-white/80 rounded-2xl px-4 py-3 shadow-sm border border-white">
                <span className="text-xl shrink-0" aria-hidden="true">{icon}</span>
                <span className="text-sm text-slate-700 font-medium">{text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep("form")}
            className="w-full py-4 rounded-2xl font-bold text-base text-white bg-amber-500 hover:bg-amber-400 transition-colors shadow-lg mb-3"
          >
            はじめる（約2分）
          </button>
          <button
            onClick={onSkip}
            className="w-full py-3 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            スキップして使ってみる →
          </button>
        </div>
      </div>
    );
  }

  // ── STEP: FORM ─────────────────────────────────────────────────────
  if (step === "form") {
    const canNext = form.hobbies.trim() || form.age.trim() || form.job.trim();
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50">
        <div className="max-w-lg mx-auto px-4 pt-8 pb-16">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs font-semibold text-amber-500 mb-1">STEP 1 / 2</p>
              <h2 className="text-xl font-black text-slate-900">あなたのことを教えてください</h2>
              <p className="text-xs text-slate-400 mt-1">返信があなたらしくなります。後からいつでも編集できます。</p>
            </div>
            <div className="flex items-center gap-2 mt-1 shrink-0">
              <button onClick={onSkip} className="text-xs text-slate-400 hover:text-slate-600">
                スキップ
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* 一人称・話し方 */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">一人称</label>
                <input
                  type="text"
                  value={form.firstPerson}
                  onChange={(e) => set("firstPerson", e.target.value)}
                  placeholder="俺 / 僕 / 私"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">話し方</label>
                <input
                  type="text"
                  value={form.dialect}
                  onChange={(e) => set("dialect", e.target.value)}
                  placeholder="関西弁、フランク、丁寧"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 shadow-sm"
                />
              </div>
            </div>

            {/* 基本情報 */}
            <div className="grid grid-cols-3 gap-2">
              {([ { key: "age", label: "年齢", placeholder: "30歳" },
                   { key: "job", label: "職業", placeholder: "商社" },
                   { key: "area", label: "エリア", placeholder: "横浜" },
              ] as const).map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
                  <input
                    type="text"
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 shadow-sm"
                  />
                </div>
              ))}
            </div>

            {/* 趣味 — 最重要 */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                🎯 趣味・好きなこと
                <span className="text-amber-500 font-normal ml-1">← 具体的に書くほどよくなります！</span>
              </label>
              <textarea
                value={form.hobbies}
                onChange={(e) => set("hobbies", e.target.value)}
                placeholder={"例：\n・スノーボード（小学生からやってます。去年は長野に3回！）\n・ジグソーパズル（今2016ピースに挑戦中）\n・甘いもの（チョコとケーキが大好き）"}
                rows={5}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm placeholder-slate-400 resize-none focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 shadow-sm"
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
                  placeholder="明るい、冗談多め"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">休日の過ごし方</label>
                <input
                  type="text"
                  value={form.weekends}
                  onChange={(e) => set("weekends", e.target.value)}
                  placeholder="山登り、カフェ巡り"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 shadow-sm"
                />
              </div>
            </div>

            {/* 理想の相手 */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">理想の相手（任意）</label>
              <input
                type="text"
                value={form.idealPartner}
                onChange={(e) => set("idealPartner", e.target.value)}
                placeholder="例：一緒に笑える人、アクティブな人"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 shadow-sm"
              />
            </div>

            {/* 使うアプリ */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">📱 使うアプリ</label>
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

            <button
              onClick={generateAndProceed}
              disabled={!canNext}
              className="w-full py-4 rounded-2xl font-bold text-sm text-white bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-lg"
            >
              プロフィール文を生成する →
            </button>

            <button
              onClick={() => setForm(DEV_TEST_DATA)}
              className="w-full py-2 text-xs text-slate-300 hover:text-slate-400 transition-colors"
            >
              🧪 テストデータを入力
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP: RESULT ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50">
      <div className="max-w-lg mx-auto px-4 pt-8 pb-16">
        <div className="mb-6">
          <p className="text-xs font-semibold text-amber-500 mb-1">STEP 2 / 2</p>
          <h2 className="text-xl font-black text-slate-900">
            {loading ? "生成中..." : error ? "エラーが発生しました" : "プロフィール文ができました！"}
          </h2>
          {!loading && !error && (
            <p className="text-xs text-slate-400 mt-1">コピーしてアプリに貼り付けてください。</p>
          )}
        </div>

        {loading && (
          <div className="text-center py-20">
            <div className="text-5xl mb-5">✨</div>
            <p className="text-sm text-slate-400">あなたらしいプロフィール文を考えています...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <button
              onClick={() => { setStep("form"); setError(null); }}
              className="text-xs text-red-500 underline"
            >
              フォームに戻る
            </button>
          </div>
        )}

        {!loading && profiles.length > 0 && (
          <>
            <div className="space-y-4 mb-5">
              {profiles.map((p, i) => (
                <ProfileCardMini key={i} profile={p} />
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5">
              <p className="text-xs font-semibold text-amber-700">💡 入力した情報は「自分設定」に保存されます</p>
              <p className="text-xs text-amber-600 mt-0.5">返信サポートで、あなたらしい文体で提案されるようになります。</p>
            </div>
          </>
        )}

        {!loading && (
          <button
            onClick={() => onComplete(mapToProfile(form))}
            className="w-full py-4 rounded-2xl font-bold text-sm text-white bg-amber-500 hover:bg-amber-400 transition-colors shadow-lg"
          >
            {profiles.length > 0 ? "保存してメイン画面へ →" : "メイン画面へ →"}
          </button>
        )}
      </div>
    </div>
  );
}

function ProfileCardMini({ profile }: { profile: ProfileOutput }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const CARD_COLORS: Record<string, string> = {
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
    <div className={`rounded-xl border p-4 shadow-sm ${CARD_COLORS[profile.type] ?? "bg-white border-slate-200"}`}>
      <div className="flex items-center justify-between mb-2.5">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${BADGE_COLORS[profile.type] ?? "bg-slate-100 text-slate-600"}`}>
          {profile.type}
        </span>
        <button
          onClick={copy}
          className="text-xs text-slate-400 hover:text-amber-600 font-medium px-3 py-1.5 rounded-lg hover:bg-white/60 transition-colors"
        >
          {copied ? "✓ コピー済み" : "コピー"}
        </button>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{profile.text}</p>
      {profile.hooks.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {profile.hooks.map((h, i) => (
            <span key={i} className="text-xs bg-white/70 text-slate-500 px-2 py-0.5 rounded-lg border border-white/80">
              {h}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
