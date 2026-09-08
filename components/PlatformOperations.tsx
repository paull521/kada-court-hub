"use client";

import { ChevronRight } from "lucide-react";
import { FormMessage } from "@/components/ui/FormMessage";
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
import { accountDisclosure, accountRow } from "@/components/ui/account-classes";
import { emptyNote, ownerForm } from "@/components/ui/shared-classes";

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
      {/* Three of these have to shout. .btn sets the button's padding, and
          .eyebrow sets a 12px bottom margin on the <p> that .platform-operation
          p used to flatten - all unlayered, all beating a layered utility. */}
      <section className="card grid gap-[12px] p-[18px_20px] mb-[12px] [&_h2]:m-0! [&_p]:m-0!">
        <p className="eyebrow">INVITE NEW OWNER</p>
        <button
          type="button"
          className="btn secondary w-[calc(100%_-_24px)] justify-self-center px-[14px]! py-[12px]! text-[12px]!"
          onClick={copy}
        >
          {copied ? "Copied!" : "Owner Invitation Link"}
        </button>
      </section>
      <section className="card p-[16px] mb-[12px] [&_h2]:m-0! [&_p]:m-0!">
        <p className="eyebrow">CREATE NEW OWNER</p>
        <h2>Create New Owner</h2>
        {candidates.length ? (
          candidates.map((candidate) => <CandidateCard candidate={candidate} key={candidate.id} />)
        ) : (
          <p className={emptyNote}>No completed owner applications.</p>
        )}
      </section>
      <section className="card p-[16px] mb-[12px] [&_h2]:m-0! [&_p]:m-0!">
        <p className="eyebrow">OWNER MANAGEMENT</p>
        <h2>Owner Management</h2>
        {owners.length ? (
          owners.map((owner) => <OwnerCard owner={owner} key={owner.id} />)
        ) : (
          <p className={emptyNote}>No conference owners.</p>
        )}
      </section>
    </>
  );
}

function CandidateCard({ candidate }: { candidate: PlatformOperations["candidates"][number] }) {
  const [state, action, pending] = useActionState(createOwnerConferenceAction, initial);
  return (
    <form action={action} className={`${ownerForm} platform-candidate`}>
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
    <section className="grid gap-[11px] border-t border-line py-[14px]">
      <div className="grid grid-cols-5 gap-[9px] max-mid:grid-cols-2">
        <span className="grid min-w-0 gap-[4px] text-[12px] [overflow-wrap:anywhere] max-mid:col-span-full">
          <small className="text-[8px] font-[850] text-muted">OWNER NAME</small>
          {owner.name}
        </span>
        <span className="grid min-w-0 gap-[4px] text-[12px] [overflow-wrap:anywhere]">
          <small className="text-[8px] font-[850] text-muted">CONFERENCE NAME</small>
          {owner.conferenceName ?? "Not assigned"}
        </span>
        <span className="grid min-w-0 gap-[4px] text-[12px] [overflow-wrap:anywhere]">
          <small className="text-[8px] font-[850] text-muted">EMAIL</small>
          {owner.email || "—"}
        </span>
        <span className="grid min-w-0 gap-[4px] text-[12px] [overflow-wrap:anywhere]">
          <small className="text-[8px] font-[850] text-muted">PHONE</small>
          {owner.phone || "—"}
        </span>
        <span className="grid min-w-0 gap-[4px] text-[12px] [overflow-wrap:anywhere]">
          <small className="text-[8px] font-[850] text-muted">SUBSCRIPTION DATE</small>
          {owner.subscriptionStartsOn ?? "—"}
        </span>
        <span className="grid min-w-0 gap-[4px] text-[12px] [overflow-wrap:anywhere]">
          <small className="text-[8px] font-[850] text-muted">DEMO OVERVIEW ACCEPTED</small>
          {owner.demoAcknowledgedAt ? timestamp(owner.demoAcknowledgedAt) : "—"}
        </span>
      </div>
      <form
        action={action}
        className="grid grid-cols-3 gap-[7px] [&_.btn]:p-[9px_4px]! [&_.btn]:text-[11px]!"
      >
        <input type="hidden" name="ownerId" value={owner.id} />
        <button
          className={`btn secondary ${status === "active" ? "bg-navy! border-navy! text-white!" : ""}`}
          name="status"
          value="active"
          disabled={pending}
        >
          Active
        </button>
        <button
          className={`btn secondary ${status === "suspended" ? "bg-red! border-red! text-white!" : ""}`}
          name="status"
          value="suspended"
          disabled={pending}
        >
          Suspend
        </button>
        <button
          className={`btn secondary ${status === "inactive" ? "bg-[#68727e]! border-[#68727e]! text-white!" : ""}`}
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
    <div className="card overflow-hidden p-0 [&_table]:w-full [&_table]:border-collapse [&_td]:border-b [&_td]:border-line [&_td]:p-[13px_11px] [&_td]:text-left [&_td]:text-[12px] [&_th]:border-b [&_th]:border-line [&_th]:bg-[#08243e] [&_th]:p-[13px_11px] [&_th]:text-left [&_th]:text-[10px] [&_th]:text-white [&_tr:last-child_td]:border-b-0">
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
/**
 * The payment status word. Keyed on the same names the CSS matched, so
 * "confirmation" - which never had a rule - still falls through to the same
 * red default it always got.
 */
const payTone: Record<string, string> = {
  paid: "text-green",
  partial: "text-[#8a5900]",
};

export function OwnerPayments({ records }: { records: PlatformOwnerPaymentBilling[] }) {
  return (
    <section className="grid gap-[10px]">
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
            <details className="card group overflow-hidden" key={record.conferenceId}>
              <summary className="grid min-h-[72px] cursor-pointer list-none grid-cols-[1fr_auto_auto] items-center gap-[10px] p-[13px_15px] [&::-webkit-details-marker]:hidden">
                <span className="grid gap-[4px]">
                  <b className="text-[15px]">{record.conferenceName}</b>
                  <small className="text-[11px] text-muted">
                    {money(received)} received · {money(balance)} due
                  </small>
                </span>
                <em
                  className={`text-[9px] font-[850] uppercase not-italic ${payTone[statusClass] ?? "text-[#a51118]"}`}
                >
                  {status}
                </em>
                <strong aria-hidden="true" className="text-[23px] group-open:rotate-90">
                  <ChevronRight className="go-caret" />
                </strong>
              </summary>
              <div className="border-t border-line p-[14px]">
                <p className="m-[0_0_12px] grid grid-cols-[1fr_1fr_1.4fr] gap-[8px] text-[12px] max-[500px]:grid-cols-1 [&>span]:text-muted">
                  <b>{record.ownerName}</b>
                  <span>{record.phone}</span>
                  <span>{record.email}</span>
                </p>
                <div className="m-[2px_0_12px] grid border-t border-line [&>span]:flex [&>span]:justify-between [&>span]:border-b [&>span]:border-line [&>span]:py-[9px] [&>span]:text-[12px] [&>span]:text-muted [&>span:last-child]:grid [&>span:last-child]:grid-cols-[1fr_auto] [&>span:last-child]:gap-[8px] [&>span:last-child]:bg-[#f7f5f2] [&>span:last-child]:p-[10px] [&>span:last-child]:text-navy [&_strong]:text-[15px]">
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
                  <section className="m-[14px_0] grid gap-[7px] [&>b]:text-[12px] [&>p]:m-0 [&>p]:flex [&>p]:justify-between [&>p]:gap-[10px] [&>p]:border-t [&>p]:border-line [&>p]:py-[9px] [&>p]:text-[12px] [&>p>span]:text-muted [&>p>span]:capitalize">
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
        <p className={emptyNote}>No owner payment ledgers are available yet.</p>
      )}
    </section>
  );
}
function PaymentConfirmation({ submissionId }: { submissionId: string }) {
  const [state, action, pending] = useActionState(confirmSubscriptionAction, initial);
  return (
    <form action={action}>
      <input type="hidden" name="submissionId" value={submissionId} />
      {/* .platform-owner-payment .btn set width: 100% on whatever button landed
          inside the disclosure. This is that button, and it only renders when a
          submission is pending - so it may not be in any screenshot. Carried
          over deliberately rather than left to chance. */}
      <button className="btn primary w-full" disabled={pending}>
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
/* .platform-operation em set this pill's padding, size, background and colour
   unlayered, so it beat both tone maps at every call site: measured on
   /platform/support, every pill renders green at 10px on 5px 8px whatever its
   status says. That is what is reproduced here. statusTone and payTone are
   left where they are rather than quietly switched on - whether those tones
   were meant to show is a question for a human, not for this migration. */
const statusPill =
  "self-start rounded-full bg-[#eaf6ec] p-[5px_8px] text-[10px] font-[850] whitespace-nowrap text-green not-italic";

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
        <em className={statusPill}>{status}</em>
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
              className="btn secondary px-[13px]! py-[9px]! text-[12px]! justify-self-start"
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
              className="btn primary px-[13px]! py-[9px]! text-[12px]! justify-self-start"
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
      <section className="card grid gap-[13px] p-[16px] mb-[12px] [&_h2]:m-0! [&_p]:m-0!">
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
          <p className={emptyNote}>No customer requests.</p>
        )}
      </section>
      <section className="card grid gap-[13px] p-[16px] mb-[12px] [&_h2]:m-0! [&_p]:m-0!">
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
                        <em className={statusPill}>Feedback</em>
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
          <p className={emptyNote}>No platform feedback yet.</p>
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
  // `owner-support-request` restated what .card already said - same border,
  // background, radius and shadow - on an element that carried both.
  return (
    <details className={`card ${accountDisclosure}`}>
      <summary className={accountRow}>
        <span>?</span>
        <b>Request Support</b>
        <strong aria-hidden="true">
          <ChevronRight className="go-caret" />
        </strong>
      </summary>
      <form action={a} className="grid gap-[9px] border-t border-line p-[17px]">
        <input type="hidden" name="conferenceId" value={conferenceId} />
        <label className="text-[12px] font-[800]">
          Subject
          <input
            name="subject"
            maxLength={120}
            required
            className="w-full rounded-[11px] border border-[#d6dbe2] bg-white p-[11px] [font:inherit]"
          />
        </label>
        <label className="text-[12px] font-[800]">
          Message
          <textarea
            name="message"
            maxLength={1000}
            required
            className="w-full rounded-[11px] border border-[#d6dbe2] bg-white p-[11px] [font:inherit] min-h-[96px] resize-y"
          />
        </label>
        <button className="btn primary" disabled={p}>
          {p ? "Sending…" : "Send Request"}
        </button>
        {s.error && <FormMessage tone="error">{s.error}</FormMessage>}
        {s.message && <FormMessage tone="success">{s.message}</FormMessage>}
      </form>
      {history.length > 0 && (
        <section className="grid gap-[9px] border-t border-line p-[16px] [&_article]:grid [&_article]:gap-[5px] [&_article]:rounded-[11px] [&_article]:border [&_article]:border-line [&_article]:p-[11px] [&_em]:text-[10px] [&_em]:text-green [&_em]:uppercase [&_em]:not-italic [&_header]:flex [&_header]:justify-between [&_header]:gap-[10px] [&_header]:text-[13px] [&_header]:font-[800] [&_p]:m-0 [&_p]:text-[12px] [&_p]:leading-[1.45] [&_p]:text-muted [&_small]:m-0 [&_small]:text-[12px] [&_small]:leading-[1.45] [&_small]:text-muted [&_small_b]:text-navy">
          <b className="text-[12px] tracking-[0.05em] uppercase">Request History</b>
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
