import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const roots = ["app", "lib"].map((dir) => join(process.cwd(), dir));
const sources = roots.flatMap(function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
});

/**
 * supabase-js derives row types from the select string *literal*. Splitting a
 * long select across concatenated pieces silently collapses the inference to
 * GenericStringError and every downstream property access stops being checked.
 * It still compiles at the call site, so nothing catches it but this test.
 */
describe("supabase select strings stay single literals", () => {
  const offenders = sources.flatMap((file) => {
    const source = readFileSync(file, "utf8");
    const hits: string[] = [];
    // .select( ... ) where the argument list contains a string followed by +
    const pattern = /\.select\(\s*("(?:[^"\\]|\\.)*"\s*\+)/g;
    for (const match of source.matchAll(pattern)) {
      const line = source.slice(0, match.index).split("\n").length;
      hits.push(`${relative(process.cwd(), file)}:${line}`);
    }
    return hits;
  });

  it("scans the real source tree", () => {
    expect(sources.length).toBeGreaterThan(50);
  });

  it("finds no concatenated select argument", () => {
    expect(offenders).toEqual([]);
  });
});
