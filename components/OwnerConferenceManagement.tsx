"use client";

import { useActionState } from "react";
import {
  createTestConferenceAction,
  selectOwnerConferenceAction,
  type OwnerActionState,
} from "@/app/owner/actions";
import type { OwnerConferenceOption } from "@/lib/owner-data";
import { ownerForm } from "@/components/ui/shared-classes";

const initialState: OwnerActionState = {};

export default function OwnerConferenceManagement({
  currentId,
  conferences,
}: {
  currentId: string;
  conferences: OwnerConferenceOption[];
}) {
  const [state, action, pending] = useActionState(createTestConferenceAction, initialState);
  return (
    <section className="grid gap-[26px]">
      <div className="card p-[20px] [&>h2]:m-[0_0_7px] [&>h2]:text-[22px]">
        <p className="eyebrow">CLEAN TEST</p>
        <h2>Create a Test Conference</h2>
        <p className="m-[0_0_18px] text-[14px] leading-[1.55] text-muted">
          This creates a separate conference and loads 150 fictional players. You will create its
          season, division, teams, fees, and uniforms through the normal owner workflow.
        </p>
        <form
          action={action}
          className={`${ownerForm} mt-0 [&>small]:text-center [&>small]:text-[10px] [&>small]:leading-[1.4] [&>small]:text-muted`}
        >
          <label>
            Conference name
            <input name="name" defaultValue="KCH Owner Simulation" maxLength={80} required />
          </label>
          <label>
            Timezone
            <select name="timezone" defaultValue="America/Los_Angeles">
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/New_York">Eastern Time</option>
            </select>
          </label>
          {state.error && <p className="form-error">{state.error}</p>}
          <button className="btn primary" disabled={pending}>
            {pending ? "Creating 150 test players…" : "Create Test Conference"}
          </button>
          <small>No real email or text messages will be sent to the fictional contacts.</small>
        </form>
      </div>
      <section className="[&>h2]:m-[0_0_7px] [&>h2]:text-[22px]">
        <p className="eyebrow">YOUR CONFERENCES</p>
        <h2>Switch Conference</h2>
        <div className="grid gap-[9px]">
          {conferences.map((conference) => (
            <form
              action={selectOwnerConferenceAction}
              key={conference.id}
              // border- and bg- shout because .card sets both unlayered; the
              // button's three do because .btn does.
              className={`card grid min-h-[76px] grid-cols-[minmax(0,1fr)_auto] items-center gap-[10px] p-[12px_13px] ${
                conference.id === currentId ? "border-[#cce6d0]! bg-[#f3faf4]!" : ""
              }`}
            >
              <input type="hidden" name="conferenceId" value={conference.id} />
              <span className="grid min-w-0 gap-[5px]">
                <b className="text-[15px]">{conference.name}</b>
                <small className="text-[10px] text-muted">
                  {conference.id === currentId ? "Currently selected" : "Open this owner workspace"}
                </small>
              </span>
              <button
                className={`btn secondary min-h-[42px] px-[12px]! py-[8px]! ${
                  conference.id === currentId ? "border-[#cce6d0]! bg-white! text-green!" : ""
                }`}
                disabled={conference.id === currentId}
              >
                {conference.id === currentId ? "Selected" : "Switch"}
              </button>
            </form>
          ))}
        </div>
      </section>
    </section>
  );
}
