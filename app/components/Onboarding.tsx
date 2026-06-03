"use client";
import { useState, useEffect } from "react";
import {
  ThumbsDown,
  MessageSquareX,
  HelpCircle,
  Sparkles,
  MessageCircle,
  Target,
  Lightbulb,
  Check,
  X,
  PawPrint,
  Smartphone,
  FlaskConical,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import type { Profile, ProfileFormData, ProfileOutput } from "../types";

const APP_OPTIONS = ["Omiai", "Pairs", "with", "タップル", "Tinder", "その他"];

type OnboardingStep = "welcome" | "form" | "result";

type FormState = ProfileFormData & { name: string; firstPerson: string; dialect: string; pets: string };

function mapToProfile(form: FormState, profileText: string): Profile {
  return {
    name: form.name,
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
    pets: form.pets,
    sampleReplies: "",
    freeText: "",
    profileText,
    app: form.app,
  };
}


interface OnboardingProps {
  storedKey: string;
  onComplete: (profile: Profile) => void;
  onSkip: () => void;
}

export default function Onboarding({ storedKey, onComplete, onSkip }: OnboardingProps) {
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [form, setForm] = useState<FormState>({
    name: "", firstPerson: "", dialect: "", age: "", job: "", area: "",
    hobbies: "", personality: "", weekends: "", strengths: "", idealPartner: "", pets: "", app: "Pairs",
  });
  const [profiles, setProfiles] = useState<ProfileOutput[]>([]);
  const [savedProfileText, setSavedProfileText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testDataLoading, setTestDataLoading] = useState(false);

  const fillTestData = async () => {
    setTestDataLoading(true);
    try {
      const res = await fetch("/api/testdata");
      const data = await res.json() as FormState;
      if (data.name) setForm(data);
    } catch {
      // サイレントに失敗
    } finally {
      setTestDataLoading(false);
    }
  };

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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50 flex flex-col items-center px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-5xl font-black tracking-tight text-slate-900 mb-2">
            サポ<span className="text-amber-500">チャ</span>
          </h1>
          <p className="text-slate-500 text-sm mb-10">会うまでは、全部サポート。その先は、君の番。</p>

          {/* Pain points */}
          <div className="mb-4 text-left">
            <p className="text-sm font-bold text-slate-500 mb-3 text-center">マッチングアプリでこんな悩み、ありませんか？</p>
            <div className="space-y-2.5">
              {([
                { Icon: ThumbsDown, text: "いいねを送っても全然マッチングしない" },
                { Icon: MessageSquareX, text: "せっかくマッチしても既読スルーされる" },
                { Icon: HelpCircle, text: "女性が喜ぶデートの仕方がわからない" },
              ] as { Icon: LucideIcon; text: string }[]).map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 border border-slate-200 shadow-sm">
                  <Icon className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
                  <span className="text-sm font-medium text-slate-600">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-amber-200" />
            <span className="text-sm font-bold text-amber-500 shrink-0">サポチャで全部解決！</span>
            <div className="flex-1 h-px bg-amber-200" />
          </div>

          {/* Features */}
          <div className="space-y-2.5 mb-6 text-left">
            {([
              { Icon: Sparkles, text: "マッチ率が上がるプロフィール文を作れる" },
              { Icon: MessageCircle, text: "スクショを貼るだけで返信案を3つ提案" },
              { Icon: Target, text: "あなたの話し方に合わせた自然な返信文" },
              { Icon: Lightbulb, text: "デートの話題・コースもまるごとサポート" },
            ] as { Icon: LucideIcon; text: string }[]).map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 border border-slate-200 shadow-sm">
                <Icon className="w-5 h-5 text-amber-500 shrink-0" aria-hidden="true" />
                <span className="text-sm text-slate-700 font-medium">{text}</span>
              </div>
            ))}
          </div>

          {/* vs 汎用AI */}
          <div className="mb-8 text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-sm font-bold text-slate-500 shrink-0">ChatGPTとどう違うの？</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="grid grid-cols-2 text-xs font-bold text-center border-b border-slate-100">
                <div className="py-2.5 text-slate-400 border-r border-slate-100">汎用AIチャット</div>
                <div className="py-2.5 text-amber-500">サポチャ</div>
              </div>
              {[
                ["状況をゼロから説明", "スクショを貼るだけ"],
                ["誰にでも同じ返信文", "あなたの話し方で提案"],
                ["相手のことを毎回説明", "相手の情報を記憶"],
                ["恋愛以外も対応", "マッチングアプリに特化"],
              ].map(([bad, good]) => (
                <div key={bad} className="grid grid-cols-2 text-xs border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-1.5 px-3 py-3 border-r border-slate-100 text-slate-400">
                    <X className="w-3.5 h-3.5 text-red-400 shrink-0" aria-hidden="true" />
                    {bad}
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-3 text-slate-700 font-medium">
                    <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />
                    {good}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-base font-black mb-4">
            <span className="text-amber-800">彼女が欲しいなら、</span><span className="text-amber-500">いま動こう。</span>
          </p>

          <button
            onClick={() => setStep("form")}
            className="w-full py-4 rounded-2xl font-bold text-base text-white bg-amber-500 hover:bg-amber-400 transition-colors shadow-lg mb-3"
          >
            無料ではじめる（約2分）
          </button>
          <button
            onClick={onSkip}
            className="w-full inline-flex items-center justify-center gap-1 py-3 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            プロフィール設定をスキップしてすぐ使う
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
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
        <div className="max-w-lg mx-auto px-4 pt-8 pb-[calc(4rem+env(safe-area-inset-bottom))]">
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
            {/* 名前 */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">名前・ニックネーム</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="ゆうき、けん など"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 shadow-sm"
              />
            </div>

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
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                <Target className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                趣味・好きなこと
                <span className="text-amber-500 font-normal">具体的に書くほどよくなります！</span>
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

            {/* 犬猫 */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5"><PawPrint className="w-3.5 h-3.5" aria-hidden="true" />犬・猫への好感度</label>
              <input
                type="text"
                value={form.pets}
                onChange={(e) => set("pets", e.target.value)}
                placeholder="例：犬も猫も大好き / 実家で柴犬を飼ってた / 猫派です"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 shadow-sm"
              />
            </div>

            {/* 使うアプリ */}
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

            <button
              onClick={generateAndProceed}
              disabled={!canNext}
              className="w-full inline-flex items-center justify-center gap-1.5 py-4 rounded-2xl font-bold text-sm text-white bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-lg"
            >
              プロフィール文を生成する
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              onClick={fillTestData}
              disabled={testDataLoading}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs text-slate-300 hover:text-slate-400 transition-colors disabled:opacity-50"
            >
              <FlaskConical className="w-3.5 h-3.5" aria-hidden="true" />
              {testDataLoading ? "生成中..." : "AIでテストデータを生成"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP: RESULT ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50">
      <div className="max-w-lg mx-auto px-4 pt-8 pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <div className="mb-6">
          <p className="text-xs font-semibold text-amber-500 mb-1">STEP 2 / 2</p>
          <h2 className="text-xl font-black text-slate-900">
            {loading ? "生成中..." : error ? "エラーが発生しました" : "プロフィール文ができました！"}
          </h2>
          {!loading && !error && (
            <p className="text-xs text-slate-400 mt-1">コピーしてアプリに貼り付けてください。</p>
          )}
        </div>

        {loading && <LoadingAnimation />}

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
                <ProfileCardMini
                  key={i}
                  profile={p}
                  onSave={(text) => setSavedProfileText(text)}
                  isSaved={savedProfileText === p.text}
                />
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700"><Lightbulb className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />入力した情報は「自分設定」に保存されます</p>
              <p className="text-xs text-amber-600 mt-0.5">返信サポートで、あなたらしい文体で提案されるようになります。</p>
            </div>
          </>
        )}

        {!loading && (
          <button
            onClick={() => onComplete(mapToProfile(form, savedProfileText))}
            className="w-full inline-flex items-center justify-center gap-1.5 py-4 rounded-2xl font-bold text-sm text-white bg-amber-500 hover:bg-amber-400 transition-colors shadow-lg"
          >
            {profiles.length > 0 ? "保存してメイン画面へ" : "メイン画面へ"}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

const LOADING_MESSAGES = [
  "あなたの趣味を分析しています...",
  "話し方のクセを学習しています...",
  "魅力的なフレーズを考えています...",
  "あなたらしい表現を磨いています...",
  "マッチング率を高める文章を生成中...",
  "もうすぐできあがります...",
];

function LoadingAnimation() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
        setFade(true);
      }, 300);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center py-20">
      <div className="flex justify-center mb-5 animate-bounce text-amber-500" aria-hidden="true">
        <Sparkles className="w-12 h-12" />
      </div>
      <div
        className="text-sm text-slate-400 transition-opacity duration-300"
        style={{ opacity: fade ? 1 : 0 }}
      >
        {LOADING_MESSAGES[msgIndex]}
      </div>
      <div className="flex justify-center gap-1.5 mt-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-amber-400"
            style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
    </div>
  );
}

function ProfileCardMini({
  profile,
  onSave,
  isSaved,
}: {
  profile: ProfileOutput;
  onSave?: (text: string) => void;
  isSaved?: boolean;
}) {
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
        <div className="flex items-center gap-2">
          {onSave && (
            <button
              onClick={() => onSave(profile.text)}
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                isSaved
                  ? "bg-amber-500 text-white"
                  : "text-amber-600 hover:bg-white/60 border border-amber-200"
              }`}
            >
              {isSaved && <Check className="w-3 h-3" aria-hidden="true" />}
              {isSaved ? "保存済み" : "保存する"}
            </button>
          )}
          <button
            onClick={copy}
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-amber-600 font-medium px-2.5 py-1.5 rounded-lg hover:bg-white/60 transition-colors"
          >
            {copied && <Check className="w-3 h-3" aria-hidden="true" />}
            {copied ? "コピー済み" : "コピー"}
          </button>
        </div>
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
