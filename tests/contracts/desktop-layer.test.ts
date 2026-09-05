import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const css = readFileSync(join(root, "app/globals.css"), "utf8");
const BREAKPOINT = "@media (min-width: 900px) {";

/** Every rule in the file, tagged with whether it sits inside the desktop layer. */
function rules() {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out: { selector: string; desktop: boolean }[] = [];
  let depth = 0;
  let desktopDepth = -1;
  let buffer = "";
  for (let i = 0; i < stripped.length; i++) {
    const char = stripped[i];
    if (char === "{") {
      const selector = buffer.trim();
      if (selector.startsWith("@")) {
        if (selector.startsWith("@media (min-width: 900px)")) desktopDepth = depth;
      } else if (selector) {
        out.push({ selector, desktop: desktopDepth >= 0 });
      }
      depth++;
      buffer = "";
    } else if (char === "}") {
      depth--;
      if (desktopDepth >= 0 && depth <= desktopDepth) desktopDepth = -1;
      buffer = "";
    } else {
      buffer += char;
    }
  }
  return out;
}

/**
 * The phone layout and the laptop layout share one component tree and one
 * stylesheet. The only thing keeping them apart is that every laptop rule sits
 * inside the 900px query. A rule that escapes it silently changes the phone,
 * and nothing else in the project would catch that.
 */
describe("the laptop layer stays inside its media query", () => {
  const all = rules();

  it("parsed the stylesheet", () => {
    expect(all.length).toBeGreaterThan(200);
    expect(all.some((rule) => rule.desktop)).toBe(true);
  });

  it("declares the breakpoint exactly once", () => {
    expect(css.split(BREAKPOINT).length - 1).toBe(1);
  });

  // display:contents is the mechanism that makes the desktop column wrappers
  // invisible to the phone, so it is the one rule that must live outside.
  const ALLOWED_OUTSIDE = [".col-pane"];

  it.each(["two-col", "col-pane-a", "col-pane-b"])("keeps .%s inside the laptop layer", (token) => {
    const leaked = all.filter((rule) => rule.selector.includes(token) && !rule.desktop);
    expect(leaked.map((rule) => rule.selector)).toEqual([]);
  });

  it("only allows the documented wrapper rule outside the layer", () => {
    const outside = all.filter((rule) => rule.selector.includes("col-pane") && !rule.desktop);
    expect(outside.map((rule) => rule.selector)).toEqual(ALLOWED_OUTSIDE);
  });

  it("neutralises the wrappers below the breakpoint", () => {
    const bare = css.match(/\.col-pane\s*\{([^}]*)\}/);
    expect(bare?.[1]).toContain("display: contents");
  });
});

/**
 * A two-column page needs both panes. One pane, or three, means the grid is
 * placing children it was not told about and the layout silently degrades.
 */
describe("two-column pages declare both panes", () => {
  const pages = readdirSync(join(root, "app"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(root, "app", entry.name, "page.tsx"))
    .filter((path) => {
      try {
        return readFileSync(path, "utf8").includes('contentClass="two-col"');
      } catch {
        return false;
      }
    });

  it("finds the opted-in pages", () => {
    expect(pages.length).toBeGreaterThanOrEqual(4);
  });

  it.each(pages.map((path) => path.replace(`${root}/`, "")))(
    "%s has exactly one of each pane",
    (relative) => {
      const source = readFileSync(join(root, relative), "utf8");
      expect(source.match(/col-pane-a/g)?.length).toBe(1);
      expect(source.match(/col-pane-b/g)?.length).toBe(1);
    },
  );
});
