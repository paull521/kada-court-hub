import { Trophy } from "lucide-react";
import { LoadingNote, SkeletonText } from "@/components/Skeleton";
import { Card } from "@/components/ui/Card";
import { cx } from "@/components/ui/cx";
import type { PlayerPortalData } from "@/lib/kch-data";
import { seasonEmpty } from "@/components/ui/shared-classes";

/** Rank, team, then the three counts - the header and every row share it. */
const columns = "grid grid-cols-[27px_minmax(0,1fr)_25px_25px_44px] items-center gap-[7px]";

/**
 * `!` twice, and both for the same reason: .card is unlayered CSS setting its
 * own radius, border and background, and a layered utility loses to it whatever
 * its specificity. The old rules won by sitting later in the same file, which
 * is a thing only source order was deciding.
 */
const row = "min-h-[66px] rounded-[15px]! p-[10px_12px]";
const currentTeam = "border-2! border-[#e0a43f]! bg-[#fffbf3]!";

/** Centred count column. TEAM is the one heading that stays left. */
const count = "text-center text-[14px]";

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
      <Card className={seasonEmpty}>
        <span>
          <Trophy className="ui-icon" />
        </span>
        <h2>Standings will appear here</h2>
        <p>Teams appear after they are added to this division.</p>
      </Card>
    );
  return (
    <section className="grid gap-[7px]">
      {!data && <LoadingNote />}
      <header className={cx(columns, "px-[12px] pb-[3px] text-[10px] text-muted")}>
        <span>#</span>
        <b>TEAM</b>
        <b className="text-center">GP</b>
        <b className="text-center">W</b>
        <b className="text-center">L</b>
      </header>
      {data
        ? data.standings.map((row_, index) => {
            const isMine = row_.team === data.context.team;
            return (
              <Card
                as="article"
                className={cx(columns, row, isMine && currentTeam)}
                key={row_.teamId}
              >
                <strong className="text-center text-[16px] text-muted">{index + 1}</strong>
                <span className="grid min-w-0 gap-[4px]">
                  <b className={cx("truncate text-[14px]", isMine && "text-gold")}>{row_.team}</b>
                </span>
                <b className={count}>{row_.played}</b>
                <b className={count}>{row_.wins}</b>
                <b className={count}>{row_.losses}</b>
              </Card>
            );
          })
        : [0, 1, 2, 3, 4, 5].map((index) => (
            <Card as="article" className={cx(columns, row)} key={index}>
              <strong className="text-center text-[16px] text-muted">{index + 1}</strong>
              <span className="grid min-w-0 gap-[4px]">
                <b className="truncate text-[14px]">
                  <SkeletonText width="9em" />
                </b>
              </span>
              <b className={count}>
                <SkeletonText width="1em" />
              </b>
              <b className={count}>
                <SkeletonText width="1em" />
              </b>
              <b className={count}>
                <SkeletonText width="1em" />
              </b>
            </Card>
          ))}
    </section>
  );
}
