export type Locale = "az" | "en" | "tr" | "ru";

export type PageContentInput = {
  slug?: string;
  url?: string;
  title?: string;
  metaTitle?: string;
  metaDescription?: string;
  authorName?: string;
  publishedAt?: string | Date | null;
  updatedAt?: string | Date | null;
  language?: Locale | string;
  canonical?: string;
  hreflangs?: Array<{ locale: string; href: string }>;
  indexable?: boolean;
  htmlBody?: string;
  textBody?: string;
  internalLinks?: string[];
  externalLinks?: string[];
  tags?: string[];
  category?: string;
  /** Known duplicate title candidates (e.g. from sitemap or content inventory) */
  allMetaTitles?: string[];
};

export type PageQualityFlags = {
  wordCount: number;
  hasH1: boolean;
  h2Count: number;
  h3Count: number;
  hasMetaTitle: boolean;
  metaTitleLength: number;
  metaTitleDuplicated: boolean;
  hasMetaDescription: boolean;
  metaDescriptionLength: number;
  hasAuthor: boolean;
  hasPublishedDate: boolean;
  hasUpdatedDate: boolean;
  internalLinkCount: number;
  hasCanonical: boolean;
  hreflangCount: number;
  hasHreflangXDefault: boolean;
  hasPlaceholderText: boolean;
  placeholderMatches: string[];
  hasEmptySections: boolean;
  languageDetected: string | null;
  indexable: boolean;
  brokenLinkCount: number;
  brokenLinks: string[];
  duplicateContentRisk: "low" | "medium" | "high";
  headingStructureOk: boolean;
};

export type PageQualityReport = {
  flags: PageQualityFlags;
  score: number;
  pass: boolean;
  warnings: string[];
  errors: string[];
};

const PLACEHOLDER_PATTERNS: RegExp[] = [
  /lorem ipsum/gi,
  /content will be added/gi,
  /coming soon/gi,
  /yaxın zamanda/gi,
  /təqdim olunacaq/gi,
  /məlumat əlavə olunacaq/gi,
  /doldurulacaq/gi,
  /placeholder/gi,
  /test content/gi,
  /örnek metin/gi,
  /doldurulacaktır/gi,
  /заглушка/gi,
  /будет добавлено/gi,
  /xxxxxxxx+/i,
  /#\{[a-z_]+\}/i,
];

const MIN_WORDS = 300;
const META_TITLE_MIN = 30;
const META_TITLE_MAX = 65;
const META_DESC_MIN = 80;
const META_DESC_MAX = 165;

export function stripHtml(html?: string | null): string {
  if (!html) return "";
  return String(html)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function countWords(text: string): number {
  const clean = (text || "").trim();
  if (!clean) return 0;
  const tokens = clean.match(/[\p{L}\p{N}'-]+/gu);
  return tokens ? tokens.length : 0;
}

export function analyzePageContent(input: PageContentInput): PageQualityReport {
  const {
    metaTitle,
    metaDescription,
    authorName,
    publishedAt,
    updatedAt,
    canonical,
    hreflangs,
    indexable = true,
    htmlBody,
    textBody,
    internalLinks,
    externalLinks,
    allMetaTitles,
    title,
  } = input;

  const body = textBody ?? stripHtml(htmlBody);
  const wordCount = countWords(body);

  const h1Count = (htmlBody || "").match(/<h1\b/gi)?.length ?? 0;
  const hasH1 = h1Count >= 1 || !!(title && title.trim().length > 0 && !htmlBody);

  const h2Count = (htmlBody || "").match(/<h2\b/gi)?.length ?? 0;
  const h3Count = (htmlBody || "").match(/<h3\b/gi)?.length ?? 0;
  const headingStructureOk = hasH1 && h1Count === 1 && (h2Count >= 1 || wordCount < MIN_WORDS);

  const hasMetaTitle = !!(metaTitle && metaTitle.trim().length > 0);
  const metaTitleLength = (metaTitle || "").trim().length;
  const metaTitleDuplicated = !!(
    hasMetaTitle &&
    allMetaTitles &&
    allMetaTitles.filter((t) => t && t.trim() === metaTitle!.trim()).length > 1
  );

  const hasMetaDescription = !!(metaDescription && metaDescription.trim().length > 0);
  const metaDescriptionLength = (metaDescription || "").trim().length;

  const hasAuthor = !!(authorName && authorName.trim().length > 0);
  const hasPublishedDate = !!publishedAt && !Number.isNaN(new Date(publishedAt).getTime());
  const hasUpdatedDate = !!updatedAt && !Number.isNaN(new Date(updatedAt).getTime());

  const linkCount = (internalLinks || []).length;
  const hasCanonical = !!(canonical && canonical.trim().length > 0);
  const hreflangCount = (hreflangs || []).length;
  const hasHreflangXDefault = (hreflangs || []).some((h) => h.locale.toLowerCase() === "x-default");

  const placeholderMatches: string[] = [];
  PLACEHOLDER_PATTERNS.forEach((re) => {
    const text = `${body}\n${title || ""}\n${metaTitle || ""}`;
    const m = text.match(re);
    if (m) placeholderMatches.push(...m.slice(0, 3));
  });
  const hasPlaceholderText = placeholderMatches.length > 0;

  const sectionChunks = (htmlBody || "")
    .split(/<h[1-4]\b[^>]*>/)
    .slice(1)
    .map((chunk) => stripHtml(chunk.split(/<\/h[1-4]>/).slice(1).join("</h>")));
  const hasEmptySections = sectionChunks.some(
    (t) => t.length > 0 && countWords(t) < 15
  );

  const languageDetected =
    (input.language as string | null) ||
    (/[\u0400-\u04FF]/.test(body) ? "ru" : null) ||
    (/ə|ö|ü|ğ|ı|ş/i.test(body) ? "az" : null) ||
    (/ş|ğ|ı|ö|ü|ç/i.test(body) ? "tr" : null) ||
    (/[A-Za-z]{4,}/.test(body) ? "en" : null);

  const brokenLinks: string[] = [];
  const linksToCheck = [...(internalLinks || []), ...(externalLinks || [])];
  linksToCheck.forEach((l) => {
    if (!l) return;
    if (/\s/.test(l.trim())) brokenLinks.push(l);
    if (!/^(https?:\/\/|\/|mailto:|tel:)/i.test(l.trim())) brokenLinks.push(l);
  });

  let risk: "low" | "medium" | "high" = "low";
  if (metaTitleDuplicated) risk = "medium";
  if (hasPlaceholderText) risk = "medium";
  if (wordCount > 0 && wordCount < MIN_WORDS && !hasMetaDescription) risk = "high";
  if (metaTitleDuplicated && hasPlaceholderText) risk = "high";

  const duplicateContentRisk = risk;

  const flags: PageQualityFlags = {
    wordCount,
    hasH1,
    h2Count,
    h3Count,
    hasMetaTitle,
    metaTitleLength,
    metaTitleDuplicated,
    hasMetaDescription,
    metaDescriptionLength,
    hasAuthor,
    hasPublishedDate,
    hasUpdatedDate,
    internalLinkCount: linkCount,
    hasCanonical,
    hreflangCount,
    hasHreflangXDefault,
    hasPlaceholderText,
    placeholderMatches,
    hasEmptySections,
    languageDetected,
    indexable,
    brokenLinkCount: brokenLinks.length,
    brokenLinks,
    duplicateContentRisk,
    headingStructureOk,
  };

  const warnings: string[] = [];
  const errors: string[] = [];

  if (indexable && wordCount < MIN_WORDS)
    warnings.push(`Word count ${wordCount} is below recommended ${MIN_WORDS}.`);
  if (!hasH1) errors.push("Missing H1 heading.");
  if (h1Count > 1) warnings.push(`Multiple H1 tags found (${h1Count}).`);
  if (!headingStructureOk) warnings.push("Heading structure may be incomplete (no H2 sections).");
  if (!hasMetaTitle) errors.push("Missing meta title.");
  if (hasMetaTitle && (metaTitleLength < META_TITLE_MIN || metaTitleLength > META_TITLE_MAX))
    warnings.push(
      `Meta title length ${metaTitleLength} is outside ${META_TITLE_MIN}-${META_TITLE_MAX}.`
    );
  if (metaTitleDuplicated) errors.push("Meta title is duplicated across pages.");
  if (!hasMetaDescription) errors.push("Missing meta description.");
  if (
    hasMetaDescription &&
    (metaDescriptionLength < META_DESC_MIN || metaDescriptionLength > META_DESC_MAX)
  )
    warnings.push(
      `Meta description length ${metaDescriptionLength} is outside ${META_DESC_MIN}-${META_DESC_MAX}.`
    );
  if (!hasAuthor && indexable) warnings.push("Missing author attribution.");
  if (!hasPublishedDate && indexable) warnings.push("Missing published date.");
  if (indexable && linkCount === 0) warnings.push("No internal links.");
  if (!hasCanonical) warnings.push("Missing canonical URL.");
  if (hreflangCount === 0) warnings.push("Missing hreflang alternates.");
  if (hreflangCount > 0 && !hasHreflangXDefault) warnings.push("Missing hreflang x-default.");
  if (hasPlaceholderText) errors.push(`Placeholder text detected: ${placeholderMatches.join(", ")}`);
  if (hasEmptySections) warnings.push("One or more sections are nearly empty.");
  if (brokenLinks.length) errors.push(`Broken/invalid link count: ${brokenLinks.length}.`);
  if (duplicateContentRisk === "high") errors.push("High duplicate-content risk.");
  else if (duplicateContentRisk === "medium") warnings.push("Medium duplicate-content risk.");

  let score = 100;
  score -= errors.length * 8;
  score -= warnings.length * 3;
  if (wordCount > 0 && wordCount < 150) score -= 6;
  else if (wordCount > 0 && wordCount < MIN_WORDS) score -= 3;
  score = Math.max(0, Math.min(100, score));

  const pass = errors.length === 0 && score >= 70 && indexable ? true : !indexable ? true : false;

  return { flags, score, pass, warnings, errors };
}

export function auditPageList(pages: PageContentInput[]): {
  total: number;
  passCount: number;
  failCount: number;
  averageScore: number;
  reports: Array<{ slug?: string; url?: string; report: PageQualityReport }>;
} {
  const reports = pages.map((p) => ({
    slug: p.slug,
    url: p.url,
    report: analyzePageContent(p),
  }));
  const scores = reports.map((r) => r.report.score);
  const averageScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const passCount = reports.filter((r) => r.report.pass).length;
  return {
    total: reports.length,
    passCount,
    failCount: reports.length - passCount,
    averageScore,
    reports,
  };
}
