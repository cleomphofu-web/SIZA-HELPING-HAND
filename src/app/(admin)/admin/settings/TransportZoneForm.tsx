"use client";

import { useActionState } from "react";
import { t } from "@/content/t";
import type { TransportZoneRow } from "@/server/domain/admin-settings";
import { updateTransportZoneAction } from "./actions";

export function TransportZoneForm({ row }: { row: TransportZoneRow }) {
  const [state, formAction, isPending] = useActionState(updateTransportZoneAction, null);

  return (
    <form action={formAction} style={{ display: "contents" }}>
      <input type="hidden" name="suburb" value={row.suburb} />
      <td style={{ padding: "8px 12px" }}>{row.suburb}</td>
      <td style={{ padding: "8px 12px" }}>{row.region}</td>
      <td style={{ padding: "8px 12px" }}>{row.zone}</td>
      <td style={{ padding: "8px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <input
            name="transport_cents"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={row.transport_cents}
            style={{ width: "80px", padding: "4px 6px", border: "1px solid var(--color-border)", borderRadius: "4px" }}
            aria-label={`${row.suburb} transport cost in cents`}
          />
          <span style={{ fontSize: "0.8rem", color: "var(--color-muted, #6b7280)" }}>c</span>
        </label>
      </td>
      <td style={{ padding: "8px" }}>
        <select
          name="enabled"
          defaultValue={String(row.enabled)}
          style={{ padding: "4px 6px", border: "1px solid var(--color-border)", borderRadius: "4px" }}
          aria-label={`${row.suburb} active status`}
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </td>
      <td style={{ padding: "8px" }}>
        <button
          type="submit"
          disabled={isPending}
          className="siza-button"
          style={{ fontSize: "0.85rem", padding: "6px 12px" }}
        >
          {isPending ? "…" : t("admin.settings.transport.save")}
        </button>
        {state?.ok ? <span style={{ color: "var(--color-success, #16a34a)", marginLeft: "8px", fontSize: "0.8rem" }}>{t("admin.settings.transport.saved")}</span> : null}
        {state && !state.ok ? <span style={{ color: "var(--color-danger, #e11d48)", marginLeft: "8px", fontSize: "0.8rem" }}>{t("admin.settings.transport.error")}</span> : null}
      </td>
    </form>
  );
}

