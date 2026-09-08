import { test as setup, expect } from "@playwright/test";

const STATE = "tests/visual/.auth/platform.json";

/**
 * The platform workspace is a separate sign-in at /platform/login, granted
 * separately from conference owner access - so it needs its own session file
 * rather than a second role on the owner's.
 */
setup("authenticate platform", async ({ page }) => {
  const email = process.env.KCH_PLATFORM_EMAIL;
  const password = process.env.KCH_PLATFORM_PASSWORD;

  if (!email || !password)
    throw new Error(
      "KCH_PLATFORM_EMAIL and KCH_PLATFORM_PASSWORD are not set. Add them to .env.local.",
    );

  await page.goto("/platform/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click("form.loginbox button.btn.primary");

  // /platform bounces anyone unauthorised straight back to the login form, so
  // landing anywhere else is the signal the creator account took.
  await page.waitForURL((url) => !url.pathname.startsWith("/platform/login"), { timeout: 30_000 });
  await page.context().storageState({ path: STATE });
});
