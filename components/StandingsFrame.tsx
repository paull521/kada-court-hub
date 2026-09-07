import { Trophy } from "lucide-react";
import { LoadingNote, SkeletonText } from "@/components/Skeleton";
import type { PlayerPortalData } from "@/lib/kch-data";

/**
 * The standings, written once and drawn twice: with the portal data, and without it.
 *
 * Without it the frame is the same frame - the cards, their headings and every
 * word that never depended on the read are on screen from the first paint, and
 * only the values are grey, at the size of the text they stand in for. The page
 * renders this inside its boundary and as the boundary's fallback, and the
 * route's loading.tsx renders it with no data, so a placeholder cannot drift
 * away from the screen it is standing in for.
 */
export default function StandingsFrame({ data }: { data?: PlayerPortalData }) {
  if (data && !data.standings.length)
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
      {!data && <LoadingNote />}
      <header>
        <span>#</span>
        <b>TEAM</b>
        <b>GP</b>
        <b>W</b>
        <b>L</b>
      </header>
      {data
        ? data.standings.map((row, index) => (
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
          ))
        : [0, 1, 2, 3, 4, 5].map((index) => (
            <article className="card standing-row" key={index}>
              <strong>{index + 1}</strong>
              <span>
                <b>
                  <SkeletonText width="9em" />
                </b>
              </span>
              <b>
                <SkeletonText width="1em" />
              </b>
              <b>
                <SkeletonText width="1em" />
              </b>
              <b>
                <SkeletonText width="1em" />
              </b>
            </article>
          ))}
    </section>
  );
}
