import "server-only";
import { createClient } from "@/lib/supabase/server";

export type LedgerEntry = {
  id: string;
  chargeType: "subscription" | "platform_fee";
  label: string;
  amountCents: number;
  paidCents: number;
  balanceCents: number;
  status: "due" | "partial" | "paid";
  dueOn: string | null;
};
export type SubscriptionSubmission = {
  id: string;
  amountCents: number;
  method: "zelle" | "cash";
  status: "pending" | "confirmed" | "declined";
  submittedAt: string;
  reviewedAt?: string | null;
};
export type BillingDivision = {
  divisionName: string;
  activePlayers: number;
  platformFeeCents: number;
};
export type OwnerPaymentBilling = {
  entries: LedgerEntry[];
  submissions: SubscriptionSubmission[];
  divisions: BillingDivision[];
};
export type PlatformOwnerPaymentBilling = {
  conferenceId: string;
  conferenceName: string;
  ownerName: string;
  email: string;
  phone: string;
  billing: OwnerPaymentBilling;
};

const empty: OwnerPaymentBilling = { entries: [], submissions: [], divisions: [] };
export const toEntry = (row: Record<string, unknown>): LedgerEntry => ({
  id: String(row.id ?? ""),
  chargeType: row.chargeType === "platform_fee" ? "platform_fee" : "subscription",
  label: String(row.label ?? ""),
  amountCents: Number(row.amountCents ?? 0),
  paidCents: Number(row.paidCents ?? 0),
  balanceCents: Number(row.balanceCents ?? 0),
  status: row.status === "paid" ? "paid" : row.status === "partial" ? "partial" : "due",
  dueOn: typeof row.dueOn === "string" ? row.dueOn : null,
});
export const toSubmission = (row: Record<string, unknown>): SubscriptionSubmission => ({
  id: String(row.id ?? ""),
  amountCents: Number(row.amountCents ?? 0),
  method: row.method === "cash" ? "cash" : "zelle",
  status:
    row.status === "confirmed" ? "confirmed" : row.status === "declined" ? "declined" : "pending",
  submittedAt: String(row.submittedAt ?? ""),
  reviewedAt: typeof row.reviewedAt === "string" ? row.reviewedAt : null,
});
export const toBilling = (value: unknown): OwnerPaymentBilling => {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    entries: Array.isArray(row.entries)
      ? row.entries
          .filter(
            (item): item is Record<string, unknown> => Boolean(item) && typeof item === "object",
          )
          .map(toEntry)
      : [],
    submissions: Array.isArray(row.submissions)
      ? row.submissions
          .filter(
            (item): item is Record<string, unknown> => Boolean(item) && typeof item === "object",
          )
          .map(toSubmission)
      : [],
    divisions: Array.isArray(row.divisions)
      ? row.divisions
          .filter(
            (item): item is Record<string, unknown> => Boolean(item) && typeof item === "object",
          )
          .map((item) => ({
            divisionName: String(item.divisionName ?? "Division"),
            activePlayers: Number(item.activePlayers ?? 0),
            platformFeeCents: Number(item.platformFeeCents ?? 0),
          }))
      : [],
  };
};

export async function getOwnerPaymentBilling(conferenceId: string): Promise<OwnerPaymentBilling> {
  if (!conferenceId) return empty;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("owner_payment_billing", {
    p_conference_id: conferenceId,
  });
  return error ? empty : toBilling(data);
}

export async function getPlatformOwnerPaymentBilling(): Promise<PlatformOwnerPaymentBilling[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("platform_owner_payment_billing");
  if (error || !Array.isArray(data)) return [];
  return data
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((row) => ({
      conferenceId: String(row.conferenceId ?? ""),
      conferenceName: String(row.conferenceName ?? "Conference"),
      ownerName: String(row.ownerName ?? "Owner"),
      email: String(row.email ?? ""),
      phone: String(row.phone ?? ""),
      billing: toBilling(row.billing),
    }));
}
