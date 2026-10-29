"use client";

import { useState } from "react";
import { t } from "@/content/t";

type Service = "home" | "turnover";
type Preference = "any" | "female" | "male" | "mix";

// One Host Home/Request draft; local state only, no service calls or persistence.
export function HostHomeDraft() {
  const [service, setService] = useState<Service>("home");
  const [preference, setPreference] = useState<Preference>("any");
  const [propertyType, setPropertyType] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="host-draft">
      <header className="host-draft-header">
        <span className="host-draft-wordmark">{t("site.name")}</span>
        <span className="host-draft-context">{t("host.preview.kicker")}</span>
        <span className="host-draft-pending">TOKENS PENDING REVIEW</span>
      </header>

      <div className="host-draft-body">
        <div className="host-draft-heading">
          <p className="host-draft-eyebrow">01 / YOUR HOME</p>
          <h1>{t("host.preview.title")}</h1>
          <p className="host-draft-note">{t("host.preview.notice")}</p>
        </div>

        <form className="host-draft-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
          <section className="host-draft-section" aria-labelledby="host-draft-location-heading">
            <div className="host-draft-section-head">
              <span className="host-draft-step">01</span>
              <h2 id="host-draft-location-heading">{t("host.preview.location")}</h2>
            </div>
            <label className="host-draft-field">
              <span className="sr-only">{t("host.preview.location")}</span>
              <span className="host-draft-pin" aria-hidden="true"><PinIcon /></span>
              <input autoComplete="address-level2" name="suburb" placeholder={t("host.preview.location_placeholder")} />
              <span className="host-draft-chevron" aria-hidden="true">⌄</span>
            </label>
            <p className="host-draft-help">Your full address stays private until a helper is assigned.</p>
          </section>

          <section className="host-draft-section" aria-labelledby="host-draft-service-heading">
            <div className="host-draft-section-head">
              <span className="host-draft-step">02</span>
              <h2 id="host-draft-service-heading">{t("host.preview.services")}</h2>
            </div>
            <div className="host-draft-services" role="group" aria-labelledby="host-draft-service-heading">
              <button className="host-draft-service" type="button" aria-pressed={service === "home"} onClick={() => setService("home")}>
                <span className="host-draft-service-art" aria-hidden="true"><HomeIcon /></span>
                <span className="host-draft-service-title">{t("host.preview.home_cleaning")}</span>
                <span className="host-draft-service-meta">{t("host.book.type.standard")}</span>
              </button>
              <button className="host-draft-service" type="button" aria-pressed={service === "turnover"} onClick={() => setService("turnover")}>
                <span className="host-draft-service-art host-draft-service-art-alt" aria-hidden="true"><BedIcon /></span>
                <span className="host-draft-service-title">{t("host.preview.turnover")}</span>
                <span className="host-draft-service-meta">{t("service.airbnb_turnover.body")}</span>
              </button>
            </div>
          </section>

          <section className="host-draft-section" aria-labelledby="host-draft-schedule-heading">
            <div className="host-draft-section-head">
              <span className="host-draft-step">03</span>
              <h2 id="host-draft-schedule-heading">{t("host.preview.schedule")}</h2>
            </div>
            <div className="host-draft-fields-row">
              <label className="host-draft-control"><span>{t("host.preview.date")}</span><input name="date" type="date" /></label>
              <label className="host-draft-control"><span>{t("host.preview.time")}</span><input name="time" type="time" /></label>
            </div>
          </section>

          <section className="host-draft-section" aria-labelledby="host-draft-details-heading">
            <div className="host-draft-section-head">
              <span className="host-draft-step">04</span>
              <h2 id="host-draft-details-heading">{t("host.preview.home_details")}</h2>
              <span className="host-draft-optional">OPTIONAL</span>
            </div>
            <label className="host-draft-control">
              <span>{t("host.preview.property_type")}</span>
              <select name="property-type" value={propertyType} onChange={(event) => setPropertyType(event.target.value)}>
                <option value="">Choose home type</option>
                <option value="house">{t("host.preview.house")}</option>
                <option value="flat">{t("host.preview.flat")}</option>
                <option value="complex">{t("host.preview.complex")}</option>
              </select>
            </label>
            <p className="host-draft-help">{t("host.preview.property_type_help")}</p>
          </section>

          <section className="host-draft-pay" aria-labelledby="host-draft-pay-heading">
            <div className="host-draft-pay-top">
              <div>
                <p className="host-draft-eyebrow">05 / FAIR PAY</p>
                <h2 id="host-draft-pay-heading">{t("host.preview.pay")}</h2>
              </div>
              <span className="host-draft-pay-value">—</span>
            </div>
            <p className="host-draft-pay-pending">{t("host.preview.pay_pending")}</p>
            <p className="host-draft-help">{t("host.preview.pay_help")}</p>
          </section>

          <fieldset className="host-draft-section host-draft-preference">
            <legend>{t("host.preview.preference")}</legend>
            <div className="host-draft-preference-options">
              {(["any", "female", "male", "mix"] as const).map((value) => (
                <label className="host-draft-preference-option" key={value}>
                  <input type="radio" name="preference" value={value} checked={preference === value} onChange={() => setPreference(value)} />
                  <span>{t(`host.preview.${value}`)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <button className="host-draft-submit" type="submit">{t("host.preview.review")} <span aria-hidden="true">→</span></button>
          <p className="host-draft-submit-note" role="status" aria-live="polite">{submitted ? t("host.preview.local_result") : t("host.preview.notice")}</p>
        </form>
      </div>

      <nav className="host-draft-nav" aria-label={t("host.preview.nav_label")}>
        {(["home", "services", "activity", "account"] as const).map((item) => (
          <button aria-current={item === "home" ? "page" : undefined} disabled={item !== "home"} key={item} type="button">
            <span className="host-draft-nav-mark" aria-hidden="true">{item === "home" ? <HomeIcon /> : item === "services" ? <GridIcon /> : item === "activity" ? <ClockIcon /> : <PersonIcon />}</span>
            {t(`host.preview.nav_${item}`)}
          </button>
        ))}
      </nav>
    </main>
  );
}

function PinIcon() { return <svg viewBox="0 0 24 24" focusable="false"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.2"/></svg>; }
function HomeIcon() { return <svg viewBox="0 0 32 32" focusable="false"><path d="m4 14 12-10 12 10v14H5V14Zm8 14V17h8v11M3 14l13-11 13 11"/></svg>; }
function BedIcon() { return <svg viewBox="0 0 32 32" focusable="false"><path d="M4 25V9m0 12h24v4M4 15h24v6M8 15v-4h7v4m3 0v-4h6v4"/></svg>; }
function GridIcon() { return <svg viewBox="0 0 24 24" focusable="false"><rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><rect x="14" y="14" width="6" height="6"/></svg>; }
function ClockIcon() { return <svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/></svg>; }
function PersonIcon() { return <svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>; }
