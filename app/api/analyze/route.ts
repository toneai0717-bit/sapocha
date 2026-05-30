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
        { "name": "スポット名", "description": "なぜここか・何をするか" },
        { "name": "スポット名", "description": "なぜここか・何をするか" },
        { "name": "スポット名", "description": "なぜここか・何をするか" }
      ],
      "point": "このコースの決め手を15文字以内で"
    },
    {
      "theme": "コースのテーマ（10文字以内）",
      "spots": [
        { "name": "スポット名", "description": "なぜここか・何をするか" },
        { "name": "スポット名", "description": "なぜここか・何をするか" },
        { "name": "スポット名", "description": "なぜここか・何をするか" }
      ],
      "point": "このコースの決め手を15文字以内で"
    },
    {
      "theme": "コースのテーマ（10文字以内）",
      "spots": [
        { "name": "スポット名", "description": "なぜここか・何をするか" },
        { "name": "スポット名", "description": "なぜここか・何をするか" },
        { "name": "スポット名", "description": "なぜここか・何をするか" }
      ],
      "point": "このコースの決め手を15文字以内で"
    }
  ]
}`;

const SYSTEM_PROMPT = `あなたはマッチングアプリの会話コーチです。
スクリーンショットまたはテキストの会話を読み取り、「相手（自分ではない方）の直近の連続メッセージすべて」に対する返信案を3つ提案してください。相手が複数回に分けて送っている場合はその全体をまとめて1つの「ターン」として扱う。

【画像の読み取り方】
- 画面の右側のメッセージが「自分」、左側が「相手」です。
- 自分がすでに送ったメッセージは参考にするだけで、返信に含めたり繰り返したりしない。
- 自分が最後に送った以降の相手のメッセージをすべて「1ターン」として読み取り、その全体に自然に返す内容を考える。

【トーンの定義】
- 自然：普通に会話を続ける。テンポよく、相手のボリュームに合わせる。
- 盛り上げる：笑いや共感を狙う。軽いノリで場を温める。
- 積極的：デートや次の約束に少し近づける。ただし「将来」「一緒に住む」「料理作って」など重い表現は絶対NG。あくまで「今度会いたい」レベルに留める。

【重要】指定されたトーンで3つのバリエーションを返すこと。3つは同じトーンで、表現・切り口・言い回しを変えた別案にする。

【文体ミラーリング（最重要）】
相手の「最後の連続メッセージ（自分の最後の返信以降に送られたすべてのブロック）」を合計して分析し、返信を合わせること：
1. 文字数：相手の直近メッセージ群の合計文字数に近い返信にする。相手が3メッセージ計10行送っていれば、返信も10行相当にする。
2. 絵文字：相手の直近メッセージ群で使われた絵文字の合計数と同じ数だけ使う。
3. メッセージ分割：相手が複数のブロックに分けて送っている場合（例：3回送信＝3ブロック）、返信も「\n\n」で同じ数に分ける。1回なら1ブロック。
4. テンション：相手の句読点・感嘆符・語尾のノリをそのまま真似る。
5. 内容の網羅：相手が複数のトピックに触れているなら、すべてに反応する。スルーしない。

【面白さの作り方（最重要）】
返信に「ちょうどいい引っかかり」を必ず作ること。
- 相手の発言から一番ユニークな部分を見つけ、「確かに！」と思わせる角度で反応する
- 無難な共感だけはNG（「そうなんだ！すごいね！」は不合格）
- 奇抜すぎもNG（脈絡ない話題転換、過剰なボケは不合格）
- 正解：相手が「この人ちょっと面白い」と思って返したくなる、ちょっとした意外な視点や軽いツッコミ
- 例：相手「最近ジム通い始めた」→NG「えすごい！何のトレーニングしてるの？」→OK「なんか最初の1ヶ月で辞める人めっちゃ多いイメージあるけど、もう習慣になってる感じ？」

【マッチングアプリ会話ルール（必須）】
1. 【絶対条件】質問を必ず1つだけ入れる。例外なし。質問がない返信は不合格。2つ以上は尋問になるのでNG。
2. 質問の型：「なんで？」「理由は？」など答えにくい質問は禁止。代わりに以下の型を使う。
   - 「〜っていつから？」（時期を聞く）
   - 「〜だったら△と□どっち？」（二択で選ばせる）
   - 「〜って行ったことある？」（経験を聞く）
   - 「〜のどんなところが好き？」（好みを深掘り）
3. 相手が話した具体的なエピソードや単語を1つ拾って反応する（ちゃんと読んでる感を出す）。
4. 自分のことも少し混ぜる（聞くだけでなく自己開示で対等感を出す）。
5. 褒めすぎ禁止：「すごい！」「えー！」の連発はNG。1回までに抑える。
6. ハート絵文字（❤️💕😍）は使わない。重く見える。

【絶対禁止】
- 相手のメッセージをそのまま・または少し変えて繰り返すのは絶対NG。例：相手「料理男子だったんですね」→自分「料理男子だったんですね！」はNG。
- 相手の言葉を引用・オウム返しせず、必ず自分の言葉で「次の話題・反応・質問」を返すこと。

【共通ルール】
- 相手との関係は始まったばかりを前提に、馴れ馴れしくしすぎない。
- 自然な日本語で、不自然な敬語や硬い表現は避ける。

必ず以下のJSON形式のみで返してください（マークダウンや説明文は不要）：
{
  "situation": "会話の状況を1〜2文で",
  "replies": [
    { "message": "返信文1", "reason": "このパターンを選ぶ理由を10文字以内で" },
    { "message": "返信文2", "reason": "このパターンを選ぶ理由を10文字以内で" },
    { "message": "返信文3", "reason": "このパターンを選ぶ理由を10文字以内で" }
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    const { image, mediaType, profile, text, tone, history, mode, area } = await req.json();
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
      const profileSection = safeProfile
        ? `\n\n【自分のプロフィール】\n${safeProfile}`
        : "";
      const areaSection = safeArea
        ? `\n\n【エリア指定】${safeArea}周辺で提案してください。`
        : "";
      systemPrompt = DATE_PROMPT + profileSection + areaSection;
      userInstruction = "このスクリーンショットの会話を分析して、デートコースを3つ提案してください。";
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
