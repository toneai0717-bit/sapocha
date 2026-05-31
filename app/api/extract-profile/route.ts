import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "../../lib/rate-limit";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
const genAI = new GoogleGenerativeAI(apiKey);

const ALLOWED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_BASE64_LENGTH = 5 * 1024 * 1024 * 1.4;

const EXTRACT_PROMPT = `あなたはマッチングアプリのプロフィール読み取りアシスタントです。
アップロードされたスクリーンショット（複数枚可）から、相手の情報をできるだけ読み取ってください。

【読み取る情報】
- 名前・ニックネーム
- 年齢
- 職業・仕事
- 居住エリア・出身地
- 趣味・好きなこと（具体的に）
- 性格・雰囲気
- 休日の過ごし方
- 好きな食べ物・お酒
- 価値観・恋愛観
- 写真から読み取れる雰囲気・特徴
- その他プロフィールに書いてあること

【ルール】
- スクショに書いてある情報だけを使う。推測で補完しない。
- 読み取れなかった項目は省略する。
- 箇条書きで読みやすくまとめる。

必ず以下のJSON形式のみで返してください：
{
  "name": "読み取れた名前（不明なら空文字）",
  "profile": "読み取った情報を箇条書きでまとめたテキスト"
}`;

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "リクエストが多すぎます。少し待ってから再試行してください。" }, { status: 429 });
  }

  const accessKey = process.env.SAPOCHA_ACCESS_KEY;
  if (accessKey) {
    const auth = req.headers.get("Authorization");
    if (auth !== `Bearer ${accessKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const body = await req.json() as { images: { data: string; mediaType: string }[] };
    const { images } = body;

    const safeImages = Array.isArray(images)
      ? images
          .filter(
            (img) =>
              typeof img?.data === "string" &&
              img.data.length < MAX_BASE64_LENGTH &&
              ALLOWED_MEDIA_TYPES.has(img.mediaType)
          )
          .slice(0, 8)
      : [];

    if (safeImages.length === 0) {
      return NextResponse.json({ error: "画像がありません" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: EXTRACT_PROMPT,
    });

    const contentParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
    for (const img of safeImages) {
      contentParts.push({ inlineData: { mimeType: img.mediaType, data: img.data } });
    }
    contentParts.push({ text: `${safeImages.length}枚のスクリーンショットから相手の情報を読み取ってください。` });

    const result = await model.generateContent({ contents: [{ role: "user", parts: contentParts }] });
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "読み取りに失敗しました" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]) as { name?: string; profile?: string };
    return NextResponse.json({ name: parsed.name ?? "", profile: parsed.profile ?? "" });
  } catch (error) {
    console.error("Extract profile error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
