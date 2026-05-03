const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Calendar date collected on the wizard date step (`YYYY-MM-DD`). */
export function isValidCelebrationDate(raw: string): boolean {
  const t = raw.trim();
  if (!ISO.test(t)) return false;
  return !Number.isNaN(Date.parse(`${t}T12:00:00Z`));
}

export function formatCelebrationDisplay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("he-IL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Full days from now until end of calendar day `iso` (local). */
export function celebrationFullDaysRemaining(iso: string): number | null {
  const t = iso.trim();
  if (!isValidCelebrationDate(t)) return null;
  const [y, m, d] = t.split("-").map((x) => Number(x));
  if (!y || !m || !d) return null;
  const endMs = new Date(y, m - 1, d, 0, 0, 0, 0).getTime() + 86400000;
  const ms = endMs - Date.now();
  if (ms <= 0) return 0;
  return Math.floor(ms / 86400000);
}
