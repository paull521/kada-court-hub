"use client";

import { ChevronRight, DollarSign } from "lucide-react";
import { useActionState } from "react";
import { saveSeasonFinancialSummaryAction, type OwnerActionState } from "@/app/owner/actions";
import type { OwnerPaymentGroup, OwnerSeason, OwnerSeasonFinancial } from "@/lib/owner-data";

const initialState: OwnerActionState = {};
const money = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

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
  const playerCount = groups.reduce((sum, group) => sum + group.totalPlayers, 0);
  return (
    <details className="financial-season-card card" open>
      <summary>
        <span>
          <b>{season.name}</b>
          <small>
            {season.divisions.length} division{season.divisions.length === 1 ? "" : "s"} ·{" "}
            {playerCount} players
          </small>
        </span>
        <span className={profitLoss >= 0 ? "financial-positive" : "financial-negative"}>
          <small>{profitLoss >= 0 ? "PROFIT" : "LOSS"}</small>
          <b>{money(Math.abs(profitLoss))}</b>
        </span>
        <strong aria-hidden="true">
          <ChevronRight className="go-caret" />
        </strong>
      </summary>
      <div className="financial-season-body">
        <p className="payment-card-label">SEASON INCOME</p>
        <div className="financial-income-grid">
          <span>
            <small>LEAGUE FEES RECEIVED</small>
            <b>{money(leagueIncome)}</b>
          </span>
          <span>
            <small>UNIFORM FEES RECEIVED</small>
            <b>{money(uniformIncome)}</b>
          </span>
          <span>
            <small>EXPECTED INCOME</small>
            <b>{money(expectedIncome)}</b>
          </span>
          <span className="financial-total">
            <small>TOTAL INCOME RECEIVED</small>
            <b>{money(totalIncome)}</b>
          </span>
        </div>
        <details className="financial-expense-editor">
          <summary>
            <span>
              <b>Update Season Expenses</b>
              <small>Court, referee, uniforms, and league operations</small>
            </span>
            <strong aria-hidden="true">
              <ChevronRight className="go-caret" />
            </strong>
          </summary>
          <form action={action} className="owner-form">
            <input type="hidden" name="seasonId" value={season.id} />
            <div className="financial-expense-grid">
              <label>
                Court cost ($)
                <input
                  name="courtCost"
                  type="number"
                  min="0"
                  max="1000000"
                  step="0.01"
                  inputMode="decimal"
                  defaultValue={courtCost}
                />
              </label>
              <label>
                Referee cost ($)
                <input
                  name="refereeCost"
                  type="number"
                  min="0"
                  max="1000000"
                  step="0.01"
                  inputMode="decimal"
                  defaultValue={refereeCost}
                />
              </label>
              <label>
                Uniform cost ($)
                <input
                  name="uniformCost"
                  type="number"
                  min="0"
                  max="1000000"
                  step="0.01"
                  inputMode="decimal"
                  defaultValue={uniformCost}
                />
              </label>
              <label>
                League operations ($)
                <input
                  name="leagueCost"
                  type="number"
                  min="0"
                  max="1000000"
                  step="0.01"
                  inputMode="decimal"
                  defaultValue={leagueCost}
                />
              </label>
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
            {state.error && (
              <p className="form-error" role="alert">
                {state.error}
              </p>
            )}
            {state.message && (
              <p className="form-success" role="status">
                {state.message}
              </p>
            )}
            <button className="btn primary" disabled={pending}>
              {pending ? "Saving…" : "Save Season Expenses"}
            </button>
          </form>
        </details>
        <p className="payment-card-label">SEASON TOTALS</p>
        <div className="financial-bottom-line">
          <span>
            <small>TOTAL INCOME</small>
            <b>{money(totalIncome)}</b>
          </span>
          <span>
            <small>TOTAL EXPENSE</small>
            <b>{money(totalExpense)}</b>
          </span>
          <span className={profitLoss >= 0 ? "profit" : "loss"}>
            <small>PROFIT / LOSS</small>
            <b>
              {profitLoss < 0 ? "−" : ""}
              {money(Math.abs(profitLoss))}
            </b>
          </span>
        </div>
      </div>
    </details>
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
      <section className="card owner-empty-operation">
        <span>
          <DollarSign className="ui-icon" />
        </span>
        <div>
          <h3>No seasons yet</h3>
          <p>Create a season before tracking income and expenses.</p>
        </div>
      </section>
    );
  return (
    <section className="owner-operations financial-summary-page">
      <p className="operations-intro">
        Add other expenses such as uniform, referee, court, and league operations. The page will
        provide the actual season financial summary.
      </p>
      <div className="financial-season-list">
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
