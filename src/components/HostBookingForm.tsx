"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Building,
  Home as HomeIcon,
  Castle,
  KeyRound,
  Sparkles,
  Calendar as CalendarIcon,
  Check,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Wrench,
  Flower2,
  DollarSign,
  Info,
} from "lucide-react";
import { t } from "@/content/t";
import type { CopyKey } from "@/content/copy.generated";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { estimateBooking, type BookingEstimateInput } from "@/lib/booking-estimate";
import { formatZarCents, parseZarToCents } from "@/lib/money";
import type { HostProfileView } from "@/server/views/host-profile";
import type { HostBookingFormView } from "@/server/views/booking-form";
import { HostFloatingDock } from "@/components/HostFloatingDock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

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

type PropertyType = "flat" | "complex" | "house";

export function HostBookingForm({
  profile,
  config,
  turnstileSiteKey,
  idempotencyKey,
  error,
}: HostBookingFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const reviewDialogRef = useRef<HTMLDialogElement>(null);
  const suburbSelectId = useId();

  const knownServices = config.services.filter((service) => serviceCopyKeys[service.service]);
  const firstArea = config.areas.find((area) => area.suburb === profile.suburb) ?? config.areas[0];
  const [suburb, setSuburb] = useState(firstArea?.suburb ?? "");
  const availableServices = knownServices.filter((service) =>
    config.areas.find((area) => area.suburb === suburb)?.serviceKeys.includes(service.service)
  );
  const initialService = availableServices[0]?.service ?? "";
  const [selectedServices, setSelectedServices] = useState<string[]>(initialService ? [initialService] : []);
  const [primaryService, setPrimaryService] = useState(initialService);

  // Property type and access
  const [propertyType, setPropertyType] = useState<PropertyType>("flat");
  const [complexName, setComplexName] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [gateCode, setGateCode] = useState("");
  const [customNotes, setCustomNotes] = useState(profile.notesDefault ?? "");

  // Rooms and size
  const [bedrooms, setBedrooms] = useState("2");
  const [bathrooms, setBathrooms] = useState("1");
  const [sizeBand, setSizeBand] = useState<BookingEstimateInput["sizeBand"] | "">("medium");
  const [addons, setAddons] = useState<string[]>([]);

  // Helpers & scheduling
  const [helpersNeeded, setHelpersNeeded] = useState("1");
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    return tomorrow;
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("08:00");
  const [startAtString, setStartAtString] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yr = tomorrow.getFullYear();
    const mo = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const da = String(tomorrow.getDate()).padStart(2, "0");
    return `${yr}-${mo}-${da}T08:00`;
  });

  // Rates
  const [payPerHelperZar, setPayPerHelperZar] = useState("");
  const [transportPerHelperZar, setTransportPerHelperZar] = useState("");
  const [reviewValues, setReviewValues] = useState<{ startAt: string; preference: string } | null>(null);

  const area = config.areas.find((option) => option.suburb === suburb);
  const selectedServiceSet = area?.serviceSets.find(
    (set) =>
      set.services.length === selectedServices.length &&
      set.services.every((service) => selectedServices.includes(service))
  );
  const selectedServicesAvailable = Boolean(selectedServiceSet);
  const helperLimit = Math.min(4, selectedServiceSet?.eligibleHelperCount ?? 0);
  const primaryRate = config.services.find((service) => service.service === primaryService);
  const usableAddons = Object.keys(primaryRate?.addonMinutes ?? {}).filter((addon) => addonCopyKeys[addon]);

  const estimate = (() => {
    if (
      !primaryService ||
      !selectedServices.length ||
      !selectedServicesAvailable ||
      selectedServices.some((service) => !availableServices.some((option) => option.service === service)) ||
      !sizeBand ||
      bedrooms === "" ||
      bathrooms === ""
    )
      return null;
    try {
      return estimateBooking(
        {
          primaryService,
          services: selectedServices,
          bedrooms: Number(bedrooms),
          bathrooms: Number(bathrooms),
          sizeBand,
          addons,
        },
        config.services
      );
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
  const total =
    displayedPay !== null && displayedTransport !== null
      ? (displayedPay + displayedTransport) * BigInt(helpersNeeded)
      : null;
  const minimumPay =
    estimate && config.floorPercent !== null
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

  function updateDateTime(date: Date, time: string) {
    const yr = date.getFullYear();
    const mo = String(date.getMonth() + 1).padStart(2, "0");
    const da = String(date.getDate()).padStart(2, "0");
    setStartAtString(`${yr}-${mo}-${da}T${time}`);
  }

  function handleDateSelect(date: Date | undefined) {
    if (!date) return;
    setSelectedDate(date);
    updateDateTime(date, selectedTimeSlot);
  }

  function handleTimeSlotSelect(time: string) {
    setSelectedTimeSlot(time);
    updateDateTime(selectedDate, time);
  }

  function toggleService(service: string, checked: boolean) {
    const next = checked ? [...selectedServices, service] : selectedServices.filter((item) => item !== service);
    const combination = area?.serviceSets.find(
      (set) => set.services.length === next.length && set.services.every((item) => next.includes(item))
    );
    if (checked && !combination) return;
    setSelectedServices(next);
    if (combination) setHelpersNeeded((current) => String(Math.min(Number(current), combination.eligibleHelperCount)));
    if (!primaryService || !next.includes(primaryService)) setPrimaryService(next[0] ?? "");
  }

  function toggleAddon(addon: string, checked: boolean) {
    setAddons((current) => (checked ? [...current, addon] : current.filter((item) => item !== addon)));
  }

  // Generate composite access notes
  const computedAccessNotes = (() => {
    const parts: string[] = [];
    if (propertyType === "complex") {
      parts.push(`[Complex: ${complexName || "Gated"}${unitNumber ? `, Unit ${unitNumber}` : ""}${gateCode ? `, Gate code: ${gateCode}` : ""}]`);
    } else if (propertyType === "flat") {
      parts.push(`[Flat/Apartment${unitNumber ? `, Unit ${unitNumber}` : ""}${gateCode ? `, Buzzer: ${gateCode}` : ""}]`);
    } else {
      parts.push(`[Standalone House${gateCode ? `, Gate code: ${gateCode}` : ""}]`);
    }
    if (customNotes.trim()) parts.push(customNotes.trim());
    return parts.join(" ");
  })();

  function openReview() {
    const form = formRef.current;
    if (!form?.reportValidity()) return;
    const formData = new FormData(form);
    setReviewValues({
      startAt: String(formData.get("startAt") ?? startAtString),
      preference: String(formData.get("genderPreference") ?? "any"),
    });
    reviewDialogRef.current?.showModal();
  }

  const errorCopy = error ? t(errorKey[error]) : "";
  const serviceOptionsAvailable = availableServices.length > 0;
  const formattedReviewStart = reviewValues?.startAt
    ? new Intl.DateTimeFormat("en-ZA", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Africa/Johannesburg",
      }).format(new Date(`${reviewValues.startAt}:00+02:00`))
    : "";

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-black pb-36 font-sans">
      {/* Top Header - UntitledUI Style */}
      <header className="sticky top-0 z-30 bg-black/95 text-white backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="text-lg font-bold tracking-tighter hover:opacity-80 transition-opacity"
            >
              siZa.
            </Link>
            <span className="text-white/30" aria-hidden="true">/</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              {t("host.book.title")}
            </span>
          </div>
          <Badge variant="outline" className="text-white/80 border-white/20 text-[11px] font-medium hidden sm:inline-flex">
            Fair Rotation · First Accept
          </Badge>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-16">
        {/* Page Hero Intro */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Johannesburg Pilot Area
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-black mb-2">
            {t("host.book.title")}
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 max-w-xl">
            {t("host.book.body")}
          </p>
        </div>

        {/* Global Notices / Errors */}
        {errorCopy ? (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3" role="alert">
            <AlertCircle className="size-5 shrink-0 mt-0.5 text-red-600" />
            <p className="text-sm font-medium">{errorCopy}</p>
          </div>
        ) : null}

        {(!serviceOptionsAvailable || !config.areas.length || config.floorPercent === null) ? (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3" role="status">
            <Info className="size-5 shrink-0 mt-0.5 text-amber-600" />
            <p className="text-sm font-medium">{t("host.book.estimate.unavailable")}</p>
          </div>
        ) : null}

        <form ref={formRef} className="space-y-8" action="/api/bookings" method="post">
          {/* STEP 1: Location & Property Type */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-neutral-200/80 space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-full bg-black text-white text-xs font-bold">
                  01
                </span>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
                    Location &amp; Property
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Where should the helpers arrive?
                  </p>
                </div>
              </div>
              <MapPin className="size-5 text-neutral-400" />
            </div>

            {/* Suburb & Address Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor={suburbSelectId} className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                  {t("host.label.suburb")}
                </label>
                <div className="relative">
                  <select
                    id={suburbSelectId}
                    name="suburb"
                    required
                    value={suburb}
                    onChange={(event) => {
                      const nextSuburb = event.target.value;
                      const nextArea = config.areas.find((item) => item.suburb === nextSuburb);
                      const currentCombination = nextArea?.serviceSets.find(
                        (set) =>
                          set.services.length === selectedServices.length &&
                          set.services.every((service) => selectedServices.includes(service))
                      );
                      const nextCombination =
                        currentCombination ?? nextArea?.serviceSets.find((set) => set.services.length === 1);
                      const nextSelected = nextCombination?.services ?? [];
                      setSuburb(nextSuburb);
                      setSelectedServices(nextSelected);
                      setHelpersNeeded((current) =>
                        String(Math.min(Number(current), nextCombination?.eligibleHelperCount ?? 1))
                      );
                      if (!nextSelected.includes(primaryService)) setPrimaryService(nextSelected[0] ?? "");
                      setAddons([]);
                    }}
                    className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    {config.areas.map((option) => (
                      <option key={option.suburb} value={option.suburb}>
                        {option.suburb}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                  {t("host.label.address")}
                </label>
                <div className="relative">
                  <input
                    name="addressLine"
                    required
                    maxLength={300}
                    autoComplete="street-address"
                    defaultValue={profile.addressLine}
                    placeholder="e.g. 14 Jan Smuts Avenue"
                    className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
            </div>

            <input name="city" type="hidden" value={profile.city || "Johannesburg"} />

            {/* Property Type Selection (Flat, Complex, House) */}
            <div className="pt-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-2.5">
                Property Type &amp; Access
              </label>
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                {[
                  { id: "flat", label: "Flat / Unit", icon: Building },
                  { id: "complex", label: "Gated Complex", icon: Castle },
                  { id: "house", label: "House", icon: HomeIcon },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = propertyType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPropertyType(item.id as PropertyType)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border transition-all text-center",
                        isSelected
                          ? "bg-black text-white border-black shadow-sm font-medium"
                          : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                      )}
                    >
                      <Icon className={cn("size-5", isSelected ? "text-white" : "text-neutral-500")} />
                      <span className="text-xs tracking-tight">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Gate / Intercom Code Inputs */}
              <div className="mt-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-neutral-700">
                  <KeyRound className="size-4 text-neutral-500" />
                  <span>
                    {propertyType === "complex"
                      ? "Complex Name & Gate Access Code"
                      : propertyType === "flat"
                      ? "Apartment Number & Intercom / Buzzer"
                      : "Street House Number & Gate Buzzer"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {propertyType === "complex" && (
                    <input
                      type="text"
                      placeholder="Complex / Estate Name"
                      value={complexName}
                      onChange={(e) => setComplexName(e.target.value)}
                      className="h-10 px-3 bg-white border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  )}
                  <input
                    type="text"
                    placeholder="Unit / Door Number"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    className="h-10 px-3 bg-white border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <input
                    type="text"
                    placeholder="Gate / Intercom Code (e.g. #1234)"
                    value={gateCode}
                    onChange={(e) => setGateCode(e.target.value)}
                    className="h-10 px-3 bg-white border border-neutral-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <p className="text-[11px] text-neutral-500">
                  Secured: Gate and intercom codes are only revealed to your assigned helper after arrival check-in.
                </p>
              </div>
            </div>
          </section>

          {/* STEP 2: Featured Services & Room Sizing */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-neutral-200/80 space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-full bg-black text-white text-xs font-bold">
                  02
                </span>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
                    {t("host.book.services")}
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Choose one or more services for this request.
                  </p>
                </div>
              </div>
              <Sparkles className="size-5 text-neutral-400" />
            </div>

            {/* Apple Cards Carousel for Services */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Featured Services ({availableServices.length} available)
                </span>
              </div>

              <Carousel className="w-full">
                <CarouselContent className="-ml-3">
                  {availableServices.map((service) => {
                    const isChecked = selectedServices.includes(service.service);
                    const canCheck =
                      isChecked ||
                      area?.serviceSets.some(
                        (set) =>
                          set.services.length === selectedServices.length + 1 &&
                          set.services.includes(service.service) &&
                          selectedServices.every((selected) => set.services.includes(selected))
                      );

                    return (
                      <CarouselItem key={service.service} className="pl-3 basis-1/2 sm:basis-1/3">
                        <label
                          className={cn(
                            "relative flex flex-col justify-between h-36 p-4 rounded-xl border cursor-pointer transition-all select-none",
                            isChecked
                              ? "bg-black text-white border-black shadow-md ring-2 ring-black"
                              : canCheck
                              ? "bg-neutral-50 border-neutral-200 text-neutral-800 hover:border-neutral-400"
                              : "bg-neutral-100/60 border-neutral-200 text-neutral-400 opacity-60 cursor-not-allowed"
                          )}
                        >
                          <input
                            name="services"
                            type="checkbox"
                            value={service.service}
                            checked={isChecked}
                            disabled={!canCheck}
                            onChange={(event) => toggleService(service.service, event.target.checked)}
                            className="sr-only"
                          />

                          <div className="flex items-start justify-between">
                            {service.service === "home" ? (
                              <Sparkles className={cn("size-5", isChecked ? "text-white" : "text-neutral-500")} />
                            ) : service.service.includes("deep") ? (
                              <ShieldCheck className={cn("size-5", isChecked ? "text-white" : "text-neutral-500")} />
                            ) : service.service.includes("turnover") ? (
                              <Building className={cn("size-5", isChecked ? "text-white" : "text-neutral-500")} />
                            ) : service.service === "garden" ? (
                              <Flower2 className={cn("size-5", isChecked ? "text-white" : "text-neutral-500")} />
                            ) : (
                              <Wrench className={cn("size-5", isChecked ? "text-white" : "text-neutral-500")} />
                            )}

                            <span
                              className={cn(
                                "flex size-5 items-center justify-center rounded-full border text-[10px]",
                                isChecked
                                  ? "bg-white text-black border-white font-bold"
                                  : "border-neutral-300 text-transparent"
                              )}
                            >
                              <Check className="size-3 stroke-[3]" />
                            </span>
                          </div>

                          <div>
                            <p className="text-xs sm:text-sm font-semibold tracking-tight leading-snug">
                              {t(serviceCopyKeys[service.service]!)}
                            </p>
                            <p className={cn("text-[10px] mt-0.5", isChecked ? "text-neutral-300" : "text-neutral-500")}>
                              {formatZarCents(service.hourlyCents)}/hr floor
                            </p>
                          </div>
                        </label>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <div className="hidden sm:flex items-center justify-end gap-2 mt-2">
                  <CarouselPrevious type="button" className="static translate-y-0 size-7" />
                  <CarouselNext type="button" className="static translate-y-0 size-7" />
                </div>
              </Carousel>
            </div>

            {/* Primary Service Selector (if multiple selected) */}
            {selectedServices.length > 1 ? (
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                  {t("host.book.type")} (Lead Focus)
                </label>
                <select
                  name="primaryService"
                  value={primaryService}
                  onChange={(event) => {
                    setPrimaryService(event.target.value);
                    setAddons([]);
                  }}
                  className="w-full h-10 px-3 bg-white border border-neutral-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black"
                >
                  {selectedServices.map((service) => (
                    <option key={service} value={service}>
                      {t(serviceCopyKeys[service]!)}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <input name="primaryService" type="hidden" value={primaryService} />
            )}

            {/* Bedrooms, Bathrooms, and Property Size Steppers */}
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bedrooms */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                    {t("host.book.bedrooms")}
                  </label>
                  <div className="flex items-center gap-2">
                    {["0", "1", "2", "3", "4", "5"].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setBedrooms(count)}
                        className={cn(
                          "flex-1 h-10 rounded-lg text-xs font-semibold border transition-all",
                          bedrooms === count
                            ? "bg-black text-white border-black shadow-sm"
                            : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                        )}
                      >
                        {count}
                      </button>
                    ))}
                    <input
                      name="bedrooms"
                      required
                      type="hidden"
                      value={bedrooms}
                    />
                  </div>
                </div>

                {/* Bathrooms */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                    {t("host.book.bathrooms")}
                  </label>
                  <div className="flex items-center gap-2">
                    {["1", "2", "3", "4", "5"].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setBathrooms(count)}
                        className={cn(
                          "flex-1 h-10 rounded-lg text-xs font-semibold border transition-all",
                          bathrooms === count
                            ? "bg-black text-white border-black shadow-sm"
                            : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                        )}
                      >
                        {count}
                      </button>
                    ))}
                    <input
                      name="bathrooms"
                      required
                      type="hidden"
                      value={bathrooms}
                    />
                  </div>
                </div>
              </div>

              {/* Home Size Band */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-2">
                  {t("host.book.size_band")}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "small", label: t("host.book.size_band.small"), hint: "Compact · 1-2 rooms" },
                    { id: "medium", label: t("host.book.size_band.medium"), hint: "Standard · 3-4 rooms" },
                    { id: "large", label: t("host.book.size_band.large"), hint: "Spacious · 5+ rooms" },
                  ].map((band) => (
                    <button
                      key={band.id}
                      type="button"
                      onClick={() => setSizeBand(band.id as BookingEstimateInput["sizeBand"])}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all",
                        sizeBand === band.id
                          ? "bg-black text-white border-black shadow-sm"
                          : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                      )}
                    >
                      <p className="text-xs font-semibold">{band.label}</p>
                      <p className={cn("text-[10px] mt-0.5", sizeBand === band.id ? "text-neutral-300" : "text-neutral-500")}>
                        {band.hint}
                      </p>
                    </button>
                  ))}
                </div>
                <select
                  name="sizeBand"
                  required
                  value={sizeBand}
                  onChange={(e) => setSizeBand(e.target.value as BookingEstimateInput["sizeBand"])}
                  className="sr-only"
                >
                  <option value="">—</option>
                  <option value="small">small</option>
                  <option value="medium">medium</option>
                  <option value="large">large</option>
                </select>
              </div>

              {/* Addons / Extras */}
              {usableAddons.length > 0 && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-2">
                    {t("host.book.addons")} (Optional Extras)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {usableAddons.map((addon) => {
                      const isChecked = addons.includes(addon);
                      return (
                        <label
                          key={addon}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition-all select-none",
                            isChecked
                              ? "bg-black text-white border-black shadow-sm"
                              : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                          )}
                        >
                          <input
                            name="addons"
                            type="checkbox"
                            value={addon}
                            checked={isChecked}
                            onChange={(event) => toggleAddon(addon, event.target.checked)}
                            className="sr-only"
                          />
                          <span
                            className={cn(
                              "size-3.5 rounded-full border flex items-center justify-center text-[8px]",
                              isChecked ? "bg-white text-black border-white" : "border-neutral-400"
                            )}
                          >
                            {isChecked && <Check className="size-2.5 stroke-[3]" />}
                          </span>
                          <span>{t(addonCopyKeys[addon]!)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* STEP 3: Date, Time & Helpers */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-neutral-200/80 space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-full bg-black text-white text-xs font-bold">
                  03
                </span>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
                    {t("host.book.when")}
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Schedule arrival and team size.
                  </p>
                </div>
              </div>
              <CalendarIcon className="size-5 text-neutral-400" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Calendar Date Picker */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                  Arrival Date
                </label>
                <Popover>
                  <PopoverTrigger
                    type="button"
                    className="w-full h-11 px-3.5 flex items-center justify-start text-left font-normal bg-neutral-50 border border-neutral-300 rounded-xl hover:bg-neutral-100 transition-colors"
                  >
                    <CalendarIcon className="mr-2 size-4 text-neutral-500" />
                    <span className="text-sm font-medium text-neutral-900">
                      {new Intl.DateTimeFormat("en-ZA", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(selectedDate)}
                    </span>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Slots */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                  Arrival Window
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["07:30", "08:00", "08:30", "09:00", "10:00", "11:30", "13:00", "14:00"].map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleTimeSlotSelect(time)}
                      className={cn(
                        "h-10 rounded-lg text-xs font-mono font-medium border transition-all",
                        selectedTimeSlot === time
                          ? "bg-black text-white border-black shadow-sm"
                          : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                      )}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Hidden / Native startAt input to satisfy form submission & tests */}
            <input
              name="startAt"
              required
              type="datetime-local"
              value={startAtString}
              onChange={(e) => setStartAtString(e.target.value)}
              className="sr-only"
            />

            {/* Helpers Needed & Team Gender Preference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                  {t("host.book.helpers")} (Team Size)
                </label>
                <div className="relative">
                  <select
                    name="helpersNeeded"
                    value={helpersNeeded}
                    onChange={(event) => setHelpersNeeded(event.target.value)}
                    className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    {[1, 2, 3, 4]
                      .filter((count) => count <= helperLimit)
                      .map((count) => (
                        <option key={count} value={count}>
                          {count}
                        </option>
                      ))}
                  </select>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Fair rotation: Up to {helperLimit} helpers available in {suburb}.
                </p>
              </div>

              <div>
                {config.genderMatchingEnabled ? (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                      {t("host.book.gender")}
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(["any", "female", "male", "mix"] as const).map((preference) => (
                        <label
                          key={preference}
                          className="relative flex items-center justify-center h-11 rounded-xl border cursor-pointer text-xs font-medium bg-neutral-50 border-neutral-200 has-checked:bg-black has-checked:text-white has-checked:border-black transition-all"
                        >
                          <input
                            type="radio"
                            name="genderPreference"
                            value={preference}
                            defaultChecked={preference === "any"}
                            className="sr-only"
                          />
                          <span>{t(`host.book.gender.${preference}` as CopyKey)}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1">{t("host.book.gender.help")}</p>
                  </div>
                ) : (
                  <input name="genderPreference" type="hidden" value="any" />
                )}
              </div>
            </div>

            {/* Access Notes */}
            <div className="pt-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                {t("host.book.notes")} (Entry &amp; Special Instructions)
              </label>
              <textarea
                name="accessNotes"
                maxLength={2000}
                rows={2}
                value={computedAccessNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Gate buzzer, parking, dogs on premises, key collection..."
                className="w-full p-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </section>

          {/* STEP 4: Rates & Payout Calculation */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-neutral-200/80 space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-full bg-black text-white text-xs font-bold">
                  04
                </span>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
                    Transparent Rates &amp; Estimate
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Direct cash or EFT on arrival.
                  </p>
                </div>
              </div>
              <DollarSign className="size-5 text-neutral-400" />
            </div>

            {/* Highlighted Total Box */}
            <div className="p-5 rounded-2xl bg-black text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  {t("host.book.total")}
                </p>
                <h3 id="host-book-estimate-title" className="text-3xl sm:text-4xl font-bold tracking-tight mt-1">
                  {total === null ? "—" : formatZarCents(total)}
                </h3>
              </div>

              <div className="space-y-1 text-xs text-neutral-300">
                {estimate ? (
                  <p className="font-medium text-emerald-400">
                    {t("host.book.estimate.duration", {
                      hours: String(Math.floor(estimate.estimatedMinutes / 60)),
                      minutes: String(estimate.estimatedMinutes % 60).padStart(2, "0"),
                    })}
                  </p>
                ) : (
                  <p className="text-neutral-400" role="status">
                    {t("host.book.estimate.unavailable")}
                  </p>
                )}
                {estimate && (
                  <p className="text-neutral-300">
                    Recommended helper pay: {formatZarCents(estimate.recommendedPayCents)}
                  </p>
                )}
                {minimumPay !== null && (
                  <p className="text-neutral-400">
                    Floor: {formatZarCents(minimumPay)}
                  </p>
                )}
              </div>
            </div>

            {/* Custom Pay and Transport Adjusters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                  {t("host.book.pay")} (per helper in ZAR)
                </label>
                <input
                  name="payPerHelperZar"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={payPerHelperZar}
                  onChange={(event) => setPayPerHelperZar(event.target.value)}
                  placeholder={estimate ? (Number(estimate.recommendedPayCents) / 100).toFixed(2) : "300.00"}
                  className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-black"
                />
                <p className="text-[11px] text-neutral-500 mt-1">{t("host.book.pay.help")}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                  {t("host.book.transport")} (per helper in ZAR)
                </label>
                <input
                  name="transportPerHelperZar"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={transportPerHelperZar}
                  onChange={(event) => setTransportPerHelperZar(event.target.value)}
                  placeholder={suggestedTransport ? (Number(suggestedTransport) / 100).toFixed(2) : "50.00"}
                  className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-black"
                />
                <p className="text-[11px] text-neutral-500 mt-1">{t("host.book.transport.help")}</p>
              </div>
            </div>
          </section>

          {/* Hidden Required Payload */}
          <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
          <TurnstileWidget siteKey={turnstileSiteKey} />

          {/* Statutory Notices */}
          <div className="p-5 rounded-2xl bg-neutral-100 border border-neutral-200/80 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
              Important Notices
            </p>

            <label className="flex items-start gap-3 cursor-pointer text-xs text-neutral-700 leading-relaxed">
              <input
                type="checkbox"
                name="outsideAgreementNotice"
                required
                defaultChecked
                className="mt-0.5 size-4 rounded border-neutral-300 text-black focus:ring-black"
              />
              <span>{t("notice.outside")}</span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer text-xs text-neutral-700 leading-relaxed">
              <input
                type="checkbox"
                name="addressSharingNotice"
                required
                defaultChecked
                className="mt-0.5 size-4 rounded border-neutral-300 text-black focus:ring-black"
              />
              <span>{t("notice.address")}</span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer text-xs text-neutral-700 leading-relaxed">
              <input
                type="checkbox"
                name="paymentNotice"
                required
                defaultChecked
                className="mt-0.5 size-4 rounded border-neutral-300 text-black focus:ring-black"
              />
              <span>{t("notice.payment.phase_a")}</span>
            </label>
          </div>

          {/* Action Trigger Button (Opens Review) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={openReview}
              disabled={!serviceOptionsAvailable || !config.areas.length || config.floorPercent === null || !estimate || !turnstileSiteKey}
              className="w-full h-14 bg-black text-white hover:bg-neutral-800 rounded-2xl text-base font-semibold shadow-lg flex items-center justify-between px-6 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {t("host.book.review")}
              <span className="flex items-center gap-1 font-mono text-sm" aria-hidden="true">
                <span>Next</span>
                <ChevronRight className="size-4" />
              </span>
            </button>
          </div>

          {/* Review Sheet Modal */}
          <dialog
            ref={reviewDialogRef}
            aria-labelledby="host-book-review-title"
            className="fixed inset-0 z-50 m-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm border border-neutral-200"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
              <h2 id="host-book-review-title" className="text-xl font-bold tracking-tight text-neutral-900">
                {t("host.review.title")}
              </h2>
              <Badge variant="secondary" className="text-xs">
                Review before dispatch
              </Badge>
            </div>

            <dl className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs">
              <dt className="text-neutral-500">{t("host.review.services")}</dt>
              <dd className="text-right font-medium text-neutral-900">
                {selectedServices.map((service) => t(serviceCopyKeys[service]!)).join(", ")}
              </dd>

              <dt className="text-neutral-500">{t("host.review.start")}</dt>
              <dd className="text-right font-medium text-neutral-900">{formattedReviewStart}</dd>

              <dt className="text-neutral-500">{t("host.review.helpers")}</dt>
              <dd className="text-right font-medium text-neutral-900">{helpersNeeded}</dd>

              <dt className="text-neutral-500">{t("host.review.preference")}</dt>
              <dd className="text-right font-medium text-neutral-900">
                {t(`host.book.gender.${reviewValues?.preference ?? "any"}` as CopyKey)}
              </dd>

              <dt className="text-neutral-500">{t("host.review.estimate")}</dt>
              <dd className="text-right font-medium text-neutral-900">
                {estimate
                  ? t("host.book.estimate.duration", {
                      hours: String(Math.floor(estimate.estimatedMinutes / 60)),
                      minutes: String(estimate.estimatedMinutes % 60).padStart(2, "0"),
                    })
                  : ""}
              </dd>

              <dt className="text-neutral-500">{t("host.review.pay")}</dt>
              <dd className="text-right font-medium text-neutral-900">
                {displayedPay === null ? "" : formatZarCents(displayedPay)}
              </dd>

              <dt className="text-neutral-500">{t("host.review.transport")}</dt>
              <dd className="text-right font-medium text-neutral-900">
                {displayedTransport === null ? "" : formatZarCents(displayedTransport)}
              </dd>

              <div className="col-span-2 border-t border-neutral-100 pt-2 my-1" />

              <dt className="text-sm font-bold text-neutral-900">{t("host.review.total")}</dt>
              <dd className="text-right text-base font-bold text-neutral-900">
                {total === null ? "" : formatZarCents(total)}
              </dd>
            </dl>

            <div className="mt-6 flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => reviewDialogRef.current?.close()}
                className="flex-1 h-12 rounded-xl text-xs font-semibold"
              >
                {t("host.review.edit")}
              </Button>
              <button
                type="submit"
                disabled={!selectedServicesAvailable}
                className="flex-1 h-12 bg-black text-white hover:bg-neutral-800 rounded-xl text-xs font-semibold shadow-md flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
              >
                {t("host.review.submit")}
                <span aria-hidden="true">↗</span>
              </button>
            </div>
          </dialog>
        </form>
      </div>

      {/* Floating Bottom Navigation Dock */}
      <HostFloatingDock />
    </main>
  );
}
