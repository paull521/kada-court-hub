import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import ConferenceInviteForm from "./ConferenceInviteForm";

const validToken=(token:string)=>/^[0-9a-f-]{36}$/i.test(token);
export default async function ConferenceInvitePage({params}:{params:Promise<{token:string}>}){
  const {token}=await params;
  if(!validToken(token))return <main className="shell"><section className="content"><section className="card join-card"><h1>Invitation unavailable</h1></section></section></main>;
  const supabase=await createClient();
  const [{data:details},{data:claims}]=await Promise.all([supabase.rpc("get_conference_player_invitation",{p_token:token}),supabase.auth.getClaims()]);
  const conferenceName=Array.isArray(details)?details[0]?.conference_name:undefined;
  if(!conferenceName)return <main className="shell"><section className="content"><section className="card join-card"><h1>Invitation unavailable</h1></section></section></main>;
  const nextPath=`/invite/${token}`;
  return <main className="shell"><section className="content">{claims?.claims?.sub?<ConferenceInviteForm token={token} conferenceName={conferenceName}/>:<section className="card join-card"><span>🏀</span><h1>{conferenceName}</h1><Link className="btn primary" href={`/login?next=${encodeURIComponent(nextPath)}`}>Log In</Link><Link className="btn secondary" href={`/sign-up?next=${encodeURIComponent(nextPath)}`}>Create KCH Profile</Link></section>}</section></main>;
}
