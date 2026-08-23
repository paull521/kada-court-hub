"use client";

import {useActionState} from "react";
import {createTestConferenceAction,selectOwnerConferenceAction,type OwnerActionState} from "@/app/owner/actions";
import type {OwnerConferenceOption} from "@/lib/owner-data";

const initialState:OwnerActionState={};

export default function OwnerConferenceManagement({currentId,conferences}:{currentId:string;conferences:OwnerConferenceOption[]}){
  const[state,action,pending]=useActionState(createTestConferenceAction,initialState);
  return <section className="owner-conference-management"><div className="conference-create-card card"><p className="eyebrow">CLEAN TEST</p><h2>Create a Test Conference</h2><p>This creates a separate conference and loads 150 fictional players. You will create its season, division, teams, fees, and uniforms through the normal owner workflow.</p><form action={action} className="owner-form"><label>Conference name<input name="name" defaultValue="KCH Owner Simulation" maxLength={80} required/></label><label>Timezone<select name="timezone" defaultValue="America/Los_Angeles"><option value="America/Los_Angeles">Pacific Time</option><option value="America/Denver">Mountain Time</option><option value="America/Chicago">Central Time</option><option value="America/New_York">Eastern Time</option></select></label>{state.error&&<p className="form-error">{state.error}</p>}<button className="btn primary" disabled={pending}>{pending?"Creating 150 test players…":"Create Test Conference"}</button><small>No real email or text messages will be sent to the fictional contacts.</small></form></div><section className="conference-list-section"><p className="eyebrow">YOUR CONFERENCES</p><h2>Switch Conference</h2><div className="conference-choice-list">{conferences.map(conference=><form action={selectOwnerConferenceAction} key={conference.id} className={`conference-choice card ${conference.id===currentId?"selected":""}`}><input type="hidden" name="conferenceId" value={conference.id}/><span><b>{conference.name}</b><small>{conference.id===currentId?"Currently selected":"Open this owner workspace"}</small></span><button className="btn secondary" disabled={conference.id===currentId}>{conference.id===currentId?"Selected":"Switch"}</button></form>)}</div></section></section>;
}
