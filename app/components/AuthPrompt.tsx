"use client";

interface AuthPromptProps {
  accessKeyInput: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export default function AuthPrompt({ accessKeyInput, onChange, onSubmit }: AuthPromptProps) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-xl">
        <h2 className="text-base font-semibold text-slate-900 mb-1">アクセスキーを入力</h2>
        <p className="text-xs text-slate-500 mb-4">このアプリの利用には認証が必要です。</p>
        <input
          type="password"
          value={accessKeyInput}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          placeholder="アクセスキー"
          autoFocus
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 mb-4"
        />
        <button
          onClick={onSubmit}
          disabled={!accessKeyInput.trim()}
          className="w-full py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 text-white transition-colors"
        >
          認証する
        </button>
      </div>
    </div>
  );
}
