"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AvailabilityActionState = { error?: string; message?: string };
const uuid = /^[0-9a-f-]{36}$/i;

export async function setAvailabilityAction(
  _: AvailabilityActionState,
  formData: FormData,
): Promise<AvailabilityActionState> {
  const gameId = String(formData.get("gameId") ?? ""),
    response = String(formData.get("available") ?? "");
  if (!uuid.test(gameId) || !["yes", "no"].includes(response))
    return { error: "Choose Yes or No." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_game_availability", {
    p_game_id: gameId,
    p_available: response === "yes",
  });
  if (error)
    return {
      error: error.message.includes("function")
        ? "Install the Captain workspace SQL first."
        : error.message,
    };
  revalidatePath("/home");
  revalidatePath("/my-team");
  revalidatePath("/schedule");
  revalidatePath("/captain");
  revalidatePath("/captain/team");
  revalidatePath("/captain/availability");
  return {
    message:
      response === "yes"
        ? "You are marked available."
        : "Your team can now see that you are unavailable.",
  };
}
