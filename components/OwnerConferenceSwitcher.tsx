"use client";

import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
import {selectOwnerConferenceAction} from "@/app/owner/actions";
import type {OwnerConferenceOption} from "@/lib/owner-data";

export default function OwnerConferenceSwitcher({conferences,currentId}:{conferences:OwnerConferenceOption[];currentId:string}){
  const [open,setOpen]=useState(false);
  const pathname=usePathname();
  const current=conferences.find(conference=>conference.id===currentId)??conferences[0];
  const hasChoices=conferences.length>1;

  useEffect(()=>{
    if(!open)return;
    const close=(event:KeyboardEvent)=>event.key==="Escape"&&setOpen(false);
    document.addEventListener("keydown",close);
    return()=>document.removeEventListener("keydown",close);
  },[open]);

  if(!current)return null;

  return <>
    <button className="context-switcher-trigger owner-context-trigger" type="button" onClick={()=>hasChoices&&setOpen(true)} aria-haspopup={hasChoices?"dialog":undefined} aria-expanded={hasChoices?open:undefined} disabled={!hasChoices}>
      <span><b>{current.name}</b></span>{hasChoices&&<i aria-hidden="true">⌄</i>}
    </button>
    {open&&<div className="context-overlay context-overlay-open" role="presentation" onMouseDown={event=>event.target===event.currentTarget&&setOpen(false)}>
      <section className="context-sheet" role="dialog" aria-modal="true" aria-labelledby="owner-conference-title">
        <div className="context-sheet-handle"/>
        <header><span><small>OWNER VIEW</small><h2 id="owner-conference-title">Choose your conference</h2></span><button type="button" onClick={()=>setOpen(false)} aria-label="Close">×</button></header>
        <p className="context-help">Your owner workspace will update to the selected conference.</p>
        <div className="context-options">{conferences.map(conference=><form action={selectOwnerConferenceAction} key={conference.id}><input type="hidden" name="conferenceId" value={conference.id}/><input type="hidden" name="returnPath" value={pathname}/><button className={`context-option ${conference.id===current.id?"selected":""}`} type="submit" disabled={conference.id===current.id} onClick={()=>setOpen(false)}><span className="context-option-mark" aria-hidden="true">{conference.id===current.id?"✓":"K"}</span><span><b>{conference.name}</b><small>Conference owner workspace</small></span><strong aria-hidden="true">{conference.id===current.id?"Current":"›"}</strong></button></form>)}</div>
      </section>
    </div>}
  </>;
}
