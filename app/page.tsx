"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type InputMode = "image" | "text";
type FeatureMode = "reply" | "topics" | "date";
type Tone = "自然" | "盛り上げる" | "積極的";
type Reply = { message: string; reason?: string };
type Topic = { title: string; starter: string; why: string };
type DateSpot = { name: string; description: string; cost?: string };
type DateCourse = { theme: string; spots: DateSpot[]; point: string; totalCost?: string };
type ReplyResult = { situation: string; replies: Reply[] };
type TopicsResult = { situation: string; topics: Topic[] };
type DateResult = { situation: string; courses: DateCourse[] };
type Result = ReplyResult | TopicsResult | DateResult;

function isTopicsResult(r: Result): r is TopicsResult { return "topics" in r; }
function isDateResult(r: Result): r is DateResult { return "courses" in r; }

const FEATURE_MODES: { key: FeatureMode; label: string; icon: string }[] = [
  { key: "reply",  label: "返信サポート", icon: "💬" },
  { key: "topics", label: "話す内容",     icon: "💡" },
  { key: "date",   label: "デートコース", icon: "🗓" },
];
type Profile = {
  firstPerson: string;
  likes: string;
  values: string;
  dialect: string;
  sampleReplies: string;
  freeText: string;
};
type Contact = {
  id: string;
  name: string;
  situationHistory: string[];
  createdAt: number;
};

const EMPTY_PROFILE: Profile = {
  firstPerson: "",
  likes: "",
  values: "",
  dialect: "",
  sampleReplies: "",
  freeText: "",
};

const PROFILE_KEY = "sapocha_profile_v2";
const CONTACTS_KEY = "sapocha_contacts_v1";
const SELECTED_CONTACT_KEY = "sapocha_selected_contact_v1";

function formatProfileForPrompt(p: Profile): string {
  const lines: string[] = [];
  if (p.firstPerson) lines.push(`一人称：${p.firstPerson}`);
  if (p.likes) lines.push(`好きなこと：${p.likes}`);
  if (p.values) lines.push(`価値観：${p.values}`);
  if (p.dialect) lines.push(`方言・話し方：${p.dialect}`);
  if (p.sampleReplies) lines.push(`【返信スタイルのサンプル（このトーン・文体・テンションを完全に真似すること）】\n${p.sampleReplies}`);
  if (p.freeText) lines.push(`その他：${p.freeText}`);
  return lines.join("\n");
}

function hasProfile(p: Profile): boolean {
  return Object.values(p).some((v) => v.trim() !== "");
}

export default function Home() {
  const [mode, setMode] = useState<InputMode>("image");
  const [featureMode, setFeatureMode] = useState<FeatureMode>("reply");
  const [area, setArea] = useState<string>("");
  const [dateTime, setDateTime] = useState<string>("夕方");
  const [dateDuration, setDateDuration] = useState<string>("半日");
  const [dateInterests, setDateInterests] = useState<string>("");
  const [dateBudget, setDateBudget] = useState<string>("〜5,000円");
  const [tone, setTone] = useState<Tone>("自然");
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string>("image/jpeg");
  const [conversationText, setConversationText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [savedProfile, setSavedProfile] = useState<Profile>(EMPTY_PROFILE);

  // Contact state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROFILE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Profile;
        setSavedProfile(parsed);
        setProfile(parsed);
      }
      const storedContacts = localStorage.getItem(CONTACTS_KEY);
      if (storedContacts) setContacts(JSON.parse(storedContacts) as Contact[]);
      const storedSelected = localStorage.getItem(SELECTED_CONTACT_KEY);
      if (storedSelected) setSelectedContactId(storedSelected);
    } catch {
      // ignore corrupted storage
    }
  }, []);

  const saveProfile = () => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    setSavedProfile(profile);
    setShowProfile(false);
  };

  const updateField = (field: keyof Profile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const saveContacts = useCallback((updated: Contact[]) => {
    setContacts(updated);
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(updated));
  }, []);

  const addContact = () => {
    if (!newContactName.trim()) return;
    const newContact: Contact = {
      id: Date.now().toString(),
      name: newContactName.trim(),
      situationHistory: [],
      createdAt: Date.now(),
    };
    const updated = [...contacts, newContact];
    saveContacts(updated);
    setSelectedContactId(newContact.id);
    localStorage.setItem(SELECTED_CONTACT_KEY, newContact.id);
    setNewContactName("");
    setShowAddContact(false);
  };

  const selectContact = (id: string) => {
    if (selectedContactId === id) {
      setSelectedContactId(null);
      localStorage.removeItem(SELECTED_CONTACT_KEY);
    } else {
      setSelectedContactId(id);
      localStorage.setItem(SELECTED_CONTACT_KEY, id);
    }
  };

  const deleteContact = (id: string) => {
    const updated = contacts.filter((c) => c.id !== id);
    saveContacts(updated);
    if (selectedContactId === id) {
      setSelectedContactId(null);
      localStorage.removeItem(SELECTED_CONTACT_KEY);
    }
  };

  const appendSituation = useCallback((situation: string, currentContacts: Contact[]) => {
    if (!selectedContactId) return;
    const updated = currentContacts.map((c) =>
      c.id === selectedContactId
        ? { ...c, situationHistory: [...c.situationHistory.slice(-9), situation] }
        : c
    );
    saveContacts(updated);
  }, [selectedContactId, saveContacts]);

  const getHistoryContext = useCallback((): string => {
    const contact = contacts.find((c) => c.id === selectedContactId);
    if (!contact || contact.situationHistory.length === 0) return "";
    return contact.situationHistory.map((s, i) => `${i + 1}. ${s}`).join("\n");
  }, [contacts, selectedContactId]);

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
    if (featureMode !== "date") {
      if (mode === "image" && !preview) return;
      if (mode === "text" && conversationText.trim().length < 5) return;
    }
    setLoading(true);
    setError(null);
    try {
      const historyContext = getHistoryContext();
      const body = featureMode === "date"
        ? { profile: formatProfileForPrompt(savedProfile), mode: featureMode, area, dateTime, dateDuration, dateInterests, dateBudget }
        : mode === "image"
          ? { image: preview!.split(",")[1], mediaType, profile: formatProfileForPrompt(savedProfile), tone, history: historyContext, mode: featureMode, area }
          : { text: conversationText, profile: formatProfileForPrompt(savedProfile), tone, history: historyContext, mode: featureMode, area };
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      // 会話の流れを自動で相手の記憶に蓄積
      if (data.situation && selectedContactId) {
        setContacts((prev) => {
          const updated = prev.map((c) =>
            c.id === selectedContactId
              ? { ...c, situationHistory: [...c.situationHistory.slice(-9), data.situation as string] }
              : c
          );
          localStorage.setItem(CONTACTS_KEY, JSON.stringify(updated));
          return updated;
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      setError("クリップボードへのコピーに失敗しました");
    }
  };

  const selectedContact = contacts.find((c) => c.id === selectedContactId) ?? null;

  const FIELDS: { key: keyof Profile; label: string; placeholder: string; multiline?: boolean }[] = [
    { key: "firstPerson", label: "一人称", placeholder: "俺 / 僕 / 私" },
    { key: "likes", label: "好きなこと", placeholder: "フットサル、旅行、料理など" },
    { key: "values", label: "価値観", placeholder: "誠実さを大事にする、自由を重視 など" },
    { key: "dialect", label: "方言・話し方", placeholder: "関西弁、標準語、テンポ早め など" },
    { key: "sampleReplies", label: "自分の返信サンプル", placeholder: "実際に送ったメッセージをそのまま貼ってください\n例：「それ面白そうやん！どこ行ったん？」", multiline: true },
    { key: "freeText", label: "自由記述", placeholder: "その他、AIに伝えたいことなんでも", multiline: true },
  ];

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50 text-stone-900 font-sans"
      onPaste={handlePaste}
    >
      <div className="max-w-lg mx-auto px-4 pt-8 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              サポ<span className="text-amber-500">チャ</span>
            </h1>
            <button
              onClick={() => { setProfile(savedProfile); setShowProfile(true); }}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-600 transition-colors mt-1.5 bg-white hover:bg-amber-50 border border-slate-200 px-3 py-2 rounded-xl shadow-sm"
            >
              <span>⚙</span>
              <span>自分設定</span>
              {hasProfile(savedProfile) && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />}
            </button>
          </div>
          <p className="mt-2 text-slate-700 text-sm font-medium leading-relaxed">
            マッチングアプリの悩み、AIが一緒に考えます。
          </p>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            返信・話す内容・デートコースまで。あなたの恋愛をそっとサポート。
          </p>
        </div>

        {/* Contact selector */}
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {contacts.map((c) => (
              <div key={c.id} className="relative group">
                <button
                  onClick={() => selectContact(c.id)}
                  className={`pl-3 pr-7 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
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
                </button>
                <button
                  onClick={() => deleteContact(c.id)}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center text-xs transition-colors ${
                    selectedContactId === c.id
                      ? "text-slate-400 hover:text-white"
                      : "text-slate-300 hover:text-slate-500"
                  }`}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => setShowAddContact(true)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border border-dashed border-slate-300 text-slate-400 hover:border-amber-400 hover:text-amber-500 transition-colors bg-white"
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

        {/* Profile modal */}
        {showProfile && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-base font-semibold text-slate-900 mb-1">自分について</h2>
              <p className="text-xs text-slate-500 mb-5">
                入力した内容をもとに返信のキャラを合わせます。
              </p>
              <div className="space-y-4">
                {FIELDS.map(({ key, label, placeholder, multiline }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      {label}
                    </label>
                    {multiline ? (
                      <textarea
                        value={profile[key]}
                        onChange={(e) => updateField(key, e.target.value)}
                        placeholder={placeholder}
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                      />
                    ) : (
                      <input
                        type="text"
                        value={profile[key]}
                        onChange={(e) => updateField(key, e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => setShowProfile(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={saveProfile}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-white transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add contact modal */}
        {showAddContact && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-xl">
              <h2 className="text-base font-semibold text-slate-900 mb-1">相手を追加</h2>
              <p className="text-xs text-slate-500 mb-4">
                会話の流れを相手ごとに記憶します。
              </p>
              <input
                type="text"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addContact()}
                placeholder="名前（例：ひなちゃん）"
                autoFocus
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => { setShowAddContact(false); setNewContactName(""); }}
                  className="flex-1 py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={addContact}
                  disabled={!newContactName.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 text-white transition-colors"
                >
                  追加
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feature mode selector */}
        <div className="flex gap-1.5 mb-3">
          {FEATURE_MODES.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => { setFeatureMode(key); setResult(null); setError(null); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                featureMode === key
                  ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:border-amber-300"
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Input mode toggle — hidden in date mode */}
        <div className={`flex gap-2 mb-3 bg-white rounded-2xl p-1 border border-slate-200 shadow-sm ${featureMode === "date" ? "hidden" : ""}`}>
          {(["image", "text"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setResult(null); setError(null); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                mode === m
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {m === "image" ? "📸 スクショ" : "✏️ テキスト"}
            </button>
          ))}
        </div>

        {/* Tone selector — reply mode only */}
        {featureMode === "reply" && (
          <div className="flex gap-2 mb-4">
            {(["自然", "盛り上げる", "積極的"] as const).map((t) => {
              const icons = { "自然": "💬", "盛り上げる": "🔥", "積極的": "💘" };
              return (
                <button
                  key={t}
                  onClick={() => { setTone(t); setResult(null); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                    tone === t
                      ? "bg-slate-800 text-white border-slate-800"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {icons[t]} {t}
                </button>
              );
            })}
          </div>
        )}

        {/* Date form — date mode only */}
        {featureMode === "date" && (
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">📍 エリア</label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="例：梅田、渋谷、名古屋"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">🕐 時間帯</label>
              <div className="flex gap-2">
                {["昼", "夕方", "夜"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setDateTime(t)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                      dateTime === t
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-white text-slate-500 border-slate-200 hover:border-amber-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">⏱ デートの長さ</label>
              <div className="flex gap-2">
                {["ランチのみ", "半日", "一日"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDateDuration(d)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                      dateDuration === d
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-white text-slate-500 border-slate-200 hover:border-amber-300"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">💝 相手の好きなもの・こと</label>
              <input
                type="text"
                value={dateInterests}
                onChange={(e) => setDateInterests(e.target.value)}
                placeholder="例：カフェ巡り、映画、アウトドア"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">💰 予算（おひとり様）</label>
              <div className="flex gap-2 flex-wrap">
                {["〜3,000円", "〜5,000円", "〜10,000円", "それ以上"].map((b) => (
                  <button
                    key={b}
                    onClick={() => setDateBudget(b)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                      dateBudget === b
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-white text-slate-500 border-slate-200 hover:border-amber-300"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={analyze}
              disabled={loading}
              className="w-full py-4 rounded-xl font-semibold text-sm text-white bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-sm"
            >
              {loading ? "提案中..." : result ? "再提案" : "デートコースを提案する"}
            </button>
          </div>
        )}

        {/* Image mode */}
        {featureMode !== "date" && mode === "image" && (
          <>
            <div
              className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer shadow-sm
                ${dragging
                  ? "border-amber-400 bg-amber-50"
                  : "border-slate-200 hover:border-amber-300 bg-white hover:bg-amber-50/30"
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
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl mx-auto mb-3">
                    📸
                  </div>
                  <p className="text-slate-600 text-sm font-medium">タップしてスクショを選ぶ</p>
                  <p className="text-slate-400 text-xs mt-1 hidden sm:block">ドラッグ&ドロップ・Ctrl+V でも可</p>
                </div>
              )}
            </div>
            {preview && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => { setPreview(null); setResult(null); setError(null); }}
                  className="px-4 py-4 rounded-xl text-sm text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 bg-white transition-colors shadow-sm"
                >
                  クリア
                </button>
                <button
                  onClick={analyze}
                  disabled={loading}
                  className="flex-1 py-4 rounded-xl font-semibold text-sm text-white bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-sm"
                >
                  {loading ? "解析中..." : result ? "再生成" : "返信案を生成する"}
                </button>
              </div>
            )}
          </>
        )}

        {/* Text mode */}
        {featureMode !== "date" && mode === "text" && (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <p className="text-xs text-slate-400 mb-2">会話をそのままコピペしてください</p>
              <textarea
                value={conversationText}
                onChange={(e) => { setConversationText(e.target.value); setResult(null); }}
                placeholder={"相手: こんにちは！\n自分: はじめまして！\n相手: 趣味は何ですか？"}
                rows={8}
                className="w-full text-sm text-slate-800 placeholder-slate-300 resize-none focus:outline-none leading-relaxed"
              />
            </div>
            <div className="mt-3 flex gap-2">
              {conversationText && (
                <button
                  onClick={() => { setConversationText(""); setResult(null); setError(null); }}
                  className="px-4 py-4 rounded-xl text-sm text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 bg-white transition-colors shadow-sm"
                >
                  クリア
                </button>
              )}
              <button
                onClick={analyze}
                disabled={loading || conversationText.trim().length < 5}
                className="flex-1 py-4 rounded-xl font-semibold text-sm text-white bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-sm"
              >
                {loading ? "解析中..." : result ? "再生成" : "返信案を生成する"}
              </button>
            </div>
          </>
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

            {/* Reply results */}
            {!isTopicsResult(result) && !isDateResult(result) && result.replies.map((reply, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-4 shadow-sm bg-white">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    {reply.reason ?? `案 ${i + 1}`}
                  </span>
                  <button
                    onClick={() => copy(reply.message, i)}
                    className="text-xs text-slate-400 hover:text-amber-600 transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-amber-50 active:bg-amber-100"
                  >
                    {copiedIndex === i ? "✓ コピー済み" : "コピー"}
                  </button>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{reply.message}</p>
              </div>
            ))}

            {/* Topics results */}
            {isTopicsResult(result) && result.topics.map((topic, i) => (
              <div key={i} className="rounded-xl border border-amber-200 p-4 shadow-sm bg-amber-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-700">{topic.title}</span>
                  <span className="text-xs text-amber-500 bg-amber-100 px-2 py-0.5 rounded-full">{topic.why}</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{topic.starter}</p>
              </div>
            ))}

            {/* Date course results */}
            {isDateResult(result) && result.courses.map((course, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-4 shadow-sm bg-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-slate-800">{course.theme}</span>
                  <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">{course.point}</span>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
