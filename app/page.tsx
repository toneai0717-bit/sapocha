"use client";

import { useState, useCallback, useRef } from "react";

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

export default function Home() {
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string>("image/jpeg");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
        body: JSON.stringify({ image: base64, mediaType }),
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
      className="min-h-screen bg-zinc-950 text-zinc-100 font-sans"
      onPaste={handlePaste}
    >
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-[0.2em] text-violet-400 uppercase mb-2">
            Matching App Assistant
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            サポチャ
          </h1>
          <p className="mt-2 text-zinc-400 text-sm">
            スクショを貼るだけ。返信案を3つ提案します。
          </p>
        </div>

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
            <img
              src={preview}
              alt="preview"
              className="w-full rounded-xl object-contain max-h-80"
            />
          ) : (
            <div className="text-center">
              <div className="text-4xl mb-3">📸</div>
              <p className="text-zinc-400 text-sm">
                クリックまたはドラッグ&ドロップ
              </p>
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
                <div
                  key={i}
                  className={`rounded-xl border p-4 ${style.bg} ${style.border}`}
                >
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
                  <p className="text-sm text-zinc-200 leading-relaxed">
                    {reply.message}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
