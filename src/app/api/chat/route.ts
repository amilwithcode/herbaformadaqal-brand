import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const TABLE = "chat_messages";
const AI_MODEL = "gpt-4o-mini";

const getSystemPrompt = (locale: string = "az") => {
  const languageNames: Record<string, string> = {
    az: "Azərbaycan",
    en: "English",
    ru: "Русский",
    tr: "Türkçe",
  };
  
  const languageName = languageNames[locale] || "Azərbaycan";
  
  return `Sən "Aysel" adlı müştəri xidmətləri əməkdaşısan. Sən real insansan, süni intellekt deyilsən.
Şirkət sağlam həyat tərzi və qida əlavələri (Herbalife) satışı ilə məşğuldur.

Qaydalar:
- Həmişə ${languageName} dilində cavab ver. İstifadəçi hansı dildə sual verirsə, həmin dildə cavab ver.
- Qısa, səmimi və yardımsevər ol. Mesajlar 2-3 cümlədən çox olmasın.
- Əgər sual məhsullar haqqındadırsa, ümumi məlumat ver və "Məhsullar" səhifəsinə yönləndir.
- Çatdırılma haqqında sual olsa: "Bakı daxilində 1-2 iş günü, regionlara 3-5 iş günü ərzində çatdırılır" de (${languageName} dilində).
- Ödəniş haqqında sual olsa: "Nağd, bank kartı və onlayn ödəniş qəbul edirik" de (${languageName} dilində).
- Qaytarma haqqında sual olsa: "Açılmamış məhsulları 14 gün ərzində qaytara bilərsiniz" de (${languageName} dilində).
- Proqramlar haqqında sual olsa: qısa məlumat ver və "Proqramlar" səhifəsinə yönləndir (${languageName} dilində).
- Endirim haqqında sual olsa: "Mövsümi endirimlərimiz olur. Əsas səhifəni izləyin və ya bizimlə əlaqə saxlayın" de (${languageName} dilində).
- Emoji istifadə et amma çox deyil. Təbii söhbət tonu saxla.
- Heç vaxt "Mən süni intellektəm" demə. Sən Aysel adlı real insansan.
- Əgər istifadəçi başqa dildə sual verirsə (məsələn İngilis, Rus, Türk), həmin dildə cavab ver.`;
};

async function getAIResponse(userMessage: string, conversationHistory: { role: string; content: string }[], locale: string = "az"): Promise<{ response: string; needsAdmin: boolean }> {
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
  
  // Helper function for fallback responses based on locale
  const getFallbackResponse = (): { response: string; needsAdmin: boolean } => {
    const responses: Record<string, Record<string, string>> = {
      az: {
        delivery: "Bakı daxilində 1-2 iş günü, regionlara isə 3-5 iş günü ərzində çatdırılır 📦 Əlavə sualınız varsa yazın!",
        payment: "Nağd, bank kartı və onlayn ödəniş qəbul edirik 💳 Sizə başqa necə kömək edə bilərəm?",
        return: "Açılmamış məhsulları 14 gün ərzində qaytara bilərsiniz ✅ Ətraflı məlumat üçün bizimlə əlaqə saxlayın.",
        program: "Bizim fərdi qidalanma proqramlarımız var! 💪 'Proqramlar' səhifəsindən ətraflı baxa bilərsiniz. Sizə uyğun olanını birlikdə seçə bilərik.",
        discount: "Mövsümi endirimlərimiz olur 🎉 Əsas səhifəni izləyin və ya mənə yazın, yeni kampaniyalar haqqında sizə məlumat verərəm!",
        product: "Məhsullarımız haqqında ətraflı məlumatı 'Məhsullar' səhifəsindən əldə edə bilərsiniz 🌿 Hər məhsulun istifadə qaydası orada yazılıb. Konkret məhsul haqqında soruşa bilərsiniz!",
        greeting: "Salam! 😊 Xoş gəlmisiniz! Sizə necə kömək edə bilərəm?",
        default: "Təşəkkür edirəm sualınız üçün! 😊 Mütəxəssis sizinlə tezliklə əlaqə saxlayacaq.",
      },
      en: {
        delivery: "Delivery takes 1-2 business days within Baku, 3-5 business days to regions 📦 Feel free to ask if you have more questions!",
        payment: "We accept cash, bank cards, and online payments 💳 How else can I help you?",
        return: "You can return unopened products within 14 days ✅ Contact us for more details.",
        program: "We have personalized nutrition programs! 💪 Check out the 'Programs' page for details. We can help you choose the right one.",
        discount: "We have seasonal discounts 🎉 Follow our homepage or message me, and I'll inform you about new campaigns!",
        product: "You can find detailed information about our products on the 'Products' page 🌿 Each product's usage instructions are listed there. Feel free to ask about specific products!",
        greeting: "Hello! 😊 Welcome! How can I help you?",
        default: "Thank you for your question! 😊 A specialist will contact you soon.",
      },
      ru: {
        delivery: "Доставка занимает 1-2 рабочих дня в Баку, 3-5 рабочих дней в регионы 📦 Если у вас есть вопросы, напишите!",
        payment: "Мы принимаем наличные, банковские карты и онлайн-платежи 💳 Чем еще я могу помочь?",
        return: "Вы можете вернуть нераспечатанные товары в течение 14 дней ✅ Свяжитесь с нами для получения дополнительной информации.",
        program: "У нас есть индивидуальные программы питания! 💪 Посмотрите страницу 'Программы' для подробностей. Мы поможем вам выбрать подходящую.",
        discount: "У нас есть сезонные скидки 🎉 Следите за главной страницей или напишите мне, и я сообщу вам о новых акциях!",
        product: "Подробную информацию о наших продуктах вы можете найти на странице 'Продукты' 🌿 Инструкции по использованию каждого продукта указаны там. Не стесняйтесь спрашивать о конкретных продуктах!",
        greeting: "Привет! 😊 Добро пожаловать! Чем я могу помочь?",
        default: "Спасибо за ваш вопрос! 😊 Специалист свяжется с вами в ближайшее время.",
      },
      tr: {
        delivery: "Bakü içinde 1-2 iş günü, bölgelere 3-5 iş günü içinde teslim edilir 📦 Başka sorularınız varsa yazın!",
        payment: "Nakit, banka kartı ve online ödeme kabul ediyoruz 💳 Size başka nasıl yardımcı olabilirim?",
        return: "Açılmamış ürünleri 14 gün içinde iade edebilirsiniz ✅ Daha fazla bilgi için bizimle iletişime geçin.",
        program: "Kişiselleştirilmiş beslenme programlarımız var! 💪 Detaylar için 'Programlar' sayfasına bakın. Size uygun olanı birlikte seçebiliriz.",
        discount: "Mevsimsel indirimlerimiz oluyor 🎉 Ana sayfayı takip edin veya bana yazın, yeni kampanyalar hakkında size bilgi vereceğim!",
        product: "Ürünlerimiz hakkında detaylı bilgiyi 'Ürünler' sayfasından alabilirsiniz 🌿 Her ürünün kullanım talimatları orada yazılı. Belirli ürünler hakkında soru sorabilirsiniz!",
        greeting: "Merhaba! 😊 Hoş geldiniz! Size nasıl yardımcı olabilirim?",
        default: "Sorunuz için teşekkür ederim! 😊 Bir uzman yakında sizinle iletişime geçecek.",
      },
    };

    const langResponses = responses[locale] || responses.az;
    
    // Detect language from message if locale is not set correctly
    const isEnglish = /^(hi|hello|how|what|when|where|why|can|do|does|is|are|will|would|could|should|delivery|payment|return|product|program|discount|shipping|order)/i.test(userMessage);
    const isRussian = /^(привет|здравствуй|как|что|когда|где|почему|доставка|оплата|возврат|продукт|программа|скидка|заказ)/i.test(userMessage);
    const isTurkish = /^(merhaba|nasıl|ne|ne zaman|nerede|neden|teslimat|ödeme|iade|ürün|program|indirim|sipariş)/i.test(userMessage);
    
    let detectedLocale = locale;
    if (isEnglish && locale !== "en") detectedLocale = "en";
    else if (isRussian && locale !== "ru") detectedLocale = "ru";
    else if (isTurkish && locale !== "tr") detectedLocale = "tr";
    
    const finalResponses = responses[detectedLocale] || responses.az;
    
    if (lowerMsg.includes("çatdırılma") || lowerMsg.includes("çatdırma") || lowerMsg.includes("gəlir") || lowerMsg.includes("delivery") || lowerMsg.includes("доставка") || lowerMsg.includes("teslimat")) {
      return { response: finalResponses.delivery, needsAdmin: false };
    }
    if (lowerMsg.includes("ödəniş") || lowerMsg.includes("ödəmə") || lowerMsg.includes("kart") || lowerMsg.includes("payment") || lowerMsg.includes("оплата") || lowerMsg.includes("ödeme")) {
      return { response: finalResponses.payment, needsAdmin: false };
    }
    if (lowerMsg.includes("qaytarma") || lowerMsg.includes("geri") || lowerMsg.includes("return") || lowerMsg.includes("возврат") || lowerMsg.includes("iade")) {
      return { response: finalResponses.return, needsAdmin: false };
    }
    if (lowerMsg.includes("proqram") || lowerMsg.includes("qoşul") || lowerMsg.includes("program") || lowerMsg.includes("программа") || lowerMsg.includes("program")) {
      return { response: finalResponses.program, needsAdmin: false };
    }
    if (lowerMsg.includes("endirim") || lowerMsg.includes("kampaniya") || lowerMsg.includes("aksiya") || lowerMsg.includes("discount") || lowerMsg.includes("скидка") || lowerMsg.includes("indirim")) {
      return { response: finalResponses.discount, needsAdmin: false };
    }
    if (lowerMsg.includes("məhsul") || lowerMsg.includes("istifadə") || lowerMsg.includes("product") || lowerMsg.includes("продукт") || lowerMsg.includes("ürün")) {
      return { response: finalResponses.product, needsAdmin: false };
    }
    if (lowerMsg.includes("salam") || lowerMsg.includes("merhaba") || lowerMsg.includes("hey") || lowerMsg.includes("hello") || lowerMsg.includes("hi") || lowerMsg.includes("привет") || lowerMsg.includes("здравствуй")) {
      return { response: finalResponses.greeting, needsAdmin: false };
    }
    // If not a known topic, needs admin
    return { response: finalResponses.default, needsAdmin: true };
  };
  
  // If no API key, use fallback responses
  if (!apiKey || apiKey.trim() === "") {
    console.log("No API key, using fallback responses");
    return getFallbackResponse();
  }

  try {
    const systemPrompt = getSystemPrompt(locale);
    const messages = [
      { role: "system", content: systemPrompt },
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
    const locale =
      typeof body.locale === "string" && ["az", "en", "ru", "tr"].includes(body.locale)
        ? body.locale
        : "az"; // Default to Azerbaijani
    
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

        const aiResult = await getAIResponse(message, conversationHistory, locale);

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
