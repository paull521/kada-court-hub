import { ChevronRight, Wallet } from "lucide-react";
import { LoadingNote, SkeletonBlock } from "@/components/Skeleton";
import type { CaptainPortalData } from "@/lib/captain-data";
import { scheduleEmpty } from "@/components/ui/schedule-classes";

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
      <section className={`card ${scheduleEmpty}`}>
        <span>
          <Wallet className="ui-icon" />
        </span>
        <h2>No player balances</h2>
        <p>Balances appear after the owner publishes division fees.</p>
      </section>
    );
  return (
    <div className="grid gap-[10px]">
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
              <details className="card overflow-hidden" key={player.registrationId}>
                <summary className="grid cursor-pointer grid-cols-[1fr_auto_auto] items-center gap-[10px] p-[16px]">
                  <span className="grid">
                    <b>{player.playerName}</b>
                    <small className="text-[#657285]">Remaining {money(player.balance)}</small>
                  </span>
                  {/* paid renders in no conference the screenshots reach; its
                      two declarations are carried across with the other two. */}
                  <em
                    className={`rounded-full p-[5px_8px] text-[12px] font-[800] uppercase not-italic ${
                      status === "paid"
                        ? "bg-[#eaf6ec] text-[#18753a]"
                        : status === "partial"
                          ? "bg-[#fff4da] text-[#8a5900]"
                          : "bg-[#fff1f1] text-[#a51118]"
                    }`}
                  >
                    {status}
                  </em>
                  <strong aria-hidden="true">
                    <ChevronRight className="go-caret" />
                  </strong>
                </summary>
                <div className="p-[0_16px_16px]">
                  <div className="grid grid-cols-4 gap-[7px] max-[620px]:grid-cols-2 [&>span]:grid [&>span]:rounded-[10px] [&>span]:bg-[#f3f5f6] [&>span]:p-[10px_6px] [&_small]:text-[11px]">
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
                  <div className="mt-[10px] grid [&>span]:flex [&>span]:justify-between [&>span]:border-b [&>span]:border-[#e5e7e9] [&>span]:py-[8px]">
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
