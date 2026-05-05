export const SAFE_EMAIL = /^wh-e2e-[a-z0-9._-]+@example\.com$/i;
export const SAFE_VENDOR_NAME = /^Playwright-E2E-[a-z0-9._-]+$/i;

export function assertSafeEmail(email) {
  if (!SAFE_EMAIL.test(email)) {
    throw new Error(`refusing to delete non-test email: ${email}`);
  }
}

export function assertSafeVendorName(name) {
  if (!SAFE_VENDOR_NAME.test(name)) {
    throw new Error(`refusing to delete non-test vendor: ${name}`);
  }
}
