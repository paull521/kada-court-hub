import AppShell from "@/components/AppShell";
import SeasonTabs from "@/components/SeasonTabs";
import {getPlayerPortalData} from "@/lib/kch-data";

export default async function StandingsPage(){
  const data=await getPlayerPortalData();
  return <AppShell active="schedule" contexts={data.contexts} activeRegistrationId={data.activeRegistrationId} notifications={data.notifications} teamHasUnavailable={data.teamHasUnavailable}>
    <h1 className="title">Standings</h1><p className="subtitle">See where every team stands.</p>
    <p className="season-label">▦ &nbsp; {data.context.season} · {data.context.division}</p>
    <SeasonTabs active="standings"/>
    {data.standings.length?<section className="standings-list"><header><span>#</span><b>TEAM</b><b>W</b><b>L</b><b>PCT</b></header>{data.standings.map((row,index)=><article className={`card standing-row ${row.team===data.context.team?"current-team":""}`} key={row.teamId}><strong>{index+1}</strong><span><b>{row.team}</b><small>{row.played} played · {row.pointsFor} PF · {row.pointsAgainst} PA · {row.difference>=0?"+":""}{row.difference} · {row.streak}</small></span><b>{row.wins}</b><b>{row.losses}</b><b>{row.winPercentage.toFixed(3).replace(/^0/,"")}</b></article>)}</section>:<section className="card season-empty"><span>♜</span><h2>Standings will appear here</h2><p>Teams appear after they are added to this division.</p></section>}
    <p className="standings-note">Teams are ranked by win percentage, then point differential.</p>
  </AppShell>;
}
