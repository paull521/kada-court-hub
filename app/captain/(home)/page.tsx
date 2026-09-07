import { Suspense } from "react";
import { redirect } from "next/navigation";
import CaptainShell from "@/components/CaptainShell";
import ConferencePlayerInvitation from "@/components/ConferencePlayerInvitation";
import CaptainDashboardFrame from "@/components/CaptainDashboardFrame";
import { getCaptainPortalData, type CaptainPortalData } from "@/lib/captain-data";
import { getAvailableRoles } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export default async function CaptainDashboard() {
  const roles = await getAvailableRoles();
  if (!roles.captain) redirect("/profile");
  const data = getCaptainPortalData("home");
  return (
    <CaptainShell data={data} active="dashboard">
      <Suspense fallback={<CaptainDashboardFrame />}>
        <DashboardTiles data={data} />
      </Suspense>
    </CaptainShell>
  );
}

/**
 * The invitation token is a read of its own, so it stays here rather than in the
 * frame; everything above it is the four tiles, which the frame draws with or
 * without the numbers in them.
 */
async function DashboardTiles({ data: portal }: { data: Promise<CaptainPortalData> }) {
  const data = await portal;
  const supabase = await createClient();
  const { data: conferenceInvitationToken } = await supabase.rpc(
    "captain_get_conference_player_invitation_token",
    { p_team_id: data.teamId },
  );
  return (
    <>
      <CaptainDashboardFrame data={data} />
      {typeof conferenceInvitationToken === "string" && (
        <ConferencePlayerInvitation token={conferenceInvitationToken} />
      )}
    </>
  );
}
