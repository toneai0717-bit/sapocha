"use client";
import type { Contact } from "../types";

interface ContactSelectorProps {
  contacts: Contact[];
  selectedContactId: string | null;
  onSelect: (id: string) => void;
  onEdit: (contact: Contact) => void;
  onAdd: () => void;
}

export default function ContactSelector({
  contacts,
  selectedContactId,
  onSelect,
  onEdit,
  onAdd,
}: ContactSelectorProps) {
  const selectedContact = contacts.find((c) => c.id === selectedContactId) ?? null;

  return (
    <div className="mb-4">
      {contacts.length === 0 && (
        <p className="text-xs text-slate-400 mb-2 leading-relaxed">
          💡 気になる人を登録すると、会話の流れを記憶して毎回より自然な返信を提案できます
        </p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {contacts.map((c) => (
          <div key={c.id} className="relative group flex items-center">
            <button
              onClick={() => onSelect(c.id)}
              className={`pl-3 pr-9 py-2.5 rounded-full text-xs font-semibold border transition-colors ${
                selectedContactId === c.id
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
              }`}
            >
              {c.name}
              {c.situationHistory.length > 0 && (
                <span className={`ml-1 text-xs ${selectedContactId === c.id ? "text-amber-300" : "text-amber-400"}`}>
                  ●
                </span>
              )}
              {c.profile && (
                <span className={`ml-1 text-xs ${selectedContactId === c.id ? "text-blue-300" : "text-blue-400"}`}>
                  i
                </span>
              )}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(c); }}
              className={`absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-xs transition-colors ${
                selectedContactId === c.id ? "text-slate-400 hover:text-white" : "text-slate-300 hover:text-slate-500"
              }`}
              aria-label={`${c.name}を編集`}
            >
              ✎
            </button>
          </div>
        ))}
        <button
          onClick={onAdd}
          className="px-3 py-2.5 rounded-full text-xs font-semibold border border-dashed border-slate-300 text-slate-400 hover:border-amber-400 hover:text-amber-500 transition-colors bg-white"
        >
          ＋ 相手を追加
        </button>
      </div>
      {selectedContact && (
        <p className="text-xs text-slate-400 mt-1.5">
          {selectedContact.name}との会話を記憶中
          {selectedContact.situationHistory.length > 0 && (
            <span className="ml-1 text-amber-500">（{selectedContact.situationHistory.length}回分）</span>
          )}
        </p>
      )}
    </div>
  );
}
