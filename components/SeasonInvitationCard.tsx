"use client";

import Link from "next/link";
import {useActionState} from "react";
import {respondInvitationAction,type InvitationActionState} from "@/app/home/actions";

const initialState:InvitationActionState={};
type Invitation={id:string;conferenceName:string;ownerName:string;seasonName:string;divisionName:string;startsOn:string;endsOn:string;leagueFee:number;uniformFee:number;message:string;response:"pending"|"joining"|"not_joining";responseDeadline:string;teamCount:number;playersPerTeam:number;invitedCount:number};
const date=(value:string)=>value?new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"}).format(new Date(`${value}T00:00:00Z`)):"To be announced";
export default function SeasonInvitationCard({invitation}:{invitation:Invitation}){
  const[state,action,pending]=useActionState(respondInvitationAction,initialState);
  return <section className="card invitation-card"><p className="eyebrow">YOU’RE INVITED</p><div className="invitation-flyer"><span>🏀</span><h2>{invitation.conferenceName}</h2><small>Hosted by {invitation.ownerName}</small></div><div className="invitation-summary"><b>{invitation.seasonName} · {invitation.divisionName}</b><span>{date(invitation.startsOn)} – {date(invitation.endsOn)}</span></div><div className="invitation-facts"><span><b>{invitation.teamCount}</b> Teams</span><span><b>{invitation.playersPerTeam}</b> Players / team</span><span><b>${(invitation.leagueFee+invitation.uniformFee).toFixed(0)}</b> Total fees</span></div>{invitation.responseDeadline&&<p className="response-deadline">Please respond by {date(invitation.responseDeadline)}</p>}<p className="invitation-note">{invitation.message}</p><form action={action}><input type="hidden" name="invitationId" value={invitation.id}/><Link className="btn joining" href={`/rules?invitation=${invitation.id}`}>Join this season</Link><button className="btn not-joining" name="response" value="not_joining" disabled={pending}>Not Joining</button></form><small className="invitation-platform-note">KadaCourtHub · One Team. One Court. One Family.</small>{state.error&&<p className="form-error" role="alert">{state.error}</p>}{state.message&&<p className="form-success" role="status">{state.message}</p>}</section>;
}
