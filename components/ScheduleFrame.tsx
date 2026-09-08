import { CalendarDays, ChevronRight, MapPin } from "lucide-react";
import { LoadingNote, SkeletonText } from "@/components/Skeleton";
import NextGameCard from "@/components/NextGameCard";
import type { DivisionScheduleGame, PlayerPortalData } from "@/lib/kch-data";
import type { Game } from "@/lib/data";
import {
  compactGame,
  compactGameMain,
  compactGameSide,
  scheduleEmpty,
  scheduleTableScroll,
  scheduleWeek,
  scheduleWeekFrame,
  weeklySchedule,
  weeklyScheduleList,
} from "@/components/ui/schedule-classes";
import { familyBanner } from "@/components/ui/shared-classes";

function GameRow({ game, teamName }: { game: Game; teamName: string }) {
  return (
    <section className={`card ${compactGame}`}>
      <time>
        <b>{game.day}</b>
        <span>{game.month}</span>
        <strong>{game.date}</strong>
      </time>
      <div className={compactGameMain}>
        <strong>
          {teamName} <span>vs</span> {game.opponent}
        </strong>
        <small>
          <MapPin className="ui-icon" /> {game.venue}
          {game.court ? ` · ${game.court}` : ""}
        </small>
      </div>
      <div className={compactGameSide}>
        <strong>{game.time}</strong>
        <span>
          <small>UNIFORM</small>
          <i
            className={`uniform-dot ${game.uniform.toLowerCase().includes("dark") ? "dark" : "white"}`}
          />
          {game.uniform.toUpperCase()}
        </span>
      </div>
    </section>
  );
}

/** The same row with its four values missing. UNIFORM stays - it is a label. */
function GameRowFrame() {
  return (
    <section className={`card ${compactGame}`}>
      <time>
        <b>
          <SkeletonText width="1.8em" />
        </b>
        <span>
          <SkeletonText width="1.8em" />
        </span>
        <strong>
          <SkeletonText width="1.4em" />
        </strong>
      </time>
      {/* Sized against the column rather than in em: this one is the flexible
          part of the row, and a fixed width would hang out of it on a phone. */}
      <div className={compactGameMain}>
        <strong>
          <SkeletonText width="85%" />
        </strong>
        <small>
          <MapPin className="ui-icon" /> <SkeletonText width="60%" />
        </small>
      </div>
      <div className={compactGameSide}>
        <strong>
          <SkeletonText width="4em" />
        </strong>
        <span>
          <small>UNIFORM</small>
          <SkeletonText width="3.5em" />
        </span>
      </div>
    </section>
  );
}

function weekStart(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - date.getUTCDay());
  return date.toISOString().slice(0, 10);
}
function shortDate(dateKey: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateKey}T12:00:00Z`));
}

/** The division's weeks. The header is two fixed words and never waits. */
function DivisionWeeklyView({ games }: { games?: DivisionScheduleGame[] }) {
  if (games && !games.length) return null;
  const weeks = games
    ? [
        ...new Map(
          games.map((game) => [weekStart(game.dateKey), [] as DivisionScheduleGame[]]),
        ).entries(),
      ]
    : [];
  if (games)
    for (const game of games)
      weeks.find(([key]) => key === weekStart(game.dateKey))?.[1].push(game);
  return (
    <section className={`player-weekly-schedule ${weeklySchedule}`}>
      <header>
        <div>
          <small>WEEKLY VIEW</small>
          <h2>All Teams</h2>
        </div>
      </header>
      <div className={weeklyScheduleList}>
        {games
          ? weeks.map(([key, weekGames], index) => {
              const end = new Date(`${key}T12:00:00Z`);
              end.setUTCDate(end.getUTCDate() + 6);
              return (
                <details className={scheduleWeek} key={key} open={index === 0}>
                  <summary>
                    <span>
                      {shortDate(key)} – {shortDate(end.toISOString().slice(0, 10))}
                    </span>
                    <small>
                      {weekGames.length} game{weekGames.length === 1 ? "" : "s"}
                    </small>
                    <strong aria-hidden="true">
                      <ChevronRight className="go-caret" />
                    </strong>
                  </summary>
                  <div className={scheduleTableScroll}>
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Court</th>
                          <th>Matchup</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weekGames.map((game) => {
                          const completed = game.homeScore !== null && game.awayScore !== null;
                          return (
                            <tr key={game.id}>
                              <td>{game.dateLabel}</td>
                              <td>{game.time}</td>
                              <td>{game.court || game.venue}</td>
                              <td>
                                <b>
                                  {game.homeTeam}
                                  {completed ? ` ${game.homeScore}` : ""}
                                </b>
                                <span>
                                  {completed
                                    ? `${game.awayTeam} ${game.awayScore} · Final`
                                    : `vs ${game.awayTeam}`}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </details>
              );
            })
          : [0, 1, 2, 3].map((index) => (
              <div className={scheduleWeek} key={index}>
                <div className={scheduleWeekFrame}>
                  <SkeletonText width="9em" />
                  <SkeletonText width="4em" />
                </div>
              </div>
            ))}
      </div>
    </section>
  );
}

/**
 * The schedule, written once and drawn twice: with the portal data, and without it.
 *
 * Without it the frame is the same frame - the cards, their headings and every
 * word that never depended on the read are on screen from the first paint, and
 * only the values are grey, at the size of the text they stand in for. The page
 * renders this inside its boundary and as the boundary's fallback, and the
 * route's loading.tsx renders it with no data, so a placeholder cannot drift
 * away from the screen it is standing in for.
 */
export default function ScheduleFrame({ data }: { data?: PlayerPortalData }) {
  const [next, ...upcoming] = data?.games ?? [];
  return (
    <>
      {!data && <LoadingNote />}
      {data && !next ? (
        <section className={`card ${scheduleEmpty}`}>
          <span>
            <CalendarDays className="ui-icon" />
          </span>
          <h2>No games scheduled for your team</h2>
          <p>New games will appear here as soon as the conference owner publishes them.</p>
        </section>
      ) : (
        <NextGameCard game={next} teamName={data?.context.team} className="schedule-feature" />
      )}
      {(!data || upcoming.length > 0) && (
        <>
          <h2 className="list-label">UPCOMING GAMES</h2>
          <div className="grid gap-2">
            {data
              ? upcoming.map((game) => (
                  <GameRow game={game} teamName={data.context.team} key={game.id} />
                ))
              : [0, 1, 2].map((index) => <GameRowFrame key={index} />)}
          </div>
        </>
      )}
      <DivisionWeeklyView games={data?.divisionSchedule} />
      <section className={familyBanner}>
        <p className="family-quote">
          “Every game is a direct reflection of what you have prepared for.”
        </p>
        <p className="family-quote-author">— PL</p>
      </section>
    </>
  );
}
