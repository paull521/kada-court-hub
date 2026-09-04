import AppShell from "@/components/AppShell";
import { getPlayerPortalData } from "@/lib/kch-data";
import { redirect } from "next/navigation";

export default async function Team() {
  const data = await getPlayerPortalData();
  if (!data.contexts.length) redirect("/home");
  return (
    <AppShell
      active="team"
      contexts={data.contexts}
      activeRegistrationId={data.activeRegistrationId}
      notifications={data.notifications}
      profileNeedsAttention={data.profileNeedsAttention}
      paymentNeedsAttention={data.paymentNeedsAttention}
      teamHasUnavailable={data.teamHasUnavailable}
      conferenceName={data.context.conference}
    >
      <h1 className="title">My Team</h1>
      <p className="subtitle">Team details &amp; roster</p>
      <section className="card team-banner">
        <span className="team-mark large">K</span>
        <div>
          <h2>{data.context.team}</h2>
          <p>
            {data.context.division} &nbsp;•&nbsp; {data.context.season}
          </p>
          <em>
            One Team. One Court. <b>One Family.</b>
          </em>
        </div>
      </section>
      <TeamRoster
        roster={
          data.teamInfo.divisionRosters.find((team) => team.isMyTeam)?.players.length
            ? data.teamInfo.divisionRosters.find((team) => team.isMyTeam)!.players
            : data.roster
        }
        availability={data.availability}
      />
    </AppShell>
  );
}

function TeamRoster({
  roster,
  availability,
}: {
  roster: Awaited<ReturnType<typeof getPlayerPortalData>>["roster"];
  availability: Awaited<ReturnType<typeof getPlayerPortalData>>["availability"];
}) {
  return (
    <section className="card panel roster-panel">
      <div className="section-heading">
        <h2>ROSTER</h2>
        <span>
          {roster.length} Player{roster.length === 1 ? "" : "s"}
        </span>
      </div>
      {roster.length ? (
        roster.map((player) => {
          const answer = availability.find((item) => item.name === player.name);
          return (
            <div className="roster-row roster-with-availability" key={player.id}>
              <i
                className={`availability-dot ${answer?.available === false ? "no" : "yes"}`}
                title={answer?.available === false ? "Unavailable" : "Available"}
              />
              <b className="jersey">{player.number || "—"}</b>
              <span className="roster-player-name">
                <strong>{player.name}</strong>
                <small>
                  {player.jerseyName ? `${player.jerseyName} · ` : ""}
                  {player.position || "Position not set"}
                </small>
              </span>
              <span className={player.role !== "Player" ? "staff-role" : ""}>{player.role}</span>
            </div>
          );
        })
      ) : (
        <p className="empty-note">The roster has not been published yet.</p>
      )}
    </section>
  );
}
