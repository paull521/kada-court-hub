import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const OWNER = join(root, "app/owner");

const ownerPages = (function walk(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, found);
    else if (entry === "page.tsx") found.push(full);
  }
  return found;
})(OWNER);

/** Everything above the first `return` - what the page blocks on before it can paint. */
function blockingSection(source: string): string {
  const body = source.slice(source.indexOf("export default"));
  const firstReturn = body.indexOf("\n  return");
  return firstReturn === -1 ? body : body.slice(0, firstReturn);
}

/**
 * The owner workspace measured 1.2s-3.9s of server time per navigation, and the
 * shape of the page was most of it: every page opened with
 * `await getOwnerPortalData()`, which reads every registration, fee, payment and
 * game in the conference. Nothing rendered until all of it landed, so
 * loading.tsx showed a full-page skeleton for the whole wait.
 *
 * The fix is structural, so it needs a structural test. A page may block on
 * getOwnerConferenceContext() - one memoised wave, enough for the header, the
 * title and the authorization redirect - and must read the portal below a
 * <Suspense> boundary instead of above it. Putting the await back at the top
 * would restore the old behaviour silently: the page would still render, still
 * pass every other test, and just feel slow again.
 */
describe("owner pages stream their heavy read", () => {
  it("finds the owner pages to check", () => {
    expect(ownerPages.length).toBeGreaterThan(5);
  });

  const portalPages = ownerPages.filter((page) =>
    readFileSync(page, "utf8").includes("getOwnerPortalData"),
  );

  it("finds pages that read the owner portal", () => {
    expect(portalPages.length).toBeGreaterThan(5);
  });

  it.each(portalPages.map((page) => relative(root, page)))(
    "%s does not block its first paint on the portal",
    (page) => {
      const source = readFileSync(join(root, page), "utf8");
      expect(blockingSection(source)).not.toMatch(/await\s+getOwnerPortalData\(/);
    },
  );

  it.each(portalPages.map((page) => relative(root, page)))(
    "%s wraps the portal read in a Suspense boundary",
    (page) => {
      const source = readFileSync(join(root, page), "utf8");
      expect(source).toMatch(/<Suspense/);
    },
  );

  /**
   * The boundaries are only free because the portal is memoised. Without
   * cache() each boundary would repeat the entire read, and a page with six of
   * them would be six times slower than the version this replaced.
   */
  it("memoises the portal read so sibling boundaries share one request", () => {
    const data = readFileSync(join(root, "lib/owner-data.ts"), "utf8");
    expect(data).toMatch(/export const getOwnerPortalData = cache\(/);
    expect(data).toMatch(/export const getOwnerConferenceContext = cache\(/);
  });
});
