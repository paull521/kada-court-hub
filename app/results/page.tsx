import AppShell from "@/components/AppShell";
import SeasonTabs from "@/components/SeasonTabs";
import {getPlayerPortalData} from "@/lib/kch-data";

export default async function ResultsPage(){
  const data=await getPlayerPortalData();
  return <AppShell active="schedule" contexts={data.contexts} activeRegistrationId={data.activeRegistrationId} notifications={data.notifications} profileNeedsAttention={data.profileNeedsAttention} paymentNeedsAttention={data.paymentNeedsAttention} teamHasUnavailable={data.teamHasUnavailable}>
    <h1 className="title">Results</h1><p className="subtitle">Final scores from your division.</p>
    <p className="season-label">▦ &nbsp; {data.context.season} · {data.context.division}</p>
    <SeasonTabs active="results"/>
    {data.seasonResults.length?<div className="season-result-list">{data.seasonResults.map(result=><article className="card season-result-card" key={result.id}><time>{result.dateLabel}</time><div><span><b>{result.homeTeam}</b><strong>{result.homeScore}</strong></span><span><b>{result.awayTeam}</b><strong>{result.awayScore}</strong></span><small>⌖ {result.venue}{result.court?` · ${result.court}`:""}</small></div></article>)}</div>:<section className="card season-empty"><span>♜</span><h2>No final scores yet</h2><p>Results will appear after the conference owner posts both scores.</p></section>}
  </AppShell>;
}
