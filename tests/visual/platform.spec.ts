import { test, expect } from "@playwright/test";
import { settle } from "./settle";

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
