import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Request-scoped memoisation of "who is asking".
 *
 * React's cache() lives for a single render pass, so nothing here is shared
 * between requests or between users. That is what makes it safe for
 * RLS-scoped data, unlike a cross-request cache such as "use cache", where a
 * per-user row could be served to the wrong viewer.
 *
 * Pages that render a role switcher call both getAvailableRoles() and a portal
 * data function, and each of those used to resolve the signed-in player
 * independently - the same auth check and the same player_profiles row, twice
 * per request.
 */
export type SessionPlayer = {
  id: string;
  public_player_id: string;
  display_name: string | null;
  email: string | null;
  preferred_uniform_size: string | null;
  preferred_position: string | null;
};

export const getSessionUserId = cache(async (): Promise<string | undefined> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub;
});

export const getSessionPlayer = cache(async (): Promise<SessionPlayer | null> => {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("player_profiles")
    .select("id,public_player_id,display_name,email,preferred_uniform_size,preferred_position")
    .eq("profile_id", userId)
    .maybeSingle();
  return (data as SessionPlayer | null) ?? null;
});
