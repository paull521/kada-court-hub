"use client";
import {useActionState} from "react";
import {joinDivisionAction,type JoinState} from "./actions";
export default function JoinForm({divisionId}:{divisionId:string}){const[state,action,pending]=useActionState(joinDivisionAction,{} as JoinState);return <form action={action} className="card join-card"><input type="hidden" name="divisionId" value={divisionId}/><span>🏀</span><h1>Join this KCH division</h1><p>This link already identifies the conference and division.</p>{state.error&&<p className="form-error">{state.error}</p>}{state.message&&<p className="form-success">{state.message}</p>}<button className="btn primary" disabled={pending}>{pending?"Joining…":"Join This Division"}</button></form>}
