import { describe, it, expect } from "vitest";
import { playerFacingFees, feeIcon } from "@/lib/kch-data";

/**
 * playerFacingFees encodes a product rule with real money behind it: players
 * never see the platform fee as a line item, but they must still be charged it.
 * The amount is folded into the League Fee instead. Getting this wrong either
 * exposes internal billing to players or undercharges them.
 */
describe("playerFacingFees", () => {
  const league = { id: "f1", category: "league", description: "League Fee", amount_cents: 11000 };
  const uniform = { id: "f2", category: "uniform", description: "Uniform Fee", amount_cents: 6000 };
  const platform = { id: "f3", category: "platform", description: "Platform", amount_cents: 300 };

  it("converts cents to dollars", () => {
    expect(playerFacingFees([league])).toEqual([
      { id: "f1", label: "League Fee", amount: 110, icon: "◉" },
    ]);
  });

  it("never returns a platform fee as its own line item", () => {
    const result = playerFacingFees([league, uniform, platform]);
    expect(result.map((fee) => fee.id)).not.toContain("f3");
    expect(result.map((fee) => fee.label)).not.toContain("Platform");
  });

  it("folds the platform amount into an existing league fee", () => {
    const result = playerFacingFees([league, platform]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "f1", amount: 113 });
  });

  it("sums multiple platform fees before folding them in", () => {
    const result = playerFacingFees([league, platform, { ...platform, id: "f4" }]);
    expect(result[0].amount).toBe(116);
  });

  it("synthesises a League Fee when there is a platform charge but no league fee", () => {
    const result = playerFacingFees([uniform, platform]);
    const synthesised = result.find((fee) => fee.id === "league-access");
    expect(synthesised).toEqual({
      id: "league-access",
      label: "League Fee",
      amount: 3,
      icon: "◉",
    });
  });

  it("leaves other fees untouched when folding", () => {
    const result = playerFacingFees([league, uniform, platform]);
    expect(result.find((fee) => fee.id === "f2")).toEqual({
      id: "f2",
      label: "Uniform Fee",
      amount: 60,
      icon: "♕",
    });
  });

  it("adds nothing when there is no platform charge", () => {
    expect(playerFacingFees([league, uniform])).toHaveLength(2);
  });

  it("ignores a zero-amount platform fee rather than synthesising an empty line", () => {
    const result = playerFacingFees([uniform, { ...platform, amount_cents: 0 }]);
    expect(result.map((fee) => fee.id)).toEqual(["f2"]);
  });

  it("returns an empty list for no fees", () => {
    expect(playerFacingFees([])).toEqual([]);
  });
});

describe("feeIcon", () => {
  it.each([
    ["league", "◉"],
    ["uniform", "♕"],
    ["platform", "▣"],
    ["anything-else", "▣"],
  ])("maps %s to %s", (category, icon) => {
    expect(feeIcon(category)).toBe(icon);
  });
});
