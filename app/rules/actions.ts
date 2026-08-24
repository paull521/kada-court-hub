"use server";

import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

export type RulesActionState={error?:string};

export async function acknowledgeRulesAction(_:RulesActionState,formData:FormData):Promise<RulesActionState>{
  const invitationId=String(formData.get("invitationId")??"");
  const rulesDocumentId=String(formData.get("rulesDocumentId")??"");
  const acknowledged=formData.get("acknowledged")==="on";
  if(!acknowledged)return{error:"Please acknowledge the League Rules & Discipline policies."};
  if(!/^[0-9a-f-]{36}$/i.test(invitationId)||!/^[0-9a-f-]{36}$/i.test(rulesDocumentId))return{error:"This rules page is not available."};
  const supabase=await createClient();
  const{error}=await supabase.rpc("acknowledge_rules_and_join",{p_invitation_id:invitationId,p_rules_document_id:rulesDocumentId});
  if(error)return{error:error.message};
  redirect("/home");
}
