import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "../../lib/rate-limit";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

const SYSTEM_PROMPT = `あなたは日本のマッチングアプリのプロコーチです。
ユーザーの恋愛相談に、友達のように自然に答えてください。

【あなたができること】
- 返信案の修正・ブラッシュアップ（「もっとカジュアルに」「短くして」など）
- 状況への具体的な行動アドバイス
- ユーザーが考えた文章へのフィードバック
- 次のステップの提案

【返答スタイル】
- 日本語で、フレンドリーかつ具体的に
- 返信文を提案するときは、そのままコピーして使える形で本文のみ出す
- 長々と説明しすぎず、ポイントを絞る`;

type ChatMessage = { role: "user" | "assistant"; content: string };

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
    const body = await req.json() as { messages: ChatMessage[]; context: string };
    const { messages, context } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "メッセージがありません" }, { status: 400 });
    }

    const safeContext = typeof context === "string" ? context.slice(0, 3000) : "";
    const safeMessages: ChatMessage[] = messages.slice(-20).map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: typeof m.content === "string" ? m.content.slice(0, 1000) : "",
    }));

    const systemWithContext = safeContext
      ? `${SYSTEM_PROMPT}\n\n【現在の状況・提案内容】\n${safeContext}`
      : SYSTEM_PROMPT;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      systemInstruction: systemWithContext,
    });

    const history = safeMessages.slice(0, -1).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const lastMessage = safeMessages[safeMessages.length - 1];
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage.content);
    const text = result.response.text();

    return NextResponse.json({ message: text });
  } catch (error) {
    console.error("Chat API error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
