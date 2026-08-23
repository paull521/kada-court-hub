import {redirect} from "next/navigation";
import CaptainShell from "@/components/CaptainShell";
import CaptainRequestForm from "@/components/CaptainRequestForm";
import CaptainDraftRoster from "@/components/CaptainDraftRoster";
import {getCaptainPortalData} from "@/lib/captain-data";

const labels:Record<string,string>={trade:"Trade",add_player:"Add Player",remove_player:"Remove Player",other:"Other"};

export default async function CaptainRosterPage(){
  const data=await getCaptainPortalData();
  if(!data.authorized)redirect("/profile");
  return <CaptainShell data={data} active="dashboard" title="Team Roster" subtitle="Build, submit, and revise your team roster.">
    {!data.finalPublished&&<CaptainDraftRoster data={data}/>} 
    {data.finalPublished&&<details className="card captain-roster-disclosure"><summary><span><i>✓</i><span><b>Final roster published</b><small>Open the published team list.</small></span></span><strong>›</strong></summary><div className="captain-final-team">{data.roster.map(player=><div className="roster-row" key={player.registrationId}><b className="jersey">{player.jerseyNumber??"—"}</b><span className="roster-player-name"><strong>{player.name}</strong><small>{player.position||"Position not set"} · {player.uniformSize||"Size needed"}</small></span><em>{player.role}</em></div>)}</div></details>}
    <details className="card captain-roster-disclosure"><summary><span><i>↔</i><span><b>Request Change</b><small>Send a team change for owner approval.</small></span></span><strong>›</strong></summary><div><CaptainRequestForm teamId={data.teamId} enabled={data.draftPublished}/></div></details>
    <details className="card captain-roster-disclosure"><summary><span><i>☷</i><span><b>Request History</b><small>{data.requests.length?`${data.requests.length} request${data.requests.length===1?"":"s"}`:"No requests yet"}</small></span></span><strong>›</strong></summary><div>{data.requests.length?<div className="captain-request-list">{data.requests.map(request=><article key={request.id}><span><b>{labels[request.type]??"Other"}</b><small>{new Intl.DateTimeFormat("en-US",{dateStyle:"medium"}).format(new Date(request.createdAt))}</small></span><em className={request.status}>{request.status}</em><p>{request.details}</p></article>)}</div>:<p className="empty-note">No roster requests yet.</p>}</div></details>
  </CaptainShell>;
}
