"use server";

import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";

export type PreferenceActionState={error?:string;message?:string};

export async function updateNotificationPreferencesAction(_:PreferenceActionState,formData:FormData):Promise<PreferenceActionState>{
  const supabase=await createClient();
  const {data:claims}=await supabase.auth.getClaims();
  if(!claims?.claims?.sub)return{error:"Please log in again."};
  const {error}=await supabase.rpc("update_notification_preferences",{p_game_updates:formData.get("gameUpdates")==="on",p_team_updates:formData.get("teamUpdates")==="on",p_payment_updates:formData.get("paymentUpdates")==="on",p_season_updates:formData.get("seasonUpdates")==="on"});
  if(error)return{error:error.message.includes("function")?"Install the latest notification-preferences SQL, then try again.":error.message};
  revalidatePath("/profile");revalidatePath("/","layout");
  return{message:"Notification preferences saved."};
}
