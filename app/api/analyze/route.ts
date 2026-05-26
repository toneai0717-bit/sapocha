import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `あなたはマッチングアプリの会話コーチです。
スクリーンショットから会話を読み取り、次の返信案を3つ提案してください。

必ず以下のJSON形式のみで返してください（マークダウンや説明文は不要）：
{
  "situation": "会話の状況を1〜2文で",
  "replies": [
    { "tone": "自然", "message": "返信文" },
    { "tone": "盛り上げる", "message": "返信文" },
    { "tone": "積極的", "message": "返信文" }
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    const { image, mediaType } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "画像がありません" }, { status: 400 });
    }

    const response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType ?? "image/jpeg",
                data: image,
              },
            },
            {
              type: "text",
              text: "このスクリーンショットの会話を分析して、返信案を3つ提案してください。",
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "解析に失敗しました" }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
