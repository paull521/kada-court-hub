"use client";
import {selectCaptainContextAction} from "@/app/captain/context-actions";
import type {CaptainContextOption} from "@/lib/captain-data";

export default function CaptainContextSwitcher({contexts,activeRegistrationId}:{contexts:CaptainContextOption[];activeRegistrationId:string}){
  if(contexts.length<2)return null;
  return <form action={selectCaptainContextAction} className="captain-context"><select name="registrationId" defaultValue={activeRegistrationId} aria-label="Captain team" onChange={event=>event.currentTarget.form?.requestSubmit()}>{contexts.map(context=><option key={context.registrationId} value={context.registrationId}>{context.teamName} · {context.divisionName}</option>)}</select></form>;
}
