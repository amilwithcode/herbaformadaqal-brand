const ALLOWED_TAGS = new Set([
  "p", "br", "hr",
  "strong", "b", "em", "i", "u", "s", "del", "ins", "mark", "small", "sub", "sup",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "blockquote", "pre", "code",
  "a", "span", "div",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td",
  "img",
  "abbr", "cite", "dfn", "kbd", "samp", "var",
  "details", "summary",
]);

const SELF_CLOSING = new Set(["br", "hr", "img", "input"]);

const ALLOWED_ATTRS_COMMON = new Set([
  "class", "id", "dir", "lang", "title",
]);

const ALLOWED_ATTRS_A = new Set(["href", "rel", "target", "title"]);
const ALLOWED_ATTRS_IMG = new Set(["src", "alt", "title", "width", "height", "loading"]);
const ALLOWED_ATTRS_TABLE = new Set(["border", "cellpadding", "cellspacing"]);
const ALLOWED_ATTRS_TD = new Set(["colspan", "rowspan", "width", "height", "align", "valign"]);

const SAFE_URL_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

function isSafeUrl(value: string): boolean {
  try {
    const trimmed = value.trim();
    if (!trimmed) return false;
    if (!/^[a-zA-Z][a-zA-Z0-9+.\-]*:/.test(trimmed)) {
      // Relative or protocol-relative URL.
      return !/^\/\//.test(trimmed); // block protocol-relative
    }
    const u = new URL(trimmed, "https://placeholder.example");
    return SAFE_URL_PROTOCOLS.has(u.protocol);
  } catch {
    return false;
  }
}

function parseAttrs(tag: string, raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /([a-zA-Z\-:]+)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const name = m[1]!.toLowerCase();
    const value = (m[2] ?? m[3] ?? m[4] ?? "").trim();
    let allowed = ALLOWED_ATTRS_COMMON.has(name);
    if (tag === "a" && ALLOWED_ATTRS_A.has(name)) allowed = true;
    if (tag === "img" && ALLOWED_ATTRS_IMG.has(name)) allowed = true;
    if ((tag === "table") && ALLOWED_ATTRS_TABLE.has(name)) allowed = true;
    if ((tag === "td" || tag === "th") && ALLOWED_ATTRS_TD.has(name)) allowed = true;
    if (!allowed) continue;
    if ((name === "href" || name === "src") && !isSafeUrl(value)) continue;
    if (name === "style") continue;
    if (/^(on|data-|x-)/i.test(name)) continue;
    out[name] = value
      .replace(/\0/g, "")
      .replace(/<\//g, "")
      .slice(0, 2048);
  }
  return out;
}

function stringifyAttrs(attrs: Record<string, string>, tag: string): string {
  const harden: Record<string, Record<string, string>> = {
    a: { rel: "noopener noreferrer nofollow", target: "_blank" },
    img: { loading: "lazy", referrerpolicy: "no-referrer" },
  };
  const merged = { ...attrs, ...(harden[tag] || {}) };
  const parts: string[] = [];
  for (const [k, v] of Object.entries(merged)) {
    const safe = v.replace(/"/g, "&quot;").replace(/</g, "&lt;");
    parts.push(`${k}="${safe}"`);
  }
  return parts.length ? " " + parts.join(" ") : "";
}

const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};
function escapeText(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ENTITIES[c] ?? c);
}

export function sanitizeHtml(unsafe: unknown): string {
  if (typeof unsafe !== "string") return "";
  const src = unsafe.replace(/\0/g, "").slice(0, 200_000);

  let out = "";
  let lastIndex = 0;
  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)(\s[^<>]*)?(\/?)>/g;
  let m: RegExpExecArray | null;

  while ((m = tagRe.exec(src)) !== null) {
    if (m.index > lastIndex) {
      out += escapeText(src.slice(lastIndex, m.index));
    }
    lastIndex = m.index + m[0].length;

    const isClose = m[1] === "/";
    const tag = (m[2] || "").toLowerCase();
    const attrsRaw = m[3] || "";
    const selfClose = m[4] === "/" || SELF_CLOSING.has(tag);

    if (!ALLOWED_TAGS.has(tag)) {
      out += " ";
      continue;
    }

    if (isClose) {
      out += `</${tag}>`;
      continue;
    }

    const attrs = parseAttrs(tag, attrsRaw);
    if (tag === "img" && !attrs.src) {
      out += " ";
      continue;
    }
    if (tag === "a" && attrs.href && !attrs.rel) {
      attrs.rel = "noopener noreferrer nofollow";
    }
    if (selfClose) {
      out += `<${tag}${stringifyAttrs(attrs, tag)} />`;
    } else {
      out += `<${tag}${stringifyAttrs(attrs, tag)}>`;
    }
  }

  if (lastIndex < src.length) {
    out += escapeText(src.slice(lastIndex));
  }

  return out
    .replace(/<script[\s>]/gi, "&lt;script ")
    .replace(/javascript:/gi, "&#106;avascript:");
}

export function plainTextEscape(input: unknown): string {
  return typeof input === "string" ? escapeText(input) : "";
}
