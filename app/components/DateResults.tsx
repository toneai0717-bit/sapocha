"use client";
import { Lightbulb, TriangleAlert, Heart } from "lucide-react";
import { type DateResult, type DateCourse } from "../types";

interface DateResultsProps {
  result: DateResult;
  onToggleSave: (course: DateCourse) => void;
  isSaved: (theme: string) => boolean;
}

export default function DateResults({ result, onToggleSave, isSaved }: DateResultsProps) {
  return (
    <>
      <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
        <p className="text-xs text-slate-500 leading-relaxed">{result.situation}</p>
      </div>

      {result.topics && result.topics.length > 0 && (
        <>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 h-px bg-amber-200" />
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-500 shrink-0"><Lightbulb className="w-3.5 h-3.5" aria-hidden="true" />当日の話題</span>
            <div className="flex-1 h-px bg-amber-200" />
          </div>
          {result.topics.map((topic, i) => (
            <div key={i} className="rounded-xl border border-amber-200 p-4 shadow-sm bg-amber-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-700">{topic.title}</span>
                <span className="text-xs text-amber-500 bg-amber-100 px-2 py-0.5 rounded-full">{topic.why}</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{topic.starter}</p>
            </div>
          ))}
        </>
      )}

      <p className="flex items-start gap-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
        <TriangleAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
        <span>店名はAIが提案したものです。実際に行く前にGoogle マップで存在を確認してください。</span>
      </p>

      {result.courses.map((course, i) => {
        const saved = isSaved(course.theme);
        return (
          <div key={i} className="rounded-xl border border-slate-200 p-4 shadow-sm bg-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-800">{course.theme}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">{course.point}</span>
                <button
                  onClick={() => onToggleSave(course)}
                  className={`px-1.5 py-0.5 rounded-lg transition-colors ${saved ? "text-rose-400 hover:text-rose-500" : "text-slate-300 hover:text-rose-400"}`}
                  aria-label={saved ? "お気に入りから削除" : "お気に入りに追加"}
                >
                  <Heart className={`w-4 h-4 ${saved ? "fill-current" : ""}`} aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {course.spots.map((spot, j) => (
                <div key={j} className="flex gap-3">
                  <span className="text-xs font-bold text-amber-500 mt-0.5 shrink-0">{j + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-700">{spot.name}</p>
                      {spot.cost && <span className="text-xs text-slate-400">{spot.cost}</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{spot.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {course.totalCost && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs text-slate-500">合計目安</span>
                <span className="text-xs font-bold text-amber-600">{course.totalCost}</span>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
