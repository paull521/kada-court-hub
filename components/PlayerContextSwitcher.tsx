"use client";

import {useEffect,useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {switchPlayerContextAction} from "@/app/context/actions";
import type {PlayerContextOption} from "@/lib/kch-data";

export default function PlayerContextSwitcher({contexts,activeRegistrationId}:{contexts:PlayerContextOption[];activeRegistrationId:string}) {
  const [open,setOpen]=useState(false);
  const [pending,startTransition]=useTransition();
  const [error,setError]=useState("");
  const router=useRouter();
  const active=contexts.find(context=>context.registrationId===activeRegistrationId)??contexts[0];
  const hasDivisionChoices=new Set(contexts.map(context=>context.divisionId)).size>1;
  const conferenceLabel=active?.conference?.toLowerCase().includes("seattle filipino")||active?.conference?.toLowerCase().includes("kch basketball")?"KCH BBALL":active?.conference||"KCH BBALL";

  useEffect(()=>{
    if (!open) return;
    const close=(event:KeyboardEvent)=>event.key==="Escape"&&setOpen(false);
    document.addEventListener("keydown",close);
    return ()=>document.removeEventListener("keydown",close);
  },[open]);

  if (!active) return null;

  function choose(registrationId:string) {
    setError("");
    startTransition(async()=>{
      const result=await switchPlayerContextAction(registrationId);
      if (result.error) return setError(result.error);
      setOpen(false);
      router.refresh();
    });
  }

  return <>
    <button className="context-switcher-trigger" type="button" onClick={()=>hasDivisionChoices&&setOpen(true)} aria-haspopup={hasDivisionChoices?"dialog":undefined} aria-expanded={hasDivisionChoices?open:undefined} disabled={!hasDivisionChoices}>
      <span><b>{conferenceLabel}</b></span>{hasDivisionChoices&&<i aria-hidden="true">⌄</i>}
    </button>
    {open&&<div className="context-overlay" role="presentation" onMouseDown={event=>event.target===event.currentTarget&&setOpen(false)}>
      <section className="context-sheet" role="dialog" aria-modal="true" aria-labelledby="context-title">
        <div className="context-sheet-handle"/>
        <header><span><small>PLAYER VIEW</small><h2 id="context-title">Choose your division</h2></span><button type="button" onClick={()=>setOpen(false)} aria-label="Close">×</button></header>
        <p className="context-help">Your Home, Team, Schedule, Payments, and Profile will update together.</p>
        <div className="context-options">{contexts.map(context=><button className={`context-option ${context.registrationId===active.registrationId?"selected":""}`} type="button" disabled={pending} onClick={()=>choose(context.registrationId)} key={context.registrationId}>
          <span className="context-option-mark" aria-hidden="true">{context.registrationId===active.registrationId?"✓":"K"}</span>
          <span><b>{context.team}</b><small>{context.conference}</small><em>{context.division} &nbsp;•&nbsp; {context.season}</em></span>
          <strong aria-hidden="true">{context.registrationId===active.registrationId?"Current":"›"}</strong>
        </button>)}</div>
        {pending&&<p className="context-status">Updating your player view…</p>}
        {error&&<p className="form-error">{error}</p>}
      </section>
    </div>}
  </>;
}
