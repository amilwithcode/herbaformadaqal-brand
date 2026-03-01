import { NextResponse } from "next/server";

const MODEL = "gpt-4o-mini";

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Süni intellekt hazırda konfiqurasiya olunmayıb. Zəhmət olmasa OpenAI açarını əlavə edin.",
      },
      { status: 500 }
    );
  }

  const body = await req.json();
  const genderRaw = typeof body.gender === "string" ? body.gender : "male";
  const gender = genderRaw === "female" ? "female" : "male";
  const heightCm = Number(body.heightCm);
  const weightKg = Number(body.weightKg);
  const localeRaw =
    typeof body.locale === "string" ? body.locale.toLowerCase() : "az";
  const locale: "az" | "en" | "ru" | "tr" =
    localeRaw === "en" || localeRaw === "ru" || localeRaw === "tr"
      ? localeRaw
      : "az";

  if (!heightCm || !weightKg || heightCm < 100 || heightCm > 250) {
    return NextResponse.json(
      { error: "Məlumatlar düzgün deyil. Boy və çəkini yenidən yoxlayın." },
      { status: 400 }
    );
  }

  const languageName =
    locale === "en"
      ? "English"
      : locale === "ru"
      ? "Russian"
      : locale === "tr"
      ? "Turkish"
      : "Azerbaijani";

  const genderText =
    locale === "en"
      ? gender === "male"
        ? "male"
        : "female"
      : locale === "ru"
      ? gender === "male"
        ? "мужчина"
        : "женщина"
      : locale === "tr"
      ? gender === "male"
        ? "erkek"
        : "kadın"
      : gender === "male"
      ? "kişi"
      : "qadın";

  const prompt = [
    "You are a professional dietitian and health advisor.",
    "The user has provided gender, height and weight.",
    "Your task:",
    "1) Estimate a healthy target weight in kilograms based on BMI.",
    "2) Compute approximately how many kilograms difference there is from the current weight.",
    "3) Write a short, motivating recommendation text:",
    "   - Encourage healthy weight management.",
    "   - Give general advice on nutrition and daily activity.",
    "   - Optionally suggest getting help from nutrition products and experts.",
    "",
    `IMPORTANT: Answer ONLY in ${languageName}.`,
    "Output format MUST be pure JSON, no extra text.",
    'Example: {\"targetWeightKg\": 68, \"differenceKg\": 7, \"message\": \"...\"}',
  ].join("\n");

  const userMessage = `Gender: ${genderText}.
Height: ${heightCm} cm.
Weight: ${weightKg} kg.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: "Süni intellekt cavabı alınmadı.", details: text },
        { status: 500 }
      );
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const content = data.choices?.[0]?.message?.content || "";

    let parsed: {
      targetWeightKg?: number;
      differenceKg?: number;
      message?: string;
    };

    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: "Süni intellektdən düzgün cavab alınmadı." },
        { status: 500 }
      );
    }

    const targetWeightKg =
      typeof parsed.targetWeightKg === "number" && parsed.targetWeightKg > 0
        ? parsed.targetWeightKg
        : null;

    const differenceKg =
      typeof parsed.differenceKg === "number" ? parsed.differenceKg : null;

    const message =
      typeof parsed.message === "string" && parsed.message.trim()
        ? parsed.message.trim()
        : null;

    if (!targetWeightKg || !message) {
      return NextResponse.json(
        { error: "Süni intellektdən lazımi məlumat alınmadı." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        targetWeightKg,
        differenceKg,
        message,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Süni intellekt xidmətinə qoşulmaq mümkün olmadı." },
      { status: 500 }
    );
  }
}
