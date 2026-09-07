import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";

const APP = join(process.cwd(), "app");

const pages = (function walk(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, found);
    else if (entry === "page.tsx") found.push(full);
  }
  return found;
})(APP);

/** A loading.tsx covers its own segment and every segment nested below it. */
const hasBoundary = (pagePath: string) => {
  let dir = dirname(pagePath);
  while (dir.startsWith(APP)) {
    if (existsSync(join(dir, "loading.tsx"))) return true;
    dir = dirname(dir);
  }
  return false;
};

const SHELL = /\b(AppShell|CaptainShell|OwnerPageShell)\b/;

/**
 * A page can inherit its shell instead of rendering one. The season routes -
 * /schedule, /standings and /results - share a layout that builds the shell and
 * the switcher once, so that the switcher survives a navigation between them;
 * their pages are bodies. They are still navigation destinations, and a page
 * that stopped naming AppShell would otherwise have dropped out of this check
 * without a single test going red, which is how this contract has gone stale
 * three times already.
 */
const wrappedInAShell = (pagePath: string) => {
  let dir = dirname(pagePath);
  while (dir.startsWith(APP)) {
    const layout = join(dir, "layout.tsx");
    if (existsSync(layout) && SHELL.test(readFileSync(layout, "utf8"))) return true;
    dir = dirname(dir);
  }
  return false;
};

/**
 * Without a loading.tsx the App Router paints nothing until the whole server
 * payload is ready, so tapping a nav item leaves the previous screen frozen.
 * Any page that renders one of the app shells, or sits under a layout that
 * does, is a navigation destination and needs a boundary above it.
 */
describe("route loading boundaries", () => {
  // Only pages that render a shell *and* await server data need a boundary.
  // A static page (app/more/page.tsx) paints immediately, so a fallback for it
  // would flash for no reason.
  const shellPages = pages.filter((page) => {
    const source = readFileSync(page, "utf8");
    const rendersShell = SHELL.test(source) || wrappedInAShell(page);
    // Promise.all counts too. app/legal/page.tsx awaited getPlayerPortalData
    // directly until it was changed to await a Promise.all of three calls, and
    // this pattern quietly stopped matching it - the page kept its boundary,
    // but nothing was checking any more.
    //
    // This has now gone stale three times, each time by losing a test rather
    // than failing one: first when app/legal moved to Promise.all, then when
    // /owner/conferences moved to getOwnerConferenceContext(), then when the
    // player pages moved to playerHasTeamContext(). Every fix widened a list of
    // names, and the next rename slipped through the wider list.
    //
    // So stop matching names. A page that awaits any call before it renders is
    // a page that blocks on something, and that is exactly the condition a
    // boundary is for. app/more/page.tsx awaits nothing and stays exempt, which
    // is the one case the name list was really protecting.
    const fetchesData = /\bawait\s+[\w$.]+\s*\(/.test(source);
    return rendersShell && fetchesData;
  });

  it("finds shell-rendering pages to check", () => {
    expect(shellPages.length).toBeGreaterThan(10);
  });

  it.each(shellPages.map((page) => relative(process.cwd(), page)))(
    "%s is covered by a loading.tsx",
    (page) => {
      expect(hasBoundary(join(process.cwd(), page))).toBe(true);
    },
  );
});
