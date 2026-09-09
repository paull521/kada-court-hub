import { expect, type Page } from "@playwright/test";

/**
 * Settles the page before the shutter: fonts loaded, no pending network, and
 * the loading frames resolved into their real values. Without this the shot
 * can catch a placeholder bar mid-swap and fail for no reason.
 */
export async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  // The frames paint immediately with grey bars where values will land.
  // Shooting before those resolve captures a placeholder, not the page.
  await expect(page.locator(".skeleton")).toHaveCount(0, { timeout: 20_000 });
}
