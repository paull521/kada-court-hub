"use server";

import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";

export type InvitationActionState={error?:string;message?:string};
export async function respondInvitationAction(_:InvitationActionState,formData:FormData):Promise<InvitationActionState>{
  const invitationId=String(formData.get("invitationId")??"");
  const response=String(formData.get("response")??"");
  if(!/^[0-9a-f-]{36}$/i.test(invitationId)||!["joining","not_joining"].includes(response))return{error:"Choose whether you are joining this season."};
  const supabase=await createClient();
  const {data:claims}=await supabase.auth.getClaims();
  if(!claims?.claims?.sub)return{error:"Your session expired. Log in again."};
  const {error}=await supabase.rpc("respond_to_season_invitation",{p_invitation_id:invitationId,p_response:response});
  if(error)return{error:error.message.includes("function")?"The latest invitation migration must be installed first.":error.message};
  revalidatePath("/home");
  revalidatePath("/profile");
  return{message:response==="joining"?"You are joining this season.":"Your Not Joining response was recorded."};
}
