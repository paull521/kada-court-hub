import { MapPin, Trophy } from "lucide-react";
import { LoadingNote, SkeletonText } from "@/components/Skeleton";
import type { PlayerPortalData } from "@/lib/kch-data";

/** A drawn game colours neither side - nobody won it. */
function outcomeClass(score: number, opponentScore: number) {
  if (score === opponentScore) return "";
  return score > opponentScore ? "result-won" : "result-lost";
}

/**
 * The results, written once and drawn twice: with the portal data, and without it.
 *
 * Without it the frame is the same frame - the cards, their headings and every
 * word that never depended on the read are on screen from the first paint, and
 * only the values are grey, at the size of the text they stand in for. The page
 * renders this inside its boundary and as the boundary's fallback, and the
 * route's loading.tsx renders it with no data, so a placeholder cannot drift
 * away from the screen it is standing in for.
 */
export default function ResultsFrame({ data }: { data?: PlayerPortalData }) {
  if (data && !data.seasonResults.length)
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
      {!data && <LoadingNote />}
      {data
        ? data.seasonResults.map((result) => (
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
          ))
        : [0, 1, 2, 3].map((index) => (
            <article className="card season-result-card" key={index}>
              {/* The date chip is a fixed 56px column with its own padding, so
                  its placeholder is sized to the chip rather than to the words
                  - at a text width it hung out of the card. */}
              <time>
                <SkeletonText width="100%" />
              </time>
              <div>
                <span>
                  <b>
                    <SkeletonText width="9em" />
                  </b>
                  <strong>
                    <SkeletonText width="1.5em" />
                  </strong>
                </span>
                <span>
                  <b>
                    <SkeletonText width="8em" />
                  </b>
                  <strong>
                    <SkeletonText width="1.5em" />
                  </strong>
                </span>
                <small>
                  <MapPin className="ui-icon" /> <SkeletonText width="11em" />
                </small>
              </div>
            </article>
          ))}
    </div>
  );
}
