import { CalendarDays, ChevronRight, MapPin } from "lucide-react";
import { LoadingNote, SkeletonText } from "@/components/Skeleton";
import NextGameCard from "@/components/NextGameCard";
import type { CaptainGame, CaptainPortalData } from "@/lib/captain-data";
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
import { listLabel } from "@/components/ui/shared-classes";

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
function CompactGameRow({ game, teamName }: { game: CaptainGame; teamName: string }) {
  const date = new Date(`${game.dateKey}T12:00:00Z`);
  const day = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(date);
  const month = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(date);
  const dateNumber = new Intl.DateTimeFormat("en-US", { day: "2-digit", timeZone: "UTC" }).format(
    date,
  );
  return (
    <article className={`card ${compactGame}`}>
      <time>
        <b>{day}</b>
        <span>{month}</span>
        <strong>{dateNumber}</strong>
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
    </article>
  );
}
/** The division's weeks. WEEKLY VIEW and All Teams are fixed and never wait. */
function WeeklyView({ games }: { games?: CaptainGame[] }) {
  if (games && !games.length) return null;
  const weeks = games
    ? [...new Map(games.map((game) => [weekStart(game.dateKey), [] as CaptainGame[]])).entries()]
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
        {!games &&
          [0, 1, 2, 3].map((index) => (
            <div className={scheduleWeek} key={index}>
              <div className={scheduleWeekFrame}>
                <SkeletonText width="9em" />
                <SkeletonText width="4em" />
              </div>
            </div>
          ))}
        {weeks.map(([key, weekGames], index) => {
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
                    {weekGames.map((game) => (
                      <tr key={game.id}>
                        <td>{game.dateLabel}</td>
                        <td>{game.time}</td>
                        <td>{game.court || game.venue}</td>
                        <td>
                          <b>{game.homeTeam}</b>
                          <span>vs {game.awayTeam}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

/** The same row with its values missing. UNIFORM stays - it is a label. */
function CompactGameRowFrame() {
  return (
    <article className={`card ${compactGame}`}>
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
    </article>
  );
}

/**
 * The captain's schedule, written once and drawn twice: with the portal data,
 * and without it. NEXT GAME, UPCOMING GAMES, WEEKLY VIEW, All Teams, UNIFORM and
 * the table headings are fixed words; the fixtures are the read.
 */
export default function CaptainScheduleFrame({ data }: { data?: CaptainPortalData }) {
  const [next, ...upcoming] = data?.games ?? [];
  return (
    <>
      {!data && <LoadingNote />}
      <div className="col-pane col-pane-a">
        {data && !next ? (
          <section className={`card ${scheduleEmpty}`}>
            <span>
              <CalendarDays className="ui-icon" />
            </span>
            <h2>No games scheduled</h2>
            <p>Games appear after the owner finalizes this division’s schedule.</p>
          </section>
        ) : (
          <>
            <NextGameCard game={next} teamName={data?.teamName} className="schedule-feature" />
            {(!data || upcoming.length > 0) && (
              <>
                <h2 className={listLabel}>UPCOMING GAMES</h2>
                <div className="grid gap-[10px]">
                  {data
                    ? upcoming.map((game) => (
                        <CompactGameRow game={game} teamName={data.teamName} key={game.id} />
                      ))
                    : [0, 1, 2].map((index) => <CompactGameRowFrame key={index} />)}
                </div>
              </>
            )}
          </>
        )}
      </div>
      <div className="col-pane col-pane-b">
        <WeeklyView games={data?.divisionGames} />
      </div>
    </>
  );
}
