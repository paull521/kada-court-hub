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

/**
 * Without a loading.tsx the App Router paints nothing until the whole server
 * payload is ready, so tapping a nav item leaves the previous screen frozen.
 * Any page that renders one of the app shells is a navigation destination and
 * needs a boundary above it.
 */
describe("route loading boundaries", () => {
  // Only pages that render a shell *and* await server data need a boundary.
  // A static page (app/more/page.tsx) paints immediately, so a fallback for it
  // would flash for no reason.
  const shellPages = pages.filter((page) => {
    const source = readFileSync(page, "utf8");
    const rendersShell = /\b(AppShell|CaptainShell|OwnerPageShell)\b/.test(source);
    // Promise.all counts too. app/legal/page.tsx awaited getPlayerPortalData
    // directly until it was changed to await a Promise.all of three calls, and
    // this pattern quietly stopped matching it - the page kept its boundary,
    // but nothing was checking any more.
    //
    // The name list this used to carry (PortalData|Roles|Dashboard|Operations)
    // had the same failure a second time when /owner/conferences moved onto
    // getOwnerConferenceContext(): a page dropped out of the checked set by
    // being renamed, silently, and the suite got one test shorter rather than
    // one test redder. Match any awaited get*() call instead, so a new data
    // function is covered on the day it is written.
    const fetchesData = /\bawait\s+(get[A-Z][A-Za-z]*\(|supabase|Promise\.all)/.test(source);
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
