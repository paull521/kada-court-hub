"use server";

import {redirect} from "next/navigation";
import {cookies,headers} from "next/headers";
import {isSupabaseConfigured} from "@/lib/supabase/config";
import {createClient} from "@/lib/supabase/server";

export type AuthActionState = {error?: string; message?: string};
const safeReturnPath=(path:string)=>path==="/platform"||path==="/platform/owner-invitation"||/^\/invite\/[0-9a-f-]{36}$/i.test(path)||/^\/platform\/invite\/[0-9a-f-]{36}$/i.test(path)?path:"";

function credentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  };
}

export async function loginAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) redirect("/home?mode=demo");
  const {email, password} = credentials(formData);
  if (!email || !password) return {error: "Enter your email and password."};

  const supabase = await createClient();
  const {error} = await supabase.auth.signInWithPassword({email, password});
  if (error) return {error: "We could not log you in. Check your email and password."};
  const cookieStore=await cookies(),nextPath=safeReturnPath(String(formData.get("nextPath")??""))||safeReturnPath(cookieStore.get("kch_return_path")?.value??"");
  if(nextPath)cookieStore.delete("kch_return_path");
  redirect(nextPath||"/home");
}

export async function signUpAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) return {error: "Connect the Supabase project before creating real profiles."};
  const {email, password} = credentials(formData);
  const displayName = String(formData.get("displayName") ?? "").trim();
  const nextPath=safeReturnPath(String(formData.get("nextPath")??""));
  if (!displayName || !email || password.length < 8) return {error: "Enter your name, email, and a password of at least 8 characters."};
  const playerInvite=nextPath.match(/^\/invite\/([0-9a-f-]{36})$/i);
  const ownerInvite=nextPath.match(/^\/platform\/invite\/([0-9a-f-]{36})$/i);
  if(!playerInvite&&!ownerInvite)return{error:"Create your KCH profile from an invitation link."};

  if(nextPath)(await cookies()).set("kch_return_path",nextPath,{httpOnly:true,sameSite:"lax",path:"/",maxAge:60*60*24});
  const supabase = await createClient();
  if(playerInvite){const{data:invitation,error:invitationError}=await supabase.rpc("get_conference_player_invitation",{p_token:playerInvite[1]});if(invitationError||!Array.isArray(invitation)||!invitation.length)return{error:"This conference invitation is not available."};}
  const origin=(await headers()).get("origin")??process.env.NEXT_PUBLIC_SITE_URL??"";
  const confirmationPath=nextPath?`/auth/callback?next=${encodeURIComponent(nextPath)}`:"/auth/callback";
  const metadata=playerInvite?{display_name:displayName,conference_invitation_token:playerInvite[1]}:{display_name:displayName,platform_owner_invitation_token:ownerInvite?.[1]};
  const {data, error} = await supabase.auth.signUp({email, password, options:{data:metadata,emailRedirectTo:origin?`${origin}${confirmationPath}`:undefined}});
  if (error) return {error: error.message};
  if (!data.session) return {message: nextPath?"Check your email to confirm your new KCH profile. After confirmation, log in and KCH will return you to your invitation.":"Check your email to confirm your new KCH profile."};
  redirect(nextPath||"/home");
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
