"use client";
import { useState } from "react";
import { Check, Heart, X } from "lucide-react";
import { type Favorite, type FavoriteReply, type FavoriteDateCourse } from "../types";

interface FavoritesModalProps {
  favorites: Favorite[];
  onRemove: (id: string) => void;
  onClose: () => void;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function ReplyCard({ fav, onRemove }: { fav: FavoriteReply; onRemove: () => void }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fav.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="rounded-xl border border-slate-200 p-3.5 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">返信案</span>
          {fav.contactName && <span className="text-xs text-slate-400">{fav.contactName}</span>}
        </div>
        <span className="text-xs text-slate-300">{formatDate(fav.savedAt)}</span>
      </div>
      {fav.situation && (
        <p className="text-xs text-slate-400 mb-2 leading-relaxed">{fav.situation}</p>
      )}
      {fav.reason && (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 mb-1.5 inline-block">
          {fav.reason}
        </span>
      )}
      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mb-3">{fav.message}</p>
      <div className="flex gap-2">
        <button
          onClick={copy}
          className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-amber-600 border border-slate-200 hover:border-amber-300 transition-colors"
        >
          {copied && <Check className="w-3 h-3" aria-hidden="true" />}
          {copied ? "コピー済み" : "コピー"}
        </button>
        <button
          onClick={onRemove}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-200 transition-colors"
        >
          削除
        </button>
      </div>
    </div>
  );
}

function DateCourseCard({ fav, onRemove }: { fav: FavoriteDateCourse; onRemove: () => void }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3.5 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">デートコース</span>
          {fav.contactName && <span className="text-xs text-slate-400">{fav.contactName}</span>}
        </div>
        <span className="text-xs text-slate-300">{formatDate(fav.savedAt)}</span>
      </div>
      {fav.situation && (
        <p className="text-xs text-slate-400 mb-2 leading-relaxed">{fav.situation}</p>
      )}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-slate-800">{fav.course.theme}</span>
        <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">{fav.course.point}</span>
      </div>
      <div className="space-y-1 mb-3">
        {fav.course.spots.map((spot, i) => (
          <div key={i} className="flex gap-2 text-xs text-slate-500">
            <span className="font-bold text-amber-500 shrink-0">{i + 1}</span>
            <span>{spot.name}</span>
          </div>
        ))}
      </div>
      {fav.course.totalCost && (
        <p className="text-xs text-slate-400 mb-3">合計目安：<span className="font-semibold text-amber-600">{fav.course.totalCost}</span></p>
      )}
      <div className="flex justify-end">
        <button
          onClick={onRemove}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-200 transition-colors"
        >
          削除
        </button>
      </div>
    </div>
  );
}

export default function FavoritesModal({ favorites, onRemove, onClose }: FavoritesModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl max-h-[calc(100dvh-2rem)] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">お気に入り</h2>
            {favorites.length > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{favorites.length}</span>
            )}
          </div>
          <button onClick={onClose} aria-label="閉じる" className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100"><X className="w-5 h-5" aria-hidden="true" /></button>
        </div>

        <div className="overflow-y-auto overscroll-contain p-4 space-y-3 flex-1">
          {favorites.length === 0 ? (
            <div className="py-12 text-center">
              <Heart className="w-9 h-9 text-slate-200 mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm text-slate-400">まだ保存したものがありません</p>
              <p className="inline-flex items-center gap-1 text-xs text-slate-300 mt-1">返信案やデートコースの<Heart className="w-3 h-3" aria-hidden="true" />をタップして保存できます</p>
            </div>
          ) : (
            favorites.map((fav) =>
              fav.type === "reply" ? (
                <ReplyCard key={fav.id} fav={fav} onRemove={() => onRemove(fav.id)} />
              ) : (
                <DateCourseCard key={fav.id} fav={fav} onRemove={() => onRemove(fav.id)} />
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}
