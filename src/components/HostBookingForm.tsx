"use client";

import { useRef, useState } from "react";
import { t } from "@/content/t";
import type { CopyKey } from "@/content/copy.generated";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { estimateBooking, type BookingEstimateInput } from "@/lib/booking-estimate";
import { formatZarCents, parseZarToCents } from "@/lib/money";
import type { HostProfileView } from "@/server/views/host-profile";
import type { HostBookingFormView } from "@/server/views/booking-form";

const serviceCopyKeys: Partial<Record<string, CopyKey>> = {
  home: "service.home_cleaning.title",
  standard_clean: "host.book.type.standard",
  standard: "host.book.type.standard",
  deep_clean: "host.book.type.deep",
  deep: "host.book.type.deep",
  airbnb_turnover: "host.book.type.turnover",
  laundry: "host.book.addon.laundry",
  oven: "host.book.addon.oven",
  fridge: "host.book.addon.fridge",
  windows: "host.book.addon.windows",
  ironing: "host.book.addon.ironing",
  balcony: "host.book.addon.balcony",
};

const addonCopyKeys: Partial<Record<string, CopyKey>> = {
  oven: "host.book.addon.oven",
  fridge: "host.book.addon.fridge",
  windows: "host.book.addon.windows",
  laundry: "host.book.addon.laundry",
  ironing: "host.book.addon.ironing",
  balcony: "host.book.addon.balcony",
};

type HostBookingFormProps = {
  profile: HostProfileView;
  config: HostBookingFormView;
  turnstileSiteKey: string;
  idempotencyKey: string;
  error?: "rate_limited" | "validation" | "verify" | "not_open" | "pricing" | "failed";
};

export function HostBookingForm({ profile, config, turnstileSiteKey, idempotencyKey, error }: HostBookingFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const reviewDialogRef = useRef<HTMLDialogElement>(null);
  const knownServices = config.services.filter((service) => serviceCopyKeys[service.service]);
  const firstArea = config.areas.find((area) => area.suburb === profile.suburb) ?? config.areas[0];
  const [suburb, setSuburb] = useState(firstArea?.suburb ?? "");
  const availableServices = knownServices.filter((service) => config.areas.find((area) => area.suburb === suburb)?.serviceKeys.includes(service.service));
  const initialService = availableServices[0]?.service ?? "";
  const [selectedServices, setSelectedServices] = useState<string[]>(initialService ? [initialService] : []);
  const [primaryService, setPrimaryService] = useState(initialService);
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [sizeBand, setSizeBand] = useState<BookingEstimateInput["sizeBand"] | "">("");
  const [addons, setAddons] = useState<string[]>([]);
  const [helpersNeeded, setHelpersNeeded] = useState("1");
  const [payPerHelperZar, setPayPerHelperZar] = useState("");
  const [transportPerHelperZar, setTransportPerHelperZar] = useState("");
  const [reviewValues, setReviewValues] = useState<{ startAt: string; preference: string } | null>(null);
  const area = config.areas.find((option) => option.suburb === suburb);
  const selectedServiceSet = area?.serviceSets.find((set) => set.services.length === selectedServices.length && set.services.every((service) => selectedServices.includes(service)));
  const selectedServicesAvailable = Boolean(selectedServiceSet);
  const helperLimit = Math.min(4, selectedServiceSet?.eligibleHelperCount ?? 0);
  const primaryRate = config.services.find((service) => service.service === primaryService);
  const usableAddons = Object.keys(primaryRate?.addonMinutes ?? {}).filter((addon) => addonCopyKeys[addon]);

  const estimate = (() => {
    if (!primaryService || !selectedServices.length || !selectedServicesAvailable || selectedServices.some((service) => !availableServices.some((option) => option.service === service)) || !sizeBand || bedrooms === "" || bathrooms === "") return null;
    try {
      return estimateBooking({
        primaryService,
        services: selectedServices,
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        sizeBand,
        addons,
      }, config.services);
    } catch {
      return null;
    }
  })();

  const suggestedTransport = area ? BigInt(area.transportCents) : null;
  let displayedPay = estimate?.recommendedPayCents ?? null;
  let displayedTransport = suggestedTransport;
  try {
    displayedPay = parseZarToCents(payPerHelperZar) ?? displayedPay;
    displayedTransport = parseZarToCents(transportPerHelperZar) ?? displayedTransport;
  } catch {
    displayedPay = null;
    displayedTransport = null;
  }
  const total = displayedPay !== null && displayedTransport !== null
    ? (displayedPay + displayedTransport) * BigInt(helpersNeeded)
    : null;
  const minimumPay = estimate && config.floorPercent !== null
    ? (estimate.recommendedPayCents * BigInt(config.floorPercent) + BigInt(99)) / BigInt(100)
    : null;
  const errorKey: Record<NonNullable<HostBookingFormProps["error"]>, CopyKey> = {
    rate_limited: "host.book.error.rate_limited",
    validation: "host.book.error.validation",
    verify: "host.book.error.verify",
    not_open: "host.book.error.not_open",
    pricing: "host.book.error.pricing",
    failed: "host.book.error.failed",
  };

  function toggleService(service: string, checked: boolean) {
    const next = checked ? [...selectedServices, service] : selectedServices.filter((item) => item !== service);
    const combination = area?.serviceSets.find((set) => set.services.length === next.length && set.services.every((item) => next.includes(item)));
    if (checked && !combination) return;
    setSelectedServices(next);
    if (combination) setHelpersNeeded((current) => String(Math.min(Number(current), combination.eligibleHelperCount)));
    if (!primaryService || !next.includes(primaryService)) setPrimaryService(next[0] ?? "");
  }

  function toggleAddon(addon: string, checked: boolean) {
    setAddons((current) => checked ? [...current, addon] : current.filter((item) => item !== addon));
  }

  function openReview() {
    const form = formRef.current;
    if (!form?.reportValidity()) return;
    const formData = new FormData(form);
    setReviewValues({
      startAt: String(formData.get("startAt") ?? ""),
      preference: String(formData.get("genderPreference") ?? "any"),
    });
    reviewDialogRef.current?.showModal();
  }

  const errorCopy = error ? t(errorKey[error]) : "";
  const serviceOptionsAvailable = availableServices.length > 0;
  const formattedReviewStart = reviewValues?.startAt
    ? new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Johannesburg" }).format(new Date(`${reviewValues.startAt}:00+02:00`))
    : "";

  return (
    <main className="host-draft">
      <header className="host-draft-header"><a className="host-draft-wordmark" href="/app">siZa.</a><span className="host-draft-context">{t("host.book.title")}</span></header>
      <div className="host-draft-body">
        <div className="host-draft-heading">
          <p className="host-draft-eyebrow">{t("host.book.title")}</p>
          <h1>{t("host.book.title")}</h1>
          <p className="host-draft-note">{t("host.book.body")}</p>
        </div>
        {errorCopy ? <p className="phase-a-notice" role="alert">{errorCopy}</p> : null}
        {!serviceOptionsAvailable || !config.areas.length || config.floorPercent === null ? <p className="phase-a-notice" role="status">{t("host.book.estimate.unavailable")}</p> : null}
        <form ref={formRef} className="host-draft-form" action="/api/bookings" method="post">
          <fieldset className="host-draft-section">
            <div className="host-draft-section-head"><span className="host-draft-step" aria-hidden="true">01</span><h2>{t("host.book.services")}</h2></div>
            <label className="host-draft-control"><span>{t("host.label.address")}</span><input name="addressLine" required maxLength={300} autoComplete="street-address" defaultValue={profile.addressLine} /></label>
            <label className="host-draft-control"><span>{t("host.label.suburb")}</span><select name="suburb" required value={suburb} onChange={(event) => {
              const nextSuburb = event.target.value;
              const nextArea = config.areas.find((item) => item.suburb === nextSuburb);
              const currentCombination = nextArea?.serviceSets.find((set) => set.services.length === selectedServices.length && set.services.every((service) => selectedServices.includes(service)));
              const nextCombination = currentCombination ?? nextArea?.serviceSets.find((set) => set.services.length === 1);
              const nextSelected = nextCombination?.services ?? [];
              setSuburb(nextSuburb);
              setSelectedServices(nextSelected);
              setHelpersNeeded((current) => String(Math.min(Number(current), nextCombination?.eligibleHelperCount ?? 1)));
              if (!nextSelected.includes(primaryService)) setPrimaryService(nextSelected[0] ?? "");
              setAddons([]);
            }}>
              {config.areas.map((option) => <option key={option.suburb} value={option.suburb}>{option.suburb}</option>)}
            </select></label>
            <input name="city" type="hidden" value={profile.city || "Johannesburg"} />
            <fieldset className="host-draft-section">
              <legend>{t("host.book.services")}</legend>
              <div className="host-draft-services">
                {availableServices.map((service) => <label key={service.service} className="host-draft-service">
                  <input name="services" type="checkbox" value={service.service} checked={selectedServices.includes(service.service)} disabled={!selectedServices.includes(service.service) && !area?.serviceSets.some((set) => set.services.length === selectedServices.length + 1 && set.services.includes(service.service) && selectedServices.every((selected) => set.services.includes(selected)))} onChange={(event) => toggleService(service.service, event.target.checked)} />
                  <span className="host-draft-service-title">{t(serviceCopyKeys[service.service]!)}</span>
                </label>)}
              </div>
            </fieldset>
            {selectedServices.length > 1 ? <label className="host-draft-control"><span>{t("host.book.type")}</span><select name="primaryService" value={primaryService} onChange={(event) => { setPrimaryService(event.target.value); setAddons([]); }}>
              {selectedServices.map((service) => <option key={service} value={service}>{t(serviceCopyKeys[service]!)}</option>)}
            </select></label> : <input name="primaryService" type="hidden" value={primaryService} />}
          </fieldset>

          <fieldset className="host-draft-section">
            <div className="host-draft-section-head"><span className="host-draft-step" aria-hidden="true">02</span><h2>{t("host.book.type")}</h2></div>
            <div className="host-draft-fields-row">
              <label className="host-draft-control"><span>{t("host.book.bedrooms")}</span><input name="bedrooms" required type="number" min="0" max="50" inputMode="numeric" value={bedrooms} onChange={(event) => setBedrooms(event.target.value)} /></label>
              <label className="host-draft-control"><span>{t("host.book.bathrooms")}</span><input name="bathrooms" required type="number" min="0" max="50" inputMode="numeric" value={bathrooms} onChange={(event) => setBathrooms(event.target.value)} /></label>
            </div>
            <label className="host-draft-control"><span>{t("host.book.size_band")}</span><select name="sizeBand" required value={sizeBand} onChange={(event) => setSizeBand(event.target.value as BookingEstimateInput["sizeBand"] | "")}>
              <option value="">—</option>
              <option value="small">{t("host.book.size_band.small")}</option>
              <option value="medium">{t("host.book.size_band.medium")}</option>
              <option value="large">{t("host.book.size_band.large")}</option>
            </select></label>
            {usableAddons.length ? <fieldset className="host-draft-section">
              <legend>{t("host.book.addons")}</legend>
              {usableAddons.map((addon) => <label className="phase-a-check" key={addon}><input name="addons" type="checkbox" value={addon} checked={addons.includes(addon)} onChange={(event) => toggleAddon(addon, event.target.checked)} />{t(addonCopyKeys[addon]!)}</label>)}
            </fieldset> : null}
          </fieldset>

          <fieldset className="host-draft-section">
            <div className="host-draft-section-head"><span className="host-draft-step" aria-hidden="true">03</span><h2>{t("host.book.when")}</h2></div>
            <label className="host-draft-control"><span>{t("host.label.start")}</span><input name="startAt" required type="datetime-local" /></label>
            <label className="host-draft-control"><span>{t("host.book.helpers")}</span><select name="helpersNeeded" value={helpersNeeded} onChange={(event) => setHelpersNeeded(event.target.value)}>{[1, 2, 3, 4].filter((count) => count <= helperLimit).map((count) => <option key={count} value={count}>{count}</option>)}</select></label>
            {config.genderMatchingEnabled ? <fieldset className="host-draft-section host-draft-preference">
              <legend>{t("host.book.gender")}</legend>
              <div className="host-draft-preference-options">
                {(["any", "female", "male", "mix"] as const).map((preference) => <label className="host-draft-preference-option" key={preference}><input type="radio" name="genderPreference" value={preference} defaultChecked={preference === "any"} /><span>{t(`host.book.gender.${preference}` as CopyKey)}</span></label>)}
              </div>
              <p className="phase-a-help">{t("host.book.gender.help")}</p>
            </fieldset> : <input name="genderPreference" type="hidden" value="any" />}
            <label className="host-draft-control"><span>{t("host.book.notes")}</span><textarea name="accessNotes" maxLength={2000} rows={3} defaultValue={profile.notesDefault} /></label>
          </fieldset>

          <section className="host-draft-pay" aria-labelledby="host-book-estimate-title">
            <div className="host-draft-pay-top"><div><p className="host-draft-eyebrow">{t("host.book.total")}</p><h2 id="host-book-estimate-title" className="host-draft-pay-value">{total === null ? "—" : formatZarCents(total)}</h2></div></div>
            {estimate ? <p className="host-draft-pay-pending" aria-live="polite">{t("host.book.estimate.duration", { hours: String(Math.floor(estimate.estimatedMinutes / 60)), minutes: String(estimate.estimatedMinutes % 60).padStart(2, "0") })}</p> : <p className="host-draft-pay-pending" role="status">{t("host.book.estimate.unavailable")}</p>}
            {estimate ? <p className="host-draft-pay-pending">{t("host.book.estimate.pay", { amount: formatZarCents(estimate.recommendedPayCents) })}</p> : null}
            {minimumPay !== null ? <p className="host-draft-pay-pending">{t("host.book.pay.minimum", { amount: formatZarCents(minimumPay) })}</p> : null}
            <label className="host-draft-control"><span>{t("host.book.pay")}</span><input name="payPerHelperZar" type="number" min="0" step="0.01" inputMode="decimal" value={payPerHelperZar} onChange={(event) => setPayPerHelperZar(event.target.value)} /></label>
            <p className="host-draft-help">{t("host.book.pay.help")}</p>
            <label className="host-draft-control"><span>{t("host.book.transport")}</span><input name="transportPerHelperZar" type="number" min="0" step="0.01" inputMode="decimal" value={transportPerHelperZar} onChange={(event) => setTransportPerHelperZar(event.target.value)} /></label>
            <p className="host-draft-help">{t("host.book.transport.help")}</p>
          </section>

          <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
          <TurnstileWidget siteKey={turnstileSiteKey} />
          <label className="phase-a-check"><input type="checkbox" name="outsideAgreementNotice" required />{t("notice.outside")}</label>
          <label className="phase-a-check"><input type="checkbox" name="addressSharingNotice" required />{t("notice.address")}</label>
          <label className="phase-a-check"><input type="checkbox" name="paymentNotice" required />{t("notice.payment.phase_a")}</label>
          <button className="host-draft-submit" type="button" onClick={openReview} disabled={!serviceOptionsAvailable || !config.areas.length || config.floorPercent === null || !estimate || !turnstileSiteKey}>{t("host.book.review")}<span aria-hidden="true">↗</span></button>
          <dialog ref={reviewDialogRef} className="host-draft-review" aria-labelledby="host-book-review-title">
            <h2 id="host-book-review-title">{t("host.review.title")}</h2>
            <dl>
              <dt>{t("host.review.services")}</dt>
              <dd>{selectedServices.map((service) => t(serviceCopyKeys[service]!)).join(", ")}</dd>
              <dt>{t("host.review.start")}</dt>
              <dd>{formattedReviewStart}</dd>
              <dt>{t("host.review.helpers")}</dt>
              <dd>{helpersNeeded}</dd>
              <dt>{t("host.review.preference")}</dt>
              <dd>{t(`host.book.gender.${reviewValues?.preference ?? "any"}` as CopyKey)}</dd>
              <dt>{t("host.review.estimate")}</dt>
              <dd>{estimate ? t("host.book.estimate.duration", { hours: String(Math.floor(estimate.estimatedMinutes / 60)), minutes: String(estimate.estimatedMinutes % 60).padStart(2, "0") }) : ""}</dd>
              <dt>{t("host.review.pay")}</dt>
              <dd>{displayedPay === null ? "" : formatZarCents(displayedPay)}</dd>
              <dt>{t("host.review.transport")}</dt>
              <dd>{displayedTransport === null ? "" : formatZarCents(displayedTransport)}</dd>
              <dt>{t("host.review.total")}</dt>
              <dd>{total === null ? "" : formatZarCents(total)}</dd>
            </dl>
            <div className="host-draft-review-actions">
              <button className="host-draft-review-edit" type="button" onClick={() => reviewDialogRef.current?.close()}>{t("host.review.edit")}</button>
              <button className="host-draft-submit" type="submit" disabled={!selectedServicesAvailable}>{t("host.review.submit")}<span aria-hidden="true">↗</span></button>
            </div>
          </dialog>
        </form>
      </div>
    </main>
  );
}
