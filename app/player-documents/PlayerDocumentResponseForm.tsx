"use client";

import { useActionState, useState } from "react";
import { respondToPlayerDocumentAction, type PlayerDocumentActionState } from "./actions";
import { rulesAcknowledgment } from "@/components/ui/shared-classes";

export default function PlayerDocumentResponseForm({
  invitationId = "",
  registrationId = "",
  documentType,
  documentId,
}: {
  invitationId?: string;
  registrationId?: string;
  documentType: "rules" | "participation_agreement" | "multimedia_release";
  documentId: string;
}) {
  const [state, action, pending] = useActionState(
    respondToPlayerDocumentAction,
    {} as PlayerDocumentActionState,
  );
  const [acknowledged, setAcknowledged] = useState(false);
  const isRules = documentType === "rules";
  const isAgreement = documentType === "participation_agreement";
  return (
    <form action={action} className={rulesAcknowledgment}>
      <input type="hidden" name="invitationId" value={invitationId} />
      <input type="hidden" name="registrationId" value={registrationId} />
      <input type="hidden" name="documentType" value={documentType} />
      <input type="hidden" name="documentId" value={documentId} />
      {isRules && (
        <label className="check-row">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
          />{" "}
          I acknowledge these League Rules &amp; Discipline policies.
        </label>
      )}
      {isAgreement && (
        <label className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-[12px] text-[13px] font-[800] text-navy">
          Legal name
          <input
            name="legalName"
            className="w-full rounded-[10px] border border-line bg-white px-[12px] py-[11px] font-[inherit] text-[14px] text-navy outline-none focus:border-navy"
            autoComplete="name"
            required
          />
        </label>
      )}
      {state.error && <p className="form-error">{state.error}</p>}
      {isRules ? (
        <button name="response" value="acknowledged" className="btn primary" disabled={pending || !acknowledged}>
          {pending ? "Saving…" : "Acknowledge"}
        </button>
      ) : isAgreement ? (
        <button name="response" value="accepted" className="btn primary" disabled={pending}>
          {pending ? "Saving…" : "Accept Agreement"}
        </button>
      ) : (
        <div className="grid w-full grid-cols-2 gap-2">
          <button name="response" value="accepted" className="btn primary" disabled={pending}>
            Accept
          </button>
          <button name="response" value="declined" className="btn secondary" disabled={pending}>
            Decline
          </button>
        </div>
      )}
    </form>
  );
}
