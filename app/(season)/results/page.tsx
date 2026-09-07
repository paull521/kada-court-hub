import { Suspense } from "react";
import { MapPin, Trophy } from "lucide-react";
import { ContentPlaceholder } from "@/components/Skeleton";
import { getPlayerPortalData, playerHasTeamContext, type PlayerPortalData } from "@/lib/kch-data";
import { redirect } from "next/navigation";

/** A drawn game colours neither side - nobody won it. */
function outcomeClass(score: number, opponentScore: number) {
  if (score === opponentScore) return "";
  return score > opponentScore ? "result-won" : "result-lost";
}

export default async function ResultsPage() {
  if (!(await playerHasTeamContext())) redirect("/home");
  const data = getPlayerPortalData();
  return (
    <Suspense fallback={<ContentPlaceholder cards={1} rows={5} />}>
      <ResultsBody data={data} />
    </Suspense>
  );
}

async function ResultsBody({ data: portal }: { data: Promise<PlayerPortalData> }) {
  const data = await portal;
  // The gate above is the looser test - it sees the registration but not
  // whether its team still resolves. This is the authoritative one.
  if (!data.contexts.length) redirect("/home");
  if (!data.seasonResults.length)
    return (
      <section className="card season-empty">
        <span>
          <Trophy className="ui-icon" />
        </span>
        <h2>No final scores yet</h2>
        <p>Results will appear after the conference owner posts both scores.</p>
      </section>
    );
  return (
    <div className="season-result-list">
      {data.seasonResults.map((result) => (
        <article className="card season-result-card" key={result.id}>
          <time>{result.dateLabel}</time>
          <div>
            <span className={outcomeClass(result.homeScore, result.awayScore)}>
              <b>{result.homeTeam}</b>
              <strong>{result.homeScore}</strong>
            </span>
            <span className={outcomeClass(result.awayScore, result.homeScore)}>
              <b>{result.awayTeam}</b>
              <strong>{result.awayScore}</strong>
            </span>
            <small>
              <MapPin className="ui-icon" /> {result.venue}
              {result.court ? ` · ${result.court}` : ""}
            </small>
          </div>
        </article>
      ))}
    </div>
  );
}
