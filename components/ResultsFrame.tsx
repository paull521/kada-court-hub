import { MapPin, Trophy } from "lucide-react";
import { LoadingNote, SkeletonText } from "@/components/Skeleton";
import { Card } from "@/components/ui/Card";
import { cx } from "@/components/ui/cx";
import type { PlayerPortalData } from "@/lib/kch-data";
import { seasonEmpty } from "@/components/ui/shared-classes";

/** A drawn game colours neither side - nobody won it. */
function outcome(score: number, opponentScore: number) {
  if (score === opponentScore) return "";
  return score > opponentScore
    ? "[&>b]:text-green [&>strong]:text-green [&>strong]:font-[900]"
    : "[&>b]:text-muted [&>strong]:text-muted [&>strong]:font-[700]";
}

/** The date chip: a fixed 56px column, not a line of text. */
const chip =
  "mb-[12px] block self-start rounded-[11px] bg-[#f2efeb] p-[9px_5px] text-center text-[11px] font-[800] text-muted";
/** One team's name against its score. */
const line =
  "grid grid-cols-[1fr_auto] items-center gap-[8px] [&>b]:text-[15px] [&>b]:leading-[1.25] [&>strong]:text-[20px]";
const venue = "border-t border-line pt-[7px] text-[11px] leading-[1.4] text-muted";
const resultCard = "grid grid-cols-[56px_1fr] gap-[12px] p-[14px]";

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
      <Card className={seasonEmpty}>
        <span>
          <Trophy className="ui-icon" />
        </span>
        <h2>No final scores yet</h2>
        <p>Results will appear after the conference owner posts both scores.</p>
      </Card>
    );
  return (
    <div className="grid gap-[9px]">
      {!data && <LoadingNote />}
      {data
        ? data.seasonResults.map((result) => (
            <Card as="article" className={resultCard} key={result.id}>
              <time className={chip}>{result.dateLabel}</time>
              <div className="grid gap-[8px]">
                <span className={cx(line, outcome(result.homeScore, result.awayScore))}>
                  <b>{result.homeTeam}</b>
                  <strong>{result.homeScore}</strong>
                </span>
                <span className={cx(line, outcome(result.awayScore, result.homeScore))}>
                  <b>{result.awayTeam}</b>
                  <strong>{result.awayScore}</strong>
                </span>
                <small className={venue}>
                  <MapPin className="ui-icon" /> {result.venue}
                  {result.court ? ` · ${result.court}` : ""}
                </small>
              </div>
            </Card>
          ))
        : [0, 1, 2, 3].map((index) => (
            <Card as="article" className={resultCard} key={index}>
              {/* The date chip is a fixed 56px column with its own padding, so
                  its placeholder is sized to the chip rather than to the words
                  - at a text width it hung out of the card. */}
              <time className={chip}>
                <SkeletonText width="100%" />
              </time>
              <div className="grid gap-[8px]">
                <span className={line}>
                  <b>
                    <SkeletonText width="9em" />
                  </b>
                  <strong>
                    <SkeletonText width="1.5em" />
                  </strong>
                </span>
                <span className={line}>
                  <b>
                    <SkeletonText width="8em" />
                  </b>
                  <strong>
                    <SkeletonText width="1.5em" />
                  </strong>
                </span>
                <small className={venue}>
                  <MapPin className="ui-icon" /> <SkeletonText width="11em" />
                </small>
              </div>
            </Card>
          ))}
    </div>
  );
}
