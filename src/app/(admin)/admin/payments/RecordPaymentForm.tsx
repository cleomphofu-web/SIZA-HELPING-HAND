"use client";

import { useActionState } from "react";
import { recordSubscriptionPaymentAction } from "./actions";

export function RecordPaymentForm() {
  const [state, formAction, isPending] = useActionState(recordSubscriptionPaymentAction, null);

  return (
    <form action={formAction} style={{ background: "var(--color-surface)", padding: "20px", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
      <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "16px" }}>Record Cleared Payment</h3>
      
      {state && !state.ok ? (
        <div style={{ color: "var(--color-danger, #e11d48)", marginBottom: "12px", fontSize: "0.9rem" }}>
          {state.error.message}
        </div>
      ) : null}

      {state && state.ok ? (
        <div style={{ color: "var(--color-success, #16a34a)", marginBottom: "12px", fontSize: "0.9rem" }}>
          Payment recorded successfully. Subscription active until {new Date(state.data.paidUntil).toLocaleDateString("en-ZA")}.
        </div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.9rem" }}>
          <span>Helper User UUID</span>
          <input
            name="helperId"
            type="text"
            required
            placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
            style={{ padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--color-border)" }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.9rem" }}>
          <span>Amount (Cents)</span>
          <input
            name="amountCents"
            type="number"
            required
            defaultValue="15000"
            placeholder="15000 for R150.00"
            style={{ padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--color-border)" }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.9rem" }}>
          <span>Prepaid Period</span>
          <select
            name="periodMonths"
            defaultValue="1"
            style={{ padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--color-border)" }}
          >
            <option value="1">1 Month</option>
            <option value="3">3 Months</option>
            <option value="6">6 Months</option>
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.9rem" }}>
          <span>Bank Payment Reference</span>
          <input
            name="reference"
            type="text"
            required
            placeholder="e.g. EFT-HLP-098273"
            style={{ padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--color-border)" }}
          />
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="siza-button"
          style={{ marginTop: "8px", alignSelf: "flex-start" }}
        >
          {isPending ? "Recording..." : "Record Payment & Extend"}
        </button>
      </div>
    </form>
  );
}
