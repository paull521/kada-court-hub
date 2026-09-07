import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { OwnerDemoOverview } from "@/components/OwnerDemoOverview";
import { getPlayerPortalData } from "@/lib/kch-data";
import { getOwnerProfileSummary } from "@/lib/owner-data";
import { getAvailableRoles } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export default async function DocumentsPage() {
  const [data, roles, supabase, owner] = await Promise.all([
    getPlayerPortalData(),
    getAvailableRoles(),
    createClient(),
    getOwnerProfileSummary(),
  ]);
  if (!roles.owner) redirect("/profile");
  const { data: acknowledgments } = await supabase.rpc("get_owner_demo_acknowledgment");
  const acknowledgedAt = acknowledgments?.[0]?.acknowledged_at ?? null;
  return (
    <AppShell
      active="profile"
      notifications={data.notifications}
      role="owner"
      contentClass="reading-content"
    >
      <p className="eyebrow">PROFILE</p>
      <h1 className="title">Owner Documents</h1>
      <p className="subtitle">
        {owner.conferenceName || "Conference"} · {owner.activeSeasonName || "Season"} ·{" "}
        {owner.activeSeasonDivisions.join(", ") || "Division"}
      </p>
      <OwnerDemoOverview acknowledgedAt={acknowledgedAt} />
      <Link className="btn secondary" href="/profile?view=owner">
        Back to Profile
      </Link>
    </AppShell>
  );
}
