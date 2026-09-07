import { LoadingNote, SkeletonText } from "@/components/Skeleton";
import PlayerContextSwitcher from "@/components/PlayerContextSwitcher";
import type { PlayerPortalData } from "@/lib/kch-data";

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
        <div className="team-switcher">
          <div className="card team-banner">
            <span className="team-mark small" aria-hidden="true">
              K
            </span>
            <span className="team-banner-copy">
              <b>
                <SkeletonText width="9em" />
              </b>
              <small>
                <SkeletonText width="12em" />
              </small>
            </span>
          </div>
        </div>
      )}
      <section className="card panel roster-panel">
        <div className="section-heading">
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
                <div className="roster-row roster-with-availability" key={player.id}>
                  <i
                    className={`availability-dot ${answer?.available === false ? "no" : "yes"}`}
                    title={answer?.available === false ? "Unavailable" : "Available"}
                  />
                  <b className="jersey">{player.number || "—"}</b>
                  <span className="roster-player-name">
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
            <p className="empty-note">The roster has not been published yet.</p>
          )
        ) : (
          [0, 1, 2, 3, 4, 5].map((index) => (
            <div className="roster-row roster-with-availability" key={index}>
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
              <span>
                <SkeletonText width="3.5em" />
              </span>
            </div>
          ))
        )}
      </section>
      <section className="family-banner">
        <p className="family-quote">
          “Talent wins games, but teamwork and intelligence win championships.”
        </p>
        <p className="family-quote-author">— MJ</p>
      </section>
    </>
  );
}
