import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const kchData = readFileSync(join(root, "lib/kch-data.ts"), "utf8");

/**
 * Keys returned by the compact branch of getPlayerPortalData - the one that
 * serves every scope except "full".
 */
function compactReturnKeys(): Set<string> {
  const branch = kchData.indexOf('if (scope !== "full") {');
  const marker = kchData.indexOf('source: "supabase",', branch);
  const returnStart = kchData.lastIndexOf("return {", marker);
  const block = kchData.slice(returnStart, marker);
  return new Set([...block.matchAll(/^\s{8}([a-zA-Z]+)[,:]/gm)].map((match) => match[1]));
}

/** Fields the compact branch does not set fall back to these defaults. */
function fallbackKeys(): Set<string> {
  const start = kchData.indexOf("const fallback: PlayerPortalData = {");
  const end = kchData.indexOf("\n};", start);
  const block = kchData.slice(start, end);
  return new Set([...block.matchAll(/^\s{2}([a-zA-Z]+):/gm)].map((match) => match[1]));
}

const pages = (function walk(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, found);
    else if (entry === "page.tsx") found.push(full);
  }
  return found;
})(join(root, "app"));

const scopedPages = pages.flatMap((page) => {
  const source = readFileSync(page, "utf8");
  const call = source.match(/getPlayerPortalData\(\s*"([a-z]+)"\s*\)/);
  if (!call) return [];
  return [
    {
      file: relative(root, page),
      scope: call[1],
      reads: [...new Set([...source.matchAll(/\bdata\.([a-zA-Z]+)/g)].map((m) => m[1]))],
    },
  ];
});

/**
 * Pages that ask for a narrow scope skip most of the portal's queries. If a
 * page later starts reading a field the compact branch never sets, it silently
 * renders the fallback default - an empty roster or a zero balance - rather
 * than failing. This is the check that turns that into a build failure.
 */
describe("scoped pages only read fields their scope provides", () => {
  const provided = compactReturnKeys();
  const fallbacks = fallbackKeys();

  it("parsed the compact return block", () => {
    expect(provided.size).toBeGreaterThan(10);
    expect(provided.has("paymentHistory")).toBe(true);
  });

  it("parsed the fallback block", () => {
    expect(fallbacks.size).toBeGreaterThan(10);
  });

  it("found the scoped pages", () => {
    expect(scopedPages.map((page) => page.scope).sort()).toEqual(["home", "payments", "profile"]);
  });

  it.each(scopedPages.map((page) => [page.file, page.scope, page.reads] as const))(
    "%s (scope %s) reads only provided fields",
    (_file, _scope, reads) => {
      const missing = reads.filter((field) => !provided.has(field));
      expect(missing).toEqual([]);
    },
  );
});
