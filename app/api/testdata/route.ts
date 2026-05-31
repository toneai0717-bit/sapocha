import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

const PROMPT = `マッチングアプリのテストユーザーをランダムに1人生成してください。
毎回必ず異なるキャラクターにすること（職業・趣味・エリア・話し方など全部変える）。

必ず以下のJSON形式のみで返してください：
{
  "name": "ニックネーム（ひらがな2〜4文字）",
  "firstPerson": "一人称（俺/僕/私のどれか）",
  "dialect": "話し方の特徴（例：関西弁、敬語多め、フランク、語尾にっす）",
  "age": "年齢（例：27歳）",
  "job": "職業（具体的に。例：IT系エンジニア、小学校の先生、飲食店オーナー）",
  "area": "居住エリア（例：渋谷、梅田、名古屋、福岡）",
  "hobbies": "趣味・好きなこと（具体的エピソード付きで3〜4項目。箇条書き形式）",
  "personality": "性格（2〜3語）",
  "weekends": "休日の過ごし方（具体的に）",
  "strengths": "自慢・エピソード（1つ具体的に）",
  "idealPartner": "理想の相手（1〜2文）",
  "pets": "犬・猫への好感度（一言）",
  "app": "使うアプリ（Omiai/Pairs/with/タップル/Tinderのどれか）"
}`;

export async function GET() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(PROMPT);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "生成失敗" }, { status: 500 });
    }
    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Testdata error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "生成失敗" }, { status: 500 });
  }
}
