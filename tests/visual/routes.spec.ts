import { test, expect } from "@playwright/test";
import { settle } from "./settle";

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
  // /rules reads a record chosen by query string and renders its empty state
  // without one, so it takes two lines rather than one. ?required=1 resolves
  // the account's own active registration.
  { path: "/rules?required=1", name: "player-rules" },
  { path: "/rules", name: "player-rules-empty" },
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
  /**
   * The guide's FAQ is seven closed disclosures, and the summary swaps its +
   * for a – when one opens. Neither the open padding nor the swapped glyph is
   * in the owner-guide baseline.
   */
  test("owner-guide-faq-open", async ({ page }) => {
    const response = await page.goto("/owner/guide", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(400);
    await settle(page);
    const count = await page.locator("details").evaluateAll((nodes) => {
      nodes.forEach((node) => ((node as HTMLDetailsElement).open = true));
      return nodes.length;
    });
    expect(count, "expected disclosures on /owner/guide").toBeGreaterThan(0);
    await settle(page);
    await expect(page).toHaveScreenshot("owner-guide-faq-open.png", { fullPage: true });
  });

  /**
   * Disclosures are closed on arrival, so everything inside one - the whole of
   * PlatformFeedback's form, and the account panels beside it - is absent from
   * the profile baselines. Opening them is a DOM property, not a click: the
   * spec still presses nothing.
   */
  test("owner-profile-disclosures-open", async ({ page }) => {
    const response = await page.goto("/profile?view=owner", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(400);
    await settle(page);
    const count = await page.locator("details").evaluateAll((nodes) => {
      nodes.forEach((node) => ((node as HTMLDetailsElement).open = true));
      return nodes.length;
    });
    // If the page stops using disclosures this shot silently becomes a second
    // copy of owner-profile and stops covering anything.
    expect(count, "expected disclosures to open").toBeGreaterThan(0);
    await settle(page);
    await expect(page).toHaveScreenshot("owner-profile-disclosures-open.png", { fullPage: true });
  });

  test("owner-scores-finalized", async ({ page, context, baseURL }) => {
    await context.addCookies([
      { name: "kch_owner_conference", value: CONFERENCE_WITH_RESULTS, url: baseURL! },
    ]);
    const response = await page.goto("/owner/scores", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(400);
    await settle(page);
    // The point of the shot: if this is zero the conference no longer has
    // results and the screenshot below proves nothing. The hook is a data
    // attribute, not a class, so restyling the component cannot quietly
    // disarm the assertion that guards it.
    await expect(page.locator("[data-finalized]").first()).toBeVisible();
    await expect(page).toHaveScreenshot("owner-scores-finalized.png", { fullPage: true });
  });

  /**
   * The season and division disclosures on the teams workspace, opened. Their
   * summaries are in the owner-teams baseline already; the rotated caret, the
   * seam above the panel and everything inside it are not, and that is most of
   * what styles them. Twenty-one disclosures and 5,700px - the same page with
   * every game card open on /owner/schedule is six times that, which is why
   * the open game card below is photographed one at a time instead.
   */
  test("owner-teams-open", async ({ page }) => {
    const response = await page.goto("/owner/roster?view=teams", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBeLessThan(400);
    await settle(page);
    // Three passes, because the nesting is three deep: opening a season is
    // what puts its divisions in the DOM, a division its teams, a team its
    // players.
    for (let pass = 0; pass < 3; pass++)
      await page
        .locator("details")
        .evaluateAll((nodes) => nodes.forEach((n) => ((n as HTMLDetailsElement).open = true)));
    const open = await page.locator("details[open]").count();
    // If the conference loses its seasons this becomes a second copy of
    // owner-teams and stops covering anything.
    expect(open, "expected open disclosures on the teams workspace").toBeGreaterThan(2);
    await settle(page);
    await expect(page).toHaveScreenshot("owner-teams-open.png", { fullPage: true });
  });

  /**
   * The schedule's whole game list. Its one division is final, so the division
   * disclosure arrives shut and every game card sits inside collapsed content
   * - the owner-schedule baseline is a season card, a division card and empty
   * background, and photographs not one of the thirty-eight. Opening the
   * division brings them all into view shut; opening the first brings the
   * card's open state - caret turned, panel seam, the radius clipping it - in
   * with them.
   */
  test("owner-schedule-games", async ({ page }) => {
    const response = await page.goto("/owner/schedule", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(400);
    await settle(page);
    await page
      .locator("details.division-operation")
      .evaluateAll((nodes) => nodes.forEach((n) => ((n as HTMLDetailsElement).open = true)));
    await settle(page);
    // A closed division renders none of these, which is the state this shot
    // exists to escape. If it ever counts zero it has become owner-schedule.
    const cards = page.locator("[data-game-card]");
    expect(await cards.count(), "expected game cards on /owner/schedule").toBeGreaterThan(1);
    // Two of them: the create-game card is laid out with an icon column and an
    // existing game is laid out without one.
    for (const kind of ["new", "edit"])
      await page
        .locator(`[data-game-card="${kind}"]`)
        .first()
        .evaluate((node) => ((node as HTMLDetailsElement).open = true));
    await settle(page);
    await expect(page).toHaveScreenshot("owner-schedule-games.png", { fullPage: true });
  });

  /**
   * A finalized game is an <article> with no summary at all, not a disclosure.
   * The conference every other shot uses has none, so this variant - a third
   * of the schedule page in a season that has been played - is invisible to
   * the suite without switching conferences the way owner-scores-finalized
   * does, and shut inside its division even then.
   */
  test("owner-schedule-finalized", async ({ page, context, baseURL }) => {
    await context.addCookies([
      { name: "kch_owner_conference", value: CONFERENCE_WITH_RESULTS, url: baseURL! },
    ]);
    const response = await page.goto("/owner/schedule", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(400);
    await settle(page);
    await page
      .locator("details.division-operation")
      .evaluateAll((nodes) => nodes.forEach((n) => ((n as HTMLDetailsElement).open = true)));
    await settle(page);
    // Zero of these means the conference no longer has finished games and the
    // shot below proves nothing.
    expect(
      await page.locator('[data-game-card="final"]').count(),
      "expected finalized games on /owner/schedule",
    ).toBeGreaterThan(0);
    await expect(page).toHaveScreenshot("owner-schedule-finalized.png", { fullPage: true });
  });

  /**
   * The captain's roster is four disclosures and all four arrive shut, so the
   * captain-roster baseline is four summaries on an empty page: the published
   * team list, the request form, the history and the player-details panel are
   * none of them in it. The list alone is ten rows of markup that six rules in
   * two stylesheets re-scope.
   */
  test("captain-roster-open", async ({ page }) => {
    const response = await page.goto("/captain/roster", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(400);
    await settle(page);
    // Twice: the published roster is inside a disclosure that is itself inside
    // one, and opening the outer is what puts the inner in the DOM.
    for (let pass = 0; pass < 2; pass++)
      await page
        .locator("details")
        .evaluateAll((nodes) => nodes.forEach((n) => ((n as HTMLDetailsElement).open = true)));
    // The first two disclosures render only once a roster is published. If
    // that stops being true this shot quietly loses half its subject.
    expect(
      await page.locator("details[open]").count(),
      "expected the published roster to be open",
    ).toBeGreaterThan(3);
    await settle(page);
    await expect(page).toHaveScreenshot("captain-roster-open.png", { fullPage: true });
  });
});
