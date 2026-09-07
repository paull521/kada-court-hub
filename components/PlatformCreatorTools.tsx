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
      <details className="monthly-subscription-dropdown">
        <summary>
          <span>
            <b>Season Subscription</b>
            <small>
              {pilotSeason
                ? "Pilot season · no charge"
                : `${activePlayers} active players · ${money(playerAccess)} player access`}
              {pendingSubmission
                ? ` · ${pendingSubmission.method === "zelle" ? "Zelle" : "Cash"}`
                : ""}
            </small>
          </span>
          <em className={`owner-subscription-status ${statusClass}`}>
            {pilotSeason ? "Pilot" : status}
          </em>
          <strong aria-hidden="true">
            <ChevronRight className="go-caret" />
          </strong>
        </summary>
        <div className="monthly-subscription-body">
          <div className="owner-platform-table-wrap">
            <table>
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
          <div className="owner-platform-breakdown">
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
          <section className="owner-platform-balance">
            <header>
              <span>
                <small>BALANCE DUE</small>
                <b>{money(balance)}</b>
              </span>
              <p>{pendingMessage}</p>
            </header>
            {!pendingSubmission && balance > 0 && (
              <form action={action} className="platform-form">
                <input type="hidden" name="conferenceId" value={conferenceId} />
                <label className="owner-payment-amount">
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
                <fieldset className="method-choice owner-payment-methods">
                  <legend>Payment method</legend>
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
                <button className="btn primary" disabled={pending}>
                  {pending ? "Sending…" : "Send payment"}
                </button>
              </form>
            )}
          </section>
          {state.error && <p className="form-error">{state.error}</p>}
          {state.message && <p className="form-success">{state.message}</p>}
        </div>
      </details>
      <details className="card payment-history-panel owner-subscription-history">
        <summary>
          <b>Payment History</b>
          <strong aria-hidden="true">
            <ChevronRight className="go-caret" />
          </strong>
        </summary>
        <div className="payment-history-scroll">
          {billing.submissions.length ? (
            billing.submissions.map((submission) => (
              <div className="payment-history-row" key={submission.id}>
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
          <p className="setup-note">
            Use KCH to apply to run your basketball conference. KCH will review your application
            before creating your owner workspace.
          </p>
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
