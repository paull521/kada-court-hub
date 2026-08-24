"use server";

import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";

export type ProfileActionState = {error?:string;message?:string};

export async function updateProfileAction(_:ProfileActionState,formData:FormData):Promise<ProfileActionState>{
  const mobile=String(formData.get("mobile")??"").trim();
  const email=String(formData.get("email")??"").trim().toLowerCase();
  const birthdate=String(formData.get("birthdate")??"").trim();
  const location=String(formData.get("location")??"").trim();
  const preferredPosition=String(formData.get("preferredPosition")??"").trim().toUpperCase();
  if(mobile.length>40||location.length>100)return{error:"Mobile number or location is too long."};
  if(!email||email.length>254||!/^\S+@\S+\.\S+$/.test(email))return{error:"Enter a valid email address."};
  if(birthdate&&!/^\d{4}-\d{2}-\d{2}$/.test(birthdate))return{error:"Enter a valid birthdate."};
  if(birthdate&&new Date(`${birthdate}T00:00:00Z`)>new Date())return{error:"Birthdate cannot be in the future."};
  if(preferredPosition&&!['G','SG','PG','F','PF','C'].includes(preferredPosition))return{error:"Choose a listed preferred position."};

  const supabase=await createClient();
  const {data:claims}=await supabase.auth.getClaims();
  if(!claims?.claims?.sub)return{error:"Your session expired. Log in again."};
  const {error}=await supabase.rpc("update_own_player_profile",{p_mobile:mobile||null,p_email:email,p_birthdate:birthdate||null,p_location:location||null,p_preferred_position:preferredPosition||null});
  if(error)return{error:"The profile could not be updated. Make sure the latest database migration is installed."};
  revalidatePath("/profile");revalidatePath("/captain");revalidatePath("/captain/more");revalidatePath("/captain/team");revalidatePath("/my-team");
  return{message:"Profile updated successfully."};
}
