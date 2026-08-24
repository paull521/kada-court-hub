import Link from "next/link";
import AppShell from "@/components/AppShell";
import NotificationPreferencesForm from "@/components/NotificationPreferencesForm";
import ProfileEditForm from "@/components/ProfileEditForm";
import RoleSwitcher from "@/components/RoleSwitcher";
import {logoutAction} from "@/app/auth/actions";
import {getPlayerPortalData} from "@/lib/kch-data";
import {getAvailableRoles} from "@/lib/roles";
import {createClient} from "@/lib/supabase/server";
import "@/components/ProfileCleanup.module.css";

function InfoPanel({title,rows}:{title:string;rows:string[][]}){return <section className="card panel info-panel"><h2>{title}</h2>{rows.map(([icon,label,value])=><div className="info-row" key={label}><span>{icon}</span><b>{label}</b><em>{value}</em></div>)}</section>}

export default async function Profile({searchParams}:{searchParams:Promise<{view?:string}>}){
  const[data,roles,supabase]=await Promise.all([getPlayerPortalData(),getAvailableRoles(),createClient()]);
  const{data:rulesAcknowledgments}=await supabase.rpc("get_player_rule_acknowledgments");
  const ownerMode=(await searchParams).view==="owner"&&roles.owner;
  const player=data.profile,context=data.context;
  const personal=[["☎","Mobile Number",player.mobile||"Not provided"],["✉","Email",player.email],["▦","Birthdate",player.birthdate||"Not provided"],["⌖","Location",player.location||"Not provided"]];
  const details=[["♕","Jersey Number",String(player.jerseyNumber||"Not assigned")],["♕","Jersey Name",player.jerseyName||"Not assigned"],["♙","Position",player.position||"Not assigned"],["◇","Team",context.team],["♙","Preferred Position",player.preferredPosition||"Please complete"],["♕","Preferred Uniform Size",player.uniformSize||"Not provided"]];
  return <AppShell active="profile" contexts={data.contexts} activeRegistrationId={data.activeRegistrationId} notifications={data.notifications} profileNeedsAttention={data.profileNeedsAttention} paymentNeedsAttention={data.paymentNeedsAttention} teamHasUnavailable={data.teamHasUnavailable} homeHref={ownerMode?"/owner":"/home"}>
    <h1 className="title">Profile</h1><p className="subtitle">Manage your account and player details</p>
    <section className="card profile-card"><span className="avatar">{player.initials}</span><div><h2>{player.name}</h2><p>KCH Player ID: &nbsp;{player.id}</p><b className="status">● &nbsp;{player.status}</b></div></section>
    <RoleSwitcher roles={roles} current={ownerMode?"owner":"player"}/>
    <ProfileEditForm mobile={player.mobile} email={player.email} birthdate={player.birthdateValue} location={player.location} preferredPosition={player.preferredPosition}/>
    <InfoPanel title="PERSONAL INFO" rows={personal}/><InfoPanel title="PLAYER DETAILS" rows={details}/>
    <h2 className="profile-section-title">ACCOUNT</h2>
    <div className="profile-account-list"><NotificationPreferencesForm preferences={data.notificationPreferences}/>{(rulesAcknowledgments??[]).map((ack:{acknowledgment_id:string;conference_name:string;season_name:string;version:string;acknowledged_at:string})=><Link href={`/rules?acknowledgment=${ack.acknowledgment_id}`} className="card rules-account-link" key={ack.acknowledgment_id}><span>▢</span><div><b>Rules &amp; Discipline</b><small>{ack.season_name} — {ack.conference_name}</small><em>Rules Acknowledged · {new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"}).format(new Date(ack.acknowledged_at))}</em><small>Version {ack.version}</small></div><strong>›</strong></Link>)}<Link href="/legal" className="card account-link"><span>▢</span><b>Privacy &amp; Terms</b><strong>›</strong></Link><form action={logoutAction}><button className="card account-link logout-account"><span>↪</span><b>Log Out</b><strong>›</strong></button></form></div>
  </AppShell>;
}
