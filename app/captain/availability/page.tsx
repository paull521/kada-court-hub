import { Suspense } from "react";
import { Check } from "lucide-react";
import { redirect } from "next/navigation";
import CaptainShell from "@/components/CaptainShell";
import { ContentPlaceholder } from "@/components/Skeleton";
import { getCaptainPortalData, type CaptainPortalData } from "@/lib/captain-data";
import { getAvailableRoles } from "@/lib/roles";

export default async function CaptainAvailabilityPage() {
  const roles = await getAvailableRoles();
  if (!roles.captain) redirect("/profile");
  const data = getCaptainPortalData();
  return (
    <CaptainShell
      data={data}
      active="team"
      title="Availability"
      subtitle="See who is playing in the next game."
    >
      <Suspense fallback={<ContentPlaceholder />}>
        <AvailabilityBody data={data} />
      </Suspense>
    </CaptainShell>
  );
}

async function AvailabilityBody({ data: portal }: { data: Promise<CaptainPortalData> }) {
  const data = await portal;
  const game = data.games[0],
    no = data.availability.filter((player) => !player.available).length;
  return (
    <>
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
    </>
  );
}
