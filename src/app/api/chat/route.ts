import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const TABLE = "chat_messages";
const AI_MODEL = "gpt-4o-mini";

const SYSTEM_PROMPT = `Sən "Aysel" adlı müştəri xidmətləri əməkdaşısan. Sən real insansan, süni intellekt deyilsən.
Şirkət sağlam həyat tərzi və qida əlavələri (Herbalife) satışı ilə məşğuldur.

Qaydalar:
- Həmişə Azərbaycan dilində cavab ver.
- Qısa, səmimi və yardımsevər ol. Mesajlar 2-3 cümlədən çox olmasın.
- Əgər sual məhsullar haqqındadırsa, ümumi məlumat ver və "Məhsullar" səhifəsinə yönləndir.
- Çatdırılma haqqında sual olsa: "Bakı daxilində 1-2 iş günü, regionlara 3-5 iş günü ərzində çatdırılır" de.
- Ödəniş haqqında sual olsa: "Nağd, bank kartı və onlayn ödəniş qəbul edirik" de.
- Qaytarma haqqında sual olsa: "Açılmamış məhsulları 14 gün ərzində qaytara bilərsiniz" de.
- Proqramlar haqqında sual olsa: qısa məlumat ver və "Proqramlar" səhifəsinə yönləndir.
- Endirim haqqında sual olsa: "Mövsümi endirimlərimiz olur. Əsas səhifəni izləyin və ya bizimlə əlaqə saxlayın" de.
- Emoji istifadə et amma çox deyil. Təbii söhbət tonu saxla.
- Heç vaxt "Mən süni intellektəm" demə. Sən Aysel adlı real insansan.`;

async function getAIResponse(userMessage: string, conversationHistory: { role: string; content: string }[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    // Fallback responses when no API key
    const lowerMsg = userMessage.toLowerCase();
    if (lowerMsg.includes("çatdırılma") || lowerMsg.includes("çatdırma") || lowerMsg.includes("gəlir")) {
      return "Bakı daxilində 1-2 iş günü, regionlara isə 3-5 iş günü ərzində çatdırılır 📦 Əlavə sualınız varsa yazın!";
    }
    if (lowerMsg.includes("ödəniş") || lowerMsg.includes("ödəmə") || lowerMsg.includes("kart")) {
      return "Nağd, bank kartı və onlayn ödəniş qəbul edirik 💳 Sizə başqa necə kömək edə bilərəm?";
    }
    if (lowerMsg.includes("qaytarma") || lowerMsg.includes("geri")) {
      return "Açılmamış məhsulları 14 gün ərzində qaytara bilərsiniz ✅ Ətraflı məlumat üçün bizimlə əlaqə saxlayın.";
    }
    if (lowerMsg.includes("proqram") || lowerMsg.includes("qoşul")) {
      return "Bizim fərdi qidalanma proqramlarımız var! 💪 'Proqramlar' səhifəsindən ətraflı baxa bilərsiniz. Sizə uyğun olanını birlikdə seçə bilərik.";
    }
    if (lowerMsg.includes("endirim") || lowerMsg.includes("kampaniya") || lowerMsg.includes("aksiya")) {
      return "Mövsümi endirimlərimiz olur 🎉 Əsas səhifəni izləyin və ya mənə yazın, yeni kampaniyalar haqqında sizə məlumat verərəm!";
    }
    if (lowerMsg.includes("məhsul") || lowerMsg.includes("istifadə")) {
      return "Məhsullarımız haqqında ətraflı məlumatı 'Məhsullar' səhifəsindən əldə edə bilərsiniz 🌿 Hər məhsulun istifadə qaydası orada yazılıb. Konkret məhsul haqqında soruşa bilərsiniz!";
    }
    if (lowerMsg.includes("salam") || lowerMsg.includes("merhaba") || lowerMsg.includes("hey")) {
      return "Salam! 😊 Xoş gəlmisiniz! Sizə necə kömək edə bilərəm?";
    }
    return "Təşəkkür edirəm sualınız üçün! 😊 Sizə daha yaxşı kömək edə bilmək üçün bir az ətraflı yaza bilərsiniz? Məhsullar, sifarişlər və ya proqramlar haqqında suallarınız varsa buyurun!";
  }

  try {
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory.slice(-10), // Last 10 messages for context
      { role: "user", content: userMessage },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI error:", await response.text());
      return "Təşəkkür edirəm sualınız üçün! Bir az sonra sizə cavab verəcəyəm 😊";
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const content = data.choices?.[0]?.message?.content?.trim();
    return content || "Sualınız üçün təşəkkür edirəm! Sizə tezliklə cavab verəcəyəm 😊";
  } catch (err) {
    console.error("AI response error:", err);
    return "Təşəkkür edirəm! Mütəxəssis sizinlə tezliklə əlaqə saxlayacaq 😊";
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId") || "";
  const mode = url.searchParams.get("mode") || "";

  const supabase = await getSupabaseServerClient();

  if (mode === "sessions") {
    // Check for admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
      
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from(TABLE)
      .select("session_id, message, sender_type, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const bySession: Record<
      string,
      { sessionId: string; lastMessage: string; lastSender: string; lastAt: string }
    > = {};
    for (const row of data || []) {
      const s = String((row as { session_id: unknown }).session_id ?? "");
      if (!s) continue;
      if (!bySession[s]) {
        const m = row as {
          message?: unknown;
          sender_type?: unknown;
          created_at?: unknown;
        };
        bySession[s] = {
          sessionId: s,
          lastMessage: typeof m.message === "string" ? m.message : "",
          lastSender: typeof m.sender_type === "string" ? m.sender_type : "",
          lastAt: String(m.created_at ?? ""),
        };
      }
    }
    return NextResponse.json(Object.values(bySession), { status: 200 });
  }

  if (!sessionId) {
    return NextResponse.json({ messages: [] }, { status: 200 });
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ messages: data ?? [] }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const sessionId =
    typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  const message =
    typeof body.message === "string" ? body.message.trim() : "";
  
  let sender = "user";
  const supabase = await getSupabaseServerClient();

  // Only allow admin sender if authenticated as admin
  if (typeof body.sender === "string" && body.sender === "admin") {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      
      if (profile && profile.role === "admin") {
        sender = "admin";
      }
    }
  }

  if (!sessionId || !message) {
    return NextResponse.json(
      { error: "sessionId and message are required" },
      { status: 400 }
    );
  }

  // Save user message
  const payload = {
    session_id: sessionId,
    message,
    sender_type: sender,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Message send failed" },
      { status: 500 }
    );
  }

  // If the sender is user, generate AI response asynchronously
  if (sender === "user") {
    // Don't await - let it run in the background so user gets immediate response
    (async () => {
      try {
        // Fetch conversation history for context
        const { data: history } = await supabase
          .from(TABLE)
          .select("message, sender_type")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true })
          .limit(20);

        const conversationHistory = (history || []).map((h: any) => ({
          role: h.sender_type === "user" ? "user" : "assistant",
          content: h.message,
        }));

        // Add a small delay for realistic typing effect
        await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 2000));

        const aiResponse = await getAIResponse(message, conversationHistory);

        // Save AI response
        await supabase.from(TABLE).insert({
          session_id: sessionId,
          message: aiResponse,
          sender_type: "admin",
        });
      } catch (err) {
        console.error("AI auto-response error:", err);
      }
    })();
  }

  return NextResponse.json(data, { status: 201 });
}
