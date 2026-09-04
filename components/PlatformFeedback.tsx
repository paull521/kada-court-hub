"use client";
import { useActionState } from "react";
import { submitPlatformFeedbackAction, type ProfileActionState } from "@/app/profile/actions";
const initial: ProfileActionState = {};
export default function PlatformFeedback({ conferenceId }: { conferenceId: string }) {
  const [state, action, pending] = useActionState(submitPlatformFeedbackAction, initial);
  return (
    <details className="card account-disclosure platform-feedback">
      <summary>
        <span>✦</span>
        <b>Platform Feedback</b>
        <strong>›</strong>
      </summary>
      <form action={action}>
        <input type="hidden" name="conferenceId" value={conferenceId} />
        <label>
          What do you like most?
          <textarea name="liked" maxLength={500} required />
        </label>
        <label>
          What should we improve?
          <textarea name="improve" maxLength={500} required />
        </label>
        <button className="btn primary" disabled={pending}>
          {pending ? "Sending…" : "Send Feedback"}
        </button>
        {state.error && <p className="form-error">{state.error}</p>}
        {state.message && <p className="form-success">{state.message}</p>}
      </form>
    </details>
  );
}
