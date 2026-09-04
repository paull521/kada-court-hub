"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ConferenceInviteState = { error?: string };
export async function claimConferenceInviteAction(
  _: ConferenceInviteState,
  formData: FormData,
): Promise<ConferenceInviteState> {
  const token = String(formData.get("token") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(token))
    return { error: "This conference invitation is not available." };
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { error: "Log in before joining this conference." };
  const { error } = await supabase.rpc("claim_conference_player_invitation", { p_token: token });
  if (error) return { error: error.message };
  revalidatePath("/home");
  revalidatePath("/owner/roster");
  redirect("/home");
}
