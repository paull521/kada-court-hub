import "server-only";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type AvailableRoles = { player: boolean; captain: boolean; owner: boolean };
export async function getAvailableRoles(): Promise<AvailableRoles> {
  await connection();
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return { player: false, captain: false, owner: false };
  const [{ data: player }, { data: owner }] = await Promise.all([
    supabase.from("player_profiles").select("id").eq("profile_id", userId).maybeSingle(),
    supabase
      .from("conference_memberships")
      .select("id")
      .eq("profile_id", userId)
      .eq("role", "owner")
      .limit(1)
      .maybeSingle(),
  ]);
  let captain = false;
  if (player) {
    const { data } = await supabase
      .from("registrations")
      .select("id")
      .eq("player_id", player.id)
      .in("role_label", ["Captain", "Co-captain"])
      .in("status", ["active", "pending"])
      .limit(1)
      .maybeSingle();
    captain = Boolean(data);
  }
  return { player: Boolean(player), captain, owner: Boolean(owner) };
}
