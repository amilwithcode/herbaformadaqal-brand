import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Only initialize Resend if API key is available
const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, fullName, locale = "az" } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const resend = getResend();
    if (!resend) {
      console.warn("RESEND_API_KEY not configured, skipping email send");
      return NextResponse.json(
        { success: true, message: "Email service not configured" },
        { status: 200 }
      );
    }

    // Welcome email templates in different languages
    const emailTemplates: Record<string, { subject: string; html: string }> = {
      az: {
        subject: "Xoş gəlmisiniz!",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Xoş gəlmisiniz!</h1>
              </div>
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">Salam ${fullName || "İstifadəçi"}!</p>
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Hesabınız uğurla yaradıldı. Bizimlə birlikdə sağlam həyat tərzi yolunda addım atın.
                </p>
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Məhsullarımızı kəşf edin, fərdi qidalanma proqramlarımızdan yararlanın və sağlamlığınızı idarə edin.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://aformadaqal.com"}" 
                     style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                    Sayta keç
                  </a>
                </div>
                <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                  Suallarınız varsa, bizimlə əlaqə saxlayın.
                </p>
              </div>
            </body>
          </html>
        `,
      },
      en: {
        subject: "Welcome!",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Welcome!</h1>
              </div>
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">Hello ${fullName || "User"}!</p>
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Your account has been successfully created. Take a step towards a healthy lifestyle with us.
                </p>
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Explore our products, benefit from our personalized nutrition programs, and manage your health.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://aformadaqal.com"}" 
                     style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                    Go to Site
                  </a>
                </div>
                <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                  If you have any questions, please contact us.
                </p>
              </div>
            </body>
          </html>
        `,
      },
      ru: {
        subject: "Добро пожаловать!",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Добро пожаловать!</h1>
              </div>
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">Здравствуйте ${fullName || "Пользователь"}!</p>
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Ваш аккаунт успешно создан. Сделайте шаг к здоровому образу жизни вместе с нами.
                </p>
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Изучите наши продукты, воспользуйтесь нашими персональными программами питания и управляйте своим здоровьем.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://aformadaqal.com"}" 
                     style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                    Перейти на сайт
                  </a>
                </div>
                <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                  Если у вас есть вопросы, свяжитесь с нами.
                </p>
              </div>
            </body>
          </html>
        `,
      },
      tr: {
        subject: "Hoş geldiniz!",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Hoş geldiniz!</h1>
              </div>
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">Merhaba ${fullName || "Kullanıcı"}!</p>
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Hesabınız başarıyla oluşturuldu. Bizimle birlikte sağlıklı yaşam yolunda adım atın.
                </p>
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Ürünlerimizi keşfedin, kişiselleştirilmiş beslenme programlarımızdan yararlanın ve sağlığınızı yönetin.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://aformadaqal.com"}" 
                     style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                    Siteye Git
                  </a>
                </div>
                <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                  Sorularınız varsa, bizimle iletişime geçin.
                </p>
              </div>
            </body>
          </html>
        `,
      },
    };

    const template = emailTemplates[locale] || emailTemplates.az;
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: template.subject,
      html: template.html,
    });

    if (error) {
      console.error("Resend email error:", error);
      return NextResponse.json(
        { error: "Failed to send email", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, messageId: data?.id },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Send welcome email error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
