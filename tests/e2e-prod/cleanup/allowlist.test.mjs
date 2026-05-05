import test from "node:test";
import assert from "node:assert/strict";
import {
  SAFE_EMAIL,
  SAFE_VENDOR_NAME,
  assertSafeEmail,
  assertSafeVendorName,
} from "./allowlist.mjs";

test("SAFE_EMAIL accepts wh-e2e account", () => {
  const email = "wh-e2e-abc123-w0-couple1@example.com";
  assert.equal(SAFE_EMAIL.test(email), true);
  assert.doesNotThrow(() => assertSafeEmail(email));
});

test("SAFE_EMAIL rejects non-test emails", () => {
  const bad = [
    "admin@weddinghall.app",
    "omri96david@gmail.com",
    "attacker@example.com",
    "wh-e2e-xyz@gmail.com",
  ];
  for (const email of bad) {
    assert.equal(SAFE_EMAIL.test(email), false);
    assert.throws(
      () => assertSafeEmail(email),
      /refusing to delete non-test email/,
    );
  }
});

test("SAFE_VENDOR_NAME accepts playwright vendor names", () => {
  const names = ["Playwright-E2E-run123-foo", "playwright-e2e-x"];
  for (const name of names) {
    assert.equal(SAFE_VENDOR_NAME.test(name), true);
    assert.doesNotThrow(() => assertSafeVendorName(name));
  }
});

test("SAFE_VENDOR_NAME rejects real vendor-like names", () => {
  const bad = ["My Real Vendor", "Playwright-E2E"];
  for (const name of bad) {
    assert.equal(SAFE_VENDOR_NAME.test(name), false);
    assert.throws(
      () => assertSafeVendorName(name),
      /refusing to delete non-test vendor/,
    );
  }
});
