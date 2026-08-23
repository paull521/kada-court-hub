import AppShell from "@/components/AppShell";
import SeasonTabs from "@/components/SeasonTabs";
import {getPlayerPortalData} from "@/lib/kch-data";

export default async function ResultsPage(){
  const data=await getPlayerPortalData();
  return <AppShell active="schedule" contexts={data.contexts} activeRegistrationId={data.activeRegistrationId} notifications={data.notifications} teamHasUnavailable={data.teamHasUnavailable}>
    <h1 className="title">Results</h1><p className="subtitle">Final scores from your division.</p>
    <p className="season-label">▦ &nbsp; {data.context.season} · {data.context.division}</p>
    <SeasonTabs active="results"/>
    {data.seasonResults.length?<div className="season-result-list">{data.seasonResults.map(result=><article className="card season-result-card scoreboard-card" key={result.id}><time>{result.dateLabel} · {result.venue}{result.court?` · ${result.court}`:""}</time><div className="scoreboard-final"><b>{result.homeTeam}</b><strong>{result.homeScore} – {result.awayScore}</strong><b>{result.awayTeam}</b></div></article>)}</div>:<section className="card season-empty"><span>♜</span><h2>No final scores yet</h2><p>Results will appear after the conference owner posts both scores.</p></section>}
  </AppShell>;
}
