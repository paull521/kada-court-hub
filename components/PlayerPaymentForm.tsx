"use client";

import { Clock, FileCheck, Landmark, Wallet } from "lucide-react";
import { useActionState, useState } from "react";
import { submitPaymentNoticeAction, type PaymentActionState } from "@/app/payments/actions";
import type { PaymentSubmission } from "@/lib/kch-data";

const initialState: PaymentActionState = {};

export default function PlayerPaymentForm({
  registrationId,
  balance,
  submissions,
}: {
  registrationId: string;
  balance: number;
  submissions: PaymentSubmission[];
}) {
  const [state, action, pending] = useActionState(submitPaymentNoticeAction, initialState);
  const [method, setMethod] = useState("");
  const awaiting = submissions.filter((submission) => submission.status === "pending");
  const disabled = balance <= 0 || awaiting.length > 0;

  return (
    <section className={`card panel payment-method-panel ${disabled ? "disabled" : ""}`}>
      <h2>PAYMENT METHODS</h2>
      {awaiting.map((submission) => (
        <div className="payment-status-card" key={submission.id}>
          <span>
            <Clock className="ui-icon" />
          </span>
          <div>
            <b>{submission.method === "waiver" ? "Waiver request" : "Payment"}</b>
            <small>
              ${submission.amount.toFixed(2)} ·{" "}
              {submission.method === "waiver"
                ? "Awaiting owner decision"
                : "Awaiting owner confirmation"}
            </small>
          </div>
        </div>
      ))}
      <form action={action} className="payment-submit-form always-visible">
        <input type="hidden" name="registrationId" value={registrationId} />
        <label className="payment-amount-label">
          How much will you pay?
          <div className="payment-amount-input">
            <span>$</span>
            <input
              name="amount"
              type="number"
              min="0.01"
              max={balance.toFixed(2)}
              step="0.01"
              inputMode="decimal"
              required
              disabled={disabled}
              placeholder="0.00"
            />
          </div>
          <small>Remaining balance: ${balance.toFixed(2)}</small>
        </label>
        <fieldset className="method-choice">
          <legend>Choose Zelle, Cash, or Waiver</legend>
          <label>
            <input
              type="radio"
              name="method"
              value="zelle"
              required
              disabled={disabled}
              onChange={(event) => setMethod(event.target.value)}
            />
            <span>
              <b>
                <Landmark className="ui-icon" />
              </b>{" "}
              Zelle
            </span>
          </label>
          <label>
            <input
              type="radio"
              name="method"
              value="cash"
              required
              disabled={disabled}
              onChange={(event) => setMethod(event.target.value)}
            />
            <span>
              <b>
                <Wallet className="ui-icon" />
              </b>{" "}
              Cash
            </span>
          </label>
          <label>
            <input
              type="radio"
              name="method"
              value="waiver"
              required
              disabled={disabled}
              onChange={(event) => setMethod(event.target.value)}
            />
            <span>
              <b>
                <FileCheck className="ui-icon" />
              </b>{" "}
              Waiver
            </span>
          </label>
        </fieldset>
        {!disabled && (
          <>
            <label>
              {method === "waiver" ? "Reason for waiver" : "Reference or note"}{" "}
              <small>{method === "waiver" ? "(required)" : "(optional)"}</small>
              <input
                name="reference"
                maxLength={200}
                required={method === "waiver"}
                placeholder={
                  method === "waiver"
                    ? "Explain why you are requesting a waiver"
                    : "Zelle confirmation or who received the cash"
                }
              />
            </label>
            <p className="payment-safety-note">
              {method === "waiver"
                ? "Your fee remains due until the conference owner approves the waiver."
                : "Your balance changes only after the conference owner confirms receipt."}
            </p>
          </>
        )}
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
        <button className="btn primary" disabled={pending || disabled}>
          {pending
            ? "Sending…"
            : balance <= 0
              ? "Payment Complete"
              : awaiting.length
                ? "Awaiting Owner Review"
                : method === "waiver"
                  ? "Send Waiver Request"
                  : "Send for Confirmation"}
        </button>
      </form>
    </section>
  );
}
