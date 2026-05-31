import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "../../lib/rate-limit";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
const genAI = new GoogleGenerativeAI(apiKey);

const ALLOWED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_BASE64_LENGTH = 5 * 1024 * 1024 * 1.4; // ~5MB after base64 overhead

const TOPICS_PROMPT = `あなたはデートコーチです。
相手のプロフィールまたは会話のスクリーンショットを見て、初デートで盛り上がる話題を5つ提案してください。

【読み取り方】
- プロフィールスクショの場合：趣味・仕事・自己紹介文・写真の雰囲気から相手の人柄を読む。
- 会話スクショの場合：右が自分、左が相手。会話の流れと相手の興味を読む。

【いい話題の条件】
- 相手が「話したくなる」テーマを選ぶ（相手の興味・経験に根ざしたもの）
- 対面ならではの話題（思い出・場所・食・体験）を優先する
- 一問一答で終わらず、お互いが話せる広がりのある話題
- 「実は自分も〜」と自己開示に繋げやすいもの

必ず以下のJSON形式のみで返してください：
{
  "situation": "相手の印象を1〜2文で",
  "topics": [
    { "title": "話題のタイトル", "starter": "デートでの最初の切り口（一言）", "why": "盛り上がる理由を10文字以内で" },
    { "title": "話題のタイトル", "starter": "デートでの最初の切り口（一言）", "why": "盛り上がる理由を10文字以内で" },
    { "title": "話題のタイトル", "starter": "デートでの最初の切り口（一言）", "why": "盛り上がる理由を10文字以内で" },
    { "title": "話題のタイトル", "starter": "デートでの最初の切り口（一言）", "why": "盛り上がる理由を10文字以内で" },
    { "title": "話題のタイトル", "starter": "デートでの最初の切り口（一言）", "why": "盛り上がる理由を10文字以内で" }
  ]
}`;

const DATE_PROMPT = `あなたはマッチングアプリのデートプランナーです。
入力された条件をもとに、デートコースを3つ＋当日盛り上がる話題を5つ提案してください。

【デートコースのルール】
- 何回目のデートかを考慮した雰囲気・場所を選ぶ。
- 会話の内容・相手の興味と連動させる。
- 「また行きたい」と思わせる締め方を意識する。
- エリアが指定されていればそのエリアで提案する。

【話題のルール】
- デートの場所・雰囲気に合った話題を選ぶ。
- 対面ならではの話題（思い出・場所・食・体験）を優先する。
- 一問一答で終わらず、お互いが話せる広がりのある話題。

必ず以下のJSON形式のみで返してください：
{
  "situation": "条件から読み取った今回のデートの雰囲気を1〜2文で",
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
  ],
  "topics": [
    { "title": "話題のタイトル", "starter": "デートでの最初の切り口（一言）", "why": "盛り上がる理由を10文字以内で" },
    { "title": "話題のタイトル", "starter": "デートでの最初の切り口（一言）", "why": "盛り上がる理由を10文字以内で" },
    { "title": "話題のタイトル", "starter": "デートでの最初の切り口（一言）", "why": "盛り上がる理由を10文字以内で" },
    { "title": "話題のタイトル", "starter": "デートでの最初の切り口（一言）", "why": "盛り上がる理由を10文字以内で" },
    { "title": "話題のタイトル", "starter": "デートでの最初の切り口（一言）", "why": "盛り上がる理由を10文字以内で" }
  ]
}`;

const PHOTO_PROMPT = `あなたはマッチングアプリの写真コーチです。
アップロードされたプロフィール写真を診断し、以下の観点で正直に評価してください。

【評価観点】
- 清潔感（髪・服・肌の印象）
- 表情（笑顔・親しみやすさ・目力）
- 背景・構図（整理されているか・映える環境か）
- 1枚目向きかどうか（第一印象・インパクト）
- 日常感・親しみやすさ（自然体かどうか）

【判定基準】
- 1枚目向き：第一印象が良く、プロフィールのメイン写真として最適
- サブ向き：趣味・日常感を伝えるのに適しているが1枚目には向かない
- やめとけ：使わない方がいい（明確な理由あり）

複数枚ある場合は各写真を個別に評価してください。
スコアは100点満点で、女性目線での好感度として正直につけること。

必ず以下のJSON形式のみで返してください：
{
  "overall": "全体的なアドバイスを1〜2文で",
  "photos": [
    {
      "verdict": "1枚目向き",
      "score": 85,
      "goods": ["清潔感がある", "笑顔が自然"],
      "bads": ["背景が少し暗い"],
      "advice": "光の当たる場所で撮ればさらに良くなります"
    }
  ]
}`;

const FIRST_MESSAGE_PROMPT = `あなたは日本のマッチングアプリのプロコーチです。
マッチング直後のファーストメッセージを3パターン提案してください。

【ファーストメッセージの鉄則】
- 「はじめまして！よろしくお願いします！」だけはNG。返信を相手に丸投げになる。
- いきなりタメ口・呼び捨てはNG。「チャラそう」と思われて一発アウト。
- 長文すぎる日記もNG。最初から熱量が重すぎると引かれる。
- 「なぜいいねしたのか」を必ず入れる（プロフィールをちゃんと読んだことが伝わる）
- 相手が返しやすい質問を1つだけ入れる
- 敬語ベースで、でも堅すぎない自然なトーン

【良い構成】
「共感・気づき（プロフィールのここが刺さった）＋自分のエピソード少し＋返しやすい質問」

【良い例】
例1（共通の趣味）：「〇〇さん、はじめまして！プロフィール読んで、カフェ巡りが好きって書いてあって嬉しくなりました笑 僕も休日よくカフェ開拓してるんですよね。最近お気に入りのお店とかありますか？😊」
例2（食・写真から）：「はじめまして！写真のパスタ、めちゃくちゃ美味しそうで思わずいいねしました笑 僕も食べ歩き好きなんですが、これってどこのお店ですか？ぜひ教えてほしいです！」
例3（誠実さ重視）：「はじめまして！〇〇さんのプロフィール読んで、休日の過ごし方の価値観が近そうだなと思っていいねしました。まずは色々お話しできたら嬉しいです、よろしくお願いします！ちなみに最近の週末はどんな感じで過ごされてますか？」

3つは必ず異なる切り口で作ること：
- 案1：共通の趣味・好きなものから入る
- 案2：写真や具体的なプロフィールの一言に反応する
- 案3：相手の雰囲気・価値観への共感から入る

必ず以下のJSON形式のみで返してください（説明文不要）：
{
  "situation": "相手のプロフィールから読み取った印象を1〜2文で",
  "replies": [
    { "message": "ファーストメッセージ本文", "reason": "特徴を10文字以内で" },
    { "message": "ファーストメッセージ本文", "reason": "特徴を10文字以内で" },
    { "message": "ファーストメッセージ本文", "reason": "特徴を10文字以内で" }
  ]
}`;

const SYSTEM_PROMPT = `あなたは日本のマッチングアプリのプロコーチです。
会話のスクリーンショットを見て、相手が「返信したくなる」自然なメッセージを3つ提案してください。

【読み取り方】
- 画面の右が自分、左が相手。
- 相手が複数メッセージを送っている場合は、すべての内容を読んで会話全体の流れを把握した上で返信を考える。

【いい返信の4条件】
1. 相手のメッセージ量に合わせた長さにする。相手が長く書いてきたら同程度以上、短ければ短めに。絶対に相手より極端に短くしない。
2. 相手の言葉の中で拾えるものは積極的に複数拾って反応する（1つに絞らなくていい）
3. 答えやすい質問を1つだけ入れる
4. 自分のことも少し混ぜて対等な会話にする

【良い例と悪い例】
相手「最近ジム通い始めました😊」
悪い例：「えすごい！何のトレーニングしてるんですか？」
良い例：「ジムって最初の1ヶ月が一番しんどいですよね笑 もう習慣になってきた感じ？私も行こうか迷ってるんですよね〜」

3つは必ず異なる切り口で作ること：
- 案1：相手の言葉を拾って共感から入る
- 案2：自分の話から入って相手に質問を投げる
- 案3：軽いツッコミ・笑いから入って距離を縮める

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
    const { images, profile, contactProfile, text, tone, history, mode, area, dateTime, dateDuration, dateInterests, dateBudget, dateNumber } = body;

    const safeMode = ["reply", "firstMessage", "topics", "date", "photo"].includes(mode as string) ? (mode as string) : "reply";

    const safeImages = Array.isArray(images)
      ? images
          .filter(
            (img) =>
              typeof img?.data === "string" &&
              img.data.length < MAX_BASE64_LENGTH &&
              ALLOWED_MEDIA_TYPES.has(img.mediaType)
          )
          .slice(0, 5)
      : [];

    const safeProfile = typeof profile === "string" ? profile.trim().slice(0, 500) : "";
    const safeContactProfile = typeof contactProfile === "string" ? contactProfile.trim().slice(0, 500) : "";
    const contactProfileSection = safeContactProfile ? `\n\n【相手のプロフィール】\n${safeContactProfile}` : "";
    const safeTone = ["自然", "盛り上げる", "積極的"].includes(tone as string) ? (tone as string) : "自然";
    const safeArea = typeof area === "string" ? area.trim().slice(0, 50) : "";
    const safeHistory = typeof history === "string" ? history.trim().slice(0, 3000) : "";

    const noInput = safeImages.length === 0 && !text;
    const inputRequired = safeMode !== "date" && safeMode !== "firstMessage" && !(safeMode === "topics" && safeHistory) && safeMode !== "photo" || (safeMode === "photo" && safeImages.length === 0);
    if (noInput && inputRequired) {
      return NextResponse.json({ error: "画像またはテキストがありません" }, { status: 400 });
    }
    if (text && typeof text === "string" && text.trim().length < 5) {
      return NextResponse.json({ error: "会話が短すぎます" }, { status: 400 });
    }

    let systemPrompt: string;
    let userInstruction: string;

    if (safeMode === "firstMessage") {
      const profileSection = safeProfile
        ? `\n\n【自分のプロフィール】\n${safeProfile}\nファーストメッセージはこの人物の性格・話し方に合わせてください。`
        : "";
      systemPrompt = FIRST_MESSAGE_PROMPT + profileSection + contactProfileSection;
      userInstruction = safeContactProfile
        ? "上記の相手のプロフィールをもとに、ファーストメッセージを3パターン提案してください。"
        : "ファーストメッセージを3パターン提案してください。";
      const model2 = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: systemPrompt });
      const result2 = await model2.generateContent(userInstruction);
      return parseAndReturn(result2.response.text());
    } else if (safeMode === "photo") {
      systemPrompt = PHOTO_PROMPT;
      userInstruction =
        safeImages.length > 1
          ? `${safeImages.length}枚の写真を1枚ずつ診断してください。`
          : "この写真を診断してください。";
    } else if (safeMode === "topics") {
      const safeDateNumber = typeof dateNumber === "string" ? dateNumber.slice(0, 10) : "1回目";
      const profileSection = safeProfile ? `\n\n【自分のプロフィール】\n${safeProfile}` : "";
      const historySection = safeHistory ? `\n\n【これまでの会話履歴】\n${safeHistory}` : "";
      const dateNumberGuide =
        safeDateNumber === "1回目"
          ? "初対面なので、趣味・仕事・出身・ライフスタイルなど自己開示と相手を知る話題を中心に提案してください。"
          : safeDateNumber === "2回目"
          ? "2回目なので、価値観・恋愛観・家族・将来観など、より深い相互開示につながる話題を提案してください。"
          : "3回目以降なので、関係性をさらに深める話題・共通の将来像・次のステップへの布石になる話題を提案してください。";
      systemPrompt = TOPICS_PROMPT + profileSection + contactProfileSection + historySection + `\n\n【デートの回数】${safeDateNumber}：${dateNumberGuide}`;
      userInstruction =
        safeImages.length > 0
          ? `このスクリーンショットを参考に、${safeDateNumber}のデートで盛り上がる話題を5つ提案してください。`
          : `会話履歴をもとに、${safeDateNumber}のデートで盛り上がる話題を5つ提案してください。`;
    } else if (safeMode === "date") {
      const safeDateTime = typeof dateTime === "string" ? dateTime.slice(0, 10) : "夕方";
      const safeDateDuration = typeof dateDuration === "string" ? dateDuration.slice(0, 10) : "半日";
      const safeDateInterests = typeof dateInterests === "string" ? dateInterests.slice(0, 200) : "";
      const safeDateBudget = typeof dateBudget === "string" ? dateBudget.slice(0, 20) : "";
      const safeDateNumber = typeof dateNumber === "string" ? dateNumber.slice(0, 10) : "1回目";
      const profileSection = safeProfile ? `\n\n【自分のプロフィール】\n${safeProfile}` : "";
      const dateNumberGuide =
        safeDateNumber === "1回目"
          ? "初デートなので緊張しすぎず会話が弾む場所を優先。重すぎず軽すぎないコースにする。"
          : safeDateNumber === "2回目"
          ? "2回目なので少し距離を縮める雰囲気のある場所。より二人の時間を楽しめるコースにする。"
          : "3回目以降。お付き合いの申し込みも想定したコース設計にする。自然と二人きりになれる静かな場所・夜景や雰囲気のある場所を必ず含め、告白のタイミングが作れるシチュエーションを意識する。賑やかすぎる場所は避ける。";
      const condSection = [
        `何回目のデート：${safeDateNumber}（${dateNumberGuide}）`,
        safeArea && `エリア：${safeArea}`,
        `時間帯：${safeDateTime}`,
        `デートの長さ：${safeDateDuration}`,
        safeDateInterests && `相手の好きなもの・こと：${safeDateInterests}`,
        safeDateBudget && `予算（おひとり様）：${safeDateBudget}`,
      ]
        .filter(Boolean)
        .join("\n");
      const spotCount =
        safeDateDuration === "ランチのみ" ? "1〜2箇所" : safeDateDuration === "一日" ? "4〜5箇所" : "2〜3箇所";
      systemPrompt = DATE_PROMPT + profileSection + contactProfileSection + `\n\n【デート条件】\n${condSection}`;
      userInstruction = `上記の条件でデートコースを3つ提案してください。デートの長さに合わせてスポット数は${spotCount}にし、各スポットに目安費用とコース合計費用を含めてください。`;
    } else {
      const profileSection = safeProfile
        ? `\n\n【送信者のプロフィール】\n${safeProfile}\n返信はこの人物の性格・話し方に合わせてください。`
        : "";
      const toneDefinitions: Record<string, string> = {
        "自然": "普通の友達に話しかけるような自然なトーン。力みすぎず、かつ失礼にもならない絶妙な距離感。",
        "盛り上げる": "テンションを上げて会話を弾ませるトーン。リアクションを大きめにして、相手が返信したくなるノリの良さを出す。",
        "積極的": "好意を相手に伝えつつデートに誘う方向に持っていくトーン。「会いたい」「一緒に行きたい」という気持ちを自然に盛り込む。押しつけがましくならない程度に。",
      };
      const toneSection = `\n\n【指定トーン】「${safeTone}」：${toneDefinitions[safeTone] ?? ""}`;
      const historySection = safeHistory
        ? `\n\n【これまでの会話の流れ（記憶）】\n${safeHistory}\n上記を踏まえ、すでに話したトピックの繰り返しを避け、会話を自然に発展させること。`
        : "";
      systemPrompt = SYSTEM_PROMPT + profileSection + contactProfileSection + toneSection + historySection;
      userInstruction = "このスクリーンショットの会話を分析して、返信案を3つ提案してください。";
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    });

    if (safeMode === "date" || (safeMode === "topics" && safeImages.length === 0)) {
      const result = await model.generateContent(userInstruction);
      return parseAndReturn(result.response.text());
    }

    const contentParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    if (safeImages.length > 0) {
      for (const img of safeImages) {
        contentParts.push({
          inlineData: {
            mimeType: img.mediaType as string,
            data: img.data as string,
          },
        });
      }
    }

    const instructionText =
      safeImages.length > 1
        ? `${userInstruction}（${safeImages.length}枚のスクショを順番に読んでください）`
        : safeImages.length === 0
        ? `${userInstruction}\n\n【会話】\n${(text as string).trim().slice(0, 2000)}`
        : userInstruction;

    contentParts.push({ text: instructionText });

    const result = await model.generateContent({ contents: [{ role: "user", parts: contentParts }] });
    return parseAndReturn(result.response.text());

  } catch (error) {
    console.error("API error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

function parseAndReturn(responseText: string): NextResponse {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "解析に失敗しました" }, { status: 500 });
  }
  try {
    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "解析に失敗しました" }, { status: 500 });
  }
}
