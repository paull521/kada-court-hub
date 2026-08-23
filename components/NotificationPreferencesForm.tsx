"use client";

import {useActionState} from "react";
import {updateNotificationPreferencesAction,type PreferenceActionState} from "@/app/profile/notification-actions";
import type {NotificationPreferences} from "@/lib/kch-data";

const initialState:PreferenceActionState={};
const options=[
  ["gameUpdates","Games & scores","Schedule changes and final scores"],
  ["teamUpdates","Team & roster","Roster publication and team changes"],
  ["paymentUpdates","Payments","Payment reviews and balance updates"],
  ["seasonUpdates","Seasons","Invitations, deadlines, and cancellations"],
] as const;

export default function NotificationPreferencesForm({preferences}:{preferences:NotificationPreferences}){
  const[state,action,pending]=useActionState(updateNotificationPreferencesAction,initialState);
  return <details className="card account-disclosure"><summary><span>🔔</span><b>Notification Preferences</b><strong>›</strong></summary><form action={action} className="preference-form"><p>Choose what appears in your notification bell.</p>{options.map(([name,label,help])=><label className="preference-row" key={name}><span><b>{label}</b><small>{help}</small></span><input type="checkbox" name={name} defaultChecked={preferences[name]}/></label>)}{state.error&&<p className="form-error">{state.error}</p>}{state.message&&<p className="form-success">{state.message}</p>}<button className="btn primary" disabled={pending}>{pending?"Saving…":"Save Preferences"}</button></form></details>;
}
