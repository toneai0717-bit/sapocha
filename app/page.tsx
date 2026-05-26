"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type Tone = "自然" | "盛り上げる" | "積極的";
type Reply = { message: string; reason?: string };
type Result = { situation: string; replies: Reply[] };
type Profile = {
  firstPerson: string;
  likes: string;
  values: string;
  dialect: string;
  sampleReplies: string;
  freeText: string;
};

const EMPTY_PROFILE: Profile = {
  firstPerson: "",
  likes: "",
  values: "",
  dialect: "",
  sampleReplies: "",
  freeText: "",
};


const PROFILE_KEY = "sapocha_profile_v2";

function formatProfileForPrompt(p: Profile): string {
  const lines: string[] = [];
  if (p.firstPerson) lines.push(`一人称：${p.firstPerson}`);
  if (p.likes) lines.push(`好きなこと：${p.likes}`);
  if (p.values) lines.push(`価値観：${p.values}`);
  if (p.dialect) lines.push(`方言・話し方：${p.dialect}`);
  if (p.sampleReplies) lines.push(`【返信スタイルのサンプル（このトーン・文体・テンションを完全に真似すること）】\n${p.sampleReplies}`);
  if (p.freeText) lines.push(`その他：${p.freeText}`);
  return lines.join("\n");
}

function hasProfile(p: Profile): boolean {
  return Object.values(p).some((v) => v.trim() !== "");
}

export default function Home() {
  const [mode, setMode] = useState<"image" | "text">("image");
  const [tone, setTone] = useState<Tone>("自然");
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string>("image/jpeg");
  const [conversationText, setConversationText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [savedProfile, setSavedProfile] = useState<Profile>(EMPTY_PROFILE);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROFILE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Profile;
        setSavedProfile(parsed);
        setProfile(parsed);
      }
    } catch {
      // ignore corrupted storage
    }
  }, []);

  const saveProfile = () => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    setSavedProfile(profile);
    setShowProfile(false);
  };

  const updateField = (field: keyof Profile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setMediaType(file.type || "image/jpeg");
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith("image/")) handleFile(file);
    },
    [handleFile]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const item = Array.from(e.clipboardData.items).find((i) =>
        i.type.startsWith("image/")
      );
      if (item) {
        const file = item.getAsFile();
        if (file) handleFile(file);
      }
    },
    [handleFile]
  );

  const analyze = async () => {
    if (mode === "image" && !preview) return;
    if (mode === "text" && conversationText.trim().length < 5) return;
    setLoading(true);
    setError(null);
    try {
      const body = mode === "image"
        ? { image: preview!.split(",")[1], mediaType, profile: formatProfileForPrompt(savedProfile), tone }
        : { text: conversationText, profile: formatProfileForPrompt(savedProfile), tone };
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      setError("クリップボードへのコピーに失敗しました");
    }
  };

  const FIELDS: { key: keyof Profile; label: string; placeholder: string; multiline?: boolean }[] = [
    { key: "firstPerson", label: "一人称", placeholder: "俺 / 僕 / 私" },
    { key: "likes", label: "好きなこと", placeholder: "フットサル、旅行、料理など" },
    { key: "values", label: "価値観", placeholder: "誠実さを大事にする、自由を重視 など" },
    { key: "dialect", label: "方言・話し方", placeholder: "関西弁、標準語、テンポ早め など" },
    { key: "sampleReplies", label: "自分の返信サンプル", placeholder: "実際に送ったメッセージをそのまま貼ってください\n例：「それ面白そうやん！どこ行ったん？」", multiline: true },
    { key: "freeText", label: "自由記述", placeholder: "その他、AIに伝えたいことなんでも", multiline: true },
  ];

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50 text-stone-900 font-sans"
      onPaste={handlePaste}
    >
      <div className="max-w-lg mx-auto px-4 pt-8 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              サポ<span className="text-amber-500">チャ</span>
            </h1>
            <button
              onClick={() => { setProfile(savedProfile); setShowProfile(true); }}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-600 transition-colors mt-1.5 bg-white hover:bg-amber-50 border border-slate-200 px-3 py-2 rounded-xl shadow-sm"
            >
              <span>⚙</span>
              <span>自分設定</span>
              {hasProfile(savedProfile) && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />}
            </button>
          </div>
          <p className="mt-2 text-slate-700 text-sm font-medium leading-relaxed">
            マッチングアプリの返信、AIがサポート。
          </p>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            会話のスクショを選ぶだけで、あなたらしいメッセージ案を3つ提案します。
          </p>
        </div>

        {/* Profile modal */}
        {showProfile && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-base font-semibold text-slate-900 mb-1">自分について</h2>
              <p className="text-xs text-slate-500 mb-5">
                入力した内容をもとに返信のキャラを合わせます。
              </p>
              <div className="space-y-4">
                {FIELDS.map(({ key, label, placeholder, multiline }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      {label}
                    </label>
                    {multiline ? (
                      <textarea
                        value={profile[key]}
                        onChange={(e) => updateField(key, e.target.value)}
                        placeholder={placeholder}
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                      />
                    ) : (
                      <input
                        type="text"
                        value={profile[key]}
                        onChange={(e) => updateField(key, e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => setShowProfile(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={saveProfile}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-white transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mode toggle */}
        <div className="flex gap-2 mb-3 bg-white rounded-2xl p-1 border border-slate-200 shadow-sm">
          {(["image", "text"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setResult(null); setError(null); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                mode === m
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {m === "image" ? "📸 スクショ" : "✏️ テキスト"}
            </button>
          ))}
        </div>

        {/* Tone selector */}
        <div className="flex gap-2 mb-4">
          {(["自然", "盛り上げる", "積極的"] as const).map((t) => {
            const icons = { "自然": "💬", "盛り上げる": "🔥", "積極的": "💘" };
            return (
              <button
                key={t}
                onClick={() => { setTone(t); setResult(null); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                  tone === t
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                }`}
              >
                {icons[t]} {t}
              </button>
            );
          })}
        </div>

        {/* Image mode */}
        {mode === "image" && (
          <>
            <div
              className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer shadow-sm
                ${dragging
                  ? "border-amber-400 bg-amber-50"
                  : "border-slate-200 hover:border-amber-300 bg-white hover:bg-amber-50/30"
                }
                ${preview ? "p-3" : "p-10"}`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              {preview ? (
                <img src={preview} alt="preview" className="w-full rounded-xl object-contain max-h-80" />
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl mx-auto mb-3">
                    📸
                  </div>
                  <p className="text-slate-600 text-sm font-medium">タップしてスクショを選ぶ</p>
                  <p className="text-slate-400 text-xs mt-1 hidden sm:block">ドラッグ&ドロップ・Ctrl+V でも可</p>
                </div>
              )}
            </div>
            {preview && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => { setPreview(null); setResult(null); setError(null); }}
                  className="px-4 py-4 rounded-xl text-sm text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 bg-white transition-colors shadow-sm"
                >
                  クリア
                </button>
                <button
                  onClick={analyze}
                  disabled={loading}
                  className="flex-1 py-4 rounded-xl font-semibold text-sm text-white bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-sm"
                >
                  {loading ? "解析中..." : result ? "再生成" : "返信案を生成する"}
                </button>
              </div>
            )}
          </>
        )}

        {/* Text mode */}
        {mode === "text" && (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <p className="text-xs text-slate-400 mb-2">会話をそのままコピペしてください</p>
              <textarea
                value={conversationText}
                onChange={(e) => { setConversationText(e.target.value); setResult(null); }}
                placeholder={"相手: こんにちは！\n自分: はじめまして！\n相手: 趣味は何ですか？"}
                rows={8}
                className="w-full text-sm text-slate-800 placeholder-slate-300 resize-none focus:outline-none leading-relaxed"
              />
            </div>
            <div className="mt-3 flex gap-2">
              {conversationText && (
                <button
                  onClick={() => { setConversationText(""); setResult(null); setError(null); }}
                  className="px-4 py-4 rounded-xl text-sm text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 bg-white transition-colors shadow-sm"
                >
                  クリア
                </button>
              )}
              <button
                onClick={analyze}
                disabled={loading || conversationText.trim().length < 5}
                className="flex-1 py-4 rounded-xl font-semibold text-sm text-white bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-sm"
              >
                {loading ? "解析中..." : result ? "再生成" : "返信案を生成する"}
              </button>
            </div>
          </>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-5 space-y-3">
            <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500 leading-relaxed">{result.situation}</p>
            </div>
            {result.replies.map((reply, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-4 shadow-sm bg-white">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    {reply.reason ?? `案 ${i + 1}`}
                  </span>
                  <button
                    onClick={() => copy(reply.message, i)}
                    className="text-xs text-slate-400 hover:text-amber-600 transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-amber-50 active:bg-amber-100"
                  >
                    {copiedIndex === i ? "✓ コピー済み" : "コピー"}
                  </button>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{reply.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
