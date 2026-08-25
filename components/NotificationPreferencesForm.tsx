"use client";

import {useState} from "react";
import {updateNotificationPreferencesAction,type PreferenceActionState} from "@/app/profile/notification-actions";
import type {NotificationPreferences} from "@/lib/kch-data";

const options=[
  ["gameUpdates","Games & scores","Schedule changes and final scores"],
  ["teamUpdates","Team & roster","Roster publication and team changes"],
  ["paymentUpdates","Payments","Payment reviews and balance updates"],
  ["seasonUpdates","Seasons","Invitations, deadlines, and cancellations"],
] as const;

export default function NotificationPreferencesForm({preferences}:{preferences:NotificationPreferences}){
  const[values,setValues]=useState(preferences),[error,setError]=useState(""),[saving,setSaving]=useState(false);
  async function change(name:keyof NotificationPreferences,next:boolean){const previous=values;const updated={...values,[name]:next};setValues(updated);setSaving(true);setError("");const formData=new FormData();for(const[key,enabled] of Object.entries(updated))if(enabled)formData.set(key,"on");const result=await updateNotificationPreferencesAction({} as PreferenceActionState,formData);if(result.error){setValues(previous);setError(result.error)}setSaving(false)}
  return <details className="card account-disclosure"><summary><span>🔔</span><b>Notification Preferences</b><strong>›</strong></summary><div className="preference-form"><p>Choose what appears in your notification bell.</p>{options.map(([name,label,help])=><label className="preference-row" key={name}><span><b>{label}</b><small>{help}</small></span><input type="checkbox" checked={values[name]} onChange={event=>change(name,event.target.checked)} disabled={saving}/></label>)}{error&&<p className="form-error">{error}</p>}</div></details>;
}
