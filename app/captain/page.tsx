import Link from "next/link";
import { redirect } from "next/navigation";
import CaptainShell from "@/components/CaptainShell";
import ConferencePlayerInvitation from "@/components/ConferencePlayerInvitation";
import { getCaptainPortalData } from "@/lib/captain-data";
import { createClient } from "@/lib/supabase/server";

export default async function CaptainDashboard() {
  const data = await getCaptainPortalData("home");
  if (!data.authorized) redirect("/profile");
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
    <CaptainShell
      data={data}
      active="dashboard"
      title={data.teamName}
      subtitle={`${data.divisionName} · ${data.seasonName}`}
    >
      <section className="captain-dashboard-grid">
        <Link href="/captain/schedule" className="card captain-task-tile featured">
          <span>▦</span>
          <small>SCHEDULE</small>
          <b>{next ? next.dateLabel : "No game"}</b>
          <em>{next ? `${next.time} · ${next.uniform}` : "Waiting for schedule"}</em>
        </Link>
        <Link
          href="/captain/availability"
          className={`card captain-task-tile ${noCount ? "attention" : ""}`}
        >
          <span>✓</span>
          <small>AVAILABILITY</small>
          <b>
            {data.availability.length - noCount} Yes · {noCount} No
          </b>
          <em>{next ? `For ${next.opponent}` : "No upcoming game"}</em>
        </Link>
        <Link href="/captain/roster" className={`card captain-task-tile ${data.draftStatus}`}>
          <span>♟</span>
          <small>TEAM ROSTER</small>
          <b>{rosterStatus}</b>
          <em>{data.roster.length} players</em>
        </Link>
        <Link
          href="/captain/payments"
          className={`card captain-task-tile featured ${notPaid ? "attention" : ""}`}
        >
          <span>▣</span>
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
    </CaptainShell>
  );
}
