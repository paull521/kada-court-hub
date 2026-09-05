import { describe, it, expect } from "vitest";
import { rosterOrder, roleName } from "@/lib/kch-data";
import type { Player } from "@/lib/data";

const player = (over: Partial<Player>): Player => ({
  id: "p",
  number: 10,
  name: "Player",
  position: "Guard",
  role: "Player",
  ...over,
});

/**
 * Roster ordering is what captains and players read down every week, so the
 * tie-breaking has to be total: leadership first, then jersey number, then name.
 * Jersey 0 means "not assigned yet" and must sort last rather than first.
 */
describe("rosterOrder", () => {
  const sort = (players: Player[]) => [...players].sort(rosterOrder).map((row) => row.name);

  it("puts Captain before Co-captain before Player", () => {
    expect(
      sort([
        player({ name: "Rank3", role: "Player" }),
        player({ name: "Rank1", role: "Captain" }),
        player({ name: "Rank2", role: "Co-captain" }),
      ]),
    ).toEqual(["Rank1", "Rank2", "Rank3"]);
  });

  it("orders by jersey number within the same role", () => {
    expect(
      sort([
        player({ name: "Twelve", number: 12 }),
        player({ name: "Four", number: 4 }),
        player({ name: "Nine", number: 9 }),
      ]),
    ).toEqual(["Four", "Nine", "Twelve"]);
  });

  it("sorts an unassigned jersey number last, not first", () => {
    expect(
      sort([player({ name: "Unassigned", number: 0 }), player({ name: "Seven", number: 7 })]),
    ).toEqual(["Seven", "Unassigned"]);
  });

  it("breaks a full tie by name", () => {
    expect(
      sort([
        player({ name: "Zulu", number: 5 }),
        player({ name: "Alpha", number: 5 }),
        player({ name: "Mike", number: 5 }),
      ]),
    ).toEqual(["Alpha", "Mike", "Zulu"]);
  });

  it("ranks role above jersey number", () => {
    expect(
      sort([
        player({ name: "LowNumberPlayer", number: 1, role: "Player" }),
        player({ name: "HighNumberCaptain", number: 99, role: "Captain" }),
      ]),
    ).toEqual(["HighNumberCaptain", "LowNumberPlayer"]);
  });

  it("is a stable total order regardless of input order", () => {
    const roster = [
      player({ name: "A", number: 3, role: "Player" }),
      player({ name: "B", number: 0, role: "Co-captain" }),
      player({ name: "C", number: 7, role: "Captain" }),
      player({ name: "D", number: 3, role: "Player" }),
    ];
    const expected = sort(roster);
    expect(sort([...roster].reverse())).toEqual(expected);
  });
});

/**
 * role_label comes from the database as free text. Anything that is not an
 * exact recognised leadership label must degrade to Player - a typo must never
 * grant someone captain styling or ordering.
 */
describe("roleName", () => {
  it.each([
    ["Captain", "Captain"],
    ["Co-captain", "Co-captain"],
  ])("keeps the recognised label %s", (input, expected) => {
    expect(roleName(input)).toBe(expected);
  });

  it.each(["captain", "CO-CAPTAIN", "Coach", "", "Co Captain", "Player"])(
    "degrades %o to Player",
    (input) => {
      expect(roleName(input)).toBe("Player");
    },
  );
});
