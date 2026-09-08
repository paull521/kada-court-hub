import { Clock } from "lucide-react";
import CaptainContextSwitcher from "@/components/CaptainContextSwitcher";
import { LoadingNote, SkeletonText } from "@/components/Skeleton";
import type { CaptainPortalData } from "@/lib/captain-data";
import { scheduleEmpty, teamBanner, teamBannerCopy } from "@/components/ui/schedule-classes";

/**
 * The published team, written once and drawn twice. The banner, the FINAL
 * ROSTER heading and the row shape are fixed; the team, the count and the
 * players are the read.
 *
 * Before the read lands it draws the published-roster panel rather than the
 * not-yet-published card, because that is the state a division spends its
 * season in.
 */
export default function CaptainTeamFrame({ data }: { data?: CaptainPortalData }) {
  return (
    <>
      {!data && <LoadingNote />}
      {data ? (
        <CaptainContextSwitcher
          variant="banner"
          contexts={data.contexts}
          activeRegistrationId={data.activeRegistrationId}
        />
      ) : (
        <div className="team-switcher">
          <div className={`card ${teamBanner}`}>
            <span className="team-mark small" aria-hidden="true">
              K
            </span>
            <span className={teamBannerCopy}>
              <b>
                <SkeletonText width="7.5em" />
              </b>
              <small>
                <SkeletonText width="12em" />
              </small>
            </span>
          </div>
        </div>
      )}
      {data && !data.finalPublished ? (
        <section className={`card ${scheduleEmpty}`}>
          <span>
            <Clock className="ui-icon" />
          </span>
          <h2>Final roster not published</h2>
          <p>Continue working from Team Roster until the commissioner finalizes this division.</p>
        </section>
      ) : (
        <section className="card panel captain-final-team">
          <div className="section-heading">
            <h2>FINAL ROSTER</h2>
            <span>{data ? `${data.roster.length} Players` : <SkeletonText width="5em" />}</span>
          </div>
          {data
            ? data.roster.map((player) => {
                const availability = data.availability.find(
                  (item) => item.registrationId === player.registrationId,
                );
                return (
                  <div className="roster-row" key={player.registrationId}>
                    <i
                      className={`availability-dot ${availability?.available === false ? "no" : "yes"}`}
                    />
                    <b className="jersey">{player.jerseyNumber ?? "—"}</b>
                    <span className="roster-player-name">
                      <strong>{player.name}</strong>
                      <small>
                        {player.role !== "Player" ? `${player.role} · ` : ""}
                        {player.jerseyName ? `${player.jerseyName} · ` : ""}
                        {player.position || "Position not set"}
                      </small>
                    </span>
                    <em>{availability?.available === false ? "No" : "Yes"}</em>
                  </div>
                );
              })
            : [0, 1, 2, 3, 4, 5].map((index) => (
                <div className="roster-row" key={index}>
                  <i className="availability-dot" />
                  <b className="jersey">
                    <SkeletonText width="1.2em" />
                  </b>
                  <span className="roster-player-name">
                    <strong>
                      <SkeletonText width="9em" />
                    </strong>
                    <small>
                      <SkeletonText width="7em" />
                    </small>
                  </span>
                  <em>
                    <SkeletonText width="2em" />
                  </em>
                </div>
              ))}
        </section>
      )}
    </>
  );
}
