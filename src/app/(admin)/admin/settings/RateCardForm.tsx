"use client";

import { useActionState } from "react";
import { t } from "@/content/t";
import type { RateCardRow } from "@/server/domain/admin-settings";
import { updateRateCardAction } from "./actions";

export function RateCardForm({ row }: { row: RateCardRow }) {
  const [state, formAction, isPending] = useActionState(updateRateCardAction, null);

  return (
    <form action={formAction} style={{ display: "contents" }}>
      <input type="hidden" name="id" value={row.id} />
      <td style={{ padding: "8px 12px" }}>{row.service}</td>
      <td style={{ padding: "8px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <input
            name="hourly_cents"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={row.hourly_cents}
            style={{ width: "90px", padding: "4px 6px", border: "1px solid var(--color-border)", borderRadius: "4px" }}
            aria-label={`${row.service} hourly rate in cents`}
          />
          <span style={{ fontSize: "0.8rem", color: "var(--color-muted, #6b7280)" }}>c</span>
        </label>
      </td>
      <td style={{ padding: "8px" }}>
        <input
          name="per_bedroom_minutes"
          type="number"
          min={0}
          step={1}
          required
          defaultValue={row.per_bedroom_minutes}
          style={{ width: "60px", padding: "4px 6px", border: "1px solid var(--color-border)", borderRadius: "4px" }}
          aria-label={`${row.service} per bedroom minutes`}
        />
      </td>
      <td style={{ padding: "8px" }}>
        <input
          name="per_bathroom_minutes"
          type="number"
          min={0}
          step={1}
          required
          defaultValue={row.per_bathroom_minutes}
          style={{ width: "60px", padding: "4px 6px", border: "1px solid var(--color-border)", borderRadius: "4px" }}
          aria-label={`${row.service} per bathroom minutes`}
        />
      </td>
      <td style={{ padding: "8px" }}>
        <button
          type="submit"
          disabled={isPending}
          className="siza-button"
          style={{ fontSize: "0.85rem", padding: "6px 12px" }}
        >
          {isPending ? "…" : t("admin.settings.rate_card.save")}
        </button>
        {state?.ok ? <span style={{ color: "var(--color-success, #16a34a)", marginLeft: "8px", fontSize: "0.8rem" }}>{t("admin.settings.rate_card.saved")}</span> : null}
        {state && !state.ok ? <span style={{ color: "var(--color-danger, #e11d48)", marginLeft: "8px", fontSize: "0.8rem" }}>{t("admin.settings.rate_card.error")}</span> : null}
      </td>
    </form>
  );
}

