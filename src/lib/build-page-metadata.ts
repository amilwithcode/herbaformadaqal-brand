import type { Metadata } from "next";
import { getSiteSettings, getMetaTags } from "@/modules/settings/queries";
import { ensureAbsoluteImageUrl } from "@/lib/seo-utils";
import { parseKeywords } from "@/lib/keywords-utils";
import { getSiteUrl } from "@/lib/site-url";

const OG_LOCALE_MAP: Record<string, string> = {
  az: "az_AZ",
  en: "en_US",
  tr: "tr_TR",
  ru: "ru_RU",
};

const LOCALES = ["az", "en", "tr", "ru"] as const;
type Locale = (typeof LOCALES)[number];

type PageFallbackEntry = {
  title?: Partial<Record<Locale, string>>;
  description?: Partial<Record<Locale, string>>;
  keywords?: Partial<Record<Locale, string>>;
};

const PAGE_FALLBACKS: Record<string, PageFallbackEntry> = {
  about: {
    title: {
      en: "About Us | Wellness, Nutrition, and Healthy Lifestyle Guidance",
      tr: "Hakkımızda | Refah, Beslenme ve Sağlıklı Yaşam Rehberliği",
      ru: "О нас | Благополучие, питание и здоровый образ жизни",
    },
    description: {
      en: "Learn who operates this website, our editorial approach, and how we curate practical wellness and nutrition content alongside carefully selected product information.",
      tr: "Bu web sitesini kimlerin işlettiğini, editöryal yaklaşımımızı ve özenle seçilmiş ürün bilgileriyle birlikte pratik sağlık ve beslenme içeriklerini nasıl hazırladığımızı keşfedin.",
      ru: "Узнайте, кто управляет этим сайтом, наш редакционный подход и то, как мы подбираем практические материалы о благополучии и питании вместе с тщательно отобранной информацией о продуктах.",
    },
    keywords: {
      en: "about us, wellness editorial, healthy lifestyle, nutrition information",
      tr: "hakkımızda, sağlık editörlüğü, sağlıklı yaşam, beslenme bilgisi",
      ru: "о нас, редакция о благополучии, здоровый образ жизни, информация о питании",
    },
  },
  contact: {
    title: {
      en: "Contact Us | Customer Support and Editorial Inquiries",
      tr: "İletişim | Müşteri Desteği ve Editöryal Sorular",
      ru: "Контакты | Поддержка клиентов и редакционные вопросы",
    },
    description: {
      en: "Get in touch with our team for questions about orders, shipping, programs, or editorial feedback. We respond during regular business hours.",
      tr: "Siparişler, kargo, programlar veya editöryal geri bildirimlerle ilgili sorularınız için ekibimizle iletişime geçin. Mesai saatleri içinde yanıt veriyoruz.",
      ru: "Свяжитесь с нашей командой по вопросам заказов, доставки, программ или редакционных отзывов. Мы отвечаем в обычные рабочие часы.",
    },
    keywords: {
      en: "contact, customer support, help desk, wellness questions",
      tr: "iletişim, müşteri desteği, yardım masası, sağlık soruları",
      ru: "контакты, поддержка клиентов, служба поддержки, вопросы о здоровье",
    },
  },
  blog: {
    title: {
      en: "Blog | Nutrition, Hydration, Meal Planning, and Healthy Habits",
      tr: "Blog | Beslenme, Hidrasyon, Öğün Planlama ve Sağlıklı Alışkanlıklar",
      ru: "Блог | Питание, гидратация, планирование приёмов пищи и полезные привычки",
    },
    description: {
      en: "Read practical, reader-friendly articles on everyday nutrition, building meal routines, hydration tips, fitness basics, and sustainable healthy habits for general wellness.",
      tr: "Günlük beslenme, öğün rutinleri oluşturma, hidrasyon ipuçları, fitness temelleri ve genel sağlık için sürdürülebilir sağlıklı alışkanlıklar üzerine pratik, okuyucu dostu makaleleri okuyun.",
      ru: "Читайте практичные, понятные статьи о повседневном питании, построении режима приёмов пищи, советах по гидратации, основах фитнеса и устойчивых полезных привычках для общего благополучия.",
    },
    keywords: {
      en: "wellness blog, nutrition articles, healthy eating, meal planning, hydration tips",
      tr: "sağlık blogu, beslenme makaleleri, sağlıklı beslenme, öğün planlama, hidrasyon",
      ru: "блог о благополучии, статьи о питании, здоровое питание, планирование приёмов пищи, гидратация",
    },
  },
  privacy: {
    title: {
      en: "Privacy Policy | How We Protect Your Personal Information",
      tr: "Gizlilik Politikası | Kişisel Bilgilerinizi Nasıl Koruyoruz",
      ru: "Политика конфиденциальности | Как мы защищаем ваши персональные данные",
    },
    description: {
      en: "Understand what personal information this website collects, how it is used, the purposes for processing, and your rights regarding your data.",
      tr: "Bu web sitesinin hangi kişisel bilgileri topladığını, nasıl kullandığını, işleme amaçlarını ve verilerinizle ilgili haklarınızı anlayın.",
      ru: "Узнайте, какие персональные данные собирает этот сайт, как они используются, цели обработки и ваши права в отношении ваших данных.",
    },
    keywords: {
      en: "privacy policy, personal data, data protection, GDPR, cookie consent",
      tr: "gizlilik politikası, kişisel veri, veri koruma, KVKK, çerez izni",
      ru: "политика конфиденциальности, персональные данные, защита данных, согласие на cookie",
    },
  },
  terms: {
    title: {
      en: "Terms of Service | Website Usage Rules and User Responsibilities",
      tr: "Kullanım Şartları | Web Sitesi Kuralları ve Kullanıcı Sorumlulukları",
      ru: "Условия использования | Правила использования сайта и обязанности пользователей",
    },
    description: {
      en: "Read the terms and conditions that govern use of this website, including acceptable use, disclaimers of liability, intellectual property notices, and order terms.",
      tr: "Bu web sitesinin kullanımını yöneten şartları ve koşulları okuyun; kabul edilebilir kullanım, sorumluluk reddi, fikri mülkiyet bildirimleri ve sipariş koşulları dahil.",
      ru: "Ознакомьтесь с условиями, регулирующими использование этого сайта, включая допустимое использование, отказ от ответственности, уведомления об интеллектуальной собственности и условия заказов.",
    },
    keywords: {
      en: "terms of service, user agreement, legal terms, website rules",
      tr: "kullanım şartları, kullanıcı sözleşmesi, yasal şartlar, web sitesi kuralları",
      ru: "условия использования, пользовательское соглашение, правовые условия, правила сайта",
    },
  },
  faq: {
    title: {
      en: "FAQ | Frequently Asked Questions About Orders, Products, and Services",
      tr: "SSS | Siparişler, Ürünler ve Hizmetler Hakkında Sıkça Sorulan Sorular",
      ru: "Частые вопросы | Вопросы о заказах, продуктах и услугах",
    },
    description: {
      en: "Find answers to the most common questions about ordering, shipping, returns, payment, programs, accounts, and how to contact support.",
      tr: "Sipariş verme, teslimat, iade, ödeme, programlar, hesaplar ve destekle nasıl iletişim kurulacağı hakkında en sık sorulan sorulara yanıt bulun.",
      ru: "Найдите ответы на самые частые вопросы о заказах, доставке, возврате, оплате, программах, учётных записях и о том, как связаться со службой поддержки.",
    },
    keywords: {
      en: "FAQ, common questions, order help, support answers",
      tr: "SSS, sık sorulan sorular, sipariş yardımı, destek yanıtları",
      ru: "частые вопросы, часто задаваемые вопросы, помощь с заказом, ответы поддержки",
    },
  },
  shipping: {
    title: {
      en: "Shipping Policy | Delivery Areas, Timelines, and Free Shipping",
      tr: "Kargo Politikası | Teslimat Bölgeleri, Süreler ve Ücretsiz Kargo",
      ru: "Политика доставки | Регионы, сроки и бесплатная доставка",
    },
    description: {
      en: "Information about shipping services we offer, regions we deliver to, estimated delivery times, and any free-shipping thresholds that may apply.",
      tr: "Sunduğumuz kargo hizmetleri, teslim ettiğimiz bölgeler, tahmini teslimat süreleri ve geçerli olabilecek ücretsiz kargo eşikleri hakkında bilgi.",
      ru: "Информация о службах доставки, регионах, сроках и возможных порогах для бесплатной доставки.",
    },
    keywords: {
      en: "shipping policy, delivery times, free shipping, courier",
      tr: "kargo politikası, teslimat süreleri, ücretsiz kargo, kurye",
      ru: "политика доставки, сроки доставки, бесплатная доставка, курьер",
    },
  },
  returns: {
    title: {
      en: "Returns Policy | How to Return Eligible Products",
      tr: "İade Politikası | Uygun Ürünleri Nasıl İade Edebilirsiniz",
      ru: "Политика возврата | Как вернуть подходящие товары",
    },
    description: {
      en: "Review the conditions under which products may be returned, the timeframe for returns, how to submit a return request, and how refunds are processed.",
      tr: "Ürünlerin hangi koşullar altında iade edilebileceğini, iade süresini, iade talebini nasıl göndereceğinizi ve para iadesinin nasıl işlendiğini inceleyin.",
      ru: "Ознакомьтесь с условиями, сроками и порядком подачи заявки на возврат, а также с тем, как обрабатывается возврат средств.",
    },
    keywords: {
      en: "returns policy, refund, exchange, product return",
      tr: "iade politikası, para iadesi, değişim, ürün iadesi",
      ru: "политика возврата, возврат средств, обмен, возврат товара",
    },
  },
  products: {
    title: {
      en: "Products | Wellness, Nutrition, and Supplement Catalog",
      tr: "Ürünler | Sağlık, Beslenme ve Takviye Kataloğu",
      ru: "Продукты | Каталог средств для благополучия, питания и добавок",
    },
    description: {
      en: "Browse our catalog of wellness and nutrition-related products. Product listings describe general purpose and typical usage. Always follow the label instructions.",
      tr: "Sağlık ve beslenmeyle ilgili ürün kataloğumuza göz atın. Ürün listeleri genel amacı ve tipik kullanımı açıklar. Her zaman etiket talimatlarını izleyin.",
      ru: "Просмотрите наш каталог средств для благополучия и питания. Описания носят общий характер. Всегда следуйте инструкциям на этикетке.",
    },
    keywords: {
      en: "wellness products, nutrition catalog, protein, vitamins, supplements",
      tr: "sağlık ürünleri, beslenme kataloğu, protein, vitaminler, takviyeler",
      ru: "средства для благополучия, каталог питания, белок, витамины, добавки",
    },
  },
  programs: {
    title: {
      en: "Programs | Structured Routines for Everyday Wellness Goals",
      tr: "Programlar | Günlük Sağlık Hedefleri için Yapılandırılmış Rutinler",
      ru: "Программы | Структурированные режимы для повседневных целей благополучия",
    },
    description: {
      en: "Explore structured programs designed to support general wellness routines, balanced habits, and everyday consistency. Individual results vary based on adherence and personal factors.",
      tr: "Genel sağlık rutinlerini, dengeli alışkanlıkları ve günlük tutarlılığı desteklemek için tasarlanmış yapılandırılmış programları keşfedin. Bireysel sonuçlar bağlılığa ve kişisel faktörlere göre değişir.",
      ru: "Изучите структурированные программы, поддерживающие режимы общего благополучия, сбалансированные привычки и ежедневную последовательность. Индивидуальные результаты зависят от соблюдения и личных факторов.",
    },
    keywords: {
      en: "wellness programs, healthy routines, structured plans, daily habits",
      tr: "sağlık programları, sağlıklı rutinler, yapılandırılmış planlar, günlük alışkanlıklar",
      ru: "программы благополучия, здоровые режимы, структурированные планы, ежедневные привычки",
    },
  },
  "cookie-policy": {
    title: {
      en: "Cookie Policy | Use of Cookies and Similar Technologies",
      tr: "Çerez Politikası | Çerezlerin ve Benzer Teknolojilerin Kullanımı",
      ru: "Политика файлов cookie | Использование cookie и аналогичных технологий",
    },
    description: {
      en: "Information about the categories of cookies used on this website, their purposes, third-party providers, and how you can manage your cookie preferences.",
      tr: "Bu web sitesinde kullanılan çerez kategorileri, amaçları, üçüncü taraf sağlayıcılar ve çerez tercihlerinizi nasıl yönetebileceğiniz hakkında bilgi.",
      ru: "Информация о категориях файлов cookie, используемых на этом сайте, их назначении, сторонних поставщиках и о том, как управлять настройками cookie.",
    },
    keywords: {
      en: "cookie policy, cookies, tracking, browser preferences",
      tr: "çerez politikası, çerezler, izleme, tarayıcı tercihleri",
      ru: "политика cookie, файлы cookie, отслеживание, настройки браузера",
    },
  },
  disclaimer: {
    title: {
      en: "Disclaimer | General Wellness Content and Medical Information Notice",
      tr: "Sorumluluk Reddi | Genel Sağlık İçeriği ve Tıbbi Bilgi Bildirimi",
      ru: "Отказ от ответственности | Уведомление об общем контенте и медицинской информации",
    },
    description: {
      en: "Read important disclaimers about the nature of content on this site. Articles and product information are general wellness education only and do not replace professional medical advice.",
      tr: "Sitedeki içeriğin doğası hakkında önemli sorumluluk reddlerini okuyun. Makaleler ve ürün bilgileri yalnızca genel sağlık eğitimi niteliğindedir ve profesyonel tıbbi tavsiyenin yerine geçmez.",
      ru: "Ознакомьтесь с важными отказами от ответственности о характере контента. Статьи и информация о продуктах носят общеобразовательный характер в области благополучия и не заменяют профессиональную медицинскую консультацию.",
    },
    keywords: {
      en: "disclaimer, medical notice, general information, not medical advice",
      tr: "sorumluluk reddi, tıbbi bildirim, genel bilgi, tıbbi tavsiye değil",
      ru: "отказ от ответственности, медицинское уведомление, общая информация, не медицинская консультация",
    },
  },
  "editorial-policy": {
    title: {
      en: "Editorial Policy | Content Preparation, Review, and Corrections",
      tr: "Editöryal Politika | İçerik Hazırlama, İnceleme ve Düzeltmeler",
      ru: "Редакционная политика | Подготовка, проверка и исправление контента",
    },
    description: {
      en: "Our editorial standards: how articles are prepared, reviewed internally, updated over time, how reader corrections are handled, and the distinction between informational and commercial content.",
      tr: "Editöryal standartlarımız: makaleler nasıl hazırlanır, dahili olarak nasıl incelenir, zaman içinde nasıl güncellenir, okuyucu düzeltmeleri nasıl yönetilir ve bilgilendirici ile ticari içerik arasındaki fark.",
      ru: "Наши редакционные стандарты: как готовятся статьи, проходят внутреннюю проверку, обновляются со временем, как обрабатываются исправления читателей, а также различие между информационным и коммерческим контентом.",
    },
    keywords: {
      en: "editorial policy, content review, corrections, fact checking",
      tr: "editöryal politika, içerik incelemesi, düzeltmeler, doğruluk kontrolü",
      ru: "редакционная политика, проверка контента, исправления, контроль фактов",
    },
  },
  author: {
    title: {
      en: "About the Author | Our Editorial Team and Scope of Work",
      tr: "Yazar Hakkında | Editöryal Ekibimiz ve Çalışma Kapsamı",
      ru: "Об авторе | Наша редакционная команда и область работы",
    },
    description: {
      en: "Meet our in-house editorial team, understand our scope of expertise, and learn how we approach wellness topics clearly, responsibly, and without fabricated credentials.",
      tr: "İç büro editöryal ekibimizle tanışın, uzmanlık kapsamımızı anlayın ve sağlık konularına nasıl açık, sorumlu ve uydurulmuş yeterlilikler olmadan yaklaştığımızı öğrenin.",
      ru: "Познакомьтесь с нашей внутренней редакционной командой, поймите область нашей компетенции и узнайте, как мы ясно, ответственно и без выдуманных квалификаций подходим к темам благополучия.",
    },
    keywords: {
      en: "about the author, editorial team, writers, wellness editors",
      tr: "yazar hakkında, editöryal ekip, yazarlar, sağlık editörleri",
      ru: "об авторе, редакционная команда, авторы, редакторы по благополучию",
    },
  },
};

export type BuildPageMetadataArgs = {
  locale: string;
  /** meta_tags.page dəyəri (admin panel) */
  pageKey: string;
  /**
   * Kanonik path: lokal səhifələr üçün "/products"; auth üçün "/auth/login"
   */
  canonicalPath: string;
  fallbackTitle: string;
  fallbackDescription: string;
  fallbackKeywords?: string;
  /**
   * true: URL-də dil prefiksi yoxdur (middleware /auth, /account)
   */
  omitLocaleInCanonical?: boolean;
};

/**
 * Admin meta_tags + site_settings əsasında Next Metadata (Open Graph, Twitter, canonical).
 */
export async function buildPageMetadata({
  locale,
  pageKey,
  canonicalPath,
  fallbackTitle,
  fallbackDescription,
  fallbackKeywords,
  omitLocaleInCanonical,
}: BuildPageMetadataArgs): Promise<Metadata> {
  const localePath = LOCALES.includes(locale as (typeof LOCALES)[number])
    ? locale
    : "az";

  const [settings, metaTags] = await Promise.all([
    getSiteSettings(),
    getMetaTags(pageKey),
  ]);

  const siteUrl = getSiteUrl();
  const brandName =
    settings?.public_site_name || settings?.site_name || "Herbalife";

  const fbEntry = PAGE_FALLBACKS[pageKey];
  const fbTitle = fbEntry?.title?.[localePath as Locale];
  const fbDescription = fbEntry?.description?.[localePath as Locale];
  const fbKeywords = fbEntry?.keywords?.[localePath as Locale];

  const title = (metaTags?.title?.trim() || fbTitle || fallbackTitle).trim();
  const description = (
    metaTags?.description?.trim() || fbDescription || fallbackDescription
  ).trim();
  const keywordsRaw =
    metaTags?.keywords?.trim() || fbKeywords || fallbackKeywords || "";
  const keywords = keywordsRaw ? parseKeywords(keywordsRaw) : [];

  const rawOgImage =
    metaTags?.og_image ||
    metaTags?.image ||
    settings?.logo ||
    `${siteUrl}/og-image.jpg`;
  const ogImage =
    ensureAbsoluteImageUrl(rawOgImage, siteUrl) || `${siteUrl}/og-image.jpg`;

  const path =
    canonicalPath === "/" ? "" : canonicalPath.startsWith("/")
      ? canonicalPath
      : `/${canonicalPath}`;

  const canonical = omitLocaleInCanonical
    ? `${siteUrl}${path === "" ? "" : path}`
    : `${siteUrl}/${localePath}${path}`;

  const ogTitle = metaTags?.og_title?.trim() || title;
  const ogDescription =
    metaTags?.og_description?.trim() || description;

  const alternates: Metadata["alternates"] = omitLocaleInCanonical
    ? { canonical }
    : {
        canonical,
        languages: {
          "x-default": `${siteUrl}/az${path}`,
          az: `${siteUrl}/az${path}`,
          en: `${siteUrl}/en${path}`,
          tr: `${siteUrl}/tr${path}`,
          ru: `${siteUrl}/ru${path}`,
        },
      };

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      siteName: brandName,
      images: [{ url: ogImage, width: 1200, height: 630, alt: ogTitle }],
      locale: OG_LOCALE_MAP[localePath] || "az_AZ",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
    alternates,
  };
}
