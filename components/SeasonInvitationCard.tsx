"use client";

import {useActionState} from "react";
import {respondInvitationAction,type InvitationActionState} from "@/app/home/actions";

const initialState:InvitationActionState={};
export default function SeasonInvitationCard({invitation}:{invitation:{id:string;seasonName:string;message:string;response:"pending"|"joining"|"not_joining";responseDeadline:string;teamCount:number;playersPerTeam:number;invitedCount:number}}){
  const[state,action,pending]=useActionState(respondInvitationAction,initialState);
  return <section className="card invitation-card"><p className="eyebrow">YOU&apos;RE INVITED!</p><div className="invitation-flyer"><span>🏀</span><h2>{invitation.seasonName}</h2><small>One Team. One Court. One Family.</small></div><p>{invitation.message}</p><div className="invitation-facts"><span><b>{invitation.teamCount}</b> Teams</span><span><b>{invitation.playersPerTeam}</b> Players / team</span><span><b>{invitation.invitedCount}</b> Invited</span></div>{invitation.responseDeadline&&<p className="response-deadline">Respond by {new Intl.DateTimeFormat("en-US",{dateStyle:"medium",timeZone:"UTC"}).format(new Date(`${invitation.responseDeadline}T00:00:00Z`))}</p>}{invitation.response==="pending"?<form action={action}><input type="hidden" name="invitationId" value={invitation.id}/><button className="btn joining" name="response" value="joining" disabled={pending}>I&apos;m Joining!</button><button className="btn not-joining" name="response" value="not_joining" disabled={pending}>Not Joining</button></form>:<b className={`invitation-response ${invitation.response}`}>{invitation.response==="joining"?"✓ You are joining":"You responded: Not Joining"}</b>}{state.error&&<p className="form-error" role="alert">{state.error}</p>}{state.message&&<p className="form-success" role="status">{state.message}</p>}</section>;
}
