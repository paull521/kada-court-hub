"use server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { CAPTAIN_ROLE_LABELS, CAPTAIN_REGISTRATION_STATUS } from "@/lib/roles";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function switchCaptainContextAction(
  registrationId: string,
): Promise<{ error?: string }> {
  if (!uuidPattern.test(registrationId)) return { error: "That team is not available." };
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { error: "Please log in again." };
  const { data: player } = await supabase
    .from("player_profiles")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();
  if (!player) return { error: "Player profile not found." };
  const { data: registration } = await supabase
    .from("registrations")
    .select("id")
    .eq("id", registrationId)
    .eq("player_id", player.id)
    .in("role_label", CAPTAIN_ROLE_LABELS)
    .not("team_id", "is", null)
    .eq("status", CAPTAIN_REGISTRATION_STATUS)
    .maybeSingle();
  if (!registration) return { error: "That captain team is no longer available." };
  (await cookies()).set("kch_captain_registration", registration.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  });
  return {};
}
