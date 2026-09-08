"use client";

import { ChevronRight, DollarSign } from "lucide-react";
import { useActionState } from "react";
import { saveSeasonFinancialSummaryAction, type OwnerActionState } from "@/app/owner/actions";
import type { OwnerPaymentGroup, OwnerSeason, OwnerSeasonFinancial } from "@/lib/owner-data";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { cx } from "@/components/ui/cx";
import { emptyOperation, ownerForm } from "@/components/ui/shared-classes";

const initialState: OwnerActionState = {};
const money = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

/**
 * Shared by both figure grids: a bordered white tile that centres a label over
 * a number. The two grids differ only in how many fit across and how tall the
 * tile is, which is why that is all the callers pass.
 */
const tile = "grid content-center gap-[5px] rounded-xl border border-line bg-white";
const tileLabel = "font-[850] text-muted";

/** Hides the disclosure triangle and lets the row own its own layout. */
const summaryReset = "cursor-pointer list-none [&::-webkit-details-marker]:hidden";

/** The chevron that turns when its <details> opens. */
function Caret() {
  return (
    <strong aria-hidden="true" className="text-[23px] transition-transform group-open:rotate-90">
      <ChevronRight className="go-caret" />
    </strong>
  );
}

function Figure({
  label,
  value,
  className,
  valueClassName,
  labelClassName,
  valueSize,
}: {
  label: string;
  value: string;
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
  valueSize: string;
}) {
  return (
    <span className={cx(tile, className)}>
      <small className={cx(tileLabel, labelClassName)}>{label}</small>
      <b className={cx(valueSize, valueClassName)}>{value}</b>
    </span>
  );
}

function SeasonFinancialCard({
  season,
  groups,
  financial,
}: {
  season: OwnerSeason;
  groups: OwnerPaymentGroup[];
  financial?: OwnerSeasonFinancial;
}) {
  const [state, action, pending] = useActionState(saveSeasonFinancialSummaryAction, initialState);
  const leagueIncome = groups.reduce((sum, group) => sum + group.leagueReceived, 0);
  const uniformIncome = groups.reduce((sum, group) => sum + group.uniformReceived, 0);
  const totalIncome = leagueIncome + uniformIncome;
  const expectedIncome = groups.reduce(
    (sum, group) => sum + (group.leagueFee + group.uniformFee) * group.totalPlayers,
    0,
  );
  const courtCost = financial?.courtCost ?? 0,
    refereeCost = financial?.refereeCost ?? 0,
    uniformCost = financial?.uniformCost ?? 0,
    leagueCost = financial?.leagueCost ?? 0;
  const totalExpense = courtCost + refereeCost + uniformCost + leagueCost;
  const profitLoss = totalIncome - totalExpense;
  const inProfit = profitLoss >= 0;
  const playerCount = groups.reduce((sum, group) => sum + group.totalPlayers, 0);

  // Income tiles are squares four-up on a phone; the laptop layer lets them
  // grow to fit the figure instead, which is the content that matters.
  const incomeLabel =
    "text-[8px] leading-[1.2] tracking-[0.02em] desk:text-[11px] desk:leading-[1.3]";
  const incomeValue =
    "text-[clamp(11px,3.4vw,15px)] leading-[1.15] [overflow-wrap:anywhere] desk:text-[21px]";
  const incomeTile =
    "aspect-square min-h-0 justify-items-center p-[7px_5px] text-center desk:aspect-auto desk:min-h-[88px] desk:p-[14px_12px]";

  const totalsLabel = "text-[9px] leading-[1.25] tracking-[0.04em]";
  const totalsValue = "text-[16px] max-tiny:text-[13px]";
  const totalsTile = "min-h-[70px] p-[9px_7px] text-center";

  const expenseFields = [
    { name: "courtCost", label: "Court cost ($)", value: courtCost },
    { name: "refereeCost", label: "Referee cost ($)", value: refereeCost },
    { name: "uniformCost", label: "Uniform cost ($)", value: uniformCost },
    { name: "leagueCost", label: "League operations ($)", value: leagueCost },
  ];

  return (
    <Card as="details" className="group overflow-hidden" open>
      <summary
        className={cx(
          summaryReset,
          "grid min-h-[76px] grid-cols-[minmax(0,1fr)_auto_22px] items-center gap-[9px] p-[14px_15px]",
        )}
      >
        <span className="grid min-w-0 gap-[5px]">
          <b className="text-[17px]">{season.name}</b>
          <small className="text-[10px] text-muted">
            {season.divisions.length} division{season.divisions.length === 1 ? "" : "s"} ·{" "}
            {playerCount} players
          </small>
        </span>
        <span className="grid gap-[3px] text-right max-tiny:max-w-[82px]">
          <small className="text-[10px] text-muted">{inProfit ? "PROFIT" : "LOSS"}</small>
          <b className={cx("text-[15px]", inProfit ? "text-green" : "text-[#a51118]")}>
            {money(Math.abs(profitLoss))}
          </b>
        </span>
        <Caret />
      </summary>

      <div className="border-t border-line p-3">
        <p className="payment-card-label">SEASON INCOME</p>
        <div className="grid grid-cols-4 gap-[6px]">
          <Figure
            label="LEAGUE FEES RECEIVED"
            value={money(leagueIncome)}
            className={incomeTile}
            labelClassName={incomeLabel}
            valueSize={incomeValue}
          />
          <Figure
            label="UNIFORM FEES RECEIVED"
            value={money(uniformIncome)}
            className={incomeTile}
            labelClassName={incomeLabel}
            valueSize={incomeValue}
          />
          <Figure
            label="EXPECTED INCOME"
            value={money(expectedIncome)}
            className={incomeTile}
            labelClassName={incomeLabel}
            valueSize={incomeValue}
          />
          <Figure
            label="TOTAL INCOME RECEIVED"
            value={money(totalIncome)}
            className={cx(incomeTile, "border-[#cce6d0] bg-[#eaf6ec]")}
            labelClassName={incomeLabel}
            valueSize={incomeValue}
            valueClassName="text-green"
          />
        </div>

        <details className="group/expense mt-[15px] overflow-hidden rounded-[14px] border border-line bg-[#fbfaf8]">
          <summary
            className={cx(
              summaryReset,
              "grid min-h-[64px] grid-cols-[1fr_auto] items-center gap-[9px] p-[12px_13px]",
            )}
          >
            <span className="grid gap-[4px]">
              <b className="text-[15px]">Update Season Expenses</b>
              <small className="text-[11px] text-muted">
                Court, referee, uniforms, and league operations
              </small>
            </span>
            <strong
              aria-hidden="true"
              className="text-[23px] transition-transform group-open/expense:rotate-90"
            >
              <ChevronRight className="go-caret" />
            </strong>
          </summary>

          <form action={action} className={`${ownerForm} border-t border-line p-[13px]`}>
            <input type="hidden" name="seasonId" value={season.id} />
            <div className="grid grid-cols-2 gap-[9px] max-tiny:grid-cols-1">
              {expenseFields.map((field) => (
                <label key={field.name}>
                  {field.label}
                  <input
                    name={field.name}
                    type="number"
                    min="0"
                    max="1000000"
                    step="0.01"
                    inputMode="decimal"
                    defaultValue={field.value}
                  />
                </label>
              ))}
            </div>
            <label>
              Financial notes <small>(optional)</small>
              <textarea
                name="notes"
                maxLength={1000}
                defaultValue={financial?.notes ?? ""}
                placeholder="Vendor details, court deposits, referee notes, or other season costs"
              />
            </label>
            {state.error && <FormMessage tone="error">{state.error}</FormMessage>}
            {state.message && <FormMessage tone="success">{state.message}</FormMessage>}
            <Button disabled={pending}>{pending ? "Saving…" : "Save Season Expenses"}</Button>
          </form>
        </details>

        <p className="payment-card-label">SEASON TOTALS</p>
        <div className="grid grid-cols-3 gap-[7px]">
          <Figure
            label="TOTAL INCOME"
            value={money(totalIncome)}
            className={totalsTile}
            labelClassName={totalsLabel}
            valueSize={totalsValue}
          />
          <Figure
            label="TOTAL EXPENSE"
            value={money(totalExpense)}
            className={totalsTile}
            labelClassName={totalsLabel}
            valueSize={totalsValue}
          />
          <Figure
            label="PROFIT / LOSS"
            value={`${profitLoss < 0 ? "−" : ""}${money(Math.abs(profitLoss))}`}
            className={cx(
              totalsTile,
              inProfit ? "border-[#cce6d0] bg-[#eaf6ec]" : "border-[#efc9cb] bg-[#fff1f1]",
            )}
            labelClassName={totalsLabel}
            valueSize={totalsValue}
            valueClassName={inProfit ? "text-green" : "text-[#a51118]"}
          />
        </div>
      </div>
    </Card>
  );
}

export default function OwnerFinancialSummary({
  seasons,
  groups,
  financials,
}: {
  seasons: OwnerSeason[];
  groups: OwnerPaymentGroup[];
  financials: OwnerSeasonFinancial[];
}) {
  if (!seasons.length)
    return (
      <Card className={emptyOperation}>
        <span>
          <DollarSign className="ui-icon" />
        </span>
        <div>
          <h3>No seasons yet</h3>
          <p>Create a season before tracking income and expenses.</p>
        </div>
      </Card>
    );
  return (
    <section className="owner-operations">
      <p className="operations-intro">
        Add other expenses such as uniform, referee, court, and league operations. The page will
        provide the actual season financial summary.
      </p>
      <div className="mt-[15px] grid gap-[11px]">
        {seasons.map((season) => (
          <SeasonFinancialCard
            key={season.id}
            season={season}
            groups={groups.filter((group) => group.seasonId === season.id)}
            financial={financials.find((item) => item.seasonId === season.id)}
          />
        ))}
      </div>
    </section>
  );
}
