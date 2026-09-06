import AppShell from "@/components/AppShell";
import PlayerContextSwitcher from "@/components/PlayerContextSwitcher";
import { getPlayerPortalData } from "@/lib/kch-data";
import { redirect } from "next/navigation";

export default async function Team() {
  const data = await getPlayerPortalData();
  if (!data.contexts.length) redirect("/home");
  return (
    <AppShell
      contentClass="two-col"
      active="team"
      notifications={data.notifications}
      profileNeedsAttention={data.profileNeedsAttention}
      paymentNeedsAttention={data.paymentNeedsAttention}
      teamHasUnavailable={data.teamHasUnavailable}
    >
      <div className="col-pane col-pane-a">
        <PlayerContextSwitcher
          contexts={data.contexts}
          activeRegistrationId={data.activeRegistrationId}
          variant="banner"
        />
      </div>
      <div className="col-pane col-pane-b">
        <TeamRoster
          roster={
            data.teamInfo.divisionRosters.find((team) => team.isMyTeam)?.players.length
              ? data.teamInfo.divisionRosters.find((team) => team.isMyTeam)!.players
              : data.roster
          }
          availability={data.availability}
        />
      </div>
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
