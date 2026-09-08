import { test, expect, type Page } from "@playwright/test";

/**
 * One screenshot per route per viewport, compared against a committed
 * baseline. This is the only check in the project that can see a layout
 * break - the 162 Vitest tests assert behaviour and never look at a page.
 *
 * Adding a route is one line. After an intentional visual change, re-run with
 * --update-snapshots and commit the new baselines in the same commit as the
 * change that caused them.
 */

type Route = { path: string; name: string };

const publicRoutes: Route[] = [
  { path: "/login", name: "login" },
  { path: "/sign-up", name: "sign-up" },
  { path: "/reset-password", name: "reset-password" },
  { path: "/legal", name: "legal" },
  { path: "/platform/login", name: "platform-login" },
];

const playerRoutes: Route[] = [
  { path: "/home", name: "player-home" },
  { path: "/my-team", name: "player-my-team" },
  { path: "/schedule", name: "player-schedule" },
  { path: "/standings", name: "player-standings" },
  { path: "/results", name: "player-results" },
  { path: "/payments", name: "player-payments" },
  { path: "/profile", name: "player-profile" },
  { path: "/more", name: "player-more" },
  { path: "/documents", name: "player-documents" },
];

const captainRoutes: Route[] = [
  { path: "/captain", name: "captain-home" },
  { path: "/captain/team", name: "captain-team" },
  { path: "/captain/roster", name: "captain-roster" },
  { path: "/captain/schedule", name: "captain-schedule" },
  { path: "/captain/availability", name: "captain-availability" },
  { path: "/captain/payments", name: "captain-payments" },
  { path: "/captain/more", name: "captain-more" },
  { path: "/profile?view=captain", name: "captain-profile" },
];

const ownerRoutes: Route[] = [
  { path: "/owner", name: "owner-home" },
  { path: "/owner/roster?view=teams", name: "owner-teams" },
  { path: "/owner/roster", name: "owner-roster" },
  { path: "/owner/schedule", name: "owner-schedule" },
  { path: "/owner/scores", name: "owner-scores" },
  { path: "/owner/payments", name: "owner-payments" },
  { path: "/owner/financials", name: "owner-financials" },
  { path: "/owner/setup", name: "owner-setup" },
  { path: "/owner/uniforms", name: "owner-uniforms" },
  { path: "/owner/conferences", name: "owner-conferences" },
  { path: "/owner/guide", name: "owner-guide" },
  { path: "/owner/more", name: "owner-more" },
  { path: "/profile?view=owner", name: "owner-profile" },
];

/**
 * Settles the page before the shutter: fonts loaded, no pending network, and
 * the loading frames resolved into their real values. Without this the shot
 * can catch a placeholder bar mid-swap and fail for no reason.
 */
async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  // The frames paint immediately with grey bars where values will land.
  // Shooting before those resolve captures a placeholder, not the page.
  await expect(page.locator(".skeleton")).toHaveCount(0, { timeout: 20_000 });
}

function shoot(routes: Route[], label: string) {
  test.describe(label, () => {
    for (const { path, name } of routes) {
      test(name, async ({ page }) => {
        const response = await page.goto(path, { waitUntil: "domcontentloaded" });
        expect(response?.status(), `${path} should not error`).toBeLessThan(400);
        await settle(page);
        await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
      });
    }
  });
}

shoot(publicRoutes, "public");
shoot(playerRoutes, "player");
shoot(captainRoutes, "captain");
shoot(ownerRoutes, "owner");

/**
 * States the default pages never reach.
 *
 * Every route above photographs whichever conference the account happens to
 * have selected, and in that one no game is finished - so the finalized
 * scoreboard, half of OwnerScoresheets, appears in no baseline. A migration
 * cannot verify what it cannot see, which is a good reason to make it visible
 * rather than to convert the component blind.
 *
 * The conference is chosen by a cookie the app already uses, so this switches
 * by setting it rather than by pressing anything. Nothing here writes.
 */

// KCH Pilot - AAPBA test: 15 finished games and 20 still awaiting a score, so
// one screenshot covers both halves of the component. If the demo data is ever
// rebuilt this id changes and the test fails loudly - update it here.
const CONFERENCE_WITH_RESULTS = "c559f3c2-447d-4b3c-8006-265c5ed377ef";

test.describe("states", () => {
  test("owner-scores-finalized", async ({ page, context, baseURL }) => {
    await context.addCookies([
      { name: "kch_owner_conference", value: CONFERENCE_WITH_RESULTS, url: baseURL! },
    ]);
    const response = await page.goto("/owner/scores", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(400);
    await settle(page);
    // The point of the shot: if this is zero the conference no longer has
    // results and the screenshot below proves nothing.
    await expect(page.locator(".scoreboard-match").first()).toBeVisible();
    await expect(page).toHaveScreenshot("owner-scores-finalized.png", { fullPage: true });
  });
});
