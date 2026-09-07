import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const css = readFileSync(join(root, "app/desktop.css"), "utf8");
const base = readFileSync(join(root, "app/globals.css"), "utf8");
const layout = readFileSync(join(root, "app/layout.tsx"), "utf8");
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
    expect(all.length).toBeGreaterThan(25);
    expect(all.some((rule) => rule.desktop)).toBe(true);
  });

  it("declares the breakpoint exactly once", () => {
    expect(css.split(BREAKPOINT).length - 1).toBe(1);
  });

  // The whole point of the file: nothing in it can reach a phone.
  it("puts every rule in the file inside the layer", () => {
    expect(all.filter((rule) => !rule.desktop).map((rule) => rule.selector)).toEqual([]);
  });

  it("keeps the breakpoint out of every other stylesheet", () => {
    expect(base.includes(BREAKPOINT)).toBe(false);
  });

  /**
   * A laptop rule only wins if it is read last. globals.css is imported first
   * and five stylesheets follow it, so a rule written there loses to any later
   * file at equal specificity - which is how the four-across captain dashboard
   * came to be dead CSS. desktop.css has to stay at the bottom of the list.
   */
  it("is the last stylesheet the app imports", () => {
    const imports = [...layout.matchAll(/^import "\.\/([\w-]+\.css)";$/gm)].map((m) => m[1]);
    expect(imports.length).toBeGreaterThanOrEqual(2);
    expect(imports.at(-1)).toBe("desktop.css");
  });

  const ALLOWED_OUTSIDE = [".col-pane"];

  it.each(["two-col", "col-pane-a", "col-pane-b"])("keeps .%s inside the laptop layer", (token) => {
    const leaked = all.filter((rule) => rule.selector.includes(token) && !rule.desktop);
    expect(leaked.map((rule) => rule.selector)).toEqual([]);
  });

  it("keeps the documented wrapper rule in the base stylesheet", () => {
    // display:contents is the mechanism that makes the desktop column wrappers
    // invisible to the phone, so it is the one rule that must live outside.
    expect(ALLOWED_OUTSIDE).toEqual([".col-pane"]);
    expect(base).toContain(".col-pane {");
  });

  it("neutralises the wrappers below the breakpoint", () => {
    const bare = base.match(/\.col-pane\s*\{([^}]*)\}/);
    expect(bare?.[1]).toContain("display: contents");
  });
});

/**
 * A two-column page needs both panes. One pane, or three, means the grid is
 * placing children it was not told about and the layout silently degrades.
 */
describe("two-column pages declare both panes", () => {
  // Recursive: captain and owner pages are nested deeper than one level, and a
  // shallow walk would silently report zero of them.
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      return entry.name === "page.tsx" ? [full] : [];
    });

  const pages = walk(join(root, "app")).filter((path) =>
    readFileSync(path, "utf8").includes('contentClass="two-col"'),
  );

  // A floor, not a target: it catches a walk that silently found nothing, which
  // would make every assertion below vacuous. /my-team dropped out of the set
  // when it went back to a single column - one pane held the team switcher and
  // nothing else, so the second column was empty down the whole page.
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

/**
 * The desktop measure cap hangs off .content. A shell that renders its own
 * markup and forgets that class opts itself out of the cap silently and
 * stretches across the whole window. app/owner/page.tsx builds its shell inline
 * rather than going through OwnerPageShell, which is exactly where that drifts.
 */
describe("every shell carries the content class", () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      return /\.tsx$/.test(entry.name) ? [full] : [];
    });

  const shellFiles = [...walk(join(root, "app")), ...walk(join(root, "components"))].filter(
    (path) => /className="shell\b/.test(readFileSync(path, "utf8")),
  );

  it("finds the files that build a shell", () => {
    expect(shellFiles.length).toBeGreaterThanOrEqual(4);
  });

  it.each(shellFiles.map((path) => path.replace(`${root}/`, "")))(
    "%s pairs its shell with a .content main",
    (relative) => {
      const source = readFileSync(join(root, relative), "utf8");
      const shells = source.match(/className="shell\b/g)?.length ?? 0;
      // login screens are a single centred form with no nav and no content main
      if (/className="shell login-shell/.test(source)) return;
      const mains = source.match(/className=\{?[`"]content\b/g)?.length ?? 0;
      expect(mains).toBeGreaterThanOrEqual(shells);
    },
  );
});
