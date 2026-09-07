import { MapPin } from "lucide-react";
import { SkeletonText } from "@/components/Skeleton";
import type { Game } from "@/lib/data";

/**
 * The navy next-game card, drawn once for Home and Schedule.
 *
 * It existed twice, and the two copies had drifted: different placeholder
 * widths, a different label over the uniform swatch, and a different way of
 * choosing the swatch class. This is Home's version, which is the one that had
 * its placeholder widths sized against the text they stand in for.
 *
 * Both props are optional and mean the same thing they mean in the frames:
 * absent is "the read has not come back yet", so each value is a grey bar in
 * the place its text will take. `game` present with `teamName` absent cannot
 * happen - they arrive together - but the card does not need to care.
 */
export default function NextGameCard({
  game,
  teamName,
  className = "",
}: {
  game?: Game;
  teamName?: string;
  /** Extra classes for a page that needs the card laid out differently. */
  className?: string;
}) {
  return (
    <section className={`card feature-card ${className}`.trim()}>
      <div className="feature-copy">
        <p className="eyebrow">NEXT GAME</p>
        <p className="feature-date">{game ? game.dateLabel : <SkeletonText width="7em" />}</p>
        <strong className="feature-time">
          {game ? game.time : <SkeletonText width="3.8em" />}
        </strong>
      </div>
      <div className="matchup-logos">
        <div>
          <span className="team-mark">K</span>
          <b>{teamName ?? <SkeletonText width="4.5em" />}</b>
        </div>
        <strong className="versus">VS</strong>
        <div>
          <span className="team-mark opponent">
            {game ? game.opponent.slice(0, 2).toUpperCase() : ""}
          </span>
          <b>{game ? game.opponent : <SkeletonText width="4.5em" />}</b>
        </div>
      </div>
      <p className="feature-venue">
        {game ? (
          <>
            <MapPin className="ui-icon" /> {game.venue}
            {game.court ? ` · ${game.court}` : ""}
          </>
        ) : (
          <SkeletonText width="15em" />
        )}
      </p>
      <div className="uniform-line">
        <small>JERSEY COLOR</small>
        {game ? (
          <>
            <span
              className={`uniform-dot ${game.uniform.toLowerCase().includes("dark") ? "dark" : "white"}`}
            />
            <b>{game.uniform.toUpperCase()}</b>
          </>
        ) : (
          <SkeletonText width="2.8em" />
        )}
      </div>
    </section>
  );
}
