/**
 * Sanitize `returnTo` from the query string so we never open-redirect.
 * Only in-app wizard paths are allowed for the guest → login → resume flow.
 */
export function safeWizardReturnPath(
  raw: string | null | undefined,
): string | undefined {
  if (raw == null || typeof raw !== "string") return undefined;
  try {
    const decoded = decodeURIComponent(raw).trim();
    if (
      decoded.length === 0 ||
      !decoded.startsWith("/") ||
      decoded.startsWith("//") ||
      decoded.includes(":\\") ||
      decoded.includes("//")
    ) {
      return undefined;
    }
    const noQuery = decoded.split("?")[0]?.split("#")[0]?.trim();
    if (!noQuery?.startsWith("/start")) return undefined;
    if (noQuery.length > 256) return undefined;
    const allowed =
      /^\/start(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?$/.test(noQuery);
    return allowed ? noQuery : undefined;
  } catch {
    return undefined;
  }
}
