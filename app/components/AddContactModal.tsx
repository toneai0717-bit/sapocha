"use client";
import { useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";

interface AddContactModalProps {
  onAdd: (name: string, profile: string) => void;
  onClose: () => void;
}

export default function AddContactModal({ onAdd, onClose }: AddContactModalProps) {
  const [name, setName] = useState("");
  const [profileText, setProfileText] = useState("");
  const [previews, setPreviews] = useState<string[]>([]);
  const [mediaTypes, setMediaTypes] = useState<string[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const { getHeaders } = useAuth();

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), profileText.trim());
  };

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreviews((prev) => [...prev, dataUrl]);
      setMediaTypes((prev) => [...prev, file.type || "image/jpeg"]);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    Array.from(e.dataTransfer.files)
      .filter((f) => f.type.startsWith("image/"))
      .forEach(handleFile);
  }, [handleFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach(handleFile);
  };

  const removePreview = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setMediaTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const extractProfile = async () => {
    if (previews.length === 0) return;
    setExtracting(true);
    setExtractError(null);
    try {
      const images = previews.map((p, i) => ({
        data: p.split(",")[1],
        mediaType: mediaTypes[i] ?? "image/jpeg",
      }));
      const res = await fetch("/api/extract-profile", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ images }),
      });
      const data = await res.json() as { name?: string; profile?: string; error?: string };
      if (data.error) throw new Error(data.error);
      if (data.name && !name.trim()) setName(data.name);
      if (data.profile) setProfileText(data.profile);
    } catch (e) {
      setExtractError(e instanceof Error ? e.message : "読み取りに失敗しました");
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg px-6 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-xl max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain">
        <h2 className="text-base font-semibold text-slate-900 mb-1">相手を追加</h2>
        <p className="text-xs text-slate-500 mb-4">プロフィールのスクショを貼ると自動で読み取ります。</p>

        {/* スクショアップロード */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-500 mb-2">📸 プロフィールのスクショ（複数枚OK）</p>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50 hover:border-amber-300 transition-colors"
          >
            {previews.length === 0 ? (
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleInputChange}
                />
                <p className="text-sm text-slate-400">タップして選ぶ / ドラッグ&ドロップ</p>
                <p className="text-xs text-slate-300 mt-1">プロフィール・趣味・価値観タブなど複数枚まとめてOK</p>
              </label>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {previews.map((p, i) => (
                    <div key={i} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p} alt={`スクショ${i + 1}`} className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                      <button
                        onClick={() => removePreview(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-600 text-white text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <label className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-amber-300 transition-colors">
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleInputChange} />
                    <span className="text-slate-300 text-xl">＋</span>
                  </label>
                </div>
                <button
                  onClick={extractProfile}
                  disabled={extracting}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-slate-700 hover:bg-slate-600 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
                >
                  {extracting ? "読み取り中..." : "✨ スクショから自動読み取り"}
                </button>
                {extractError && <p className="text-xs text-red-500">{extractError}</p>}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && handleAdd()}
            placeholder="名前（例：ひなちゃん）"
            autoFocus
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />
          <textarea
            value={profileText}
            onChange={(e) => setProfileText(e.target.value)}
            placeholder={"プロフィール情報（スクショから自動入力 or 手入力）"}
            rows={4}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleAdd}
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 text-white transition-colors"
          >
            追加
          </button>
        </div>
      </div>
    </div>
  );
}
