"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ProfileModal from "./components/ProfileModal";
import AddContactModal from "./components/AddContactModal";
import EditContactModal from "./components/EditContactModal";
import ContactSelector from "./components/ContactSelector";
import {
  type InputMode,
  type FeatureMode,
  type Tone,
  type Result,
  type Profile,
  type Contact,
  EMPTY_PROFILE,
  isTopicsResult,
  isDateResult,
  hasProfile,
  formatProfileForPrompt,
} from "./types";

const FEATURE_MODES: { key: FeatureMode; label: string; icon: string }[] = [
  { key: "reply",  label: "返信サポート", icon: "💬" },
  { key: "topics", label: "デートの話題", icon: "💡" },
  { key: "date",   label: "デートコース", icon: "🗓" },
];

const PROFILE_KEY = "sapocha_profile_v2";
const CONTACTS_KEY = "sapocha_contacts_v1";
const SELECTED_CONTACT_KEY = "sapocha_selected_contact_v1";
const ACCESS_KEY_KEY = "sapocha_access_key";

export default function Home() {
  const [mode, setMode] = useState<InputMode>("image");
  const [featureMode, setFeatureMode] = useState<FeatureMode>("reply");
  const [area, setArea] = useState<string>("");
  const [dateTime, setDateTime] = useState<string>("夕方");
  const [dateDuration, setDateDuration] = useState<string>("半日");
  const [dateInterests, setDateInterests] = useState<string>("");
  const [dateBudget, setDateBudget] = useState<string>("〜5,000円");
  const [tone, setTone] = useState<Tone>("自然");
  const [dateNumber, setDateNumber] = useState<string>("1回目");
  const [previews, setPreviews] = useState<string[]>([]);
  const [mediaTypes, setMediaTypes] = useState<string[]>([]);
  const [conversationText, setConversationText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [savedProfile, setSavedProfile] = useState<Profile>(EMPTY_PROFILE);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Auth
  const [storedKey, setStoredKey] = useState<string>("");
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [accessKeyInput, setAccessKeyInput] = useState("");

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
      setStoredKey(localStorage.getItem(ACCESS_KEY_KEY) ?? "");
    } catch {
      // ignore corrupted storage
    }
  }, []);

  const saveProfile = () => {
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch {}
    setSavedProfile(profile);
    setShowProfile(false);
  };

  const updateField = (field: keyof Profile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const saveContacts = useCallback((updated: Contact[]) => {
    setContacts(updated);
    try { localStorage.setItem(CONTACTS_KEY, JSON.stringify(updated)); } catch {}
  }, []);

  const addContact = (name: string, contactProfile: string) => {
    const newContact: Contact = {
      id: Date.now().toString(),
      name,
      profile: contactProfile,
      situationHistory: [],
      createdAt: Date.now(),
    };
    saveContacts([...contacts, newContact]);
    setSelectedContactId(newContact.id);
    try { localStorage.setItem(SELECTED_CONTACT_KEY, newContact.id); } catch {}
    setShowAddContact(false);
  };

  const saveEditContact = (updated: Contact) => {
    saveContacts(contacts.map((c) => (c.id === updated.id ? updated : c)));
    setEditingContact(null);
  };

  const selectContact = (id: string) => {
    if (selectedContactId === id) {
      setSelectedContactId(null);
      try { localStorage.removeItem(SELECTED_CONTACT_KEY); } catch {}
    } else {
      setSelectedContactId(id);
      try { localStorage.setItem(SELECTED_CONTACT_KEY, id); } catch {}
    }
  };

  const deleteContact = (id: string) => {
    saveContacts(contacts.filter((c) => c.id !== id));
    if (selectedContactId === id) {
      setSelectedContactId(null);
      try { localStorage.removeItem(SELECTED_CONTACT_KEY); } catch {}
    }
    setEditingContact(null);
  };

  const submitAccessKey = () => {
    if (!accessKeyInput.trim()) return;
    const key = accessKeyInput.trim();
    try { localStorage.setItem(ACCESS_KEY_KEY, key); } catch {}
    setStoredKey(key);
    setAccessKeyInput("");
    setShowAuthPrompt(false);
  };

  const getHistoryContext = useCallback((): string => {
    const contact = contacts.find((c) => c.id === selectedContactId);
    if (!contact || contact.situationHistory.length === 0) return "";
    return contact.situationHistory.map((s, i) => `${i + 1}. ${s}`).join("\n");
  }, [contacts, selectedContactId]);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreviews((prev) => [...prev, dataUrl]);
      setMediaTypes((prev) => [...prev, file.type || "image/jpeg"]);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const removePreview = useCallback((index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setMediaTypes((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      Array.from(e.dataTransfer.files)
        .filter((f) => f.type.startsWith("image/"))
        .forEach((f) => handleFile(f));
    },
    [handleFile]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      Array.from(e.clipboardData.items)
        .filter((i) => i.type.startsWith("image/"))
        .forEach((i) => {
          const file = i.getAsFile();
          if (file) handleFile(file);
        });
    },
    [handleFile]
  );

  const analyze = async () => {
    if (featureMode === "topics") {
      const hasHistory = contacts.find((c) => c.id === selectedContactId)?.situationHistory.length ?? 0;
      if (previews.length === 0 && hasHistory === 0 && conversationText.trim().length < 5) return;
    } else if (featureMode !== "date") {
      if (mode === "image" && previews.length === 0) return;
      if (mode === "text" && conversationText.trim().length < 5) return;
    }
    setLoading(true);
    setError(null);
    try {
      const historyContext = getHistoryContext();
      const images = previews.map((p, i) => ({
        data: p.split(",")[1],
        mediaType: mediaTypes[i] ?? "image/jpeg",
      }));
      const contactProfile = contacts.find((c) => c.id === selectedContactId)?.profile ?? "";
      const body =
        featureMode === "date"
          ? { profile: formatProfileForPrompt(savedProfile), contactProfile, mode: featureMode, area, dateTime, dateDuration, dateInterests, dateBudget }
          : featureMode === "topics"
          ? { images, profile: formatProfileForPrompt(savedProfile), contactProfile, mode: featureMode, history: historyContext, dateNumber }
          : mode === "image"
          ? { images, profile: formatProfileForPrompt(savedProfile), contactProfile, tone, history: historyContext, mode: featureMode, area }
          : { text: conversationText, profile: formatProfileForPrompt(savedProfile), contactProfile, tone, history: historyContext, mode: featureMode, area };

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (storedKey) headers["Authorization"] = `Bearer ${storedKey}`;

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        setShowAuthPrompt(true);
        return;
      }

      const data = await res.json() as Record<string, unknown>;
      if (data.error) throw new Error(data.error as string);
      setResult(data as Result);

      if (data.situation && selectedContactId) {
        const updatedContacts = contacts.map((c) =>
          c.id === selectedContactId
            ? { ...c, situationHistory: [...c.situationHistory.slice(-9), data.situation as string] }
            : c
        );
        saveContacts(updatedContacts);
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
              <Link href="/" className="select-none hover:opacity-90 transition-opacity">
                サポ<span className="text-amber-500">チャ</span>
              </Link>
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <button
                onClick={() => { setProfile(savedProfile); setShowProfile(true); }}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-600 transition-colors bg-white hover:bg-amber-50 border border-slate-200 px-3 py-2 rounded-xl shadow-sm"
              >
                <span aria-hidden="true">⚙</span>
                <span>自分設定</span>
                {hasProfile(savedProfile) && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" aria-hidden="true" />}
              </button>
            </div>
          </div>
          <p className="mt-2 text-slate-700 text-sm font-medium leading-relaxed">
            マッチングアプリの悩み、AIが一緒に考えます。
          </p>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            返信・話す内容・デートコースまで。あなたの恋愛をそっとサポート。
          </p>
        </div>

        <ContactSelector
          contacts={contacts}
          selectedContactId={selectedContactId}
          onSelect={selectContact}
          onEdit={(c) => setEditingContact(c)}
          onAdd={() => setShowAddContact(true)}
        />

        {/* Modals */}
        {showProfile && (
          <ProfileModal
            profile={profile}
            onFieldChange={updateField}
            onSave={saveProfile}
            onClose={() => setShowProfile(false)}
          />
        )}
        {showAddContact && (
          <AddContactModal
            onAdd={addContact}
            onClose={() => setShowAddContact(false)}
          />
        )}
        {editingContact && (
          <EditContactModal
            contact={editingContact}
            onSave={saveEditContact}
            onDelete={deleteContact}
            onClose={() => setEditingContact(null)}
          />
        )}

        {/* Auth prompt */}
        {showAuthPrompt && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-xl">
              <h2 className="text-base font-semibold text-slate-900 mb-1">アクセスキーを入力</h2>
              <p className="text-xs text-slate-500 mb-4">このアプリの利用には認証が必要です。</p>
              <input
                type="password"
                value={accessKeyInput}
                onChange={(e) => setAccessKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitAccessKey()}
                placeholder="アクセスキー"
                autoFocus
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 mb-4"
              />
              <button
                onClick={submitAccessKey}
                disabled={!accessKeyInput.trim()}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 text-white transition-colors"
              >
                認証する
              </button>
            </div>
          </div>
        )}

        {/* Feature mode selector */}
        <div className="flex gap-1.5 mb-3">
          {FEATURE_MODES.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => { setFeatureMode(key); setResult(null); setError(null); setPreviews([]); setMediaTypes([]); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                featureMode === key
                  ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:border-amber-300"
              }`}
            >
              <span aria-hidden="true">{icon}</span> {label}
            </button>
          ))}
        </div>

        {/* Input mode toggle */}
        <div className={`flex gap-2 mb-3 bg-white rounded-2xl p-1 border border-slate-200 shadow-sm ${featureMode === "date" ? "hidden" : ""}`}>
          {(["image", "text"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setResult(null); setError(null); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                mode === m ? "bg-amber-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {m === "image" ? "📸 スクショ" : "✏️ テキスト"}
            </button>
          ))}
        </div>

        {/* Tone selector */}
        {featureMode === "reply" && (
          <div className="flex gap-2 mb-4">
            {(["自然", "盛り上げる", "積極的"] as const).map((t) => {
              const icons: Record<Tone, string> = { "自然": "💬", "盛り上げる": "🔥", "積極的": "💘" };
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
                  <span aria-hidden="true">{icons[t]}</span> {t}
                </button>
              );
            })}
          </div>
        )}

        {/* Date form */}
        {featureMode === "date" && (
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">📍 エリア</label>
              <input
                type="text"
                value={area}
                onChange={(e) => { setArea(e.target.value); setResult(null); }}
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
                onChange={(e) => { setDateInterests(e.target.value); setResult(null); }}
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
            {featureMode === "topics" && (
              <div className="mb-3 space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">📅 何回目のデート？</label>
                  <div className="flex gap-2">
                    {["1回目", "2回目", "3回目以降"].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDateNumber(d)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          dateNumber === d
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-white text-slate-500 border-slate-200 hover:border-amber-300"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                {selectedContactId && contacts.find((c) => c.id === selectedContactId)?.situationHistory.length ? (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    💡 会話履歴があるのでスクショなしでも提案できます。追加したい場合はスクショを貼ってください。
                  </p>
                ) : (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    💡 相手のプロフィールスクショを貼ると精度が上がります。会話スクショでもOK。
                  </p>
                )}
              </div>
            )}
            {previews.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-2">
                {previews.map((p, i) => (
                  <div key={i} className="relative">
                    <Image
                      src={p}
                      alt="スクリーンショット"
                      width={80}
                      height={80}
                      className="w-20 h-20 object-cover rounded-xl border border-slate-200"
                      unoptimized
                    />
                    <button
                      onClick={() => removePreview(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-700 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-500 transition-colors"
                      aria-label="画像を削除"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
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
                onChange={(e) => Array.from(e.target.files ?? []).forEach((f) => handleFile(f))}
              />
              <div className="text-center">
                <div className={`rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-2 ${previews.length > 0 ? "w-10 h-10 text-xl" : "w-16 h-16 text-3xl"}`} aria-hidden="true">
                  {featureMode === "topics" ? "👤" : "📸"}
                </div>
                <p className="text-slate-600 text-sm font-medium">
                  {previews.length > 0 ? "＋ 追加する" : featureMode === "topics" ? "プロフィール or 会話のスクショを選ぶ" : "タップしてスクショを選ぶ"}
                </p>
                {previews.length === 0 && <p className="text-slate-400 text-xs mt-1 hidden sm:block">複数枚・ドラッグ&amp;ドロップ・Ctrl+V でも可</p>}
              </div>
            </div>
            {featureMode === "topics" && selectedContactId && (contacts.find((c) => c.id === selectedContactId)?.situationHistory.length ?? 0) > 0 && previews.length === 0 && (
              <button
                onClick={analyze}
                disabled={loading}
                className="mt-3 w-full py-4 rounded-xl font-semibold text-sm text-white bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-sm"
              >
                {loading ? "解析中..." : result ? "再生成" : "話題を提案する（履歴から生成）"}
              </button>
            )}
            {previews.length > 0 && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => { setPreviews([]); setMediaTypes([]); setResult(null); setError(null); }}
                  className="px-4 py-4 rounded-xl text-sm text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 bg-white transition-colors shadow-sm"
                >
                  クリア
                </button>
                <button
                  onClick={analyze}
                  disabled={loading}
                  className="flex-1 py-4 rounded-xl font-semibold text-sm text-white bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-sm"
                >
                  {loading ? "解析中..." : result ? "再生成" : featureMode === "topics" ? "話題を提案する" : "返信案を生成する"}
                </button>
              </div>
            )}
          </>
        )}

        {/* Text mode */}
        {featureMode !== "date" && mode === "text" && (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <p className="text-xs text-slate-400 mb-2">
                {featureMode === "topics"
                  ? "相手のプロフィール情報や会話内容を貼り付けてください"
                  : "会話をそのままコピペしてください"}
              </p>
              <textarea
                value={conversationText}
                onChange={(e) => { setConversationText(e.target.value); setResult(null); }}
                placeholder={
                  featureMode === "topics"
                    ? "例：25歳・看護師・神戸出身・猫が好き・休日はカフェ巡り\n\n---または会話---\n相手: 最近カフェ巡りにはまってます！\n自分: いいですね！どんなカフェが好きですか？"
                    : "相手: こんにちは！\n自分: はじめまして！\n相手: 趣味は何ですか？"
                }
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
              <p className="text-xs text-slate-500 leading-relaxed">{result.situation ?? ""}</p>
            </div>

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

            {isTopicsResult(result) && result.topics.map((topic, i) => (
              <div key={i} className="rounded-xl border border-amber-200 p-4 shadow-sm bg-amber-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-700">{topic.title}</span>
                  <span className="text-xs text-amber-500 bg-amber-100 px-2 py-0.5 rounded-full">{topic.why}</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{topic.starter}</p>
              </div>
            ))}

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
