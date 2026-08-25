import Link from "next/link";
import AppShell from "@/components/AppShell";
import RulesAcknowledgmentForm from "./RulesAcknowledgmentForm";
import {createClient} from "@/lib/supabase/server";
import {getPlayerPortalData} from "@/lib/kch-data";

type RuleRecord={invitation_id?:string;rules_document_id:string;conference_name:string;season_name:string;division_name?:string;title:string;version:string;effective_date:string;content:string;acknowledged_at:string|null;acknowledgment_id?:string};
const date=(value:string)=>new Intl.DateTimeFormat("en-US",{month:"long",day:"numeric",year:"numeric",timeZone:"UTC"}).format(new Date(`${value}T00:00:00Z`));
const timestamp=(value:string)=>new Intl.DateTimeFormat("en-US",{month:"long",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"}).format(new Date(value));

export default async function RulesPage({searchParams}:{searchParams:Promise<{invitation?:string;acknowledgment?:string;required?:string;registration?:string}>}){
  const params=await searchParams;
  const[data,supabase]=await Promise.all([getPlayerPortalData(),createClient()]);
  let record:RuleRecord|null=null;
  if(params.invitation){const{data:row}=await supabase.rpc("get_invitation_rules",{p_invitation_id:params.invitation});record=(row?.[0]??null) as RuleRecord|null;}
  else if(params.acknowledgment){const{data:rows}=await supabase.rpc("get_player_rule_acknowledgments");record=((rows??[]).find((row:{acknowledgment_id:string})=>row.acknowledgment_id===params.acknowledgment)??null) as RuleRecord|null;}
  else if(params.registration){const{data:row}=await supabase.rpc("get_registration_rules",{p_registration_id:params.registration});record=(row?.[0]??null) as RuleRecord|null;}
  else if(params.required&&data.activeRegistrationId){const{data:row}=await supabase.rpc("get_registration_rules",{p_registration_id:data.activeRegistrationId});record=(row?.[0]??null) as RuleRecord|null;}
  if(!record)return <AppShell active="profile" contexts={data.contexts} activeRegistrationId={data.activeRegistrationId} notifications={data.notifications} profileNeedsAttention={data.profileNeedsAttention} paymentNeedsAttention={data.paymentNeedsAttention} teamHasUnavailable={data.teamHasUnavailable}><h1 className="title">Rules &amp; Discipline</h1><section className="card rules-empty"><h2>Rules record unavailable</h2><Link href="/profile" className="btn primary">Back to Profile</Link></section></AppShell>;
  // A pending invitation still needs its join step completed even if its rules
  // acknowledgement was saved during an earlier interrupted attempt.
  const acknowledging=Boolean(params.invitation||((params.required||params.registration)&&!record.acknowledged_at));
  return <AppShell active="profile" contexts={data.contexts} activeRegistrationId={data.activeRegistrationId} notifications={data.notifications} profileNeedsAttention={data.profileNeedsAttention} paymentNeedsAttention={data.paymentNeedsAttention} teamHasUnavailable={data.teamHasUnavailable}>
    <h1 className="title">Rules &amp; Discipline</h1>
    <p className="subtitle">{record.conference_name} · {record.season_name}{record.division_name?` · ${record.division_name}`:""}</p>
    <section className="card rules-document"><header><span>▢</span><div><h2>{record.title}</h2><p>Version {record.version} · Effective {date(record.effective_date)}</p></div></header><article>{record.content.split("\n\n").map((section,index)=>{const[heading,...body]=section.split("\n");return <section key={index}>{/^\d+\.|^KCH Default/.test(heading)?<h3>{heading}</h3>:<p>{heading}</p>}{body.map((line,lineIndex)=><p key={lineIndex}>{line}</p>)}</section>})}</article>{acknowledging?<RulesAcknowledgmentForm invitationId={record.invitation_id} registrationId={params.registration||(params.required?data.activeRegistrationId:undefined)} rulesDocumentId={record.rules_document_id}/>:record.acknowledged_at?<footer><b>Rules Acknowledged</b><span>{timestamp(record.acknowledged_at)}</span></footer>:null}</section>
  </AppShell>;
}
