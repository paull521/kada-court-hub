"use client";

import {useActionState} from "react";
import {claimConferenceInviteAction,type ConferenceInviteState} from "./actions";

export default function ConferenceInviteForm({token,conferenceName}:{token:string;conferenceName:string}){
  const[state,action,pending]=useActionState(claimConferenceInviteAction,{} as ConferenceInviteState);
  return <form action={action} className="card join-card"><input type="hidden" name="token" value={token}/><span>🏀</span><h1>{conferenceName}</h1>{state.error&&<p className="form-error">{state.error}</p>}<button className="btn primary" disabled={pending}>{pending?"Joining…":"Join Conference"}</button></form>;
}
