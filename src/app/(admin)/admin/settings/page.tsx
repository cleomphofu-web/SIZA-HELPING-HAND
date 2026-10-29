import Link from "next/link";
import { t } from "@/content/t";
import { AdminShell } from "@/components/AdminShell";
import { getAdminSettings, type AdminSettingsView } from "@/server/views/admin-settings";
import { EDITABLE_CONFIG_KEYS, type RateCardRow, type TransportZoneRow } from "@/server/domain/admin-settings";
import { RateCardForm } from "./RateCardForm";
import { TransportZoneForm } from "./TransportZoneForm";
import { AppConfigForm } from "./AppConfigForm";

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
  fontSize: "0.9rem",
};

const thStyle = {
  padding: "8px 12px",
  textAlign: "left" as const,
  borderBottom: "2px solid var(--color-border)",
  fontSize: "0.8rem",
  fontWeight: 600,
  color: "var(--color-muted, #6b7280)",
};

export default async function AdminSettingsPage() {
  const result = await getAdminSettings();

  if (!result.ok) {
    return (
      <AdminShell>
        <div className="admin-main" role="alert">
          <h1 className="admin-title">{t("admin.settings.error.title")}</h1>
          <p>{t("admin.settings.error.body")}</p>
          <Link href="/admin/settings">Retry</Link>
        </div>
      </AdminShell>
    );
  }

  const { rateCard, transportZones, appConfig } = result.data as AdminSettingsView;

  return (
    <AdminShell>
      <div className="admin-main" style={{ maxWidth: "1100px" }}>
        <p className="siza-label">{t("admin.settings.eyebrow")}</p>
        <h1 className="admin-title">{t("admin.settings.title")}</h1>
        <p style={{ marginBottom: "32px", color: "var(--color-muted, #6b7280)" }}>{t("admin.settings.intro")}</p>

        {/* ── Rate Card ──────────────────────────────────────────────── */}
        <section style={{ marginBottom: "48px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "16px" }}>{t("admin.settings.rate_card.title")}</h2>
          {rateCard.length === 0 ? (
            <p style={{ color: "var(--color-muted, #6b7280)" }}>No rate card entries found. Add them via migration.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>{t("admin.settings.rate_card.service")}</th>
                    <th style={thStyle}>{t("admin.settings.rate_card.hourly")}</th>
                    <th style={thStyle}>{t("admin.settings.rate_card.bedroom")}</th>
                    <th style={thStyle}>{t("admin.settings.rate_card.bathroom")}</th>
                    <th style={thStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {rateCard.map((row: RateCardRow) => (
                    <tr key={row.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <RateCardForm row={row} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Transport Zones ────────────────────────────────────────── */}
        <section style={{ marginBottom: "48px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "16px" }}>{t("admin.settings.transport.title")}</h2>
          {transportZones.length === 0 ? (
            <p style={{ color: "var(--color-muted, #6b7280)" }}>No transport zones configured. Add them via migration seed.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>{t("admin.settings.transport.suburb")}</th>
                    <th style={thStyle}>{t("admin.settings.transport.region")}</th>
                    <th style={thStyle}>{t("admin.settings.transport.zone")}</th>
                    <th style={thStyle}>{t("admin.settings.transport.cents")}</th>
                    <th style={thStyle}>{t("admin.settings.transport.enabled")}</th>
                    <th style={thStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {transportZones.map((row: TransportZoneRow) => (
                    <tr key={row.suburb} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <TransportZoneForm row={row} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── App Config ────────────────────────────────────────────── */}
        <section>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "16px" }}>{t("admin.settings.config.title")}</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Setting</th>
                  <th style={thStyle}>Value</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {EDITABLE_CONFIG_KEYS.map((key) => (
                  <tr key={key} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <AppConfigForm configKey={key} value={appConfig[key]} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

