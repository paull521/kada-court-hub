"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function markNotificationReadAction(
  notificationId: string,
): Promise<{ error?: string }> {
  if (!uuidPattern.test(notificationId)) return { error: "Notification not found." };
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { error: "Please log in again." };
  const { error } = await supabase.rpc("mark_notification_read", {
    p_notification_id: notificationId,
  });
  if (error)
    return {
      error: error.message.includes("function")
        ? "Install the latest notification SQL, then try again."
        : error.message,
    };
  revalidatePath("/", "layout");
  return {};
}

export async function markAllNotificationsReadAction(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { error: "Please log in again." };
  const { error } = await supabase.rpc("mark_all_notifications_read");
  if (error)
    return {
      error: error.message.includes("function")
        ? "Install the latest notification SQL, then try again."
        : error.message,
    };
  revalidatePath("/", "layout");
  return {};
}
