/* eslint-disable no-console */
/**
 * Custom Playwright reporter: when E2E_OPEN_ISSUE_ON_FAIL=1 and any spec failed,
 * opens a GitHub issue via `gh` summarizing the failures. Idempotency: if an open
 * issue with the same title already exists, comments on it instead of duplicating.
 *
 * Activate by adding to the Playwright `reporter` array. Falls back gracefully
 * (logs and continues) if `gh` is missing or auth is not configured.
 */
import { spawnSync } from "node:child_process";
import type {
  FullConfig,
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";

interface FailureRecord {
  title: string;
  file: string;
  errorSummary: string;
}

class GitHubIssueReporter implements Reporter {
  private failures: FailureRecord[] = [];
  private readonly enabled = process.env.E2E_OPEN_ISSUE_ON_FAIL === "1";
  private readonly repo = process.env.E2E_ISSUE_REPO ?? "ikiliki/wedding-hall";

  onBegin(_config: FullConfig): void {
    if (this.enabled) {
      console.log(`[gh-reporter] will open an issue on ${this.repo} if tests fail.`);
    }
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    if (!this.enabled) return;
    if (result.status === "failed" || result.status === "timedOut") {
      const err = result.errors[0]?.message ?? result.error?.message ?? "(no error message)";
      this.failures.push({
        title: test.titlePath().slice(-2).join(" › "),
        file: test.location.file,
        errorSummary: err.split("\n").slice(0, 6).join("\n"),
      });
    }
  }

  async onEnd(result: FullResult): Promise<void> {
    if (!this.enabled || this.failures.length === 0) {
      return;
    }
    if (result.status === "passed") return;

    const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "(unset)";
    const runId =
      process.env.GITHUB_RUN_ID ??
      process.env.GITHUB_RUN_NUMBER ??
      new Date().toISOString();
    const title = `E2E prod failure: ${this.failures.length} test(s) (${baseUrl})`;
    const body = [
      `**Run id:** ${runId}`,
      `**Base URL:** ${baseUrl}`,
      `**Failed tests:** ${this.failures.length}`,
      "",
      ...this.failures.map(
        (f, i) =>
          `### ${i + 1}. ${f.title}\n\n` +
          `\`${f.file}\`\n\n` +
          "```\n" +
          f.errorSummary +
          "\n```",
      ),
      "",
      "_Filed automatically by `tests/e2e-prod/reporters/github-issue-reporter.ts`._",
    ].join("\n");

    const ghCheck = spawnSync("gh", ["--version"], { stdio: "ignore", shell: true });
    if (ghCheck.status !== 0) {
      console.log("[gh-reporter] `gh` CLI not available — skipping issue creation.");
      return;
    }

    const existing = spawnSync(
      "gh",
      [
        "issue",
        "list",
        "--repo",
        this.repo,
        "--state",
        "open",
        "--search",
        `in:title "E2E prod failure"`,
        "--json",
        "number,title",
      ],
      { encoding: "utf8", shell: true },
    );

    let dedupNumber: number | null = null;
    if (existing.status === 0) {
      try {
        const items = JSON.parse(existing.stdout || "[]") as Array<{
          number: number;
          title: string;
        }>;
        const match = items.find((it) => it.title.startsWith("E2E prod failure"));
        if (match) dedupNumber = match.number;
      } catch {
        /* fall through to create */
      }
    }

    if (dedupNumber !== null) {
      const r = spawnSync(
        "gh",
        ["issue", "comment", String(dedupNumber), "--repo", this.repo, "--body", body],
        { stdio: "inherit", shell: true },
      );
      console.log(
        r.status === 0
          ? `[gh-reporter] commented on existing issue #${dedupNumber}.`
          : `[gh-reporter] failed to comment on #${dedupNumber}.`,
      );
      return;
    }

    const r = spawnSync(
      "gh",
      ["issue", "create", "--repo", this.repo, "--title", title, "--body", body],
      { stdio: "inherit", shell: true },
    );
    console.log(
      r.status === 0
        ? `[gh-reporter] opened a new issue on ${this.repo}.`
        : `[gh-reporter] failed to open issue (exit ${r.status ?? "?"}).`,
    );
  }
}

export default GitHubIssueReporter;
