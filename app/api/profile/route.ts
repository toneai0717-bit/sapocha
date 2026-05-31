import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "../../lib/rate-limit";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
const genAI = new GoogleGenerativeAI(apiKey);

const SYSTEM_PROMPT = `あなたは日本のマッチングアプリで実績のあるプロフィールライターです。
マッチング率・返信率を最大化するプロフィール文を3パターン作成してください。

━━━━━━━━━━━━━━━━━━━━━━
【女性がいいねを押す・返信するプロフィールの法則】
━━━━━━━━━━━━━━━━━━━━━━

◎ 絶対に入れること
1. 抽象的な表現を避け、具体的なエピソードで書く（「スノボが好き」→「去年長野まで行ってきました！」のように情景が浮かぶ書き方）
2. 現在進行形の情報（「今〇〇にはまってます」が一番刺さる）
3. 返信したくなるフック（「おすすめあれば教えてください！」「語れます笑」）
4. 思わず笑えるか共感できる一文（読んでて「あ、この人面白い」と思わせる）
5. 一緒にいる未来が想像できる描写（「一緒に〇〇行けたら楽しそう」）
6. 犬・猫が好きな場合は必ず自然に盛り込む（女性ウケ最強ワード）

◎ 文体の大原則（最重要）
- プロフィール文は必ず「です・ます調」をベースにすること
- 「話し方・口調」に関西弁やタメ口などが入力されていても、プロフィール本文には使わない
- ただし個性を出すため、ポイントで自然な一言（「〜なんです」「〜ですよね笑」など）は可
- 返信サポートや会話では口調を反映するが、プロフィール文は相手に好印象を与えることが最優先

◎ 絶対に避けること
- 「誠実に向き合います」「真剣に考えています」→ 抽象的すぎて伝わらない
- 「普通の男です」「平凡です」→ 自己評価が低く見える
- 「傷つけません」「大切にします」→ 女性が警戒する表現
- 趣味の羅列だけ（「読書・映画・スポーツが好きです」）→ 記憶に残らない
- 長すぎる文章・改行なしの塊→ 読まれない

◎ 女性が「いいね」を押す瞬間
- 「この趣味、私も好き！話しかけやすそう」
- 「なんか面白そうな人だな笑」
- 「一緒にいたら楽しそう」
- 「この人なら安心して話せそう」

━━━━━━━━━━━━━━━━━━━━━━
【アプリ別トーン】
━━━━━━━━━━━━━━━━━━━━━━
- Omiai：結婚を意識した誠実さが伝わる文体。将来への前向きさを自然に盛り込む。
  冒頭「プロフィールを見てくださりありがとうございます！\n{名前}と申します。」末尾「よろしくお願いします！」
- Pairs / with：丁寧で真面目さが伝わる文体。
  冒頭「プロフィールを見ていただきありがとうございます！\n{名前}です！」末尾「よろしくお願いします！」
- タップル / Tinder：明るくカジュアル。定型挨拶不要。自然な入り方で。
- その他：親しみやすい標準的な文体。挨拶なくてよい。

━━━━━━━━━━━━━━━━━━━━━━
【レイアウトルール（最重要）】
━━━━━━━━━━━━━━━━━━━━━━
- 趣味は「□趣味・好きなこと」の見出しをつけて「・項目｜エピソード」形式で箇条書き
- セクション間は必ず1行空白
- 1段落は3〜4行以内
- 全体200〜380文字（長すぎると読まれない）
- スマホの縦スクロールで読まれる前提で、パッと見て読みやすく

━━━━━━━━━━━━━━━━━━━━━━
【生成プロセス（必ず守ること）】
━━━━━━━━━━━━━━━━━━━━━━
各パターンを生成したら、出力前に必ず以下を自問すること：
1. 「このプロフィールを見た女性は返信したくなるか？」
2. 「具体的なエピソードと数字が入っているか？」
3. 「返信したくなるフックが最低1つあるか？」
4. 「読んで笑えるか共感できる一文があるか？」
5. 「その人らしいキャラクターが滲み出ているか？」

上記5点が揃っていない場合は書き直してから出力すること。

【3パターンの違い】
- 誠実系：落ち着いたトーン。真面目さ・誠実さが伝わる。将来を意識した女性に刺さる。
- 親しみやすい系：自然な話し言葉。テンポよく読める。話しかけやすい雰囲気。
- フレンドリー系：明るく少し笑いがある。読んでいて楽しい。返信ハードルが下がる。

必ず以下のJSON形式のみで返してください：
{
  "profiles": [
    {
      "type": "誠実系",
      "text": "プロフィール本文",
      "hooks": ["このプロフィールの返信フック1", "フック2", "フック3"]
    },
    {
      "type": "親しみやすい系",
      "text": "プロフィール本文",
      "hooks": ["このプロフィールの返信フック1", "フック2", "フック3"]
    },
    {
      "type": "フレンドリー系",
      "text": "プロフィール本文",
      "hooks": ["このプロフィールの返信フック1", "フック2", "フック3"]
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
      name, age, job, area, hobbies,
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
    const safeName = typeof name === "string" ? name.trim().slice(0, 20) : "";
    const safeFirstPerson = typeof firstPerson === "string" ? firstPerson.trim().slice(0, 10) : "";
    const safeDialect = typeof dialect === "string" ? dialect.trim().slice(0, 50) : "";

    if (!safeAge && !safeJob && !safeHobbies) {
      return NextResponse.json({ error: "情報を入力してください" }, { status: 400 });
    }

    const userMessage = [
      safeName && `名前・ニックネーム：${safeName}`,
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

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent(
      `以下の情報でプロフィール文を3パターン作成してください。\n\n${userMessage}`
    );

    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "生成に失敗しました" }, { status: 500 });
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ error: "生成に失敗しました" }, { status: 500 });
    }
  } catch (error) {
    console.error("Profile API error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
