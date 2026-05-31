import Image from "next/image";
import { type PhotoResult } from "../types";

interface PhotoResultsProps {
  result: PhotoResult;
  previews: string[];
}

export default function PhotoResults({ result, previews }: PhotoResultsProps) {
  return (
    <div className="mt-5 space-y-3">
      <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
        <p className="text-xs text-slate-500 leading-relaxed">{result.overall}</p>
      </div>
      {result.photos.map((photo, i) => {
        const verdictStyle =
          photo.verdict === "1枚目向き" ? "bg-green-100 text-green-700 border-green-200" :
          photo.verdict === "サブ向き" ? "bg-amber-100 text-amber-700 border-amber-200" :
          "bg-red-100 text-red-700 border-red-200";
        const scoreColor =
          photo.score >= 80 ? "text-green-600" :
          photo.score >= 60 ? "text-amber-600" : "text-red-500";
        return (
          <div key={i} className="rounded-xl border border-slate-200 p-4 shadow-sm bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {previews[i] && (
                  <Image src={previews[i]} alt={`写真${i + 1}`} width={40} height={40} className="w-10 h-10 object-cover rounded-lg border border-slate-200" unoptimized />
                )}
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${verdictStyle}`}>
                  {photo.verdict}
                </span>
              </div>
              <span className={`text-xl font-black ${scoreColor}`}>
                {photo.score}<span className="text-xs font-normal text-slate-400">点</span>
              </span>
            </div>
            {photo.goods.length > 0 && (
              <div className="mb-2">
                {photo.goods.map((g, j) => (
                  <p key={j} className="text-xs text-slate-600 flex items-start gap-1.5 mb-0.5">
                    <span className="text-green-500 shrink-0">◎</span>{g}
                  </p>
                ))}
              </div>
            )}
            {photo.bads.length > 0 && (
              <div className="mb-2">
                {photo.bads.map((b, j) => (
                  <p key={j} className="text-xs text-slate-500 flex items-start gap-1.5 mb-0.5">
                    <span className="text-red-400 shrink-0">✕</span>{b}
                  </p>
                ))}
              </div>
            )}
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-2">
              💡 {photo.advice}
            </p>
          </div>
        );
      })}
    </div>
  );
}
