"use client";

import {useActionState} from "react";
import {createRosterRequestAction,type CaptainActionState} from "@/app/captain/actions";
import type {CaptainPortalData} from "@/lib/captain-data";

const initialState:CaptainActionState={};
export default function CaptainRequestForm({data,enabled}:{data:CaptainPortalData;enabled:boolean}){
  const[state,action,pending]=useActionState(createRosterRequestAction,initialState);
  const players=data.roster.filter(player=>player.role==="Player");
  const candidates=data.candidates.filter(candidate=>!data.roster.some(player=>player.registrationId===candidate.registrationId));
  return <form action={action} className="owner-form captain-request-form"><input type="hidden" name="teamId" value={data.teamId}/><label>Request type<select name="requestType" defaultValue="trade"><option value="trade">Trade</option><option value="add_player">Add player</option><option value="remove_player">Remove player</option><option value="other">Other</option></select></label><label>Player on my team <small>(for Trade or Remove)</small><select name="registrationId" defaultValue=""><option value="">Select player</option>{players.map(player=><option key={player.registrationId} value={player.registrationId}>{player.name} · {player.position||"Position needed"}</option>)}</select></label><label>Move to team <small>(for Trade)</small><select name="targetTeamId" defaultValue=""><option value="">Select team</option>{data.divisionTeams.filter(team=>team.id!==data.teamId).map(team=><option key={team.id} value={team.id}>{team.name}</option>)}</select></label><label>Draft-pool player <small>(for Add)</small><select name="invitationId" defaultValue=""><option value="">Select player</option>{candidates.map(candidate=><option key={candidate.invitationId} value={candidate.invitationId}>{candidate.name} · {candidate.preferredPosition||"Position needed"}</option>)}</select></label><label>Request details<textarea name="details" rows={3} maxLength={1000} placeholder="Briefly explain the change." required/></label>{state.error&&<p className="form-error" role="alert">{state.error}</p>}{state.message&&<p className="form-success" role="status">{state.message}</p>}<button className="btn primary" disabled={pending||!enabled}>{pending?"Sending…":enabled?"Send Request":"Available After Draft Publication"}</button></form>;
}
