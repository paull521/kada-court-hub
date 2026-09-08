import { Check, ChevronRight, Clock } from "lucide-react";
import { LoadingNote, SkeletonBlock, SkeletonText } from "@/components/Skeleton";
import PlayerPaymentForm from "@/components/PlayerPaymentForm";
import type { PlayerPortalData } from "@/lib/kch-data";
import { historyPanel, historyRow } from "@/components/ui/account-classes";
import {
  emptyNote,
  familyBanner,
  familyQuote,
  panel,
  teamMark,
  teamMarkSmall,
} from "@/components/ui/shared-classes";

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
const feeRow =
  "grid grid-cols-[35px_1fr_auto] items-center border-b border-line py-[13px] last:border-0 [&>span]:grid [&>span]:h-[30px] [&>span]:w-[30px] [&>span]:place-items-center [&>span]:rounded-full [&>span]:border [&>span]:border-line [&>span]:text-gold";

export default function PaymentsFrame({ data }: { data?: PlayerPortalData }) {
  const account = data?.paymentAccount;
  return (
    <>
      {!data && <LoadingNote />}
      <div className="col-pane col-pane-a">
        {/* bg- shouts: .card sets a background unlayered. The .skeleton pair is
            carried across by hand - it renders only while the frame is loading,
            which settle() in the visual suite waits out by definition. */}
        <section className="card mb-[14px] grid grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_auto_auto] gap-x-[16px] bg-[radial-gradient(circle_at_90%_35%,rgba(79,122,166,0.3),transparent_32%),linear-gradient(125deg,#08243e,#0a3767)]! p-[22px] text-white [&>p]:col-start-1 [&>p]:m-0 [&>p]:font-[800] [&>p]:text-[#f4a313] [&>strong]:col-start-1 [&>strong]:my-[9px] [&>strong]:text-[48px] [&>span]:col-start-1 [&>span]:text-[14px] [&>span]:text-[#d6dce4] [&_.skeleton]:bg-[linear-gradient(90deg,#061b2f_25%,#0d3055_37%,#061b2f_63%)] [&_.skeleton]:bg-[length:400%_100%]">
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
          <div className="col-start-2 row-span-full grid w-[92px] justify-items-center gap-[6px] self-center text-center text-[12px] leading-[1.2]">
            <span className={`${teamMark} ${teamMarkSmall}`} aria-hidden="true">
              K
            </span>
            <b>{data ? data.context.team : <SkeletonText width="4.5em" />}</b>
          </div>
        </section>
        <section className={`card ${panel}`}>
          <h2>FEE BREAKDOWN</h2>
          {data ? (
            data.fees.length ? (
              data.fees.map((fee) => (
                <div className={feeRow} key={fee.id}>
                  <span>{fee.icon}</span>
                  <b>{fee.label}</b>
                  <strong>${fee.amount.toFixed(2)}</strong>
                </div>
              ))
            ) : (
              <p className={emptyNote}>No outstanding fees.</p>
            )
          ) : (
            [0, 1, 2].map((index) => (
              <div className={feeRow} key={index}>
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
          <section className={`card payment-method-panel ${panel}`}>
            <h2>PAYMENT METHODS</h2>
            <SkeletonBlock height="148px" />
          </section>
        )}
        {/* Closed, this disclosure is four fixed things and a caret. It has
            never needed the read to be drawn. */}
        <details className={`card ${historyPanel}`}>
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
                <div className={historyRow} key={payment.id}>
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
              <p className={emptyNote}>Confirmed payments will appear here.</p>
            )}
          </div>
        </details>
      </div>
      <section className={familyBanner}>
        <p className={familyQuote}>“You cannot achieve greatness without sacrifice.”</p>
      </section>
    </>
  );
}
