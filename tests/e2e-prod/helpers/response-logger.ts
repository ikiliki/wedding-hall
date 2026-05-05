import type { Page, TestInfo } from "@playwright/test";

/**
 * Logs the body of every 4xx/5xx response into the Playwright trace + a per-test
 * attachment. Lets us see the actual Supabase / gateway error that caused a flake
 * (e.g. `weak_password`, `email_exists`, `invalid_credentials`) instead of a bare
 * Playwright timeout. Issue #6 motivated this.
 */
export function attachResponseLogger(page: Page, testInfo: TestInfo): () => Promise<void> {
  const lines: string[] = [];
  page.on("response", async (res) => {
    const status = res.status();
    if (status < 400) return;
    const url = res.url();
    let body = "";
    try {
      body = (await res.text()).slice(0, 2_000);
    } catch {
      body = "<body unavailable>";
    }
    lines.push(`[${status}] ${res.request().method()} ${url}\n${body}`);
  });
  return async () => {
    if (lines.length === 0) return;
    await testInfo.attach("network-errors.txt", {
      body: lines.join("\n\n---\n\n"),
      contentType: "text/plain",
    });
  };
}
