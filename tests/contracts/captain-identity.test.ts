import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { CAPTAIN_ROLE_LABELS, CAPTAIN_REGISTRATION_STATUS } from "@/lib/roles";

const root = process.cwd();

/**
 * "Is this account a captain" was once answered by three queries that
 * disagreed: the View As switcher offered a Captain role that the workspace
 * could not render, leaving an empty page. The criteria now live in
 * lib/roles.ts and every read site must use them. See
 * decisions/adr-0002 in the vault.
 */
const READ_SITES = [
  "lib/roles.ts", // gates the View As switcher
  "lib/captain-data.ts", // builds the captain workspace
  "app/captain/context-actions.ts", // switches the active captain team
];

describe("captain identity has one definition", () => {
  it("exposes the criteria as shared constants", () => {
    expect(CAPTAIN_ROLE_LABELS).toEqual(["Captain", "Co-captain"]);
    expect(CAPTAIN_REGISTRATION_STATUS).toBe("active");
  });

  it.each(READ_SITES)("%s uses the shared constants", (file) => {
    const source = readFileSync(join(root, file), "utf8");
    expect(source).toContain("CAPTAIN_ROLE_LABELS");
    expect(source).toContain("CAPTAIN_REGISTRATION_STATUS");
  });

  it.each(READ_SITES)("%s requires the registration to have a team", (file) => {
    const source = readFileSync(join(root, file), "utf8");
    expect(source).toContain('.not("team_id", "is", null)');
  });

  it.each(READ_SITES)("%s does not widen the status filter back to pending", (file) => {
    const source = readFileSync(join(root, file), "utf8");
    expect(source).not.toMatch(/\.in\(\s*"status",\s*\[\s*"active",\s*"pending"\s*\]/);
  });

  it("no server module re-inlines the role labels next to a registrations query", () => {
    const sources = ["app", "lib"]
      .map((dir) => join(root, dir))
      .flatMap(function walk(dir: string): string[] {
        return readdirSync(dir).flatMap((entry) => {
          const full = join(dir, entry);
          if (statSync(full).isDirectory()) return walk(full);
          return /\.tsx?$/.test(entry) ? [full] : [];
        });
      });

    const offenders = sources.filter((file) => {
      const source = readFileSync(file, "utf8");
      // A hardcoded label pair passed straight to a role_label filter.
      return /\.in\(\s*"role_label",\s*\[\s*"Captain"/.test(source);
    });

    expect(offenders.map((file) => relative(root, file))).toEqual([]);
  });
});
