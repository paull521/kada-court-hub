import { test as setup, expect } from "@playwright/test";

const STATE = "tests/visual/.auth/user.json";

/**
 * Signs in once and saves the session for every visual project to reuse.
 *
 * The file it writes holds a live Supabase session, so it is gitignored
 * alongside the credentials that produce it. Nothing here submits anything
 * but the login form - the visual specs navigate and screenshot, and never
 * press a control that writes to the database.
 */
setup("authenticate", async ({ page }) => {
  const email = process.env.KCH_TEST_EMAIL;
  const password = process.env.KCH_TEST_PASSWORD;

  if (!email || !password)
    throw new Error(
      "KCH_TEST_EMAIL and KCH_TEST_PASSWORD are not set. Add them to .env.local locally, or to the repository secrets in CI.",
    );

  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  // The form's own submit, found by role rather than by class: .loginbox was
  // a styling name and the migration deleted it.
  await page.getByRole("button", { name: /sign in|log in/i }).click();

  // proxy.ts sends a signed-in visitor away from /login, so landing anywhere
  // else is the signal the session took.
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 30_000 });
  await expect(page.locator("header.topbar")).toBeVisible();

  await page.context().storageState({ path: STATE });
});
