import { redirect } from "next/navigation";
import CaptainShell from "@/components/CaptainShell";
import { getCaptainPortalData, type CaptainGame } from "@/lib/captain-data";

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
    <article className="card compact-upcoming-game">
      <time>
        <b>{day}</b>
        <span>{month}</span>
        <strong>{dateNumber}</strong>
      </time>
      <div className="compact-game-main">
        <strong>
          {teamName} <span>vs</span> {game.opponent}
        </strong>
        <small>
          ⌖ {game.venue}
          {game.court ? ` · ${game.court}` : ""}
        </small>
      </div>
      <div className="compact-game-side">
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
function WeeklyView({ games }: { games: CaptainGame[] }) {
  if (!games.length) return null;
  const weeks = [
    ...new Map(games.map((game) => [weekStart(game.dateKey), [] as CaptainGame[]])).entries(),
  ];
  for (const game of games) weeks.find(([key]) => key === weekStart(game.dateKey))?.[1].push(game);
  return (
    <section className="weekly-schedule player-weekly-schedule">
      <header>
        <div>
          <small>WEEKLY VIEW</small>
          <h2>All Teams</h2>
        </div>
      </header>
      <div className="weekly-schedule-list">
        {weeks.map(([key, weekGames], index) => {
          const end = new Date(`${key}T12:00:00Z`);
          end.setUTCDate(end.getUTCDate() + 6);
          return (
            <details className="schedule-week" key={key} open={index === 0}>
              <summary>
                <span>
                  {shortDate(key)} – {shortDate(end.toISOString().slice(0, 10))}
                </span>
                <small>
                  {weekGames.length} game{weekGames.length === 1 ? "" : "s"}
                </small>
                <strong>›</strong>
              </summary>
              <div className="schedule-table-scroll">
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

export default async function CaptainSchedulePage() {
  const data = await getCaptainPortalData();
  if (!data.authorized) redirect("/profile");
  const [next, ...upcoming] = data.games;
  return (
    <CaptainShell
      data={data}
      active="schedule"
      title="Schedule"
      subtitle="Stay updated. Be ready. One game at a time."
    >
      {next ? (
        <>
          <section className="card feature-card schedule-feature">
            <div className="feature-copy">
              <p className="eyebrow">NEXT GAME</p>
              <p className="feature-date">{next.dateLabel}</p>
              <strong className="feature-time">{next.time}</strong>
            </div>
            <div className="matchup-logos">
              <div>
                <span className="team-mark">K</span>
                <b>{data.teamName}</b>
              </div>
              <strong className="versus">VS</strong>
              <div>
                <span className="team-mark opponent">
                  {next.opponent.slice(0, 2).toUpperCase()}
                </span>
                <b>{next.opponent}</b>
              </div>
            </div>
            <p className="feature-venue">
              ⌖ {next.venue}
              {next.court ? ` · ${next.court}` : ""}
            </p>
            <div className="uniform-line">
              <small>UNIFORM</small>
              <span
                className={`uniform-dot ${next.uniform.toLowerCase().includes("dark") ? "dark" : "white"}`}
              />
              <b>{next.uniform.toUpperCase()}</b>
            </div>
          </section>
          {upcoming.length > 0 && (
            <>
              <h2 className="list-label">UPCOMING GAMES</h2>
              <div className="captain-game-list">
                {upcoming.map((game) => (
                  <CompactGameRow game={game} teamName={data.teamName} key={game.id} />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <section className="card schedule-empty">
          <span>▦</span>
          <h2>No games scheduled</h2>
          <p>Games appear after the owner finalizes this division’s schedule.</p>
        </section>
      )}
      <WeeklyView games={data.divisionGames} />
    </CaptainShell>
  );
}
