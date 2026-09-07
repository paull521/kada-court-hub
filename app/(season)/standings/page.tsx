import { Suspense } from "react";
import { Trophy } from "lucide-react";
import { ContentPlaceholder } from "@/components/Skeleton";
import { getPlayerPortalData, playerHasTeamContext, type PlayerPortalData } from "@/lib/kch-data";
import { redirect } from "next/navigation";

export default async function StandingsPage() {
  if (!(await playerHasTeamContext())) redirect("/home");
  const data = getPlayerPortalData();
  return (
    <Suspense fallback={<ContentPlaceholder cards={1} rows={6} />}>
      <StandingsBody data={data} />
    </Suspense>
  );
}

async function StandingsBody({ data: portal }: { data: Promise<PlayerPortalData> }) {
  const data = await portal;
  // The gate above is the looser test - it sees the registration but not
  // whether its team still resolves. This is the authoritative one.
  if (!data.contexts.length) redirect("/home");
  if (!data.standings.length)
    return (
      <section className="card season-empty">
        <span>
          <Trophy className="ui-icon" />
        </span>
        <h2>Standings will appear here</h2>
        <p>Teams appear after they are added to this division.</p>
      </section>
    );
  return (
    <section className="standings-list">
      <header>
        <span>#</span>
        <b>TEAM</b>
        <b>GP</b>
        <b>W</b>
        <b>L</b>
      </header>
      {data.standings.map((row, index) => (
        <article
          className={`card standing-row ${row.team === data.context.team ? "current-team" : ""}`}
          key={row.teamId}
        >
          <strong>{index + 1}</strong>
          <span>
            <b>{row.team}</b>
          </span>
          <b>{row.played}</b>
          <b>{row.wins}</b>
          <b>{row.losses}</b>
        </article>
      ))}
    </section>
  );
}
