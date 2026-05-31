"use client";
import Image from "next/image";
import { useRef, useState } from "react";

const MAX_IMAGES = 5;

interface ImageDropzoneProps {
  previews: string[];
  onAddFile: (file: File) => void;
  onRemove: (index: number) => void;
  icon?: string;
  emptyLabel: string;
  emptyHint?: string;
}

export default function ImageDropzone({
  previews,
  onAddFile,
  onRemove,
  icon = "📸",
  emptyLabel,
  emptyHint,
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const isFull = previews.length >= MAX_IMAGES;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (isFull) return;
    Array.from(e.dataTransfer.files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, MAX_IMAGES - previews.length)
      .forEach(onAddFile);
  };

  return (
    <>
      {previews.length > 0 && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">{previews.length} / {MAX_IMAGES}枚</span>
          {isFull && <span className="text-xs text-amber-600 font-medium">上限に達しました</span>}
        </div>
      )}
      {previews.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-2">
          {previews.map((p, i) => (
            <div key={i} className="relative">
              <Image
                src={p}
                alt={`画像${i + 1}`}
                width={80}
                height={80}
                className="w-20 h-20 object-cover rounded-xl border border-slate-200"
                unoptimized
              />
              <button
                onClick={() => onRemove(i)}
                className="absolute -top-3 -right-3 w-11 h-11 bg-slate-700 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-500 transition-colors"
                aria-label="画像を削除"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {!isFull && (
        <div
          className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer shadow-sm
            ${dragging ? "border-amber-400 bg-amber-50" : "border-slate-200 hover:border-amber-300 bg-white hover:bg-amber-50/30"}
            ${previews.length > 0 ? "p-4" : "p-10"}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => Array.from(e.target.files ?? []).slice(0, MAX_IMAGES - previews.length).forEach(onAddFile)}
          />
          <div className="text-center">
            <div
              className={`rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-2 ${previews.length > 0 ? "w-10 h-10 text-xl" : "w-16 h-16 text-3xl"}`}
              aria-hidden="true"
            >
              {icon}
            </div>
            <p className="text-slate-600 text-sm font-medium">
              {previews.length > 0 ? "＋ 追加する" : emptyLabel}
            </p>
            {previews.length === 0 && emptyHint && (
              <p className="text-slate-400 text-xs mt-1 hidden sm:block">{emptyHint}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
