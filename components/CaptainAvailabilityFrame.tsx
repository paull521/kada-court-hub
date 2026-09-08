import { Check } from "lucide-react";
import { LoadingNote, SkeletonText } from "@/components/Skeleton";
import type { CaptainPortalData } from "@/lib/captain-data";
import { scheduleEmpty } from "@/components/ui/schedule-classes";
import { panel, sectionHeading } from "@/components/ui/shared-classes";

/**
 * The team's answers for the next game, written once and drawn twice. TEAM
 * RESPONSE and the row shape are fixed; the names, the numbers and the two
 * answers are what the read decides.
 */
export default function CaptainAvailabilityFrame({ data }: { data?: CaptainPortalData }) {
  const game = data?.games[0];
  const no = data ? data.availability.filter((player) => !player.available).length : 0;
  if (data && !game)
    return (
      <section className={`card ${scheduleEmpty}`}>
        <span>
          <Check className="ui-icon" />
        </span>
        <h2>No availability needed</h2>
        <p>There is no upcoming game.</p>
      </section>
    );
  return (
    <section className={`card ${panel}`}>
      {!data && <LoadingNote />}
      <div className={sectionHeading}>
        <h2>TEAM RESPONSE</h2>
        <span>
          {data ? `${data.availability.length - no} Yes · ${no} No` : <SkeletonText width="6em" />}
        </span>
      </div>
      {data
        ? data.availability.map((player) => (
            <div
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-[#e1e5e8] py-[13px] [&>span]:grid [&_small]:mt-[2px] [&_small]:text-[#697687] [&_strong]:text-[#0d7130]"
              key={player.registrationId}
            >
              <i className={`availability-dot ${player.available ? "yes" : "no"}`} />
              <span>
                <b>{player.name}</b>
                <small>
                  #{player.jerseyNumber ?? "—"} · {player.position || player.role}
                </small>
              </span>
              <strong>{player.available ? "YES" : "NO"}</strong>
            </div>
          ))
        : [0, 1, 2, 3, 4, 5].map((index) => (
            <div
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-[#e1e5e8] py-[13px] [&>span]:grid [&_small]:mt-[2px] [&_small]:text-[#697687] [&_strong]:text-[#0d7130]"
              key={index}
            >
              <i className="availability-dot" />
              <span>
                <b>
                  <SkeletonText width="9em" />
                </b>
                <small>
                  <SkeletonText width="7em" />
                </small>
              </span>
              <strong>
                <SkeletonText width="2.5em" />
              </strong>
            </div>
          ))}
    </section>
  );
}
