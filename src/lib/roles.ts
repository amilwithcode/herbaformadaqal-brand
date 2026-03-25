export function normalizeRole(role: unknown): string {
  if (typeof role !== "string") return "user";
  return role.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function isAdminRole(role: unknown): boolean {
  const normalized = normalizeRole(role);
  return normalized === "admin" || normalized === "super_admin";
}
