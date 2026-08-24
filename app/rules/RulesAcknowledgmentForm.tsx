"use client";

import {useActionState,useState} from "react";
import {acknowledgeRulesAction,type RulesActionState} from "./actions";

export default function RulesAcknowledgmentForm({invitationId,rulesDocumentId}:{invitationId:string;rulesDocumentId:string}){
  const[state,action,pending]=useActionState(acknowledgeRulesAction,{} as RulesActionState);
  const[acknowledged,setAcknowledged]=useState(false);
  return <form action={action} className="rules-acknowledgment"><input type="hidden" name="invitationId" value={invitationId}/><input type="hidden" name="rulesDocumentId" value={rulesDocumentId}/><p>I acknowledge that I have been provided access to these League Rules &amp; Discipline policies. I understand that my participation is subject to these rules and agree to follow the applicable league requirements and standards of conduct.</p><label className="check-row"><input name="acknowledged" type="checkbox" checked={acknowledged} onChange={event=>setAcknowledged(event.target.checked)}/> I acknowledge these League Rules &amp; Discipline policies.</label>{state.error&&<p className="form-error">{state.error}</p>}<button className="btn primary" disabled={pending||!acknowledged}>{pending?"Joining…":"Acknowledge & Join Season"}</button></form>;
}
