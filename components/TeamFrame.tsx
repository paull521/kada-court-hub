import { LoadingNote, SkeletonText } from "@/components/Skeleton";
import PlayerContextSwitcher from "@/components/PlayerContextSwitcher";
import type { PlayerPortalData } from "@/lib/kch-data";
import { teamBanner, teamBannerCopy } from "@/components/ui/schedule-classes";
import {
  emptyNote,
  familyBanner,
  familyQuote,
  familyQuoteAuthor,
  jersey,
  panel,
  playerName,
  rosterRow,
  sectionHeading,
  teamMark,
  teamMarkSmall,
  teamSwitcher,
} from "@/components/ui/shared-classes";

/**
 * My Team, written once and drawn twice: with the portal data, and without it.
 *
 * Without it the frame is the same frame. Every heading, label, icon and fixed
 * word is on screen from the first paint, because none of it ever needed the
 * read; only the values are grey, in the place and at the size of the text they
 * stand in for. The page uses this for both halves of its boundary and the
 * route's loading.tsx renders it with no data, so the route skeleton, the
 * streaming fallback and the finished page are one component and cannot
 * disagree about the layout.
 */
export default function TeamFrame({ data }: { data?: PlayerPortalData }) {
  const roster = data
    ? data.teamInfo.divisionRosters.find((team) => team.isMyTeam)?.players.length
      ? data.teamInfo.divisionRosters.find((team) => team.isMyTeam)!.players
      : data.roster
    : [];
  return (
    <>
      {!data && <LoadingNote />}
      {data ? (
        <PlayerContextSwitcher
          contexts={data.contexts}
          activeRegistrationId={data.activeRegistrationId}
        />
      ) : (
        <div className={teamSwitcher}>
          <div className={`card ${teamBanner}`}>
            <span className={`${teamMark} ${teamMarkSmall}`} aria-hidden="true">
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
      <section className={`card roster-panel ${panel}`}>
        <div className={sectionHeading}>
          <h2>ROSTER</h2>
          <span>
            {data ? (
              `${roster.length} Player${roster.length === 1 ? "" : "s"}`
            ) : (
              <SkeletonText width="5em" />
            )}
          </span>
        </div>
        {data ? (
          roster.length ? (
            roster.map((player) => {
              const answer = data.availability.find((item) => item.name === player.name);
              return (
                <div className={`${rosterRow} grid-cols-[auto_auto_1fr_auto]`} key={player.id}>
                  <i
                    className={`inline-block h-[11px] w-[11px] flex-none rounded-full bg-[#2a9b4c] ${answer?.available === false ? "bg-[#d72b2b]" : ""}`}
                    title={answer?.available === false ? "Unavailable" : "Available"}
                  />
                  <b className={jersey}>{player.number || "—"}</b>
                  <span className={playerName}>
                    <strong>{player.name}</strong>
                    <small>
                      {player.jerseyName ? `${player.jerseyName} · ` : ""}
                      {player.position || "Position not set"}
                    </small>
                  </span>
                  <span className={player.role !== "Player" ? "staff-role" : ""}>
                    {player.role}
                  </span>
                </div>
              );
            })
          ) : (
            <p className={emptyNote}>The roster has not been published yet.</p>
          )
        ) : (
          [0, 1, 2, 3, 4, 5].map((index) => (
            <div className={`${rosterRow} grid-cols-[auto_auto_1fr_auto]`} key={index}>
              <i className="inline-block h-[11px] w-[11px] flex-none rounded-full bg-[#2a9b4c]" />
              <b className={jersey}>
                <SkeletonText width="1.2em" />
              </b>
              <span className={playerName}>
                <strong>
                  <SkeletonText width="9em" />
                </strong>
                <small>
                  <SkeletonText width="7em" />
                </small>
              </span>
              <span>
                <SkeletonText width="3.5em" />
              </span>
            </div>
          ))
        )}
      </section>
      <section className={familyBanner}>
        <p className={familyQuote}>
          “Talent wins games, but teamwork and intelligence win championships.”
        </p>
        <p className={familyQuoteAuthor}>— MJ</p>
      </section>
    </>
  );
}
