"use server";

import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";

export type PaymentActionState={error?:string;message?:string};
const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function submitPaymentNoticeAction(_:PaymentActionState,formData:FormData):Promise<PaymentActionState>{
  const registrationId=String(formData.get("registrationId")??"").trim(),method=String(formData.get("method")??"").trim(),reference=String(formData.get("reference")??"").trim(),amount=Number(formData.get("amount")??0);
  if(!uuidPattern.test(registrationId)||!["zelle","cash","waiver"].includes(method))return{error:"Select Zelle, Cash, or Waiver."};
  if(!Number.isFinite(amount)||amount<=0||Math.round(amount*100)!==amount*100)return{error:"Enter a valid payment amount."};
  if(method==="waiver"&&!reference)return{error:"A comment is required for a waiver request."};
  if(reference.length>200)return{error:"Keep the payment reference under 200 characters."};
  const supabase=await createClient();
  const {data:claims}=await supabase.auth.getClaims();
  if(!claims?.claims?.sub)return{error:"Please log in again."};
  const {error}=await supabase.rpc("player_submit_account_payment",{p_registration_id:registrationId,p_amount_cents:Math.round(amount*100),p_method:method,p_reference:reference||null});
  if(error)return{error:error.message.includes("function")?"Install the latest payment SQL, then try again.":error.message};
  revalidatePath("/payments");revalidatePath("/owner");
  return{message:method==="waiver"?"Waiver request sent to the owner.":"Payment sent for owner confirmation."};
}
