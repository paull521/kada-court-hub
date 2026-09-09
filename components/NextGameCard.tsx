import { MapPin } from "lucide-react";
import { SkeletonText } from "@/components/Skeleton";
import { teamMark, uniformDot, uniformDotDark } from "@/components/ui/shared-classes";

/**
 * Only the fields the card draws, so a player Game and a captain's CaptainGame
 * both satisfy it without either having to know about the other. `uniform` is
 * widened to string because the captain's is: the swatch reads it with
 * includes("dark"), which is why that check is the one worth keeping.
 */
type NextGame = {
  dateLabel: string;
  time: string;
  opponent: string;
  venue: string;
  court: string;
  uniform: string;
};

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
  game?: NextGame;
  teamName?: string;
  /** Extra classes for a page that needs the card laid out differently. */
  className?: string;
}) {
  // The schedule pages pass schedule-feature, which used to re-scope the
  // uniform line to a wider gap and a lighter rule. Read here rather than left
  // in CSS: the class still carries the card's own row template.
  const onSchedule = className.split(/\s+/).includes("schedule-feature");
  return (
    // bg- shouts: .card sets a background unlayered. The .skeleton pair is
    // carried across by hand - the loading state is what settle() waits out.
    <section
      className={`card grid min-h-[205px] grid-cols-[42%_58%] mb-[16px] overflow-hidden bg-[radial-gradient(circle_at_88%_45%,rgba(76,113,150,0.23),transparent_38%),linear-gradient(125deg,#08243e,#0a3767)]! p-[22px] text-white [&_.skeleton]:bg-[linear-gradient(90deg,#061b2f_25%,#0d3055_37%,#061b2f_63%)]! [&_.skeleton]:bg-[length:400%_100%]! max-tiny:grid-cols-[45%_55%] max-tiny:p-[17px] ${onSchedule ? "grid-rows-[auto_auto_auto]" : ""} ${className}`.trim()}
    >
      <div className="feature-copy">
        <p className="eyebrow">NEXT GAME</p>
        <p className="m-[0_0_5px] text-[18px]">
          {game ? game.dateLabel : <SkeletonText width="7em" />}
        </p>
        <strong className="text-[34px]">{game ? game.time : <SkeletonText width="3.8em" />}</strong>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-[8px] text-center [&>div]:grid [&>div]:gap-[8px] [&>div]:text-[11px]">
        <div>
          <span className={teamMark}>K</span>
          <b>{teamName ?? <SkeletonText width="4.5em" />}</b>
        </div>
        <strong className="text-[18px]">VS</strong>
        <div>
          {/* All four shout: .team-mark.opponent outranked a bare .team-mark,
              and a layered utility outranks neither. */}
          <span className={`${teamMark} border-[#e2ca8f]! text-[17px] text-white! outline-[#111]!`}>
            {game ? game.opponent.slice(0, 2).toUpperCase() : ""}
          </span>
          <b>{game ? game.opponent : <SkeletonText width="4.5em" />}</b>
        </div>
      </div>
      <p className="col-span-full m-[10px_0_0] overflow-hidden text-center text-[12px] leading-[1.2] text-ellipsis whitespace-nowrap text-white">
        {game ? (
          <>
            <MapPin className="ui-icon" /> {game.venue}
            {game.court ? ` · ${game.court}` : ""}
          </>
        ) : (
          <SkeletonText width="15em" />
        )}
      </p>
      <div
        className={`col-span-full mt-[8px] flex items-center justify-center border-t pt-[10px] ${
          onSchedule
            ? "gap-[12px] border-t-[rgba(255,255,255,0.35)]"
            : "gap-[10px] border-t-[#ffffff40]"
        }`}
      >
        <small>JERSEY COLOR</small>
        {game ? (
          <>
            <span
              className={`${uniformDot} ${game.uniform.toLowerCase().includes("dark") ? uniformDotDark : ""}`}
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
