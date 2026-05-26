"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type Reply = { tone: string; message: string };
type Result = { situation: string; replies: Reply[] };

const TONE_STYLES: Record<string, { bg: string; border: string; badge: string }> = {
  自然: {
    bg: "bg-zinc-800/60",
    border: "border-zinc-700",
    badge: "bg-zinc-700 text-zinc-300",
  },
  盛り上げる: {
    bg: "bg-violet-950/40",
    border: "border-violet-800/60",
    badge: "bg-violet-800/70 text-violet-200",
  },
  積極的: {
    bg: "bg-rose-950/40",
    border: "border-rose-800/60",
    badge: "bg-rose-800/70 text-rose-200",
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans" onPaste={handlePaste}>
      <div className="max-w-xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-violet-400 uppercase mb-2">
              Matching App Assistant
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white">サポチャ</h1>
            <p className="mt-2 text-zinc-400 text-sm">スクショを貼るだけ。返信案を3つ提案します。</p>
          </div>
          <button
            onClick={() => { setProfile(savedProfile); setShowProfile(true); }}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors mt-1 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg"
          >
            <span>⚙</span>
            <span>自分設定</span>
            {savedProfile && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" />}
          </button>
        </div>

        {/* Profile modal */}
        {showProfile && (
          <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg p-6">
              <h2 className="text-base font-semibold text-white mb-1">自分について</h2>
              <p className="text-xs text-zinc-500 mb-4">
                年齢・出身・性格・趣味・話し方のクセなど、自由に書いてください。<br />
                これを元に返信のキャラを合わせます。
              </p>
              <textarea
                value={profile}
                onChange={(e) => setProfile(e.target.value)}
                placeholder="例：32歳・大阪出身・めちゃくちゃ頭良い・ちょっと毒舌・フットサル好き"
                className="w-full h-36 bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-violet-600"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setShowProfile(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-500 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={saveProfile}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload area */}
        <div
          className={`relative rounded-2xl border-2 border-dashed transition-colors cursor-pointer
            ${dragging ? "border-violet-500 bg-violet-950/30" : "border-zinc-700 hover:border-zinc-500 bg-zinc-900/50"}
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
              <div className="text-4xl mb-3">📸</div>
              <p className="text-zinc-400 text-sm">クリックまたはドラッグ&ドロップ</p>
              <p className="text-zinc-600 text-xs mt-1">Ctrl+V でペーストも可</p>
            </div>
          )}
        </div>

        {preview && (
          <button
            onClick={analyze}
            disabled={loading}
            className="mt-4 w-full py-3 rounded-xl font-semibold text-sm
              bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700
              disabled:text-zinc-500 transition-colors"
          >
            {loading ? "解析中..." : "返信案を生成する"}
          </button>
        )}

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-950/50 border border-red-800/60 text-red-400 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-3">
            <p className="text-xs text-zinc-500 leading-relaxed bg-zinc-900 rounded-xl p-3 border border-zinc-800">
              {result.situation}
            </p>
            {result.replies.map((reply, i) => {
              const style = TONE_STYLES[reply.tone] ?? TONE_STYLES["自然"];
              return (
                <div key={i} className={`rounded-xl border p-4 ${style.bg} ${style.border}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.badge}`}>
                      {reply.tone}
                    </span>
                    <button
                      onClick={() => copy(reply.message, i)}
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {copiedIndex === i ? "✓ コピー済み" : "コピー"}
                    </button>
                  </div>
                  <p className="text-sm text-zinc-200 leading-relaxed">{reply.message}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
