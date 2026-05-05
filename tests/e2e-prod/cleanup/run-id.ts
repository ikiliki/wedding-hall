export function runId(): string {
  return (
    process.env.E2E_RUN_ID ??
    process.env.GITHUB_RUN_ID ??
    `local-${Date.now().toString(36)}`
  );
}
