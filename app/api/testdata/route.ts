import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "../../lib/rate-limit";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const maxDuration = 30;

const PROMPT = `マッチングアプリのテストユーザー（男性）を1人生成してください。毎回違うキャラクターにすること。

必ず以下のJSON形式のみで返してください（説明不要）：
{"name":"ひらがな名前","firstPerson":"俺か僕か私","dialect":"話し方の特徴","age":"XX歳","job":"職業","area":"エリア","hobbies":"趣味を箇条書きで（・項目｜エピソード形式で3つ）","personality":"性格2〜3語","weekends":"休日の過ごし方","strengths":"自慢エピソード1つ","idealPartner":"理想の相手1文","pets":"犬猫への一言","app":"Omiai/Pairs/with/タップル/Tinderのどれか"}`;

export async function GET(req: NextRequest) {
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(PROMPT);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "生成失敗" }, { status: 500 });
    }
    const data = JSON.parse(jsonMatch[0]);
    if (Array.isArray(data.hobbies)) {
      data.hobbies = (data.hobbies as string[]).join("\n");
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Testdata error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "生成失敗" }, { status: 500 });
  }
}
