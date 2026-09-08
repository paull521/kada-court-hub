"use client";

import { Check, ChevronRight, Landmark, Wallet } from "lucide-react";
import { useActionState } from "react";
import {
  acceptOwnerInvitationAction,
  acknowledgeOwnerDemoAction,
  registerOwnerApplicantAction,
  signOwnerContractAction,
  submitSubscriptionPaymentAction,
  type PlatformActionState,
} from "@/app/platform/actions";
import type { OwnerPaymentBilling } from "@/lib/owner-payment-ledger";
import { OwnerDemoOverview } from "@/components/OwnerDemoOverview";
import { historyPanel, historyRow } from "@/components/ui/account-classes";

const initial: PlatformActionState = {};
const money = (amount: number) => `$${amount.toFixed(2)}`;
const ownerContractPricingTerms =
  "Selected pilot conferences may receive one complimentary regular season, excluding playoffs. After the pilot, each season includes a $50 Season Subscription plus $3 for each active player registered in a division. Owners set their own league fees and handle player collections.";
const paymentTimestamp = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

export function OwnerSubscriptionPayment({
  conferenceId,
  billing,
}: {
  conferenceId: string;
  billing: OwnerPaymentBilling;
}) {
  const [state, action, pending] = useActionState(submitSubscriptionPaymentAction, initial);
  const activePlayers = billing.divisions.reduce(
    (sum, division) => sum + division.activePlayers,
    0,
  );
  const currentEntries = billing.entries.filter((entry) => !entry.label.startsWith("Legacy"));
  const playerAccess =
    currentEntries
      .filter((entry) => entry.chargeType === "platform_fee")
      .reduce((sum, entry) => sum + entry.amountCents, 0) / 100;
  const balance = currentEntries.reduce((sum, entry) => sum + entry.balanceCents, 0) / 100;
  const received = currentEntries.reduce((sum, entry) => sum + entry.paidCents, 0) / 100;
  const pendingSubmission = billing.submissions.find((item) => item.status === "pending");
  const status = pendingSubmission
    ? "Awaiting confirmation"
    : balance === 0
      ? "Paid"
      : received > 0
        ? "Partial paid"
        : "Not paid";
  const statusClass = balance === 0 ? "paid" : pendingSubmission ? "confirmation" : "partial";
  const subscriptions = currentEntries.filter((entry) => entry.chargeType === "subscription");
  const seasonSubscription = subscriptions.reduce((sum, entry) => sum + entry.amountCents, 0) / 100;
  const total = seasonSubscription + playerAccess;
  const pilotSeason =
    seasonSubscription === 0 && playerAccess === 0 && billing.divisions.length > 0;
  const pendingMessage = pendingSubmission
    ? `${pendingSubmission.method === "zelle" ? "Zelle" : "Cash"} payment of ${money(pendingSubmission.amountCents / 100)} is awaiting Platform Creator confirmation.`
    : "KCH tracks this obligation; the owner handles the transfer.";
  return (
    <>
      <details className="group overflow-hidden rounded-[16px] border border-line bg-white">
        <summary className="grid min-h-[70px] cursor-pointer list-none grid-cols-[1fr_auto_auto] items-center gap-[12px] p-[14px_16px] [&::-webkit-details-marker]:hidden">
          <span className="grid gap-[4px]">
            <b className="text-[17px]">Season Subscription</b>
            <small className="text-[12px] text-muted">
              {pilotSeason
                ? "Pilot season · no charge"
                : `${activePlayers} active players · ${money(playerAccess)} player access`}
              {pendingSubmission
                ? ` · ${pendingSubmission.method === "zelle" ? "Zelle" : "Cash"}`
                : ""}
            </small>
          </span>
          <em
            className={`text-[9px] font-[850] tracking-[0.04em] whitespace-nowrap uppercase not-italic ${statusClass === "paid" ? "text-green" : "text-[#a51118]"}`}
          >
            {pilotSeason ? "Pilot" : status}
          </em>
          <strong
            aria-hidden="true"
            className="text-[23px] transition-transform group-open:rotate-90"
          >
            <ChevronRight className="go-caret" />
          </strong>
        </summary>
        <div className="border-t border-line">
          <div className="overflow-auto [&_td]:border-b [&_td]:border-line [&_td]:p-[13px] [&_td]:text-left [&_td]:text-[11px] [&_th]:border-b [&_th]:border-line [&_th]:bg-[#08243e] [&_th]:p-[13px] [&_th]:text-left [&_th]:text-[10px] [&_th]:text-white max-[420px]:[&_td]:p-[11px_8px] max-[420px]:[&_td]:text-[10px] max-[420px]:[&_th]:p-[11px_8px] max-[420px]:[&_th]:text-[10px]">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th>ACTIVE DIVISION</th>
                  <th>ACTIVE PLAYERS</th>
                  <th>PLAYER ACCESS TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {billing.divisions.length ? (
                  billing.divisions.map((division) => (
                    <tr key={division.divisionName}>
                      <td>{division.divisionName}</td>
                      <td>{division.activePlayers}</td>
                      <td>{money(division.platformFeeCents / 100)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3}>No active divisions yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-2 gap-px bg-line max-[420px]:grid-cols-1 [&>span]:grid [&>span]:gap-[5px] [&>span]:bg-white [&>span]:p-[13px] [&_small]:text-[9px] [&_small]:font-[800] [&_small]:text-muted [&_b]:text-[12px] [&_b]:font-[700]">
            <span>
              <small>OWNER COST</small>
              <b>{money(seasonSubscription)}</b>
            </span>
            <span>
              <small>PLAYER COST</small>
              <b>{money(playerAccess)}</b>
            </span>
            <span>
              <small>RECEIVED</small>
              <b>{money(received)}</b>
            </span>
            <span>
              <small>TOTAL</small>
              <b>{money(total)}</b>
            </span>
          </div>
          <section className="m-[14px] rounded-[15px] border border-line bg-[#fbfaf8] p-[16px]">
            <header className="grid justify-items-center gap-[5px] border-b border-line pb-[13px] text-center">
              <span className="grid justify-items-center gap-[4px]">
                <small className="text-[11px] font-[900] text-navy">BALANCE DUE</small>
                <b className="text-[27px] leading-none">{money(balance)}</b>
              </span>
              <p className="m-0 text-[12px] text-muted">{pendingMessage}</p>
            </header>
            {/* NOTE: this form renders only with a balance owing and no
                submission pending, which is a state the demo data does not
                currently produce - /owner/payments returns zero forms. The
                classes below are a faithful translation of the old rules but
                no screenshot covers them. */}
            {!pendingSubmission && balance > 0 && (
              <form action={action} className="platform-form mt-[15px] grid gap-[13px]">
                <input type="hidden" name="conferenceId" value={conferenceId} />
                <label className="owner-payment-amount [&>span]:text-[10px] [&>span]:font-[850] [&>span]:tracking-[0.04em] [&>span]:text-muted">
                  <span>Amount sent</span>
                  <input
                    name="amount"
                    defaultValue={balance.toFixed(2)}
                    type="number"
                    min="0.01"
                    max={balance.toFixed(2)}
                    step="0.01"
                    required
                  />
                </label>
                <fieldset className="m-0 grid grid-cols-2 gap-[9px] border-0 p-0 [&_b]:text-[21px] [&_b]:text-blue [&_input:checked+span]:text-blue [&_input]:absolute [&_input]:opacity-0 [&_label:has(input:checked)]:border-2 [&_label:has(input:checked)]:border-navy [&_label:has(input:checked)]:bg-[#eef3f8] [&_label]:relative [&_label]:flex [&_label]:min-h-[54px] [&_label]:cursor-pointer [&_label]:items-center [&_label]:justify-center [&_label]:gap-[10px] [&_label]:rounded-[13px] [&_label]:border [&_label]:border-[#d6dbe2] [&_label]:bg-white [&_label]:p-[10px] [&_label]:text-[14px] [&_label]:font-[750] [&_label]:text-navy">
                  <legend className="col-span-full mb-px text-[10px] font-[850] tracking-[0.04em] text-muted">
                    Payment method
                  </legend>
                  <label>
                    <input type="radio" name="method" value="zelle" required />
                    <span>
                      <b>
                        <Landmark className="ui-icon" />
                      </b>{" "}
                      Zelle
                    </span>
                  </label>
                  <label>
                    <input type="radio" name="method" value="cash" required />
                    <span>
                      <b>
                        <Wallet className="ui-icon" />
                      </b>{" "}
                      Cash
                    </span>
                  </label>
                </fieldset>
                <button className="btn primary w-full" disabled={pending}>
                  {pending ? "Sending…" : "Send payment"}
                </button>
              </form>
            )}
          </section>
          {state.error && <p className="form-error">{state.error}</p>}
          {state.message && <p className="form-success">{state.message}</p>}
        </div>
      </details>
      <details className={`card owner-subscription-history ${historyPanel}`}>
        <summary>
          <b>Payment History</b>
          <strong aria-hidden="true">
            <ChevronRight className="go-caret" />
          </strong>
        </summary>
        <div className="payment-history-scroll">
          {billing.submissions.length ? (
            billing.submissions.map((submission) => (
              <div className={historyRow} key={submission.id}>
                <span>
                  {submission.status === "confirmed" ? <Check className="ui-icon" /> : "!"}
                </span>
                <span>
                  <b>{submission.method === "zelle" ? "Zelle" : "Cash"} payment</b>
                  <small>
                    {paymentTimestamp(submission.submittedAt)} · {submission.status}
                  </small>
                </span>
                <strong>{money(submission.amountCents / 100)}</strong>
              </div>
            ))
          ) : (
            <p className="empty-note">No payments have been sent yet.</p>
          )}
        </div>
      </details>
    </>
  );
}

export function AcceptOwnerInvitation({ token }: { token: string }) {
  const [state, action, pending] = useActionState(acceptOwnerInvitationAction, initial);
  return (
    <form action={action} className="card loginbox">
      <input type="hidden" name="token" value={token} />
      <p className="setup-note">
        This creates your private owner workspace. Your conference details remain visible only to
        you and your members.
      </p>
      {state.error && <p className="form-error">{state.error}</p>}
      <button className="btn primary" disabled={pending}>
        {pending ? "Opening workspace…" : "Accept invitation"}
      </button>
    </form>
  );
}
export function OwnerContractSignature({ token }: { token: string }) {
  const [s, a, p] = useActionState(signOwnerContractAction, initial);
  return (
    <form action={a} className="card loginbox">
      <input type="hidden" name="token" value={token} />
      <p className="setup-note">{ownerContractPricingTerms}</p>
      <label>
        <input type="checkbox" required /> I agree to the KCH Owner Service Agreement.
      </label>
      <label>
        Type your full legal name
        <input name="signedName" required />
      </label>
      <button className="btn primary" disabled={p}>
        {p ? "Signing…" : "Sign Agreement"}
      </button>
      {s.error && <p className="form-error">{s.error}</p>}
      {s.message && <p className="form-success">{s.message}</p>}
    </form>
  );
}
export function OwnerApplication({
  pendingApplication,
}: {
  pendingApplication: { conferenceName: string | null; acknowledgedAt: string } | null;
}) {
  const [start, startAction, starting] = useActionState(registerOwnerApplicantAction, initial);
  const [acknowledgment, acknowledgmentAction, acknowledging] = useActionState(
    acknowledgeOwnerDemoAction,
    initial,
  );
  return (
    <>
      {pendingApplication ? (
        <section className="card loginbox">
          <p className="eyebrow">APPLICATION RECEIVED</p>
          <h2>Waiting for KCH review</h2>
          <p className="setup-note">
            Your application for {pendingApplication.conferenceName || "your conference"} was
            received on {paymentTimestamp(pendingApplication.acknowledgedAt)}. KCH will create your
            owner workspace after review.
          </p>
        </section>
      ) : !start.token ? (
        <form action={startAction} className="card loginbox">
          <button className="btn primary" disabled={starting}>
            {starting ? "Starting…" : "Continue"}
          </button>
          {start.error && <p className="form-error">{start.error}</p>}
        </form>
      ) : (
        <form action={acknowledgmentAction} className="loginbox">
          <OwnerDemoOverview />
          <input type="hidden" name="ownerId" value={start.token} />
          <div className="owner-application-field">
            <label htmlFor="proposedConferenceName">Proposed conference name</label>
            <input id="proposedConferenceName" name="conferenceName" required />
          </div>
          <button className="btn primary" disabled={acknowledging}>
            {acknowledging ? "Submitting…" : "I understand"}
          </button>
          {acknowledgment.error && <p className="form-error">{acknowledgment.error}</p>}
          {acknowledgment.message && <p className="form-success">{acknowledgment.message}</p>}
        </form>
      )}
    </>
  );
}
