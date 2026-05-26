import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `あなたはマッチングアプリの会話コーチです。
スクリーンショットから会話を読み取り、次の返信案を3つ提案してください。

【トーンの定義】
- 自然：普通に会話を続ける。テンポよく、短め。
- 盛り上げる：笑いや共感を狙う。軽いノリで場を温める。
- 積極的：デートや次の約束に少し近づける。ただし「将来」「一緒に住む」「料理作って」など重い表現は絶対NG。あくまで「今度会いたい」レベルに留める。

【共通ルール】
- 返信は短く自然な日本語。長すぎない。
- 相手との関係は始まったばかりを前提に、馴れ馴れしくしすぎない。
- 絵文字は使っても1〜2個まで。

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
    const { image, mediaType, profile } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "画像がありません" }, { status: 400 });
    }

    const profileSection = profile?.trim()
      ? `\n\n【送信者のプロフィール】\n${profile}\n返信はこの人物の性格・話し方に合わせてください。`
      : "";

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT + profileSection,
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
