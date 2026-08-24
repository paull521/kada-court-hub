import AppShell from "@/components/AppShell";
import SeasonTabs from "@/components/SeasonTabs";
import {getPlayerPortalData,type DivisionScheduleGame} from "@/lib/kch-data";
import type {Game} from "@/lib/data";

function GameRow({game}:{game:Game}){return <section className="card game-row"><time><b>{game.day}</b><span>{game.month}</span><strong>{game.date}</strong></time><div className="game-place"><strong>{game.time}</strong><span>⌖ &nbsp;{game.venue}<br/>&nbsp;&nbsp;&nbsp; {game.court}</span></div><div className="mini-match"><span className="team-mark tiny">K</span><b>VS</b><span>{game.opponent}</span></div><div className="game-uniform"><small>UNIFORM</small><span><i className={`uniform-dot ${game.uniform.toLowerCase()}`}/>{game.uniform.toUpperCase()}</span></div><b>›</b></section>}

function weekStart(dateKey:string){const date=new Date(`${dateKey}T12:00:00Z`);date.setUTCDate(date.getUTCDate()-date.getUTCDay());return date.toISOString().slice(0,10)}
function shortDate(dateKey:string){return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",timeZone:"UTC"}).format(new Date(`${dateKey}T12:00:00Z`))}
function DivisionWeeklyView({games}:{games:DivisionScheduleGame[]}){
  if(!games.length)return null;
  const weeks=[...new Map(games.map(game=>[weekStart(game.dateKey),[] as DivisionScheduleGame[]])).entries()];
  for(const game of games)weeks.find(([key])=>key===weekStart(game.dateKey))?.[1].push(game);
  return <section className="weekly-schedule player-weekly-schedule"><header><div><small>WEEKLY VIEW</small><h2>All Teams</h2></div></header><div className="weekly-schedule-list">{weeks.map(([key,weekGames],index)=>{const end=new Date(`${key}T12:00:00Z`);end.setUTCDate(end.getUTCDate()+6);return <details className="schedule-week" key={key} open={index===0}><summary><span>{shortDate(key)} – {shortDate(end.toISOString().slice(0,10))}</span><small>{weekGames.length} game{weekGames.length===1?"":"s"}</small><strong>›</strong></summary><div className="schedule-table-scroll"><table><thead><tr><th>Date</th><th>Time</th><th>Court</th><th>Matchup</th></tr></thead><tbody>{weekGames.map(game=><tr key={game.id}><td>{game.dateLabel}</td><td>{game.time}</td><td>{game.court||game.venue}</td><td><b>{game.homeTeam}</b><span>vs {game.awayTeam}</span></td></tr>)}</tbody></table></div></details>})}</div></section>;
}

export default async function Schedule(){
  const data=await getPlayerPortalData();
  const [next,...upcoming]=data.games;
  return <AppShell active="schedule" contexts={data.contexts} activeRegistrationId={data.activeRegistrationId} notifications={data.notifications} profileNeedsAttention={data.profileNeedsAttention} paymentNeedsAttention={data.paymentNeedsAttention} teamHasUnavailable={data.teamHasUnavailable}>
    <h1 className="title">Schedule</h1><p className="subtitle">Stay updated. Be ready. One game at a time.</p>
    <p className="season-label">▦ &nbsp; {data.context.season} · {data.context.division}</p>
    <SeasonTabs active="schedule"/>
    {next?<><section className="card feature-card schedule-feature"><div className="feature-copy"><p className="eyebrow">NEXT GAME</p><p className="feature-date">{next.dateLabel}</p><strong className="feature-time">{next.time}</strong><p className="feature-location">⌖ &nbsp;{next.venue}<br/><span>{next.court}</span></p></div><div className="matchup-logos"><div><span className="team-mark">K</span><b>{data.context.team}</b></div><strong className="versus">VS</strong><div><span className="team-mark opponent">{next.opponent.slice(0,2).toUpperCase()}</span><b>{next.opponent}</b></div></div><div className="uniform-line"><small>UNIFORM</small><span className={`uniform-dot ${next.uniform.toLowerCase()}`}/><b>{next.uniform.toUpperCase()}</b></div></section>{upcoming.length>0&&<><h2 className="list-label">UPCOMING GAMES</h2><div className="schedule-list">{upcoming.map(game=><GameRow game={game} key={game.id}/>)}</div></>}</>:<section className="card schedule-empty"><span>▦</span><h2>No games scheduled for your team</h2><p>New games will appear here as soon as the conference owner publishes them.</p></section>}
    <DivisionWeeklyView games={data.divisionSchedule}/>
  </AppShell>;
}
