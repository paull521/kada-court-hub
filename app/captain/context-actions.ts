"use server";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";

export async function selectCaptainContextAction(formData:FormData){
  const registrationId=String(formData.get("registrationId")??"");
  if(/^[0-9a-f-]{36}$/i.test(registrationId))(await cookies()).set("kch_captain_registration",registrationId,{httpOnly:true,sameSite:"lax",path:"/",maxAge:60*60*24*365,secure:process.env.NODE_ENV==="production"});
  redirect("/captain");
}
