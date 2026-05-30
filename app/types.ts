export type InputMode = "image" | "text";
export type FeatureMode = "reply" | "topics" | "date";
export type Tone = "自然" | "盛り上げる" | "積極的";

export type Reply = { message: string; reason?: string };
export type Topic = { title: string; starter: string; why: string };
export type DateSpot = { name: string; description: string; cost?: string };
export type DateCourse = { theme: string; spots: DateSpot[]; point: string; totalCost?: string };
export type ReplyResult = { situation: string; replies: Reply[] };
export type TopicsResult = { situation: string; topics: Topic[] };
export type DateResult = { situation: string; courses: DateCourse[] };
export type Result = ReplyResult | TopicsResult | DateResult;

export type Profile = {
  firstPerson: string;
  likes: string;
  values: string;
  dialect: string;
  sampleReplies: string;
  freeText: string;
};

export type Contact = {
  id: string;
  name: string;
  profile: string;
  situationHistory: string[];
  createdAt: number;
};

export const EMPTY_PROFILE: Profile = {
  firstPerson: "",
  likes: "",
  values: "",
  dialect: "",
  sampleReplies: "",
  freeText: "",
};

export function isTopicsResult(r: Result): r is TopicsResult {
  return "topics" in r;
}

export function isDateResult(r: Result): r is DateResult {
  return "courses" in r;
}

export function hasProfile(p: Profile): boolean {
  return Object.values(p).some((v) => v.trim() !== "");
}

export function formatProfileForPrompt(p: Profile): string {
  const lines: string[] = [];
  if (p.firstPerson) lines.push(`一人称：${p.firstPerson}`);
  if (p.likes) lines.push(`好きなこと：${p.likes}`);
  if (p.values) lines.push(`価値観：${p.values}`);
  if (p.dialect) lines.push(`方言・話し方：${p.dialect}`);
  if (p.sampleReplies) lines.push(`【返信スタイルのサンプル（このトーン・文体・テンションを完全に真似すること）】\n${p.sampleReplies}`);
  if (p.freeText) lines.push(`その他：${p.freeText}`);
  return lines.join("\n");
}
