"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export type JoinState = { error?: string; message?: string };
export async function joinDivisionAction(_: JoinState, formData: FormData): Promise<JoinState> {
  const divisionId = String(formData.get("divisionId") ?? "");
  const supabase = await createClient();
  const { data: invitationId, error } = await supabase.rpc("prepare_division_join_from_link", {
    p_division_id: divisionId,
  });
  if (error) return { error: error.message };
  revalidatePath("/home");
  redirect(`/rules?invitation=${invitationId}`);
}
