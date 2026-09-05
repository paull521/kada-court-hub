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
        <small>Completed KCH login and digital contract</small>
      </div>
      <label>
        Conference name
        <input name="conferenceName" required />
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
    <details className="platform-support-request">
      <summary>
        <b>{request.subject}</b>
        <em className={request.status}>{status}</em>
        <strong aria-hidden="true">
          <ChevronRight className="go-caret" />
        </strong>
      </summary>
      <div>
        <p>{request.message}</p>
        {request.status === "open" && (
          <form action={confirmAction}>
            <input type="hidden" name="requestId" value={request.id} />
            <button className="btn secondary" disabled={confirming}>
              {confirming ? "Confirming…" : "Confirm received"}
            </button>
            {confirmState.error && <p className="form-error">{confirmState.error}</p>}
          </form>
        )}
        {request.status === "received" && (
          <form action={fixedAction}>
            <input type="hidden" name="requestId" value={request.id} />
            <button className="btn primary" disabled={fixing}>
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
      <section className="card platform-operation platform-support-box">
        <p className="eyebrow">CUSTOMER REQUESTS</p>
        <h2>Requests by Conference</h2>
        {conferences.length ? (
          conferences.map((conference) => {
            const conferenceRequests = requests.filter(
              (request) => request.conferenceName === conference,
            );
            return (
              <details className="platform-support-conference" key={conference}>
                <summary>
                  <span>
                    <b>{conference}</b>
                    <small>
                      {conferenceRequests.length} request
                      {conferenceRequests.length === 1 ? "" : "s"}
                    </small>
                  </span>
                  <strong aria-hidden="true">
                    <ChevronRight className="go-caret" />
                  </strong>
                </summary>
                <div>
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
      <section className="card platform-operation platform-support-box">
        <p className="eyebrow">PLATFORM FEEDBACK</p>
        <h2>Feedback by Conference</h2>
        {feedbackConferences.length ? (
          feedbackConferences.map((conference) => {
            const items = feedback.filter((item) => item.conferenceName === conference);
            return (
              <details className="platform-support-conference" key={conference}>
                <summary>
                  <span>
                    <b>{conference}</b>
                    <small>
                      {items.length} feedback item{items.length === 1 ? "" : "s"}
                    </small>
                  </span>
                  <strong aria-hidden="true">
                    <ChevronRight className="go-caret" />
                  </strong>
                </summary>
                <div>
                  {items.map((item) => (
                    <details className="platform-support-request" key={item.id}>
                      <summary>
                        <b>{item.playerName}</b>
                        <em className="received">Feedback</em>
                        <strong aria-hidden="true">
                          <ChevronRight className="go-caret" />
                        </strong>
                      </summary>
                      <div>
                        <p>{item.message}</p>
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
