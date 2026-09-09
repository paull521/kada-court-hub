"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type PlayerDocumentActionState = { error?: string };

const validId = (value: string) => /^[0-9a-f-]{36}$/i.test(value);

export async function respondToPlayerDocumentAction(
  _: PlayerDocumentActionState,
  formData: FormData,
): Promise<PlayerDocumentActionState> {
  const invitationId = String(formData.get("invitationId") ?? "");
  const registrationId = String(formData.get("registrationId") ?? "");
  const documentType = String(formData.get("documentType") ?? "");
  const documentId = String(formData.get("documentId") ?? "");
  const response = String(formData.get("response") ?? "");
  const legalName = String(formData.get("legalName") ?? "");
  if ((!validId(invitationId) && !validId(registrationId)) || !validId(documentId))
    return { error: "This player document is not available." };
  const supabase = await createClient();
  const { data: complete, error } = await supabase.rpc("respond_to_player_document", {
    p_invitation_id: validId(invitationId) ? invitationId : null,
    p_registration_id: validId(registrationId) ? registrationId : null,
    p_document_type: documentType,
    p_document_id: documentId,
    p_response: response,
    p_legal_name: legalName || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/home");
  revalidatePath("/profile");
  revalidatePath("/player-documents");
  if (complete && validId(invitationId)) redirect("/home");
  const scope = validId(invitationId)
    ? `invitation=${encodeURIComponent(invitationId)}`
    : `registration=${encodeURIComponent(registrationId)}`;
  redirect(`/player-documents?${scope}`);
}
