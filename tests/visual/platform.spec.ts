import { test, expect } from "@playwright/test";
import { settle } from "./settle";
import { expectNoLostTextColours } from "./contrast";

/**
 * The operator's desk. It signs in separately at /platform/login, which is why
 * these routes are their own spec with their own session - the owner account
 * that photographs everything else is bounced straight back to the login form.
 *
 * Nothing here presses a control. Every one of these pages can create an owner,
 * confirm a payment or answer a support request, and a screenshot needs none
 * of that.
 */
const routes = [
  { path: "/platform", name: "platform-home" },
  { path: "/platform/directory", name: "platform-directory" },
  { path: "/platform/owners", name: "platform-owners" },
  { path: "/platform/payments", name: "platform-payments" },
  { path: "/platform/announcements", name: "platform-announcements" },
  { path: "/platform/support", name: "platform-support" },
  { path: "/platform/settings", name: "platform-settings" },
  { path: "/platform/owner-invitation", name: "platform-owner-invitation" },
];

for (const { path, name } of routes) {
  test(name, async ({ page }) => {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status(), `${path} should not error`).toBeLessThan(400);
    // A bounce back to the login form would otherwise be photographed as if it
    // were the page, and every one of these baselines would be the same shot.
    expect(new URL(page.url()).pathname, `${path} should not redirect to login`).not.toContain(
      "/platform/login",
    );
    await settle(page);
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  });
}

/**
 * Support nests disclosures two deep - a conference, then each request inside
 * it - and both are closed on arrival, so the baselines above photograph only
 * the outermost summaries. Opening them is a DOM property, not a click.
 */
test("platform-support-open", async ({ page }) => {
  const response = await page.goto("/platform/support", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBeLessThan(400);
  await settle(page);
  // Twice: opening the outer disclosures is what puts the inner ones in the DOM.
  for (let pass = 0; pass < 2; pass++)
    await page
      .locator("details")
      .evaluateAll((nodes) => nodes.forEach((n) => ((n as HTMLDetailsElement).open = true)));
  const count = await page.locator("details[open]").count();
  // If support ever empties out, this shot stops covering anything and should
  // say so rather than pass as a picture of two empty cards.
  expect(count, "expected open disclosures on /platform/support").toBeGreaterThan(0);
  await settle(page);
  await expect(page).toHaveScreenshot("platform-support-open.png", { fullPage: true });
});

/**
 * Owner payments are one disclosure per conference and closed on arrival, so
 * the ledger inside them - the whole reason the screen exists - is absent from
 * the baseline above.
 */
test("platform-payments-open", async ({ page }) => {
  const response = await page.goto("/platform/payments", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBeLessThan(400);
  await settle(page);
  for (let pass = 0; pass < 2; pass++)
    await page
      .locator("details")
      .evaluateAll((nodes) => nodes.forEach((n) => ((n as HTMLDetailsElement).open = true)));
  const count = await page.locator("details[open]").count();
  expect(count, "expected open disclosures on /platform/payments").toBeGreaterThan(0);
  await settle(page);
  await expect(page).toHaveScreenshot("platform-payments-open.png", { fullPage: true });
});

test("no text colour is lost to the unlayered base rules", async ({ page }) => {
  test.setTimeout(300_000);
  await expectNoLostTextColours(
    page,
    routes.map((r) => r.path),
  );
});
