/**
 * Müştəri adını rəylərdə şifrələnmiş (maskalanmış) formada göstərmək üçün.
 * Məs: "İsmayıl" → "İ***l", "İstifadəçi" → "İ***i"
 */
export function maskUserName(name: string | null | undefined): string {
  if (name == null || typeof name !== "string") return "***";
  const s = name.trim();
  if (s.length === 0) return "***";
  if (s.length === 1) return s + "***";
  const first = s[0];
  const last = s[s.length - 1];
  if (s.length <= 4) return first + "***";
  return first + "***" + last;
}
