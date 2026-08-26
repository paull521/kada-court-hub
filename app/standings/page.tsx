import AppShell from "@/components/AppShell";
import SeasonTabs from "@/components/SeasonTabs";
import {getPlayerPortalData} from "@/lib/kch-data";
import {redirect} from "next/navigation";

export default async function StandingsPage(){
  const data=await getPlayerPortalData();
  if(!data.contexts.length)redirect("/home");
  return <AppShell active="schedule" contexts={data.contexts} activeRegistrationId={data.activeRegistrationId} notifications={data.notifications} profileNeedsAttention={data.profileNeedsAttention} paymentNeedsAttention={data.paymentNeedsAttention} teamHasUnavailable={data.teamHasUnavailable}>
    <h1 className="title">Standings</h1><p className="subtitle">See where every team stands.</p>
    <p className="season-label">▦ &nbsp; {data.context.season} · {data.context.division}</p>
    <SeasonTabs active="standings"/>
    {data.standings.length?<section className="standings-list"><header><span>#</span><b>TEAM</b><b>GP</b><b>W</b><b>L</b></header>{data.standings.map((row,index)=><article className={`card standing-row ${row.team===data.context.team?"current-team":""}`} key={row.teamId}><strong>{index+1}</strong><span><b>{row.team}</b></span><b>{row.played}</b><b>{row.wins}</b><b>{row.losses}</b></article>)}</section>:<section className="card season-empty"><span>♜</span><h2>Standings will appear here</h2><p>Teams appear after they are added to this division.</p></section>}
  </AppShell>;
}
