"use client";
import { ChevronRight, Sparkles } from "lucide-react";
import { useActionState } from "react";
import { submitPlatformFeedbackAction, type ProfileActionState } from "@/app/profile/actions";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { accountDisclosure, accountRow } from "@/components/ui/account-classes";
const initial: ProfileActionState = {};

/**
 * The disclosure keeps `card account-disclosure`, which is what draws it and
 * lays out the summary - account-disclosure is shared with two other
 * components and stays as CSS. The `platform-feedback` class it also carried
 * only restated what `.card` already said: the same border, background, radius
 * and shadow, on an element that had both.
 */
export default function PlatformFeedback({ conferenceId }: { conferenceId: string }) {
  const [state, action, pending] = useActionState(submitPlatformFeedbackAction, initial);
  return (
    <details className={`card ${accountDisclosure}`}>
      <summary className={accountRow}>
        <span>
          <Sparkles className="ui-icon" />
        </span>
        <b>Platform Feedback</b>
        <strong aria-hidden="true">
          <ChevronRight className="go-caret" />
        </strong>
      </summary>
      <form action={action} className="grid gap-[10px] border-t border-line p-[17px]">
        <input type="hidden" name="conferenceId" value={conferenceId} />
        <label className="grid gap-[7px] text-[13px] font-[800]">
          What do you like most?
          <textarea
            name="liked"
            maxLength={500}
            required
            className="min-h-[96px] w-full resize-y rounded-[11px] border border-[#d6dbe2] bg-white p-[11px] [font:inherit]"
          />
        </label>
        <label className="grid gap-[7px] text-[13px] font-[800]">
          What should we improve?
          <textarea
            name="improve"
            maxLength={500}
            required
            className="min-h-[96px] w-full resize-y rounded-[11px] border border-[#d6dbe2] bg-white p-[11px] [font:inherit]"
          />
        </label>
        <Button disabled={pending} className="min-h-[44px] justify-self-start">
          {pending ? "Sending…" : "Send Feedback"}
        </Button>
        {state.error && <FormMessage tone="error">{state.error}</FormMessage>}
        {state.message && <FormMessage tone="success">{state.message}</FormMessage>}
      </form>
    </details>
  );
}
