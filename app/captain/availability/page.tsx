import { Check } from "lucide-react";
import { redirect } from "next/navigation";
import CaptainShell from "@/components/CaptainShell";
import { getCaptainPortalData } from "@/lib/captain-data";

export default async function CaptainAvailabilityPage() {
  const data = await getCaptainPortalData();
  if (!data.authorized) redirect("/profile");
  const game = data.games[0],
    no = data.availability.filter((player) => !player.available).length;
  return (
    <CaptainShell
      data={data}
      active="team"
      title="Availability"
      subtitle="See who is playing in the next game."
    >
      {game ? (
        <section className="card panel">
          <div className="section-heading">
            <h2>TEAM RESPONSE</h2>
            <span>
              {data.availability.length - no} Yes · {no} No
            </span>
          </div>
          {data.availability.map((player) => (
            <div className="availability-player" key={player.registrationId}>
              <i className={`availability-dot ${player.available ? "yes" : "no"}`} />
              <span>
                <b>{player.name}</b>
                <small>
                  #{player.jerseyNumber ?? "—"} · {player.position || player.role}
                </small>
              </span>
              <strong>{player.available ? "YES" : "NO"}</strong>
            </div>
          ))}
        </section>
      ) : (
        <section className="card schedule-empty">
          <span>
            <Check className="ui-icon" />
          </span>
          <h2>No availability needed</h2>
          <p>There is no upcoming game.</p>
        </section>
      )}
    </CaptainShell>
  );
}
