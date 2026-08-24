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
  const[{data:rulesAcknowledgments},{data:requiredRules}]=await Promise.all([supabase.rpc("get_player_rule_acknowledgments"),data.activeRegistrationId?supabase.rpc("get_registration_rules",{p_registration_id:data.activeRegistrationId}):Promise.resolve({data:null})]);
  const ownerMode=(await searchParams).view==="owner"&&roles.owner;
  const player=data.profile,context=data.context;
  const personal=[["☎","Mobile Number",player.mobile||"Not provided"],["✉","Email",player.email],["▦","Birthdate",player.birthdate||"Not provided"],["⌖","Location",player.location||"Not provided"]];
  const details=[["♕","Jersey Number",String(player.jerseyNumber||"Not assigned")],["♕","Jersey Name",player.jerseyName||"Not assigned"],["♙","Position",player.position||"Not assigned"],["◇","Team",context.team],["♙","Preferred Position",player.preferredPosition||"Please complete"],["♕","Preferred Uniform Size",player.uniformSize||"Not provided"]];
  const currentRule=requiredRules?.[0] as {rules_document_id:string;acknowledged_at:string|null}|undefined;
  const acknowledgments=(rulesAcknowledgments??[]) as {acknowledgment_id:string;rules_document_id:string;acknowledged_at:string}[];
  const acknowledgedRule=acknowledgments.find(ack=>ack.rules_document_id===currentRule?.rules_document_id)??acknowledgments[0];
  const rulesLink=currentRule&&!currentRule.acknowledged_at?<Link href={`/rules?registration=${data.activeRegistrationId}`} className="card rules-account-link"><span>▢</span><b>Rules &amp; Discipline</b><strong>›</strong></Link>:acknowledgedRule?<Link href={`/rules?acknowledgment=${acknowledgedRule.acknowledgment_id}`} className="card rules-account-link"><span>▢</span><b>Rules &amp; Discipline</b><strong>›</strong></Link>:null;
  return <AppShell active="profile" contexts={data.contexts} activeRegistrationId={data.activeRegistrationId} notifications={data.notifications} profileNeedsAttention={data.profileNeedsAttention} paymentNeedsAttention={data.paymentNeedsAttention} teamHasUnavailable={data.teamHasUnavailable} homeHref={ownerMode?"/owner":"/home"}>
    <h1 className="title">Profile</h1><p className="subtitle">Manage your account and player details</p>
    <section className="card profile-card"><span className="avatar">{player.initials}</span><div><h2>{player.name}</h2><p>KCH Player ID: &nbsp;{player.id}</p><b className="status">● &nbsp;{player.status}</b></div></section>
    <RoleSwitcher roles={roles} current={ownerMode?"owner":"player"}/>
    <ProfileEditForm mobile={player.mobile} email={player.email} birthdate={player.birthdateValue} location={player.location} preferredPosition={player.preferredPosition}/>
    <InfoPanel title="PERSONAL INFO" rows={personal}/><InfoPanel title="PLAYER DETAILS" rows={details}/>
    <h2 className="profile-section-title">ACCOUNT</h2>
    <div className="profile-account-list"><NotificationPreferencesForm preferences={data.notificationPreferences}/>{rulesLink}<Link href="/legal" className="card account-link"><span>▢</span><b>Privacy &amp; Terms</b><strong>›</strong></Link><form action={logoutAction}><button className="card account-link logout-account"><span>↪</span><b>Log Out</b><strong>›</strong></button></form></div>
  </AppShell>;
}
