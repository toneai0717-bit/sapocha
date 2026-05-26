"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type Reply = { tone: string; message: string };
type Result = { situation: string; replies: Reply[] };

const TONE_CONFIG: Record<string, { bg: string; border: string; badge: string; dot: string }> = {
  自然: {
    bg: "bg-white",
    border: "border-slate-200",
    badge: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  },
  盛り上げる: {
    bg: "bg-violet-50",
    border: "border-violet-200",
    badge: "bg-violet-100 text-violet-700",
    dot: "bg-violet-500",
  },
  積極的: {
    bg: "bg-pink-50",
    border: "border-pink-200",
    badge: "bg-pink-100 text-pink-700",
    dot: "bg-pink-500",
  },
};

const PROFILE_KEY = "sapocha_profile";

export default function Home() {
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string>("image/jpeg");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState("");
  const [savedProfile, setSavedProfile] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(PROFILE_KEY) ?? "";
    setSavedProfile(stored);
    setProfile(stored);
  }, []);

  const saveProfile = () => {
    localStorage.setItem(PROFILE_KEY, profile);
    setSavedProfile(profile);
    setShowProfile(false);
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
    if (!preview) return;
    setLoading(true);
    setError(null);
    try {
      const base64 = preview.split(",")[1];
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mediaType, profile: savedProfile }),
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

  const copy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 text-slate-900 font-sans"
      onPaste={handlePaste}
    >
      <div className="max-w-lg mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-violet-100 text-violet-600 text-xs font-semibold px-3 py-1 rounded-full mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block" />
              Matching App Assistant
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">サポチャ</h1>
            <p className="mt-1 text-slate-500 text-sm">スクショを貼るだけ。返信案を3つ提案します。</p>
          </div>
          <button
            onClick={() => { setProfile(savedProfile); setShowProfile(true); }}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-600 transition-colors mt-1 bg-white hover:bg-violet-50 border border-slate-200 px-3 py-2 rounded-xl shadow-sm"
          >
            <span>⚙</span>
            <span>自分設定</span>
            {savedProfile && <span className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block" />}
          </button>
        </div>

        {/* Profile modal */}
        {showProfile && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-xl">
              <h2 className="text-base font-semibold text-slate-900 mb-1">自分について</h2>
              <p className="text-xs text-slate-500 mb-4">
                年齢・出身・性格・趣味・話し方のクセなど、自由に書いてください。<br />
                これを元に返信のキャラを合わせます。
              </p>
              <textarea
                value={profile}
                onChange={(e) => setProfile(e.target.value)}
                placeholder="例：32歳・大阪出身・フットサル好き・ちょっと毒舌"
                className="w-full h-36 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setShowProfile(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={saveProfile}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload area */}
        <div
          className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer shadow-sm
            ${dragging
              ? "border-violet-400 bg-violet-50"
              : "border-slate-200 hover:border-violet-300 bg-white hover:bg-violet-50/30"
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
              <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center text-2xl mx-auto mb-3">
                📸
              </div>
              <p className="text-slate-600 text-sm font-medium">クリックまたはドラッグ&ドロップ</p>
              <p className="text-slate-400 text-xs mt-1">Ctrl+V でペーストも可</p>
            </div>
          )}
        </div>

        {/* Buttons */}
        {preview && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => { setPreview(null); setResult(null); setError(null); }}
              className="px-4 py-3 rounded-xl text-sm text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 bg-white transition-colors shadow-sm"
            >
              クリア
            </button>
            <button
              onClick={analyze}
              disabled={loading}
              className="flex-1 py-3 rounded-xl font-semibold text-sm text-white
                bg-violet-600 hover:bg-violet-500 disabled:bg-slate-200
                disabled:text-slate-400 transition-colors shadow-sm"
            >
              {loading ? "解析中..." : result ? "再生成" : "返信案を生成する"}
            </button>
          </div>
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
            {result.replies.map((reply, i) => {
              const style = TONE_CONFIG[reply.tone] ?? TONE_CONFIG["自然"];
              return (
                <div key={i} className={`rounded-xl border p-4 shadow-sm ${style.bg} ${style.border}`}>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.badge}`}>
                      {reply.tone}
                    </span>
                    <button
                      onClick={() => copy(reply.message, i)}
                      className="text-xs text-slate-400 hover:text-violet-600 transition-colors font-medium"
                    >
                      {copiedIndex === i ? "✓ コピー済み" : "コピー"}
                    </button>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{reply.message}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
