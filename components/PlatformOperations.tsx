"use client";

import { ChevronRight } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import {
  confirmSubscriptionAction,
  confirmSupportRequestAction,
  createOwnerConferenceAction,
  markSupportRequestFixedAction,
  requestSupportAction,
  setOwnerStatusAction,
  type PlatformActionState,
} from "@/app/platform/actions";
import type { PlatformOperations } from "@/lib/platform-data";
import type { PlatformOwnerPaymentBilling } from "@/lib/owner-payment-ledger";

const initial: PlatformActionState = {};
const timestamp = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

export function OwnerManagement({
  owners,
  candidates,
}: {
  owners: PlatformOperations["owners"];
  candidates: PlatformOperations["candidates"];
}) {
  const [link, setLink] = useState(""),
    [copied, setCopied] = useState(false);
  useEffect(() => setLink(`${window.location.origin}/platform/owner-invitation`), []);
  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  return (
    <>
      <section className="card platform-operation platform-invite-owner">
        <p className="eyebrow">INVITE NEW OWNER</p>
        <button type="button" className="btn secondary" onClick={copy}>
          {copied ? "Copied!" : "Owner Invitation Link"}
        </button>
      </section>
      <section className="card platform-operation">
        <p className="eyebrow">CREATE NEW OWNER</p>
        <h2>Create New Owner</h2>
        {candidates.length ? (
          candidates.map((candidate) => <CandidateCard candidate={candidate} key={candidate.id} />)
        ) : (
          <p className="empty-note">No completed owner applications.</p>
        )}
      </section>
      <section className="card platform-operation">
        <p className="eyebrow">OWNER MANAGEMENT</p>
        <h2>Owner Management</h2>
        {owners.length ? (
          owners.map((owner) => <OwnerCard owner={owner} key={owner.id} />)
        ) : (
          <p className="empty-note">No conference owners.</p>
        )}
      </section>
    </>
  );
}

function CandidateCard({ candidate }: { candidate: PlatformOperations["candidates"][number] }) {
  const [state, action, pending] = useActionState(createOwnerConferenceAction, initial);
  return (
    <form action={action} className="owner-form platform-candidate">
      <input type="hidden" name="ownerId" value={candidate.id} />
      <div>
        <b>{candidate.name}</b>
        <small>
          {candidate.email} · {candidate.phone}
        </small>
        <small>Proposed conference: {candidate.proposedConferenceName || "Not provided"}</small>
        <small>Demo overview accepted: {timestamp(candidate.demoAcknowledgedAt)}</small>
      </div>
      <label>
        Conference name
        <input
          name="conferenceName"
          defaultValue={candidate.proposedConferenceName ?? ""}
          required
        />
      </label>
      <button className="btn primary" disabled={pending}>
        {pending ? "Creating…" : "Create owner & conference"}
      </button>
      {state.error && <p className="form-error">{state.error}</p>}
      {state.message && <p className="form-success">{state.message}</p>}
    </form>
  );
}

function OwnerCard({ owner }: { owner: PlatformOperations["owners"][number] }) {
  const [state, action, pending] = useActionState(setOwnerStatusAction, initial);
  const status = owner.status;
  return (
    <section className="platform-owner-row">
      <div className="platform-owner-details">
        <span>
          <small>OWNER NAME</small>
          {owner.name}
        </span>
        <span>
          <small>CONFERENCE NAME</small>
          {owner.conferenceName ?? "Not assigned"}
        </span>
        <span>
          <small>EMAIL</small>
          {owner.email || "—"}
        </span>
        <span>
          <small>PHONE</small>
          {owner.phone || "—"}
        </span>
        <span>
          <small>SUBSCRIPTION DATE</small>
          {owner.subscriptionStartsOn ?? "—"}
        </span>
        <span>
          <small>DEMO OVERVIEW ACCEPTED</small>
          {owner.demoAcknowledgedAt ? timestamp(owner.demoAcknowledgedAt) : "—"}
        </span>
      </div>
      <form action={action} className="platform-status-actions">
        <input type="hidden" name="ownerId" value={owner.id} />
        <button
          className={`btn secondary ${status === "active" ? "selected active" : ""}`}
          name="status"
          value="active"
          disabled={pending}
        >
          Active
        </button>
        <button
          className={`btn secondary ${status === "suspended" ? "selected suspended" : ""}`}
          name="status"
          value="suspended"
          disabled={pending}
        >
          Suspend
        </button>
        <button
          className={`btn secondary ${status === "inactive" ? "selected inactive" : ""}`}
          name="status"
          value="inactive"
          disabled={pending}
        >
          Inactive
        </button>
      </form>
      {state.error && <p className="form-error">{state.error}</p>}
      {state.message && <p className="form-success">{state.message}</p>}
    </section>
  );
}

export function ConferenceDirectory({ rows }: { rows: PlatformOperations["directory"] }) {
  return (
    <div className="card platform-table">
      <table>
        <thead>
          <tr>
            <th>Conference</th>
            <th>
              Divisions
              <br />A / I
            </th>
            <th>
              Players
              <br />A / I
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.conference}>
              <td>{row.conference}</td>
              <td>
                {row.activeDivisions} / {row.inactiveDivisions}
              </td>
              <td>
                {row.activePlayers} / {row.inactivePlayers}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const paymentTimestamp = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
export function OwnerPayments({ records }: { records: PlatformOwnerPaymentBilling[] }) {
  return (
    <section className="platform-owner-payment-list">
      {records.length ? (
        records.map((record) => {
          const entries = record.billing.entries.filter((item) => !item.label.startsWith("Legacy")),
            submissions = record.billing.submissions,
            pending = submissions.find((item) => item.status === "pending"),
            balance = entries.reduce((sum, item) => sum + item.balanceCents, 0),
            received = entries.reduce((sum, item) => sum + item.paidCents, 0),
            playerAccess = entries
              .filter((item) => item.chargeType === "platform_fee")
              .reduce((sum, item) => sum + item.amountCents, 0),
            seasonSubscription = entries
              .filter((item) => item.chargeType === "subscription")
              .reduce((sum, item) => sum + item.amountCents, 0),
            status = pending
              ? "Awaiting confirmation"
              : balance === 0
                ? "Paid"
                : received > 0
                  ? "Partial paid"
                  : "Not paid",
            statusClass = balance === 0 ? "paid" : pending ? "confirmation" : "partial";
          return (
            <details className="card platform-owner-payment" key={record.conferenceId}>
              <summary>
                <span>
                  <b>{record.conferenceName}</b>
                  <small>
                    {money(received)} received · {money(balance)} due
                  </small>
                </span>
                <em className={statusClass}>{status}</em>
                <strong aria-hidden="true">
                  <ChevronRight className="go-caret" />
                </strong>
              </summary>
              <div>
                <p className="platform-payment-contact">
                  <b>{record.ownerName}</b>
                  <span>{record.phone}</span>
                  <span>{record.email}</span>
                </p>
                <div className="platform-payment-breakdown">
                  <span>
                    Owner Cost <b>{money(seasonSubscription)}</b>
                  </span>
                  <span>
                    Player Cost <b>{money(playerAccess)}</b>
                  </span>
                  <span>
                    Received <b>{money(received)}</b>
                  </span>
                  <span>
                    <b>Balance Due</b>
                    <strong>{money(balance)}</strong>
                  </span>
                </div>
                {submissions.length > 0 && (
                  <section className="platform-payment-history">
                    <b>Payment History</b>
                    {submissions.map((submission) => (
                      <p key={submission.id}>
                        <span>
                          {submission.method === "zelle" ? "Zelle" : "Cash"} ·{" "}
                          {paymentTimestamp(submission.submittedAt)} · {submission.status}
                        </span>
                        <strong>{money(submission.amountCents)}</strong>
                      </p>
                    ))}
                  </section>
                )}
                {pending && <PaymentConfirmation submissionId={pending.id} />}
              </div>
            </details>
          );
        })
      ) : (
        <p className="empty-note">No owner payment ledgers are available yet.</p>
      )}
    </section>
  );
}
function PaymentConfirmation({ submissionId }: { submissionId: string }) {
  const [state, action, pending] = useActionState(confirmSubscriptionAction, initial);
  return (
    <form action={action}>
      <input type="hidden" name="submissionId" value={submissionId} />
      <button className="btn primary" disabled={pending}>
        {pending ? "Confirming…" : "Confirm payment"}
      </button>
      {state.error && <p className="form-error">{state.error}</p>}
      {state.message && <p className="form-success">{state.message}</p>}
    </form>
  );
}
/** Both support disclosures hide their marker and own their row layout. */
const supportSummary = "cursor-pointer list-none [&::-webkit-details-marker]:hidden";
/** The chevron that turns when its <details> opens. */
const supportCaret = "text-[23px] leading-none transition-transform group-open:rotate-90";
/**
 * The status pill. Keyed on the same names the CSS matched on, so a status it
 * never had a colour for still falls through to the same green default.
 */
const statusTone: Record<string, string> = {
  open: "bg-[#fff4da] text-[#8a5900]",
  resolved: "bg-[#edf2f7] text-[#3a526c]",
};
const statusPill =
  "rounded-full px-[6px] py-[4px] text-[9px] font-[850] whitespace-nowrap not-italic";

function SupportRequestRow({ request }: { request: PlatformOperations["support"][number] }) {
  const [confirmState, confirmAction, confirming] = useActionState(
      confirmSupportRequestAction,
      initial,
    ),
    [fixedState, fixedAction, fixing] = useActionState(markSupportRequestFixedAction, initial);
  const status =
    request.status === "open"
      ? "Awaiting confirmation"
      : request.status === "received"
        ? "Received"
        : "Fixed";
  return (
    <details className="group overflow-hidden rounded-[12px] border border-line bg-white">
      <summary
        className={`${supportSummary} grid grid-cols-[minmax(0,1fr)_auto_20px] items-center gap-[8px] p-[12px]`}
      >
        <b className="truncate text-[13px]">{request.subject}</b>
        <em className={`${statusPill} ${statusTone[request.status] ?? "bg-[#eaf6ec] text-green"}`}>
          {status}
        </em>
        <strong aria-hidden="true" className={supportCaret}>
          <ChevronRight className="go-caret" />
        </strong>
      </summary>
      <div className="grid gap-[10px] border-t border-line px-[12px] pb-[12px]">
        <p className="m-0 pt-[11px] text-[13px] leading-[1.45] text-[#314056]">{request.message}</p>
        {request.status === "open" && (
          <form action={confirmAction} className="grid gap-[8px]">
            <input type="hidden" name="requestId" value={request.id} />
            <button
              className="btn secondary px-[13px]! py-[9px]! text-[12px] justify-self-start"
              disabled={confirming}
            >
              {confirming ? "Confirming…" : "Confirm received"}
            </button>
            {confirmState.error && <p className="form-error">{confirmState.error}</p>}
          </form>
        )}
        {request.status === "received" && (
          <form action={fixedAction} className="grid gap-[8px]">
            <input type="hidden" name="requestId" value={request.id} />
            <button
              className="btn primary px-[13px]! py-[9px]! text-[12px] justify-self-start"
              disabled={fixing}
            >
              {fixing ? "Marking…" : "Mark fixed"}
            </button>
            {fixedState.error && <p className="form-error">{fixedState.error}</p>}
          </form>
        )}
      </div>
    </details>
  );
}
export function SupportRequests({
  requests,
  feedback,
}: {
  requests: PlatformOperations["support"];
  feedback: PlatformOperations["feedback"];
}) {
  const conferences = [...new Set(requests.map((request) => request.conferenceName))],
    feedbackConferences = [...new Set(feedback.map((item) => item.conferenceName))];
  return (
    <section className="platform-list">
      <section className="card platform-operation grid gap-[13px]">
        <p className="eyebrow">CUSTOMER REQUESTS</p>
        <h2>Requests by Conference</h2>
        {conferences.length ? (
          conferences.map((conference) => {
            const conferenceRequests = requests.filter(
              (request) => request.conferenceName === conference,
            );
            return (
              <details className="group border-t border-line" key={conference}>
                <summary
                  className={`${supportSummary} grid grid-cols-[1fr_auto] items-center gap-[12px] py-[13px]`}
                >
                  <span className="grid gap-[3px]">
                    <b className="text-[15px]">{conference}</b>
                    <small className="text-[11px] text-muted">
                      {conferenceRequests.length} request
                      {conferenceRequests.length === 1 ? "" : "s"}
                    </small>
                  </span>
                  <strong aria-hidden="true" className={supportCaret}>
                    <ChevronRight className="go-caret" />
                  </strong>
                </summary>
                <div className="grid gap-[8px] pb-[13px]">
                  {conferenceRequests.map((request) => (
                    <SupportRequestRow request={request} key={request.id} />
                  ))}
                </div>
              </details>
            );
          })
        ) : (
          <p className="empty-note">No customer requests.</p>
        )}
      </section>
      <section className="card platform-operation grid gap-[13px]">
        <p className="eyebrow">PLATFORM FEEDBACK</p>
        <h2>Feedback by Conference</h2>
        {feedbackConferences.length ? (
          feedbackConferences.map((conference) => {
            const items = feedback.filter((item) => item.conferenceName === conference);
            return (
              <details className="group border-t border-line" key={conference}>
                <summary
                  className={`${supportSummary} grid grid-cols-[1fr_auto] items-center gap-[12px] py-[13px]`}
                >
                  <span className="grid gap-[3px]">
                    <b className="text-[15px]">{conference}</b>
                    <small className="text-[11px] text-muted">
                      {items.length} feedback item{items.length === 1 ? "" : "s"}
                    </small>
                  </span>
                  <strong aria-hidden="true" className={supportCaret}>
                    <ChevronRight className="go-caret" />
                  </strong>
                </summary>
                <div className="grid gap-[8px] pb-[13px]">
                  {items.map((item) => (
                    <details
                      className="group overflow-hidden rounded-[12px] border border-line bg-white"
                      key={item.id}
                    >
                      <summary
                        className={`${supportSummary} grid grid-cols-[minmax(0,1fr)_auto_20px] items-center gap-[8px] p-[12px]`}
                      >
                        <b className="truncate text-[13px]">{item.playerName}</b>
                        <em className={`${statusPill} bg-[#eaf6ec] text-green`}>Feedback</em>
                        <strong aria-hidden="true" className={supportCaret}>
                          <ChevronRight className="go-caret" />
                        </strong>
                      </summary>
                      <div className="grid gap-[10px] border-t border-line px-[12px] pb-[12px]">
                        <p className="m-0 pt-[11px] text-[13px] leading-[1.45] text-[#314056]">
                          {item.message}
                        </p>
                      </div>
                    </details>
                  ))}
                </div>
              </details>
            );
          })
        ) : (
          <p className="empty-note">No platform feedback yet.</p>
        )}
      </section>
    </section>
  );
}
export function OwnerSupportRequest({
  conferenceId,
  history,
}: {
  conferenceId: string;
  history: Array<{
    id: string;
    subject: string;
    message: string;
    status: string;
    createdAt: string;
  }>;
}) {
  const [s, a, p] = useActionState(requestSupportAction, initial);
  return (
    <details className="card account-disclosure owner-support-request">
      <summary>
        <span>?</span>
        <b>Request Support</b>
        <strong aria-hidden="true">
          <ChevronRight className="go-caret" />
        </strong>
      </summary>
      <form action={a}>
        <input type="hidden" name="conferenceId" value={conferenceId} />
        <label>
          Subject
          <input name="subject" maxLength={120} required />
        </label>
        <label>
          Message
          <textarea name="message" maxLength={1000} required />
        </label>
        <button className="btn primary" disabled={p}>
          {p ? "Sending…" : "Send Request"}
        </button>
        {s.error && <p className="form-error">{s.error}</p>}
        {s.message && <p className="form-success">{s.message}</p>}
      </form>
      {history.length > 0 && (
        <section className="owner-support-history">
          <b>Request History</b>
          {history.map((request) => (
            <article key={request.id}>
              <header>
                <span>{request.subject}</span>
                <em>
                  {request.status === "resolved"
                    ? "Fixed"
                    : request.status === "received"
                      ? "Received"
                      : "Sent"}
                </em>
              </header>
              <p>{request.message}</p>
            </article>
          ))}
        </section>
      )}
    </details>
  );
}
