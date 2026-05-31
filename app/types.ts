export type InputMode = "image" | "text";
export type FeatureMode = "reply" | "topics" | "date" | "profile";
export type Tone = "自然" | "盛り上げる" | "積極的";

export type Reply = { message: string; reason?: string };
export type Topic = { title: string; starter: string; why: string };
export type DateSpot = { name: string; description: string; cost?: string };
export type DateCourse = { theme: string; spots: DateSpot[]; point: string; totalCost?: string };
export type ReplyResult = { situation: string; replies: Reply[] };
export type TopicsResult = { situation: string; topics: Topic[] };
export type DateResult = { situation: string; courses: DateCourse[] };
export type ProfileFormData = {
  age: string;
  job: string;
  area: string;
  hobbies: string;
  personality: string;
  weekends: string;
  strengths: string;
  idealPartner: string;
  app: string;
  firstPerson?: string;
  dialect?: string;
};

export type ProfileOutput = {
  type: string;
  text: string;
  hooks: string[];
};

export type ProfileResult = {
  profiles: ProfileOutput[];
};

export type Result = ReplyResult | TopicsResult | DateResult | ProfileResult;

export type Profile = {
  name: string;
  firstPerson: string;
  dialect: string;
  age: string;
  job: string;
  area: string;
  likes: string;
  values: string;      // 性格
  weekends: string;
  strengths: string;
  idealPartner: string;
  pets: string;
  sampleReplies: string;
  freeText: string;
  profileText: string;
  app: string;
};

export type Contact = {
  id: string;
  name: string;
  profile: string;
  situationHistory: string[];
  createdAt: number;
};

export const EMPTY_PROFILE: Profile = {
  name: "",
  firstPerson: "",
  dialect: "",
  age: "",
  job: "",
  area: "",
  likes: "",
  values: "",
  weekends: "",
  strengths: "",
  idealPartner: "",
  pets: "",
  sampleReplies: "",
  freeText: "",
  profileText: "",
  app: "Omiai",
};

export function isTopicsResult(r: Result): r is TopicsResult {
  return "topics" in r;
}

export function isDateResult(r: Result): r is DateResult {
  return "courses" in r;
}

export function isProfileResult(r: Result): r is ProfileResult {
  return "profiles" in r;
}

export function hasProfile(p: Profile): boolean {
  return Object.values(p).some((v) => v.trim() !== "");
}

export function formatProfileForPrompt(p: Profile): string {
  const lines: string[] = [];
  if (p.name) lines.push(`名前・ニックネーム：${p.name}`);
  if (p.firstPerson) lines.push(`一人称：${p.firstPerson}`);
  if (p.dialect) lines.push(`話し方・口調：${p.dialect}`);
  if (p.age) lines.push(`年齢：${p.age}`);
  if (p.job) lines.push(`職業：${p.job}`);
  if (p.area) lines.push(`居住エリア：${p.area}`);
  if (p.likes) lines.push(`好きなこと・趣味：${p.likes}`);
  if (p.values) lines.push(`性格：${p.values}`);
  if (p.weekends) lines.push(`休日の過ごし方：${p.weekends}`);
  if (p.strengths) lines.push(`自慢・得意なこと：${p.strengths}`);
  if (p.idealPartner) lines.push(`理想の相手：${p.idealPartner}`);
  if (p.pets) lines.push(`ペット：${p.pets}`);
  if (p.sampleReplies) lines.push(`【返信スタイルのサンプル（このトーン・文体・テンションを完全に真似すること）】\n${p.sampleReplies}`);
  if (p.freeText) lines.push(`その他：${p.freeText}`);
  return lines.join("\n");
}
