import { ChevronRight, Wallet } from "lucide-react";
import { LoadingNote, SkeletonBlock } from "@/components/Skeleton";
import type { CaptainPortalData } from "@/lib/captain-data";

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

/**
 * The team's balances, written once and drawn twice. Each row is a disclosure,
 * so before the read it is a block the height of the row rather than a summary
 * with nothing behind it - a placeholder should not be pressable.
 */
export default function CaptainPaymentsFrame({ data }: { data?: CaptainPortalData }) {
  if (data && !data.payments.length)
    return (
      <section className="card schedule-empty">
        <span>
          <Wallet className="ui-icon" />
        </span>
        <h2>No player balances</h2>
        <p>Balances appear after the owner publishes division fees.</p>
      </section>
    );
  return (
    <div className="captain-payment-list">
      {!data && <LoadingNote />}
      {data
        ? data.payments.map((player) => {
            const status =
              player.balance <= 0
                ? "paid"
                : player.paid > 0 || player.waived > 0
                  ? "partial"
                  : "due";
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
          })
        : [0, 1, 2, 3, 4, 5].map((index) => (
            <SkeletonBlock key={index} height="62px" radius="18px" />
          ))}
    </div>
  );
}
