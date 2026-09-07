import { Suspense } from "react";
import { CalendarDays, Check, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import CaptainShell from "@/components/CaptainShell";
import ConferencePlayerInvitation from "@/components/ConferencePlayerInvitation";
import { ContentPlaceholder } from "@/components/Skeleton";
import { getCaptainPortalData, type CaptainPortalData } from "@/lib/captain-data";
import { getAvailableRoles } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export default async function CaptainDashboard() {
  const roles = await getAvailableRoles();
  if (!roles.captain) redirect("/profile");
  const data = getCaptainPortalData("home");
  return (
    <CaptainShell data={data} active="dashboard">
      <Suspense fallback={<ContentPlaceholder cards={4} rows={0} />}>
        <DashboardTiles data={data} />
      </Suspense>
    </CaptainShell>
  );
}

/**
 * The tiles carry a status modifier in their own className (`attention`, the
 * draft status), so unlike the owner dashboard they cannot paint before the
 * numbers arrive without changing colour underneath the reader. They stream as
 * one block instead; the tab bar above them is already live.
 */
async function DashboardTiles({ data: portal }: { data: Promise<CaptainPortalData> }) {
  const data = await portal;
  const next = data.games[0],
    notPaid = data.payments.filter((player) => player.balance > 0).length,
    noCount = data.availability.filter((player) => !player.available).length;
  const rosterStatus = data.finalPublished
    ? "Final"
    : data.draftStatus === "changes_requested"
      ? "Changes requested"
      : data.draftStatus === "submitted"
        ? "Pending approval"
        : data.draftStatus === "approved"
          ? "Approved"
          : "Editing";
  const supabase = await createClient();
  const { data: conferenceInvitationToken } = await supabase.rpc(
    "captain_get_conference_player_invitation_token",
    { p_team_id: data.teamId },
  );
  return (
    <>
      <section className="captain-dashboard-grid">
        <Link href="/captain/schedule" className="card captain-task-tile featured">
          <span>
            <CalendarDays className="ui-icon" />
          </span>
          <small>SCHEDULE</small>
          <b>{next ? next.dateLabel : "No game"}</b>
          <em>{next ? `${next.time} · ${next.uniform}` : "Waiting for schedule"}</em>
        </Link>
        <Link
          href="/captain/availability"
          className={`card captain-task-tile ${noCount ? "attention" : ""}`}
        >
          <span>
            <Check className="ui-icon" />
          </span>
          <small>AVAILABILITY</small>
          <b>
            {data.availability.length - noCount} Yes · {noCount} No
          </b>
          <em>{next ? `For ${next.opponent}` : "No upcoming game"}</em>
        </Link>
        <Link href="/captain/roster" className={`card captain-task-tile ${data.draftStatus}`}>
          <span>
            <Users className="ui-icon" />
          </span>
          <small>TEAM ROSTER</small>
          <b>{rosterStatus}</b>
          <em>{data.roster.length} players</em>
        </Link>
        <Link
          href="/captain/payments"
          className={`card captain-task-tile featured ${notPaid ? "attention" : ""}`}
        >
          <span>
            <Wallet className="ui-icon" />
          </span>
          <small>PAYMENTS</small>
          <b>
            {notPaid} balance{notPaid === 1 ? "" : "s"} due
          </b>
          <em>Team payment status</em>
        </Link>
      </section>
      {typeof conferenceInvitationToken === "string" && (
        <ConferencePlayerInvitation token={conferenceInvitationToken} />
      )}
    </>
  );
}
