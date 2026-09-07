import { Check, ChevronRight, Clock } from "lucide-react";
import { LoadingNote, SkeletonBlock, SkeletonText } from "@/components/Skeleton";
import PlayerPaymentForm from "@/components/PlayerPaymentForm";
import type { PlayerPortalData } from "@/lib/kch-data";

/**
 * Payments, written once and drawn twice: with the portal data, and without it.
 *
 * Without it the frame is the same frame. Every heading, label, icon and fixed
 * word is on screen from the first paint, because none of it ever needed the
 * read; only the values are grey, in the place and at the size of the text they
 * stand in for. The page uses this for both halves of its boundary and the
 * route's loading.tsx renders it with no data, so the route skeleton, the
 * streaming fallback and the finished page are one component and cannot
 * disagree about the layout.
 */
export default function PaymentsFrame({ data }: { data?: PlayerPortalData }) {
  const account = data?.paymentAccount;
  return (
    <>
      {!data && <LoadingNote />}
      <div className="col-pane col-pane-a">
        <section className="card balance-card">
          <p>TOTAL BALANCE DUE</p>
          <strong>
            {account ? `$${account.balance.toFixed(2)}` : <SkeletonText width="4.5em" />}
          </strong>
          <span>
            {account ? (
              <>
                ${account.paid.toFixed(2)} paid
                {account.waived ? ` · $${account.waived.toFixed(2)} waived` : ""}
                {account.pending ? ` · $${account.pending.toFixed(2)} awaiting confirmation` : ""}
              </>
            ) : (
              <SkeletonText width="10em" />
            )}
          </span>
          <div className="balance-team">
            <span className="team-mark small" aria-hidden="true">
              K
            </span>
            <b>{data ? data.context.team : <SkeletonText width="8em" />}</b>
          </div>
        </section>
        <section className="card panel">
          <h2>FEE BREAKDOWN</h2>
          {data ? (
            data.fees.length ? (
              data.fees.map((fee) => (
                <div className="fee-row" key={fee.id}>
                  <span>{fee.icon}</span>
                  <b>{fee.label}</b>
                  <strong>${fee.amount.toFixed(2)}</strong>
                </div>
              ))
            ) : (
              <p className="empty-note">No outstanding fees.</p>
            )
          ) : (
            [0, 1, 2].map((index) => (
              <div className="fee-row" key={index}>
                <span />
                <b>
                  <SkeletonText width="9em" />
                </b>
                <strong>
                  <SkeletonText width="3.5em" />
                </strong>
              </div>
            ))
          )}
        </section>
      </div>
      <div className="col-pane col-pane-b">
        {data ? (
          <PlayerPaymentForm
            registrationId={data.activeRegistrationId}
            balance={data.paymentAccount.balance}
            submissions={data.paymentSubmissions}
          />
        ) : (
          <section className="card panel payment-method-panel">
            <h2>PAYMENT METHODS</h2>
            <SkeletonBlock height="148px" />
          </section>
        )}
        {/* Closed, this disclosure is four fixed things and a caret. It has
            never needed the read to be drawn. */}
        <details className="card payment-history-panel">
          <summary>
            <span>
              <Clock className="ui-icon" />
            </span>
            <b>Payment History</b>
            <strong aria-hidden="true">
              <ChevronRight className="go-caret" />
            </strong>
          </summary>
          <div className="payment-history-scroll">
            {data?.paymentHistory.length ? (
              data.paymentHistory.slice(0, 10).map((payment) => (
                <div className="payment-history-row" key={payment.id}>
                  <span>
                    <Check className="ui-icon" />
                  </span>
                  <span>
                    <b>{payment.feeLabel}</b>
                    <small>
                      {payment.paidLabel} · {payment.method.toUpperCase()}
                    </small>
                  </span>
                  <strong>${payment.amount.toFixed(2)}</strong>
                </div>
              ))
            ) : (
              <p className="empty-note">Confirmed payments will appear here.</p>
            )}
          </div>
        </details>
      </div>
      <section className="family-banner">
        <p className="family-quote">“You cannot achieve greatness without sacrifice.”</p>
      </section>
    </>
  );
}
