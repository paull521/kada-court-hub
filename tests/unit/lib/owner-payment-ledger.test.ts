import { describe, it, expect } from "vitest";
import { toEntry, toSubmission, toBilling } from "@/lib/owner-payment-ledger";

/**
 * These three map the untyped JSON returned by the owner_payment_billing RPC
 * into the shapes the owner Payments screen renders. The database can widen a
 * status enum or return null at any time, so every unrecognised value must
 * land on a safe default rather than reaching the UI as-is.
 */
describe("toEntry", () => {
  it("maps a fully populated row", () => {
    expect(
      toEntry({
        id: "e1",
        chargeType: "platform_fee",
        label: "Platform fee",
        amountCents: 5000,
        paidCents: 2000,
        balanceCents: 3000,
        status: "partial",
        dueOn: "2026-10-01",
      }),
    ).toEqual({
      id: "e1",
      chargeType: "platform_fee",
      label: "Platform fee",
      amountCents: 5000,
      paidCents: 2000,
      balanceCents: 3000,
      status: "partial",
      dueOn: "2026-10-01",
    });
  });

  it("defaults every field on an empty row", () => {
    expect(toEntry({})).toEqual({
      id: "",
      chargeType: "subscription",
      label: "",
      amountCents: 0,
      paidCents: 0,
      balanceCents: 0,
      status: "due",
      dueOn: null,
    });
  });

  it.each(["unknown", "", null, undefined, 7])(
    "falls back to subscription for chargeType %o",
    (chargeType) => {
      expect(toEntry({ chargeType }).chargeType).toBe("subscription");
    },
  );

  it.each(["unknown", "PAID", null, 3])("falls back to due for status %o", (status) => {
    expect(toEntry({ status }).status).toBe("due");
  });

  it("keeps dueOn only when it is a string", () => {
    expect(toEntry({ dueOn: "2026-01-01" }).dueOn).toBe("2026-01-01");
    expect(toEntry({ dueOn: 20260101 }).dueOn).toBeNull();
    expect(toEntry({ dueOn: null }).dueOn).toBeNull();
  });

  it("coerces numeric fields that arrive as strings", () => {
    expect(toEntry({ amountCents: "5000" }).amountCents).toBe(5000);
  });
});

describe("toSubmission", () => {
  it("defaults every field on an empty row", () => {
    expect(toSubmission({})).toEqual({
      id: "",
      amountCents: 0,
      method: "zelle",
      status: "pending",
      submittedAt: "",
      reviewedAt: null,
    });
  });

  it("recognises cash and treats anything else as zelle", () => {
    expect(toSubmission({ method: "cash" }).method).toBe("cash");
    expect(toSubmission({ method: "venmo" }).method).toBe("zelle");
    expect(toSubmission({ method: "CASH" }).method).toBe("zelle");
  });

  it.each([
    ["confirmed", "confirmed"],
    ["declined", "declined"],
    ["pending", "pending"],
    ["something-new", "pending"],
  ])("maps status %s to %s", (status, expected) => {
    expect(toSubmission({ status }).status).toBe(expected);
  });

  it("keeps reviewedAt only when it is a string", () => {
    expect(toSubmission({ reviewedAt: "2026-09-01" }).reviewedAt).toBe("2026-09-01");
    expect(toSubmission({ reviewedAt: 0 }).reviewedAt).toBeNull();
  });
});

describe("toBilling", () => {
  const emptyBilling = { entries: [], submissions: [], divisions: [] };

  it.each([null, undefined, "string", 42, []])(
    "returns empty collections for non-object input %o",
    (value) => {
      expect(toBilling(value)).toEqual(emptyBilling);
    },
  );

  it("returns empty collections when the keys are not arrays", () => {
    expect(toBilling({ entries: "nope", submissions: null, divisions: 3 })).toEqual(emptyBilling);
  });

  it("drops non-object items rather than mapping them", () => {
    const result = toBilling({ entries: [null, "x", 5, { id: "keep" }] });
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].id).toBe("keep");
  });

  it("maps divisions with defaults", () => {
    expect(
      toBilling({ divisions: [{}, { divisionName: "Div A", activePlayers: 12 }] }),
    ).toMatchObject({
      divisions: [
        { divisionName: "Division", activePlayers: 0, platformFeeCents: 0 },
        { divisionName: "Div A", activePlayers: 12, platformFeeCents: 0 },
      ],
    });
  });

  it("maps all three collections together", () => {
    const result = toBilling({
      entries: [{ id: "e" }],
      submissions: [{ id: "s" }],
      divisions: [{ divisionName: "D" }],
    });
    expect(result.entries).toHaveLength(1);
    expect(result.submissions).toHaveLength(1);
    expect(result.divisions).toHaveLength(1);
  });
});
