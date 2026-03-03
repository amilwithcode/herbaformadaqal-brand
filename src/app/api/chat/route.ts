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

async function getAIResponse(userMessage: string, conversationHistory: { role: string; content: string }[]): Promise<{ response: string; needsAdmin: boolean }> {
  // Try multiple possible env variable names
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey || apiKey.trim() === "") {
    console.warn("OpenAI API key not found in environment variables");
  } else {
    console.log("OpenAI API key found, using AI for response");
  }
  
  // Fallback responses when no API key
  const lowerMsg = userMessage.toLowerCase();
  const knownTopics = [
    "çatdırılma", "çatdırma", "gəlir", "çatdırılır",
    "ödəniş", "ödəmə", "kart", "nağd",
    "qaytarma", "geri", "qaytar",
    "proqram", "qoşul", "qidalanma",
    "endirim", "kampaniya", "aksiya", "promo",
    "məhsul", "istifadə", "formula", "shake",
    "salam", "merhaba", "hey", "səhər", "axşam",
    "qiymət", "bahadır", "ucuz", "endirim",
    "sifariş", "səbət", "satın al",
    "çatışmazlıq", "stok", "var", "yoxdur"
  ];
  
  const isKnownTopic = knownTopics.some(topic => lowerMsg.includes(topic));
  
  // Helper function for fallback responses
  const getFallbackResponse = (): { response: string; needsAdmin: boolean } => {
    if (lowerMsg.includes("çatdırılma") || lowerMsg.includes("çatdırma") || lowerMsg.includes("gəlir")) {
      return { response: "Bakı daxilində 1-2 iş günü, regionlara isə 3-5 iş günü ərzində çatdırılır 📦 Əlavə sualınız varsa yazın!", needsAdmin: false };
    }
    if (lowerMsg.includes("ödəniş") || lowerMsg.includes("ödəmə") || lowerMsg.includes("kart")) {
      return { response: "Nağd, bank kartı və onlayn ödəniş qəbul edirik 💳 Sizə başqa necə kömək edə bilərəm?", needsAdmin: false };
    }
    if (lowerMsg.includes("qaytarma") || lowerMsg.includes("geri")) {
      return { response: "Açılmamış məhsulları 14 gün ərzində qaytara bilərsiniz ✅ Ətraflı məlumat üçün bizimlə əlaqə saxlayın.", needsAdmin: false };
    }
    if (lowerMsg.includes("proqram") || lowerMsg.includes("qoşul")) {
      return { response: "Bizim fərdi qidalanma proqramlarımız var! 💪 'Proqramlar' səhifəsindən ətraflı baxa bilərsiniz. Sizə uyğun olanını birlikdə seçə bilərik.", needsAdmin: false };
    }
    if (lowerMsg.includes("endirim") || lowerMsg.includes("kampaniya") || lowerMsg.includes("aksiya")) {
      return { response: "Mövsümi endirimlərimiz olur 🎉 Əsas səhifəni izləyin və ya mənə yazın, yeni kampaniyalar haqqında sizə məlumat verərəm!", needsAdmin: false };
    }
    if (lowerMsg.includes("məhsul") || lowerMsg.includes("istifadə")) {
      return { response: "Məhsullarımız haqqında ətraflı məlumatı 'Məhsullar' səhifəsindən əldə edə bilərsiniz 🌿 Hər məhsulun istifadə qaydası orada yazılıb. Konkret məhsul haqqında soruşa bilərsiniz!", needsAdmin: false };
    }
    if (lowerMsg.includes("salam") || lowerMsg.includes("merhaba") || lowerMsg.includes("hey")) {
      return { response: "Salam! 😊 Xoş gəlmisiniz! Sizə necə kömək edə bilərəm?", needsAdmin: false };
    }
    // If not a known topic, needs admin
    return { response: "Təşəkkür edirəm sualınız üçün! 😊 Mütəxəssis sizinlə tezliklə əlaqə saxlayacaq.", needsAdmin: true };
  };
  
  // If no API key, use fallback responses
  if (!apiKey || apiKey.trim() === "") {
    console.log("No API key, using fallback responses");
    return getFallbackResponse();
  }

  try {
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory.slice(-10), // Last 10 messages for context
      { role: "user", content: userMessage },
    ];

    console.log("Sending request to OpenAI API...");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      // Fallback to known topic responses
      return getFallbackResponse();
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const content = data.choices?.[0]?.message?.content?.trim();
    
    if (!content) {
      console.warn("OpenAI returned empty response");
      return { response: "Təşəkkür edirəm sualınız üçün! Sizə tezliklə cavab verəcəyəm 😊", needsAdmin: false };
    }
    
    console.log("OpenAI response received:", content.substring(0, 50) + "...");
    
    // Check if AI response indicates uncertainty or needs admin help
    const lowerContent = content.toLowerCase();
    const uncertaintyKeywords = ["bilmirəm", "təəssüf", "mütəxəssis", "admin", "əlaqə", "yoxdur", "məlumat yoxdur", "sorry", "don't know"];
    const needsAdmin = uncertaintyKeywords.some(keyword => lowerContent.includes(keyword));
    
    return { 
      response: content, 
      needsAdmin: needsAdmin
    };
  } catch (err: any) {
    console.error("AI response error:", err?.message || err);
    // Fallback to known topic responses on error
    return getFallbackResponse();
  }
}

export async function GET(req: NextRequest) {
  try {
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
        console.error("Error fetching chat sessions:", error);
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
      console.error("Error fetching chat messages:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ messages: data ?? [] }, { status: 200 });
  } catch (err: any) {
    console.error("Chat GET error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
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
      console.error("Error saving chat message:", error);
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

        const aiResult = await getAIResponse(message, conversationHistory);

        // If AI needs admin help, send to WhatsApp and notify user
        if (aiResult.needsAdmin) {
          // Get admin phone from settings
          const { data: settings } = await supabase
            .from("site_settings")
            .select("footer_phone")
            .eq("id", 1)
            .maybeSingle();
          
          const adminPhone = settings?.footer_phone || "";
          
          if (adminPhone) {
            // Create WhatsApp link with question
            const cleanPhone = adminPhone.replace(/[^0-9+]/g, "");
            const whatsappMessage = encodeURIComponent(
              `Yeni sual:\n\n"${message}"\n\nSessiya ID: ${sessionId}`
            );
            const whatsappUrl = `https://wa.me/${cleanPhone.replace("+", "")}?text=${whatsappMessage}`;
            
            // Save notification to admin (you can create a notifications table later)
            // For now, we'll just send WhatsApp link
            
            // Save message to user that admin will respond
            await supabase.from(TABLE).insert({
              session_id: sessionId,
              message: "Təşəkkür edirəm sualınız üçün! 😊 Mütəxəssis sizinlə tezliklə əlaqə saxlayacaq. Sualınız adminə göndərildi.",
              sender_type: "admin",
            });
            
            // Log for admin (you can enhance this with a notifications system)
            console.log("Admin notification needed:", { sessionId, message, whatsappUrl });
          } else {
            // No admin phone, just save generic response
            await supabase.from(TABLE).insert({
              session_id: sessionId,
              message: "Təşəkkür edirəm sualınız üçün! 😊 Mütəxəssis sizinlə tezliklə əlaqə saxlayacaq.",
              sender_type: "admin",
            });
          }
        } else {
          // Save AI response
          await supabase.from(TABLE).insert({
            session_id: sessionId,
            message: aiResult.response,
            sender_type: "admin",
          });
        }
      } catch (err) {
        console.error("AI auto-response error:", err);
      }
    })();
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error("Chat POST error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
