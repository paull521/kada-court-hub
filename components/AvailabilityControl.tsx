"use client";

import {useActionState} from "react";
import {setAvailabilityAction,type AvailabilityActionState} from "@/app/availability/actions";

const initialState:AvailabilityActionState={};
export default function AvailabilityControl({gameId,available}:{gameId:string;available:boolean}){
  const[state,action,pending]=useActionState(setAvailabilityAction,initialState);
  return <form action={action} className="availability-control">
    <input type="hidden" name="gameId" value={gameId}/>
    <span><small>ARE YOU PLAYING?</small></span>
    <div><button name="available" value="yes" className={available?"active yes":""} disabled={pending}>Yes</button><button name="available" value="no" className={!available?"active no":""} disabled={pending}>No</button></div>
    {state.error&&<p className="form-error">{state.error}</p>}
  </form>;
}
