"use server";

import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";

export type CaptainActionState={error?:string;message?:string};
const uuid=/^[0-9a-f-]{36}$/i;
const positions=["G","SG","PG","F","PF","C"];
const refresh=()=>{revalidatePath("/captain");revalidatePath("/owner/setup")};
export async function saveDraftPlayerAction(_:CaptainActionState,formData:FormData):Promise<CaptainActionState>{
  const teamId=String(formData.get("teamId")??""),invitationId=String(formData.get("invitationId")??""),position=String(formData.get("position")??"").trim(),uniformSize=String(formData.get("uniformSize")??"").trim().toUpperCase(),jerseyName=String(formData.get("jerseyName")??"").trim(),raw=String(formData.get("jerseyNumber")??""),jersey=raw===""?null:Number(raw);
  if(!uuid.test(teamId)||!uuid.test(invitationId)||!positions.includes(position)||!(["","S","M","L","XL","2XL","3XL"].includes(uniformSize))||jerseyName.length>24||jersey!==null&&(!Number.isInteger(jersey)||jersey<0||jersey>99))return{error:"Choose a player and complete the roster details."};
  const supabase=await createClient();const{error}=await supabase.rpc("captain_save_draft_player",{p_team_id:teamId,p_invitation_id:invitationId,p_jersey_number:jersey,p_position:position,p_uniform_size:uniformSize||null,p_jersey_name:jerseyName||null});if(error)return{error:error.message};refresh();return{message:"Player added to your draft roster."};
}
export async function updateDraftPlayerAction(_:CaptainActionState,formData:FormData):Promise<CaptainActionState>{
  const teamId=String(formData.get("teamId")??""),registrationId=String(formData.get("registrationId")??""),position=String(formData.get("position")??"").trim(),uniformSize=String(formData.get("uniformSize")??"").trim().toUpperCase(),jerseyName=String(formData.get("jerseyName")??"").trim(),raw=String(formData.get("jerseyNumber")??""),jersey=raw===""?null:Number(raw),remove=formData.get("remove")==="yes",detailsOnly=formData.get("detailsOnly")==="yes";
  if(!uuid.test(teamId)||!uuid.test(registrationId)||(!remove&&!positions.includes(position))||!(["","S","M","L","XL","2XL","3XL"].includes(uniformSize))||jerseyName.length>24||jersey!==null&&(!Number.isInteger(jersey)||jersey<0||jersey>99))return{error:"Check the player details."};
  const supabase=await createClient();const{error}=await supabase.rpc(detailsOnly?"captain_update_player_details":"captain_update_draft_player",detailsOnly?{p_team_id:teamId,p_registration_id:registrationId,p_jersey_number:jersey,p_position:position||null,p_uniform_size:uniformSize||null,p_jersey_name:jerseyName||null}:{p_team_id:teamId,p_registration_id:registrationId,p_jersey_number:jersey,p_position:position||null,p_uniform_size:uniformSize||null,p_jersey_name:jerseyName||null,p_remove:remove});if(error)return{error:error.message};refresh();return{message:remove?"Player returned to the draft pool.":"Player information updated."};
}
export async function submitTeamRosterAction(_:CaptainActionState,formData:FormData):Promise<CaptainActionState>{
  const teamId=String(formData.get("teamId")??"");if(!uuid.test(teamId))return{error:"Invalid team."};const supabase=await createClient();const{error}=await supabase.rpc("captain_submit_team_roster",{p_team_id:teamId});if(error)return{error:error.message};refresh();return{message:"Roster sent to the owner for approval."};
}
export async function createRosterRequestAction(_:CaptainActionState,formData:FormData):Promise<CaptainActionState>{
  const teamId=String(formData.get("teamId")??""),requestType=String(formData.get("requestType")??""),details=String(formData.get("details")??"").trim(),registrationId=String(formData.get("registrationId")??""),targetTeamId=String(formData.get("targetTeamId")??""),invitationId=String(formData.get("invitationId")??"");
  if(!/^[0-9a-f-]{36}$/i.test(teamId)||!["trade","add_player","remove_player","other"].includes(requestType)||details.length<1||details.length>1000)return{error:"Choose a request type and enter details."};
  const supabase=await createClient();
  const {data:claims}=await supabase.auth.getClaims();
  if(!claims?.claims?.sub)return{error:"Your session expired. Log in again."};
  const {error}=await supabase.rpc("captain_create_roster_request",{p_team_id:teamId,p_request_type:requestType,p_details:details,p_registration_id:uuid.test(registrationId)?registrationId:null,p_target_team_id:uuid.test(targetTeamId)?targetTeamId:null,p_invitation_id:uuid.test(invitationId)?invitationId:null});
  if(error)return{error:error.message.includes("function")?"Install the latest draft-workflow migration first.":error.message};
  revalidatePath("/captain");
  return{message:"Request sent to the conference owner."};
}
