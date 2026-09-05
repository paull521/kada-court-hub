import { ChevronRight } from "lucide-react";
import { redirect } from "next/navigation";
import CaptainShell from "@/components/CaptainShell";
import { getCaptainPortalData } from "@/lib/captain-data";

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
export default async function CaptainPaymentsPage() {
  const data = await getCaptainPortalData();
  if (!data.authorized) redirect("/profile");
  return (
    <CaptainShell data={data} active="payments" title="Payments" subtitle="Team payment status.">
      <div className="captain-payment-list">
        {data.payments.map((player) => {
          const status =
            player.balance <= 0 ? "paid" : player.paid > 0 || player.waived > 0 ? "partial" : "due";
          return (
            <details className="card captain-payment-player" key={player.registrationId}>
              <summary>
                <span>
                  <b>{player.playerName}</b>
                  <small>Remaining {money(player.balance)}</small>
                </span>
                <em className={`payment-flag ${status}`}>{status}</em>
                <strong aria-hidden="true">
                  <ChevronRight className="go-caret" />
                </strong>
              </summary>
              <div>
                <div className="captain-balance-grid">
                  <span>
                    <small>Total Due</small>
                    <b>{money(player.totalCharges)}</b>
                  </span>
                  <span>
                    <small>Paid</small>
                    <b>{money(player.paid)}</b>
                  </span>
                  <span>
                    <small>Waived</small>
                    <b>{money(player.waived)}</b>
                  </span>
                  <span>
                    <small>Remaining</small>
                    <b>{money(player.balance)}</b>
                  </span>
                </div>
                <div className="captain-fee-breakdown">
                  <span>
                    League fee <b>{money(player.leagueFee + player.platformFee)}</b>
                  </span>
                  <span>
                    Uniform fee <b>{money(player.uniformFee)}</b>
                  </span>
                  {player.pending > 0 && (
                    <span>
                      Awaiting owner review <b>{money(player.pending)}</b>
                    </span>
                  )}
                </div>
              </div>
            </details>
          );
        })}
        {!data.payments.length && (
          <section className="card schedule-empty">
            <span>▣</span>
            <h2>No player balances</h2>
            <p>Balances appear after the owner publishes division fees.</p>
          </section>
        )}
      </div>
    </CaptainShell>
  );
}
