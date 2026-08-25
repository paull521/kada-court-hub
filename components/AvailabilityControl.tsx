"use client";

import {useState} from "react";
import {setAvailabilityAction,type AvailabilityActionState} from "@/app/availability/actions";

export default function AvailabilityControl({gameId,available}:{gameId:string;available:boolean}){
  const[current,setCurrent]=useState(available),[pending,setPending]=useState(false),[error,setError]=useState("");
  async function choose(next:boolean){if(pending||next===current)return;const previous=current;setCurrent(next);setPending(true);setError("");const formData=new FormData();formData.set("gameId",gameId);formData.set("available",next?"yes":"no");const result=await setAvailabilityAction({} as AvailabilityActionState,formData);if(result.error){setCurrent(previous);setError(result.error)}setPending(false)}
  return <section className="availability-control">
    <span><small>ARE YOU PLAYING?</small></span>
    <div><button type="button" onClick={()=>choose(true)} className={current?"active yes":""} disabled={pending}>Yes</button><button type="button" onClick={()=>choose(false)} className={!current?"active no":""} disabled={pending}>No</button></div>
    {error&&<p className="form-error">{error}</p>}
  </section>;
}
