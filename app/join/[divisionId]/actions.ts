"use server";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";
export type JoinState={error?:string;message?:string};
export async function joinDivisionAction(_: JoinState,formData:FormData):Promise<JoinState>{const divisionId=String(formData.get("divisionId")??"");const supabase=await createClient();const {error}=await supabase.rpc("join_division_from_link",{p_division_id:divisionId});if(error)return{error:error.message};revalidatePath("/home");revalidatePath("/owner/setup");return{message:"You are joining this division. Open Home to view your invitation."}}
