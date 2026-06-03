"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  MessageCircle,
  CalendarDays,
  Camera,
  Settings,
  Heart,
  UserPlus,
  ArrowUp,
  Plus,
  Mail,
  Type,
  Flame,
  MapPin,
  Clock,
  Timer,
  Gift,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import ProfileModal from "./components/ProfileModal";
import AddContactModal from "./components/AddContactModal";
import EditContactModal from "./components/EditContactModal";
import ContactSelector from "./components/ContactSelector";
import ChatPanel, { type ChatMessage } from "./components/ChatPanel";
import Onboarding from "./components/Onboarding";
import ImageDropzone from "./components/ImageDropzone";
import AuthPrompt from "./components/AuthPrompt";
import PhotoResults from "./components/PhotoResults";
import ReplyResults from "./components/ReplyResults";
import DateResults from "./components/DateResults";
import FavoritesModal from "./components/FavoritesModal";
import { useProfile } from "./hooks/useProfile";
import { useContacts } from "./hooks/useContacts";
import { useAuth } from "./hooks/useAuth";
import { useFavorites } from "./hooks/useFavorites";
import {
  type InputMode,
  type FeatureMode,
  type Tone,
  type Result,
  type ReplyResult,
  type DateCourse,
  type Profile,
  isDateResult,
  isProfileResult,
  isPhotoResult,
  isReplyResult,
  hasProfile,
  formatProfileForPrompt,
} from "./types";

const MAIN_MODES: { key: FeatureMode; label: string; icon: LucideIcon }[] = [
  { key: "reply",  label: "返信サポート", icon: MessageCircle },
  { key: "date",   label: "デートサポート", icon: CalendarDays },
  { key: "photo",  label: "写真診断",     icon: Camera },
];

function buildAnalyzeBody(params: {
  featureMode: FeatureMode;
  mode: InputMode;
  previews: string[];
  mediaTypes: string[];
  conversationText: string;
  profileStr: string;
  contactProfile: string;
  tone: Tone;
  historyContext: string;
  area: string;
  dateTime: string;
  dateDuration: string;
  dateInterests: string;
  dateBudget: string;
  dateNumber: string;
  isFirstMessage: boolean;
  firstMessageProfile: string;
}) {
  const { featureMode, mode, previews, mediaTypes, conversationText, profileStr, contactProfile, tone, historyContext, area, dateTime, dateDuration, dateInterests, dateBudget, dateNumber, isFirstMessage, firstMessageProfile } = params;
  const images = previews.map((p, i) => ({
    data: p.split(",")[1],
    mediaType: mediaTypes[i] ?? "image/jpeg",
  }));

  if (featureMode === "photo") return { images, mode: featureMode };
  if (featureMode === "date") {
    return { images, profile: profileStr, contactProfile, mode: featureMode, area, dateTime, dateDuration, dateInterests, dateBudget, dateNumber };
  }
  if (featureMode === "reply" && isFirstMessage) {
    const resolvedContactProfile = firstMessageProfile || contactProfile;
    return { profile: profileStr, contactProfile: resolvedContactProfile, mode: "firstMessage" };
  }
  const base = { profile: profileStr, contactProfile, tone, history: historyContext, mode: featureMode, area };
  if (mode === "image") return { ...base, images };
  return { ...base, text: conversationText };
}

export default function Home() {
  const [mode, setMode] = useState<InputMode>("image");
  const [featureMode, setFeatureMode] = useState<FeatureMode>("reply");
  const [area, setArea] = useState("");
  const [dateTime, setDateTime] = useState("夕方");
  const [dateDuration, setDateDuration] = useState("半日");
  const [dateInterests, setDateInterests] = useState("");
  const [dateBudget, setDateBudget] = useState("〜5,000円");
  const [tone, setTone] = useState<Tone>("自然");
  const [dateNumber, setDateNumber] = useState("1回目");
  const [previews, setPreviews] = useState<string[]>([]);
  const [mediaTypes, setMediaTypes] = useState<string[]>([]);
  const [conversationText, setConversationText] = useState("");
  const [isFirstMessage, setIsFirstMessage] = useState(false);
  const [firstMessageProfile, setFirstMessageProfile] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [editedReplies, setEditedReplies] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);

  const {
    profile,
    savedProfile,
    load: loadProfile,
    save: saveProfile,
    updateField,
    resetDraft: resetProfileDraft,
  } = useProfile();

  const {
    contacts,
    selectedContactId,
    showAdd: showAddContact,
    setShowAdd: setShowAddContact,
    editing: editingContact,
    setEditing: setEditingContact,
    load: loadContacts,
    add: addContact,
    update: updateContact,
    remove: removeContact,
    select: selectContact,
    appendHistory: appendContactHistory,
    getSelected: getSelectedContact,
    getHistory: getContactHistory,
  } = useContacts();

  const {
    favorites,
    load: loadFavorites,
    remove: removeFavorite,
    isSavedReply,
    isSavedCourse,
    toggleReply: toggleFavoriteReply,
    toggleCourse: toggleFavoriteCourse,
  } = useFavorites();

  const {
    storedKey,
    showAuthPrompt,
    accessKeyInput,
    setAccessKeyInput,
    setShowAuthPrompt,
    load: loadAuth,
    submit: submitAuth,
    getHeaders,
  } = useAuth();

  useEffect(() => {
    loadProfile();
    loadContacts();
    loadAuth();
    loadFavorites();
    try {
      if (!localStorage.getItem("sapocha_onboarded")) setShowOnboarding(true);
    } catch {}
  }, [loadProfile, loadContacts, loadAuth, loadFavorites]);

  useEffect(() => {
    if (result && isReplyResult(result)) {
      setEditedReplies(result.replies.map((r) => r.message));
    }
    if (!result) setChatMessages([]);
  }, [result]);

  const completeOnboarding = (onboardedProfile: Profile) => {
    saveProfile(onboardedProfile);
    try { localStorage.setItem("sapocha_onboarded", "true"); } catch {}
    setShowOnboarding(false);
  };

  const skipOnboarding = () => {
    try { localStorage.setItem("sapocha_onboarded", "true"); } catch {}
    setShowOnboarding(false);
  };

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

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    Array.from(e.clipboardData.items)
      .filter((i) => i.type.startsWith("image/"))
      .forEach((i) => {
        const file = i.getAsFile();
        if (file) handleFile(file);
      });
  }, [handleFile]);

  const clearImages = () => { setPreviews([]); setMediaTypes([]); };

  const analyze = async () => {
    if (featureMode === "photo") {
      if (previews.length === 0) return;
    } else if (featureMode === "reply" && isFirstMessage) {
      // ファーストメッセージは入力不要（相手プロフィールは任意）
    } else if (featureMode !== "date") {
      if (mode === "image" && previews.length === 0) return;
      if (mode === "text" && conversationText.trim().length < 5) return;
    }

    setLoading(true);
    setError(null);
    setChatMessages([]);

    try {
      const body = buildAnalyzeBody({
        featureMode,
        mode,
        previews,
        mediaTypes,
        conversationText,
        profileStr: formatProfileForPrompt(savedProfile),
        contactProfile: getSelectedContact()?.profile ?? "",
        tone,
        historyContext: getContactHistory(),
        area,
        dateTime,
        dateDuration,
        dateInterests,
        dateBudget,
        dateNumber,
        isFirstMessage,
        firstMessageProfile,
      });

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(body),
      });

      if (res.status === 401) { setShowAuthPrompt(true); return; }

      const data = await res.json() as Record<string, unknown>;
      if (data.error) throw new Error(data.error as string);
      setResult(data as Result);

      if (data.situation && selectedContactId) {
        appendContactHistory(selectedContactId, data.situation as string);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const buildResultContext = (r: Result): string => {
    if (isPhotoResult(r)) {
      return `【写真診断結果】\n${r.overall}\n${r.photos.map((p, i) => `写真${i + 1}：${p.verdict}（${p.score}点）`).join("\n")}`;
    }
    if (isProfileResult(r)) {
      return r.profiles.map((p) => `【${p.type}】\n${p.text}`).join("\n\n");
    }
    const lines = [`【状況】\n${r.situation ?? ""}`];
    if (isDateResult(r)) {
      lines.push("\n【提案したデートコース】");
      r.courses.forEach((c, i) => lines.push(`${i + 1}. ${c.theme}：${c.spots.map((s) => s.name).join(" → ")}`));
    } else {
      lines.push("\n【提案した返信案】");
      const msgs = editedReplies.length > 0 ? editedReplies : (r as ReplyResult).replies.map((rep) => rep.message);
      msgs.forEach((msg, i) => lines.push(`案${i + 1}：${msg}`));
    }
    return lines.join("\n");
  };

  const sendChat = async (text: string) => {
    if (!text.trim() || !result) return;
    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const next = [...chatMessages, userMsg];
    setChatMessages(next);
    setChatLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ messages: next, context: buildResultContext(result) }),
      });
      if (res.status === 401) { setShowAuthPrompt(true); return; }
      const data = await res.json() as { message?: string; error?: string };
      if (data.error) throw new Error(data.error);
      setChatMessages([...next, { role: "assistant", content: data.message ?? "" }]);
    } catch {
      setChatMessages([...next, { role: "assistant", content: "エラーが発生しました。もう一度お試しください。" }]);
    } finally {
      setChatLoading(false);
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

  if (showOnboarding) {
    return (
      <Onboarding
        storedKey={storedKey}
        onComplete={completeOnboarding}
        onSkip={skipOnboarding}
      />
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50 text-stone-900 font-sans"
      onPaste={handlePaste}
    >
      <div className="max-w-lg mx-auto px-4 pt-8 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-black text-slate-900">
                <Link href="/" className="select-none hover:opacity-90 transition-opacity">
                  サポ<span className="text-amber-500">チャ</span>
                </Link>
              </h1>
              <p className="mt-0.5 text-slate-700 text-sm font-medium leading-snug">
                会うまでは、全部サポート。<br />
                <span className="text-slate-700 text-xs">その先は、君の番。</span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 mt-1">
              <button
                onClick={() => { resetProfileDraft(); setShowProfile(true); }}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-600 transition-colors bg-white hover:bg-amber-50 border border-slate-200 px-3 py-2 rounded-xl shadow-sm"
              >
                <Settings className="w-3.5 h-3.5" aria-hidden="true" />
                <span>プロフィール設定</span>
                {hasProfile(savedProfile) && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" aria-hidden="true" />}
              </button>
              <button
                onClick={() => setShowFavorites(true)}
                className="relative flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-500 transition-colors bg-white hover:bg-rose-50 border border-slate-200 px-3 py-2 rounded-xl shadow-sm"
              >
                <Heart className={`w-3.5 h-3.5 ${favorites.length > 0 ? "fill-rose-500 text-rose-500" : ""}`} aria-hidden="true" />
                <span>お気に入り</span>
                {favorites.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-400 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                    {favorites.length > 99 ? "99" : favorites.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <ContactSelector
          contacts={contacts}
          selectedContactId={selectedContactId}
          onSelect={selectContact}
          onEdit={setEditingContact}
          onAdd={() => setShowAddContact(true)}
        />

        {/* Modals */}
        {showProfile && (
          <ProfileModal
            profile={profile}
            onFieldChange={updateField}
            onSave={() => { saveProfile(profile); setShowProfile(false); }}
            onClose={() => setShowProfile(false)}
            storedKey={storedKey}
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
            onSave={updateContact}
            onDelete={removeContact}
            onClose={() => setEditingContact(null)}
          />
        )}
        {showFavorites && (
          <FavoritesModal
            favorites={favorites}
            onRemove={removeFavorite}
            onClose={() => setShowFavorites(false)}
          />
        )}
        {showAuthPrompt && (
          <AuthPrompt
            accessKeyInput={accessKeyInput}
            onChange={setAccessKeyInput}
            onSubmit={submitAuth}
          />
        )}

        {/* 相手未登録 → 追加を促す */}
        {contacts.length === 0 && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-5 text-center">
            <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2.5" aria-hidden="true">
              <UserPlus className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-slate-700 mb-1">まず気になる相手を登録しよう</p>
            <p className="text-xs text-slate-400 mb-3">プロフィールを登録すると、ファーストメッセージから返信まで一貫してサポートできます</p>
            <button
              onClick={() => setShowAddContact(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-400 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              相手を追加する
            </button>
          </div>
        )}

        {/* 相手登録済みだが未選択 → 選択を促す */}
        {contacts.length > 0 && !selectedContactId && (
          <div className="mb-4 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-center">
            <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
              <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
              上から相手を選んでください
            </p>
            <p className="text-xs text-slate-400">選択するとその子に合わせたサポートができます</p>
          </div>
        )}

        {/* Feature mode selector */}
        <div className={`flex gap-1.5 mb-3 transition-opacity ${!selectedContactId ? "opacity-40 pointer-events-none" : ""}`}>
          {MAIN_MODES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setFeatureMode(key); setResult(null); setError(null); clearImages(); setIsFirstMessage(false); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                featureMode === key
                  ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:border-amber-300"
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" /> {label}
            </button>
          ))}
        </div>

        {/* First message toggle */}
        {featureMode === "reply" && selectedContactId && (
          <button
            onClick={() => { setIsFirstMessage(!isFirstMessage); setResult(null); setError(null); clearImages(); }}
            className={`w-full mb-3 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
              isFirstMessage
                ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                : "bg-white text-slate-500 border-slate-200 hover:border-amber-300"
            }`}
          >
            <Mail className="w-4 h-4" aria-hidden="true" />
            ファーストメッセージを作る {isFirstMessage ? "ON" : "OFF"}
          </button>
        )}

        {/* First message profile input */}
        {featureMode === "reply" && isFirstMessage && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              相手のプロフィール情報（任意）
              {getSelectedContact()?.profile && (
                <span className="ml-2 text-amber-500 font-normal">{getSelectedContact()?.name}のプロフィールを反映中</span>
              )}
            </label>
            <textarea
              value={getSelectedContact()?.profile ? (firstMessageProfile || getSelectedContact()?.profile || "") : firstMessageProfile}
              onChange={(e) => setFirstMessageProfile(e.target.value)}
              placeholder={"例：\n趣味：カフェ巡り、映画鑑賞\n仕事：看護師\n休日：友達とよく出かける\n好きな食べ物：イタリアン"}
              rows={4}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-300 resize-none focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 shadow-sm"
            />
            <button
              onClick={analyze}
              disabled={loading}
              className="w-full mt-3 py-4 rounded-xl font-semibold text-sm text-white bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-sm"
            >
              {loading ? "生成中..." : result ? "再生成" : "ファーストメッセージを生成する"}
            </button>
          </div>
        )}

        {/* Input mode toggle */}
        {featureMode === "reply" && !isFirstMessage && selectedContactId && (
          <div className="flex gap-2 mb-3 bg-white rounded-2xl p-1 border border-slate-200 shadow-sm">
            {(["image", "text"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setResult(null); setError(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  mode === m ? "bg-amber-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {m === "image"
                  ? <><Camera className="w-4 h-4" aria-hidden="true" /> スクショ</>
                  : <><Type className="w-4 h-4" aria-hidden="true" /> テキスト</>}
              </button>
            ))}
          </div>
        )}

        {/* Tone selector */}
        {featureMode === "reply" && !isFirstMessage && selectedContactId && (
          <div className="flex gap-2 mb-4">
            {(["自然", "盛り上げる", "積極的"] as const).map((t) => {
              const icons: Record<Tone, LucideIcon> = { "自然": MessageCircle, "盛り上げる": Flame, "積極的": Heart };
              const ToneIcon = icons[t];
              return (
                <button
                  key={t}
                  onClick={() => { setTone(t); setResult(null); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                    tone === t
                      ? "bg-slate-800 text-white border-slate-800"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  <ToneIcon className="w-3.5 h-3.5" aria-hidden="true" /> {t}
                </button>
              );
            })}
          </div>
        )}

        {/* Date form */}
        {featureMode === "date" && selectedContactId && (
          <div className="space-y-3 mb-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5"><CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />何回目のデート？</label>
              <div className="flex gap-2">
                {(["1回目", "2回目", "3回目以降"] as const).map((d) => (
                  <button key={d} onClick={() => setDateNumber(d)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${dateNumber === d ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-500 border-slate-200 hover:border-amber-300"}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5"><MapPin className="w-3.5 h-3.5" aria-hidden="true" />エリア</label>
              <input type="text" value={area} onChange={(e) => { setArea(e.target.value); setResult(null); }}
                placeholder="例：梅田、渋谷、名古屋"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 shadow-sm" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5"><Clock className="w-3.5 h-3.5" aria-hidden="true" />時間帯</label>
              <div className="flex gap-2">
                {["昼", "夕方", "夜"].map((t) => (
                  <button key={t} onClick={() => setDateTime(t)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${dateTime === t ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-500 border-slate-200 hover:border-amber-300"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5"><Timer className="w-3.5 h-3.5" aria-hidden="true" />デートの長さ</label>
              <div className="flex gap-2">
                {["ランチのみ", "半日", "一日"].map((d) => (
                  <button key={d} onClick={() => setDateDuration(d)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${dateDuration === d ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-500 border-slate-200 hover:border-amber-300"}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5"><Gift className="w-3.5 h-3.5" aria-hidden="true" />相手の好きなもの・こと</label>
              <input type="text" value={dateInterests} onChange={(e) => { setDateInterests(e.target.value); setResult(null); }}
                placeholder="例：カフェ巡り、映画、アウトドア"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 shadow-sm" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5"><Wallet className="w-3.5 h-3.5" aria-hidden="true" />予算（おひとり様）</label>
              <div className="flex gap-2 flex-wrap">
                {["〜3,000円", "〜5,000円", "〜10,000円", "それ以上"].map((b) => (
                  <button key={b} onClick={() => setDateBudget(b)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${dateBudget === b ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-500 border-slate-200 hover:border-amber-300"}`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5"><Camera className="w-3.5 h-3.5" aria-hidden="true" />相手のスクショ（任意・話題の精度が上がります）</label>
              <ImageDropzone
                previews={previews}
                onAddFile={handleFile}
                onRemove={removePreview}
                emptyLabel="タップしてスクショを選ぶ（プロフィール・会話どちらでもOK）"
              />
            </div>
            <button onClick={analyze} disabled={loading}
              className="w-full py-4 rounded-xl font-semibold text-sm text-white bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-sm">
              {loading ? "提案中..." : result ? "再提案" : "デートを提案する"}
            </button>
          </div>
        )}

        {/* Photo mode */}
        {featureMode === "photo" && selectedContactId && (
          <>
            <p className="flex items-start gap-1.5 text-xs text-slate-500 mb-3 bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-sm">
              <Camera className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
              <span>プロフィール用の写真をアップロードしてください。1枚ずつ、または複数枚まとめて診断できます。</span>
            </p>
            <ImageDropzone
              previews={previews}
              onAddFile={handleFile}
              onRemove={removePreview}
              icon={Camera}
              emptyLabel="タップして写真を選ぶ"
              emptyHint="複数枚・ドラッグ&ドロップでも可"
            />
            {previews.length > 0 && (
              <div className="mt-3 flex gap-2">
                <button onClick={() => { clearImages(); setResult(null); setError(null); }}
                  className="px-4 py-4 rounded-xl text-sm text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 bg-white transition-colors shadow-sm">
                  クリア
                </button>
                <button onClick={analyze} disabled={loading}
                  className="flex-1 py-4 rounded-xl font-semibold text-sm text-white bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-sm">
                  {loading ? "診断中..." : result ? "再診断" : "写真を診断する"}
                </button>
              </div>
            )}
          </>
        )}

        {/* Reply image mode */}
        {featureMode === "reply" && !isFirstMessage && selectedContactId && mode === "image" && (
          <>
            <ImageDropzone
              previews={previews}
              onAddFile={handleFile}
              onRemove={removePreview}
              emptyLabel="タップしてスクショを選ぶ"
              emptyHint="複数枚・ドラッグ&ドロップ・Ctrl+V でも可"
            />
            {previews.length > 0 && (
              <div className="mt-3 flex gap-2">
                <button onClick={() => { clearImages(); setResult(null); setError(null); }}
                  className="px-4 py-4 rounded-xl text-sm text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 bg-white transition-colors shadow-sm">
                  クリア
                </button>
                <button onClick={analyze} disabled={loading}
                  className="flex-1 py-4 rounded-xl font-semibold text-sm text-white bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-sm">
                  {loading ? "解析中..." : result ? "再生成" : "返信案を生成する"}
                </button>
              </div>
            )}
          </>
        )}

        {/* Reply text mode */}
        {featureMode === "reply" && !isFirstMessage && selectedContactId && mode === "text" && (
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
                <button onClick={() => { setConversationText(""); setResult(null); setError(null); }}
                  className="px-4 py-4 rounded-xl text-sm text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 bg-white transition-colors shadow-sm">
                  クリア
                </button>
              )}
              <button onClick={analyze} disabled={loading || conversationText.trim().length < 5}
                className="flex-1 py-4 rounded-xl font-semibold text-sm text-white bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-sm">
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
        {result && isPhotoResult(result) && (
          <PhotoResults result={result} previews={previews} />
        )}

        {result && isReplyResult(result) && (
          <div className="mt-5 space-y-3">
            <ReplyResults
              result={result}
              editedReplies={editedReplies}
              onEditReply={(i, v) => {
                const updated = [...editedReplies];
                updated[i] = v;
                setEditedReplies(updated);
              }}
              copiedIndex={copiedIndex}
              onCopy={copy}
              onToggleSave={(message, reason) =>
                toggleFavoriteReply({
                  message,
                  reason,
                  situation: result.situation,
                  contactName: getSelectedContact()?.name,
                })
              }
              isSaved={isSavedReply}
            />
          </div>
        )}

        {result && isDateResult(result) && (
          <div className="mt-5 space-y-3">
            <DateResults
              result={result}
              onToggleSave={(course: DateCourse) =>
                toggleFavoriteCourse({
                  course,
                  situation: result.situation,
                  contactName: getSelectedContact()?.name,
                })
              }
              isSaved={isSavedCourse}
            />
          </div>
        )}

        {result && !isProfileResult(result) && !isPhotoResult(result) && (
          <ChatPanel
            messages={chatMessages}
            loading={chatLoading}
            onSend={sendChat}
          />
        )}
      </div>
    </div>
  );
}
