"use client";

import { useActionState } from "react";
import { t } from "@/content/t";
import type { EditableConfigKey } from "@/server/domain/admin-settings";
import { updateAppConfigAction } from "./actions";

const configLabels: Record<EditableConfigKey, string> = {
  offer_window_minutes: t("admin.settings.config.offer_window_minutes"),
  no_show_minutes: t("admin.settings.config.no_show_minutes"),
  check_in_lock_minutes: t("admin.settings.config.check_in_lock_minutes"),
  id_doc_retention_days: t("admin.settings.config.id_doc_retention_days"),
  check_in_expiry_hours: t("admin.settings.config.check_in_expiry_hours"),
  confirm_grace_hours: t("admin.settings.config.confirm_grace_hours"),
  auto_release_hours: t("admin.settings.config.auto_release_hours"),
};

export function AppConfigForm({ configKey, value }: { configKey: EditableConfigKey; value: number }) {
  const [state, formAction, isPending] = useActionState(updateAppConfigAction, null);

  return (
    <form action={formAction} style={{ display: "contents" }}>
      <input type="hidden" name="key" value={configKey} />
      <td style={{ padding: "8px 12px", fontSize: "0.9rem" }}>{configLabels[configKey]}</td>
      <td style={{ padding: "8px" }}>
        <input
          name="value"
          type="number"
          min={1}
          step={1}
          required
          defaultValue={value}
          style={{ width: "80px", padding: "4px 6px", border: "1px solid var(--color-border)", borderRadius: "4px" }}
          aria-label={configLabels[configKey]}
        />
      </td>
      <td style={{ padding: "8px" }}>
        <button
          type="submit"
          disabled={isPending}
          className="siza-button"
          style={{ fontSize: "0.85rem", padding: "6px 12px" }}
        >
          {isPending ? "…" : t("admin.settings.config.save")}
        </button>
        {state?.ok ? <span style={{ color: "var(--color-success, #16a34a)", marginLeft: "8px", fontSize: "0.8rem" }}>{t("admin.settings.config.saved")}</span> : null}
        {state && !state.ok ? <span style={{ color: "var(--color-danger, #e11d48)", marginLeft: "8px", fontSize: "0.8rem" }}>{t("admin.settings.config.error")}</span> : null}
      </td>
    </form>
  );
}

