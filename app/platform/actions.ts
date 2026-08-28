"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

export type PlatformActionState={error?:string;message?:string;token?:string};
const email=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const money=(value:string)=>Math.round(Number(value)*100);

export async function platformLogoutAction(){
  const supabase=await createClient();
  await supabase.auth.signOut();
  redirect("/platform/login");
}

export async function inviteOwnerAction(_:PlatformActionState,formData:FormData):Promise<PlatformActionState>{
  const emailAddress=String(formData.get("email")??"").trim().toLowerCase(),conferenceName=String(formData.get("conferenceName")??"").trim();
  if(!email.test(emailAddress)||conferenceName.length<2||conferenceName.length>80)return{error:"Enter a conference name and a valid owner email."};
  const supabase=await createClient();const {data,error}=await supabase.rpc("platform_invite_owner",{p_email:emailAddress,p_conference_name:conferenceName});
  if(error)return{error:error.message};revalidatePath("/platform");return{message:"Owner invitation created.",token:typeof data==="string"?data:undefined};
}

export async function confirmSubscriptionAction(_:PlatformActionState,formData:FormData):Promise<PlatformActionState>{
  const id=String(formData.get("submissionId")??"");const supabase=await createClient();const {error}=await supabase.rpc("platform_review_subscription_payment",{p_submission_id:id,p_decision:"confirmed"});
  if(error)return{error:error.message};revalidatePath("/platform");revalidatePath("/platform/payments");revalidatePath("/owner/payments");return{message:"Subscription payment confirmed."};
}

export async function submitSubscriptionPaymentAction(_:PlatformActionState,formData:FormData):Promise<PlatformActionState>{
  const conferenceId=String(formData.get("conferenceId")??""),amountCents=money(String(formData.get("amount")??"")),method=String(formData.get("method")??"");
  if(!conferenceId||amountCents<1||!['zelle','cash'].includes(method))return{error:"Enter an amount and choose Zelle or Cash."};
  const supabase=await createClient();const {error}=await supabase.rpc("owner_submit_subscription_payment",{p_conference_id:conferenceId,p_amount_cents:amountCents,p_method:method});
  if(error)return{error:error.message};revalidatePath("/owner/payments");revalidatePath("/platform");revalidatePath("/platform/payments");return{message:"Payment sent for platform confirmation."};
}

export async function acceptOwnerInvitationAction(_:PlatformActionState,formData:FormData):Promise<PlatformActionState>{
  const token=String(formData.get("token")??"");const supabase=await createClient();const {data,error}=await supabase.rpc("accept_platform_owner_invitation",{p_token:token});
  if(error)return{error:error.message};if(typeof data!=="string")return{error:"The invitation could not be accepted."};revalidatePath("/owner");redirect("/owner");
}
export async function signOwnerContractAction(_:PlatformActionState,formData:FormData):Promise<PlatformActionState>{const token=String(formData.get("token")??""),signedName=String(formData.get("signedName")??"").trim();if(!signedName)return{error:"Type your full name to sign."};const supabase=await createClient();const{error}=await supabase.rpc("sign_platform_owner_contract",{p_token:token,p_signed_name:signedName});if(error)return{error:error.message};return{message:"Agreement signed. KCH will activate your owner access after review."}}
export async function createNewOwnerInvitationAction(_:PlatformActionState,formData:FormData):Promise<PlatformActionState>{const v=(key:string)=>String(formData.get(key)??"").trim();const supabase=await createClient();const{data,error}=await supabase.rpc("platform_create_new_owner_invitation",{p_conference_name:v("conferenceName"),p_owner_name:v("ownerName"),p_email:v("email")});if(error)return{error:error.message};revalidatePath("/platform/owners");return{message:"Invitation link created.",token:typeof data==="string"?data:undefined}}

export async function registerOwnerApplicantAction(_:PlatformActionState):Promise<PlatformActionState>{const supabase=await createClient();const{data,error}=await supabase.rpc("platform_register_owner_applicant");if(error)return{error:error.message};return{message:"Your owner application is ready for the digital contract.",token:typeof data==="string"?data:undefined}}
export async function signOwnerApplicationContractAction(_:PlatformActionState,formData:FormData):Promise<PlatformActionState>{const signedName=String(formData.get("signedName")??"").trim(),ownerId=String(formData.get("ownerId")??"");if(!signedName)return{error:"Type your full name to sign."};const supabase=await createClient();const{error}=await supabase.rpc("sign_owner_application_contract",{p_owner_id:ownerId,p_signed_name:signedName});if(error)return{error:error.message};return{message:"Agreement signed. Platform Creator will create your conference and activate your owner access."}}
export async function createOwnerConferenceAction(_:PlatformActionState,formData:FormData):Promise<PlatformActionState>{const supabase=await createClient();const{error}=await supabase.rpc("platform_create_owner_conference",{p_owner_id:String(formData.get("ownerId")??""),p_conference_name:String(formData.get("conferenceName")??"").trim()});if(error)return{error:error.message};revalidatePath("/platform/owners");return{message:"Conference created and owner access activated."}}

export async function createOwnerAction(_:PlatformActionState,formData:FormData):Promise<PlatformActionState>{const v=(key:string)=>String(formData.get(key)??"").trim();const supabase=await createClient();const{data,error}=await supabase.rpc("platform_create_owner",{p_conference_name:v("conferenceName"),p_name:v("name"),p_email:v("email"),p_phone:v("phone"),p_subscription_starts_on:v("startsOn")||null,p_subscription_ends_on:v("endsOn")||null,p_contract_url:v("contractUrl")||null});if(error)return{error:error.message};revalidatePath("/platform/owners");return{message:"Owner invitation created.",token:typeof data==="string"?data:undefined}}
export async function setOwnerStatusAction(_:PlatformActionState,formData:FormData):Promise<PlatformActionState>{const supabase=await createClient();const{error}=await supabase.rpc("platform_set_owner_status",{p_owner_id:String(formData.get("ownerId")??""),p_status:String(formData.get("status")??"")});if(error)return{error:error.message};revalidatePath("/platform/owners");return{message:"Owner status updated."}}
export async function requestOwnerPaymentAction(_:PlatformActionState,formData:FormData):Promise<PlatformActionState>{const supabase=await createClient();const{error}=await supabase.rpc("platform_request_owner_payment",{p_conference_id:String(formData.get("conferenceId")??"")});if(error)return{error:error.message};revalidatePath("/platform/payments");return{message:"Payment request sent."}}
export async function requestSupportAction(_:PlatformActionState,formData:FormData):Promise<PlatformActionState>{const subject=String(formData.get("subject")??"").trim(),message=String(formData.get("message")??"").trim();if(subject.length<2||message.length<2)return{error:"Add a subject and message."};const supabase=await createClient();const{error}=await supabase.rpc("owner_request_platform_support",{p_conference_id:String(formData.get("conferenceId")??""),p_subject:subject,p_message:message});if(error)return{error:error.message};revalidatePath("/profile");revalidatePath("/platform/support");return{message:"Support request sent."}}
export async function confirmSupportRequestAction(_:PlatformActionState,formData:FormData):Promise<PlatformActionState>{const supabase=await createClient();const{error}=await supabase.rpc("platform_confirm_support_request",{p_request_id:String(formData.get("requestId")??"")});if(error)return{error:error.message};revalidatePath("/platform/support");revalidatePath("/profile");return{message:"Support request marked received."}}
export async function markSupportRequestFixedAction(_:PlatformActionState,formData:FormData):Promise<PlatformActionState>{const supabase=await createClient();const{error}=await supabase.rpc("platform_mark_support_request_fixed",{p_request_id:String(formData.get("requestId")??"")});if(error)return{error:error.message};revalidatePath("/platform/support");revalidatePath("/profile");return{message:"Support request marked fixed."}}
