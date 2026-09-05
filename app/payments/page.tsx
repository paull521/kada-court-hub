import { ChevronRight } from "lucide-react";
import AppShell from "@/components/AppShell";
import PlayerPaymentForm from "@/components/PlayerPaymentForm";
import { getPlayerPortalData } from "@/lib/kch-data";
import { redirect } from "next/navigation";

export default async function Payments() {
  const data = await getPlayerPortalData("payments");
  if (!data.contexts.length) redirect("/home");
  const account = data.paymentAccount;
  return (
    <AppShell
      active="payments"
      contexts={data.contexts}
      activeRegistrationId={data.activeRegistrationId}
      notifications={data.notifications}
      profileNeedsAttention={data.profileNeedsAttention}
      paymentNeedsAttention={data.paymentNeedsAttention}
      teamHasUnavailable={data.teamHasUnavailable}
      conferenceName={data.context.conference}
    >
      <h1 className="title">Payments</h1>
      <p className="subtitle">View fees and report manual payments.</p>
      <p className="season-label">▦ &nbsp; {data.context.season}</p>
      <section className="card balance-card">
        <p>TOTAL BALANCE DUE</p>
        <strong>${account.balance.toFixed(2)}</strong>
        <span>
          ${account.paid.toFixed(2)} paid
          {account.waived ? ` · $${account.waived.toFixed(2)} waived` : ""}
          {account.pending ? ` · $${account.pending.toFixed(2)} awaiting confirmation` : ""}
        </span>
      </section>
      <section className="card panel">
        <h2>FEE BREAKDOWN</h2>
        {data.fees.length ? (
          data.fees.map((fee) => (
            <div className="fee-row" key={fee.id}>
              <span>{fee.icon}</span>
              <b>{fee.label}</b>
              <strong>${fee.amount.toFixed(2)}</strong>
            </div>
          ))
        ) : (
          <p className="empty-note">No outstanding fees.</p>
        )}
      </section>
      <PlayerPaymentForm
        registrationId={data.activeRegistrationId}
        balance={account.balance}
        submissions={data.paymentSubmissions}
      />
      <details className="card payment-history-panel">
        <summary>
          <span>◷</span>
          <b>Payment History</b>
          <strong aria-hidden="true">
            <ChevronRight className="go-caret" />
          </strong>
        </summary>
        <div className="payment-history-scroll">
          {data.paymentHistory.length ? (
            data.paymentHistory.slice(0, 10).map((payment) => (
              <div className="payment-history-row" key={payment.id}>
                <span>✓</span>
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
    </AppShell>
  );
}
