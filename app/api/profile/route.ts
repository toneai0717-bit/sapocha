import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "../../lib/rate-limit";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `あなたは日本のマッチングアプリのプロフィールライターのプロです。
入力情報をもとに、魅力的なプロフィール文を3パターン作成してください。

【プロフィール文を書く上での鉄則】
1. 200〜350文字に収める
2. 趣味には必ず具体的なエピソードか現在進行形の情報を入れる
   ❌「スノーボードが好き」
   ✅「スノーボードは小さい頃からやっていて、去年は長野に3回行きました！」
3.「一緒に〇〇したい」という未来の描写を1つ以上入れる
4. 話しかけやすいフック（共通点を見つけやすい具体的な情報）を3つ以上散りばめる
5. 「誠実に向き合います」「慎重なタイプです」などの抽象的すぎる表現は避ける
6. 固有名詞・数字・現在進行形が刺さる（「今〇〇にはまってます」「〇〇ピースに挑戦中」など）
7. 相手が「この人と話してみたい」と思えるような温かみと人間味を出す

【アプリ別トーン】
- Omiai：結婚を強く意識した真剣さが伝わる文体。誠実さ・将来への前向きさを自然に盛り込む。
  冒頭は「プロフィールを見てくださりありがとうございます！」で始め、末尾は「よろしくお願いします！」で締める。
- Pairs / with：少し丁寧で真面目さが伝わる文体。
  冒頭は「プロフィールを見ていただきありがとうございます！」で始め、末尾は「よろしくお願いします！」で締める。
- タップル / Tinder：明るく軽めのカジュアルな文体。冒頭・末尾の定型挨拶は不要。自然な入り方で。
- その他：親しみやすい標準的な文体。冒頭・末尾の挨拶はなくてよい。

【読みやすさのルール（最重要）】
- 趣味・好きなことは必ず箇条書き（「□趣味・好きなこと」という見出しをつけて・で列挙）
- 箇条書きの各項目には具体的なエピソードか現在進行形の情報を添える
- セクション間（書き出し・箇条書き・締め）には必ず1行の空白行を入れる
- 1つの段落は3〜4行以内に抑え、ひとかたまりの文章が長くなりすぎないようにする
- マッチングアプリは縦スクロールで読まれる。パッと見て読みやすいレイアウトを意識する

【重要な方向性】
マッチングアプリは「まともで感じのいい人」を探す場所。
尖った表現・個性を強調しすぎる表現は避け、3パターンとも親しみやすさの範囲で書く。

【3パターンの違い】
- 誠実系：真面目さ・誠実さが伝わる落ち着いたトーン
- 親しみやすい系：自然な話し言葉でテンポよく、話しかけやすい雰囲気
- フレンドリー系：明るく軽めで、読んでいて楽しい雰囲気

必ず以下のJSON形式のみで返してください：
{
  "profiles": [
    {
      "type": "誠実系",
      "text": "プロフィール本文（200〜400文字、趣味は箇条書き）",
      "hooks": ["話しかけやすいポイント1", "ポイント2", "ポイント3"]
    },
    {
      "type": "親しみやすい系",
      "text": "プロフィール本文（200〜400文字、趣味は箇条書き）",
      "hooks": ["話しかけやすいポイント1", "ポイント2", "ポイント3"]
    },
    {
      "type": "フレンドリー系",
      "text": "プロフィール本文（200〜400文字、趣味は箇条書き）",
      "hooks": ["話しかけやすいポイント1", "ポイント2", "ポイント3"]
    }
  ]
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
    const body = await req.json() as Record<string, unknown>;
    const {
      age, job, area, hobbies,
      personality, weekends, strengths, idealPartner, app,
      firstPerson, dialect,
    } = body;

    const safeAge = typeof age === "string" ? age.trim().slice(0, 10) : "";
    const safeJob = typeof job === "string" ? job.trim().slice(0, 50) : "";
    const safeArea = typeof area === "string" ? area.trim().slice(0, 50) : "";
    const safeHobbies = typeof hobbies === "string" ? hobbies.trim().slice(0, 500) : "";
    const safePersonality = typeof personality === "string" ? personality.trim().slice(0, 100) : "";
    const safeWeekends = typeof weekends === "string" ? weekends.trim().slice(0, 200) : "";
    const safeStrengths = typeof strengths === "string" ? strengths.trim().slice(0, 200) : "";
    const safeIdealPartner = typeof idealPartner === "string" ? idealPartner.trim().slice(0, 200) : "";
    const safeApp = typeof app === "string" ? app.trim().slice(0, 20) : "Pairs";
    const safeFirstPerson = typeof firstPerson === "string" ? firstPerson.trim().slice(0, 10) : "";
    const safeDialect = typeof dialect === "string" ? dialect.trim().slice(0, 50) : "";

    if (!safeAge && !safeJob && !safeHobbies) {
      return NextResponse.json({ error: "情報を入力してください" }, { status: 400 });
    }

    const userMessage = [
      safeFirstPerson && `一人称：${safeFirstPerson}`,
      safeDialect && `話し方・口調：${safeDialect}`,
      safeAge && `年齢：${safeAge}歳`,
      safeJob && `職業：${safeJob}`,
      safeArea && `居住エリア：${safeArea}`,
      safeHobbies && `趣味・好きなこと：\n${safeHobbies}`,
      safePersonality && `性格：${safePersonality}`,
      safeWeekends && `休日の過ごし方：${safeWeekends}`,
      safeStrengths && `自慢・エピソード：${safeStrengths}`,
      safeIdealPartner && `理想の相手：${safeIdealPartner}`,
      `使用アプリ：${safeApp}`,
    ].filter(Boolean).join("\n");

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: `以下の情報でプロフィール文を3パターン作成してください。\n\n${userMessage}` }],
    });

    const responseText = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "生成に失敗しました" }, { status: 500 });
    }

    try {
      const result = JSON.parse(jsonMatch[0]);
      return NextResponse.json(result);
    } catch {
      return NextResponse.json({ error: "生成に失敗しました" }, { status: 500 });
    }
  } catch (error) {
    console.error("Profile API error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
