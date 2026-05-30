import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ALLOWED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_BASE64_LENGTH = 5 * 1024 * 1024 * 1.4;

const TOPICS_PROMPT = `あなたはマッチングアプリの会話コーチです。
会話のスクリーンショットを分析し、実際に会ったときに話すと盛り上がる話題を提案してください。

【画像の読み取り方】
- 画面の右側が「自分」、左側が「相手」です。
- 会話の流れ・相手の興味・キャラクターを読み取ること。

【話題提案のルール】
- 会話の中で出てきたキーワードや共通点を活かす。
- 「相手が話したくなる」話題を選ぶ。
- 一問一答で終わらない、広がりのある話題にする。
- オンラインと対面では空気が変わるので、対面ならではの話題（食事・場所・体験など）を優先する。

必ず以下のJSON形式のみで返してください：
{
  "situation": "会話の状況を1〜2文で",
  "topics": [
    { "title": "話題のタイトル", "starter": "会話の切り口・最初の一言", "why": "この話題が盛り上がる理由を10文字以内で" },
    { "title": "話題のタイトル", "starter": "会話の切り口・最初の一言", "why": "この話題が盛り上がる理由を10文字以内で" },
    { "title": "話題のタイトル", "starter": "会話の切り口・最初の一言", "why": "この話題が盛り上がる理由を10文字以内で" },
    { "title": "話題のタイトル", "starter": "会話の切り口・最初の一言", "why": "この話題が盛り上がる理由を10文字以内で" },
    { "title": "話題のタイトル", "starter": "会話の切り口・最初の一言", "why": "この話題が盛り上がる理由を10文字以内で" }
  ]
}`;

const DATE_PROMPT = `あなたはマッチングアプリのデートプランナーです。
会話のスクリーンショットから相手の興味・性格・関係性を読み取り、デートコースを3つ提案してください。

【画像の読み取り方】
- 画面の右側が「自分」、左側が「相手」です。
- 相手の趣味・好み・雰囲気を読み取ること。

【デートコースのルール】
- 初デートを想定（重すぎず、軽すぎず）。
- 会話の内容・相手の興味と連動させる。
- 「また行きたい」と思わせる締め方を意識する。
- エリアが指定されていればそのエリアで提案する。

必ず以下のJSON形式のみで返してください：
{
  "situation": "会話から読み取った相手の印象を1〜2文で",
  "courses": [
    {
      "theme": "コースのテーマ（10文字以内）",
      "spots": [
        { "name": "スポット名", "description": "なぜここか・何をするか", "cost": "目安費用（例：〜1,000円）" },
        { "name": "スポット名", "description": "なぜここか・何をするか", "cost": "目安費用" },
        { "name": "スポット名", "description": "なぜここか・何をするか", "cost": "目安費用" }
      ],
      "totalCost": "コース合計の目安費用",
      "point": "このコースの決め手を15文字以内で"
    },
    {
      "theme": "コースのテーマ（10文字以内）",
      "spots": [
        { "name": "スポット名", "description": "なぜここか・何をするか", "cost": "目安費用" },
        { "name": "スポット名", "description": "なぜここか・何をするか", "cost": "目安費用" },
        { "name": "スポット名", "description": "なぜここか・何をするか", "cost": "目安費用" }
      ],
      "totalCost": "コース合計の目安費用",
      "point": "このコースの決め手を15文字以内で"
    },
    {
      "theme": "コースのテーマ（10文字以内）",
      "spots": [
        { "name": "スポット名", "description": "なぜここか・何をするか", "cost": "目安費用" },
        { "name": "スポット名", "description": "なぜここか・何をするか", "cost": "目安費用" },
        { "name": "スポット名", "description": "なぜここか・何をするか", "cost": "目安費用" }
      ],
      "totalCost": "コース合計の目安費用",
      "point": "このコースの決め手を15文字以内で"
    }
  ]
}`;

const SYSTEM_PROMPT = `あなたは日本のマッチングアプリのプロコーチです。
会話のスクリーンショットを見て、相手が「返信したくなる」自然なメッセージを3つ提案してください。

【読み取り方】
- 画面の右が自分、左が相手。
- 相手の最後のメッセージに対して返信を考える。

【いい返信の4条件】
1. 2〜3行が理想の長さ。短すぎず長すぎず。
2. 相手の言葉を1つ具体的に拾って反応する
3. 答えやすい質問を1つだけ入れる
4. 自分のことも少し混ぜて対等な会話にする

【良い例と悪い例】
相手「最近ジム通い始めました😊」
悪い例：「えすごい！何のトレーニングしてるんですか？」
良い例：「ジムって最初の1ヶ月が一番しんどいですよね笑 もう習慣になってきた感じ？私も行こうか迷ってるんですよね〜」

3つは同じトーンで、切り口・言い回し・自己開示の内容を変えたバリエーションにする。

必ず以下のJSON形式のみで返してください（説明文不要）：
{
  "situation": "会話の状況を1〜2文で",
  "replies": [
    { "message": "返信文", "reason": "特徴を10文字以内で" },
    { "message": "返信文", "reason": "特徴を10文字以内で" },
    { "message": "返信文", "reason": "特徴を10文字以内で" }
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    const { image, mediaType, profile, text, tone, history, mode, area, dateTime, dateDuration, dateInterests, dateBudget } = await req.json();
    const safeMode = ["reply", "topics", "date"].includes(mode) ? mode : "reply";

    if (!image && !text) {
      return NextResponse.json({ error: "画像またはテキストがありません" }, { status: 400 });
    }
    if (image && image.length > MAX_BASE64_LENGTH) {
      return NextResponse.json({ error: "画像が大きすぎます" }, { status: 413 });
    }
    if (text && typeof text === "string" && text.trim().length < 5) {
      return NextResponse.json({ error: "会話が短すぎます" }, { status: 400 });
    }

    const safeProfile = typeof profile === "string" ? profile.trim().slice(0, 500) : "";
    const safeTone = ["自然", "盛り上げる", "積極的"].includes(tone) ? tone : "自然";
    const safeArea = typeof area === "string" ? area.trim().slice(0, 50) : "";
    const safeHistory = typeof history === "string" ? history.trim().slice(0, 3000) : "";

    // モードごとにシステムプロンプトを切り替え
    let systemPrompt: string;
    let userInstruction: string;

    if (safeMode === "topics") {
      const profileSection = safeProfile
        ? `\n\n【自分のプロフィール】\n${safeProfile}`
        : "";
      systemPrompt = TOPICS_PROMPT + profileSection;
      userInstruction = "このスクリーンショットの会話を分析して、実際に会ったときに話すと盛り上がる話題を5つ提案してください。";
    } else if (safeMode === "date") {
      const safeDateTime = typeof dateTime === "string" ? dateTime.slice(0, 10) : "夕方";
      const safeDateDuration = typeof dateDuration === "string" ? dateDuration.slice(0, 10) : "半日";
      const safeDateInterests = typeof dateInterests === "string" ? dateInterests.slice(0, 200) : "";
      const safeDateBudget = typeof dateBudget === "string" ? dateBudget.slice(0, 20) : "";
      const profileSection = safeProfile ? `\n\n【自分のプロフィール】\n${safeProfile}` : "";
      const condSection = [
        safeArea && `エリア：${safeArea}`,
        `時間帯：${safeDateTime}`,
        `デートの長さ：${safeDateDuration}`,
        safeDateInterests && `相手の好きなもの・こと：${safeDateInterests}`,
        safeDateBudget && `予算（おひとり様）：${safeDateBudget}`,
      ].filter(Boolean).join("\n");
      const spotCount = safeDateDuration === "ランチのみ" ? "1〜2箇所" : safeDateDuration === "一日" ? "4〜5箇所" : "2〜3箇所";
      systemPrompt = DATE_PROMPT + profileSection + `\n\n【デート条件】\n${condSection}`;
      userInstruction = `上記の条件でデートコースを3つ提案してください。デートの長さに合わせてスポット数は${spotCount}にし、各スポットに目安費用とコース合計費用を含めてください。`;
    } else {
      const profileSection = safeProfile
        ? `\n\n【送信者のプロフィール】\n${safeProfile}\n返信はこの人物の性格・話し方に合わせてください。`
        : "";
      const toneSection = `\n\n【指定トーン】「${safeTone}」で3つのバリエーションを返すこと。`;
      const historySection = safeHistory
        ? `\n\n【これまでの会話の流れ（記憶）】\n${safeHistory}\n上記を踏まえ、すでに話したトピックの繰り返しを避け、会話を自然に発展させること。`
        : "";
      systemPrompt = SYSTEM_PROMPT + profileSection + toneSection + historySection;
      userInstruction = "このスクリーンショットの会話を分析して、返信案を3つ提案してください。";
    }

    const messageContent = image
      ? [
          {
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: (ALLOWED_MEDIA_TYPES.has(mediaType) ? mediaType : "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: image,
            },
          },
          { type: "text" as const, text: userInstruction },
        ]
      : [
          {
            type: "text" as const,
            text: `${userInstruction}\n\n【会話】\n${(text as string).trim().slice(0, 2000)}`,
          },
        ];

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: messageContent }],
    });

    const responseText = response.content[0].type === "text" ? response.content[0].text : "";

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "解析に失敗しました" }, { status: 500 });
    }

    try {
      const result = JSON.parse(jsonMatch[0]);
      return NextResponse.json(result);
    } catch (parseError) {
      console.error("JSON parse failed:", parseError instanceof Error ? parseError.message : "unknown");
      return NextResponse.json({ error: "解析に失敗しました" }, { status: 500 });
    }
  } catch (error) {
    console.error("API error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
