"use client";

import { useActionState } from "react";
import { createRosterRequestAction, type CaptainActionState } from "@/app/captain/actions";
import type { CaptainPortalData } from "@/lib/captain-data";
import { ownerForm } from "@/components/ui/shared-classes";

const initialState: CaptainActionState = {};
export default function CaptainRequestForm({
  data,
  enabled,
}: {
  data: CaptainPortalData;
  enabled: boolean;
}) {
  const [state, action, pending] = useActionState(createRosterRequestAction, initialState);
  return (
    <form
      action={action}
      // gap and the stretch need `!`: .owner-form is unlayered and sets its own
      // grid gap, which is why the old rule carried !important too.
      className={`${ownerForm} grid grid-cols-1 items-stretch! gap-[12px]! [&_.btn]:min-h-[48px] [&_.btn]:w-full [&_label]:grid [&_label]:w-full [&_label]:gap-[6px] [&_label]:text-[12px] [&_label]:font-[800] [&_textarea]:min-h-[86px]! [&_textarea]:w-full [&_textarea]:resize-y`}
    >
      <input type="hidden" name="teamId" value={data.teamId} />
      <label>
        Request type
        <select name="requestType" defaultValue="trade">
          <option value="trade">Trade</option>
          <option value="add_player">Add player</option>
          <option value="remove_player">Remove player</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label>
        Request details
        <textarea
          name="details"
          rows={3}
          maxLength={1000}
          placeholder="Briefly explain the change."
          required
        />
      </label>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="form-success" role="status">
          {state.message}
        </p>
      )}
      <button className="btn primary" disabled={pending || !enabled}>
        {pending ? "Sending…" : enabled ? "Send Request" : "Available After Draft Publication"}
      </button>
    </form>
  );
}
