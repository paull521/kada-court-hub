import { CalendarDays, MapPin, Trophy } from "lucide-react";
import AppShell from "@/components/AppShell";
import SeasonTabs from "@/components/SeasonTabs";
import { getPlayerPortalData } from "@/lib/kch-data";
import { redirect } from "next/navigation";

/** A drawn game colours neither side - nobody won it. */
function outcomeClass(score: number, opponentScore: number) {
  if (score === opponentScore) return "";
  return score > opponentScore ? "result-won" : "result-lost";
}

export default async function ResultsPage() {
  const data = await getPlayerPortalData();
  if (!data.contexts.length) redirect("/home");
  return (
    <AppShell
      active="schedule"
      contexts={data.contexts}
      activeRegistrationId={data.activeRegistrationId}
      notifications={data.notifications}
      profileNeedsAttention={data.profileNeedsAttention}
      paymentNeedsAttention={data.paymentNeedsAttention}
      teamHasUnavailable={data.teamHasUnavailable}
      conferenceName={data.context.conference}
    >
      <h1 className="title">Results</h1>
      <p className="subtitle">Final scores from your division.</p>
      <p className="season-label">
        <CalendarDays className="ui-icon" /> &nbsp; {data.context.season} · {data.context.division}
      </p>
      <SeasonTabs active="results" />
      {data.seasonResults.length ? (
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
      ) : (
        <section className="card season-empty">
          <span>
            <Trophy className="ui-icon" />
          </span>
          <h2>No final scores yet</h2>
          <p>Results will appear after the conference owner posts both scores.</p>
        </section>
      )}
    </AppShell>
  );
}
