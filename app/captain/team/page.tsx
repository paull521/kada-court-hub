import { Clock } from "lucide-react";
import { redirect } from "next/navigation";
import CaptainContextSwitcher from "@/components/CaptainContextSwitcher";
import CaptainShell from "@/components/CaptainShell";
import { getCaptainPortalData } from "@/lib/captain-data";

export default async function CaptainTeamPage() {
  const data = await getCaptainPortalData();
  if (!data.authorized) redirect("/profile");
  return (
    <CaptainShell
      data={data}
      active="team"
      title={data.teamName}
      subtitle={`${data.divisionName} · ${data.seasonName}`}
    >
      <CaptainContextSwitcher
        variant="banner"
        contexts={data.contexts}
        activeRegistrationId={data.activeRegistrationId}
      />
      {!data.finalPublished ? (
        <section className="card schedule-empty">
          <span>
            <Clock className="ui-icon" />
          </span>
          <h2>Final roster not published</h2>
          <p>Continue working from Team Roster until the commissioner finalizes this division.</p>
        </section>
      ) : (
        <section className="card panel captain-final-team">
          <div className="section-heading">
            <h2>FINAL ROSTER</h2>
            <span>{data.roster.length} Players</span>
          </div>
          {data.roster.map((player) => {
            const availability = data.availability.find(
              (item) => item.registrationId === player.registrationId,
            );
            return (
              <div className="roster-row" key={player.registrationId}>
                <i
                  className={`availability-dot ${availability?.available === false ? "no" : "yes"}`}
                />
                <b className="jersey">{player.jerseyNumber ?? "—"}</b>
                <span className="roster-player-name">
                  <strong>{player.name}</strong>
                  <small>
                    {player.role !== "Player" ? `${player.role} · ` : ""}
                    {player.jerseyName ? `${player.jerseyName} · ` : ""}
                    {player.position || "Position not set"}
                  </small>
                </span>
                <em>{availability?.available === false ? "No" : "Yes"}</em>
              </div>
            );
          })}
        </section>
      )}
    </CaptainShell>
  );
}
