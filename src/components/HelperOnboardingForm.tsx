"use client";

/**
 * HelperOnboardingForm
 *
 * A full-screen, one-question-at-a-time questionnaire for helper profile
 * onboarding. Large text, big touch targets, clear progress, plain language.
 *
 * All emojis removed in compliance with editorial standard (Rule 21: No emojis).
 * Live South African ID and adult validation to catch errors before final submit.
 */

import React, { useRef, useState } from "react";
import {
  Home,
  Sparkles,
  Bed,
  Building2,
  Hammer,
  Camera,
  CheckCircle2,
  ShieldCheck,
  Info,
  UserCheck,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { t } from "@/content/t";

// ---------------------------------------------------------------------------
// Static data — pilot suburbs and service options
// ---------------------------------------------------------------------------

const PILOT_SUBURBS = [
  "Rosebank",
  "Sandton",
  "Parkhurst",
  "Craighall",
  "Melville",
  "Braamfontein",
  "Fourways",
  "Midrand",
  "Vanderbijlpark",
  "Vereeniging",
] as const;

type ServiceKey =
  | "home_cleaning"
  | "deep_clean"
  | "airbnb_turnover"
  | "office_cleaning"
  | "post_construction";

const SERVICES: Array<{ key: ServiceKey; label: string; icon: LucideIcon }> = [
  { key: "home_cleaning", label: t("helper.onboarding.services.home"), icon: Home },
  { key: "deep_clean", label: t("helper.onboarding.services.deep"), icon: Sparkles },
  { key: "airbnb_turnover", label: t("helper.onboarding.services.airbnb"), icon: Bed },
  { key: "office_cleaning", label: t("helper.onboarding.services.office"), icon: Building2 },
  { key: "post_construction", label: t("helper.onboarding.services.post_construction"), icon: Hammer },
];

const TOTAL_STEPS = 10;

// ---------------------------------------------------------------------------
// SA ID and age validation
// ---------------------------------------------------------------------------

function isValidSaIdDate(id: string): boolean {
  if (id.length !== 13) return false;
  const year = Number(id.slice(0, 2));
  const month = Number(id.slice(2, 4));
  const day = Number(id.slice(4, 6));
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  return [1900 + year, 2000 + year].some((fullYear) => {
    const date = new Date(Date.UTC(fullYear, month - 1, day));
    return (
      date.getUTCFullYear() === fullYear &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  });
}

function isValidSaIdCheckDigit(id: string): boolean {
  if (id.length !== 13) return false;
  let total = 0;
  for (let index = 0; index < 12; index += 1) {
    let digit = Number(id[index]);
    if (index % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    total += digit;
  }
  return (10 - (total % 10)) % 10 === Number(id[12]);
}

function isAdult(dobStr: string): boolean {
  if (!dobStr) return false;
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return false;
  const cutoff = new Date();
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 18);
  return dob <= cutoff;
}

// ---------------------------------------------------------------------------
// Shared layout primitives
// ---------------------------------------------------------------------------

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="sticky top-0 z-50 bg-black text-white px-6 py-4 flex items-center justify-between">
        <span className="text-base font-semibold tracking-tight">siZa.</span>
        <span className="text-sm text-neutral-400 uppercase tracking-widest">
          Helper setup
        </span>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-6 pb-28 max-w-lg mx-auto w-full">
        {children}
      </main>
    </div>
  );
}

function StepProgress({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-neutral-500 uppercase tracking-widest">
          {t("helper.onboarding.step", { step: String(step), total: String(total) })}
        </span>
        <span className="text-xs text-neutral-400">{pct}%</span>
      </div>
      <Progress value={pct} className="h-1.5 bg-neutral-100 [&>div]:bg-black" />
    </div>
  );
}

function StepHeading({ title, body }: { title: string; body?: string }) {
  return (
    <div className="mb-8 w-full">
      <h1 className="text-3xl font-bold tracking-tight text-black leading-tight mb-3">
        {title}
      </h1>
      {body && <p className="text-base text-neutral-500 leading-relaxed">{body}</p>}
    </div>
  );
}

function NavButtons({
  onBack,
  onNext,
  nextLabel = "Continue →",
  nextDisabled = false,
  isSubmit = false,
  isLoading = false,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  isSubmit?: boolean;
  isLoading?: boolean;
}) {
  return (
    <div className="w-full flex flex-col gap-3 mt-10">
      <Button
        type={isSubmit ? "submit" : "button"}
        onClick={isSubmit ? undefined : onNext}
        disabled={nextDisabled || isLoading}
        className="w-full h-14 bg-black text-white text-base font-semibold rounded-xl hover:bg-neutral-900 active:bg-neutral-800 disabled:opacity-40 transition-all cursor-pointer"
      >
        {isLoading ? "Sending…" : nextLabel}
      </Button>
      {onBack && (
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={isLoading}
          className="w-full h-12 text-neutral-500 text-sm hover:text-black transition-colors cursor-pointer"
        >
          ← Back
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// File upload area
// ---------------------------------------------------------------------------

function FileUploadArea({
  name,
  label,
  hint,
  file,
  onChange,
}: {
  name: string;
  label: string;
  hint: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        aria-label={label}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`w-full border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
          file
            ? "border-black bg-neutral-50"
            : "border-neutral-200 hover:border-neutral-400 bg-white"
        }`}
        aria-describedby={`${name}-hint`}
      >
        {file ? (
          <div className="space-y-2">
            <CheckCircle2 className="size-10 text-emerald-600 mx-auto" />
            <p className="text-sm font-medium text-black">{file.name}</p>
            <p className="text-xs text-neutral-400">Tap to change</p>
          </div>
        ) : (
          <div className="space-y-3">
            <Camera className="size-10 text-neutral-400 mx-auto" />
            <p className="text-base font-semibold text-black">{label}</p>
            <p className="text-sm text-neutral-400">{hint}</p>
            <span className="inline-block mt-2 px-4 py-2 bg-black text-white text-sm rounded-lg">
              Choose photo
            </span>
          </div>
        )}
      </button>
      <p id={`${name}-hint`} className="sr-only">
        {hint}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

type FormState = {
  dateOfBirth: string;
  suburbs: string[];
  services: string[];
  jobTitle: string;
  bio: string;
  experienceNote: string;
  rateNote: string;
  referenceName: string;
  referencePhone: string;
  idNumber: string;
  idPhoto: File | null;
  selfieCheck: File | null;
  consent: boolean;
};

const EMPTY_FORM: FormState = {
  dateOfBirth: "",
  suburbs: [],
  services: [],
  jobTitle: "",
  bio: "",
  experienceNote: "",
  rateNote: "",
  referenceName: "",
  referencePhone: "",
  idNumber: "",
  idPhoto: null,
  selfieCheck: null,
  consent: false,
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function HelperOnboardingForm({ firstName }: { firstName?: string }) {
  const [maxDob] = useState(() => new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showIdNumber, setShowIdNumber] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function next() {
    setError(null);
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setError(null);
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleSuburb(suburb: string) {
    setForm((prev) => ({
      ...prev,
      suburbs: prev.suburbs.includes(suburb)
        ? prev.suburbs.filter((s) => s !== suburb)
        : [...prev.suburbs, suburb],
    }));
  }

  function toggleService(key: string) {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(key)
        ? prev.services.filter((s) => s !== key)
        : [...prev.services, key],
    }));
  }

  async function handleSubmit() {
    if (!form.idPhoto || !form.selfieCheck) {
      setError(t("helper.onboarding.error.documents"));
      return;
    }
    if (!form.consent) {
      setError(t("helper.onboarding.consent.check"));
      return;
    }
    setIsLoading(true);
    setError(null);

    const SERVICE_ALIASES: Record<string, string[]> = {
      home: ["home", "home_cleaning"],
      home_cleaning: ["home", "home_cleaning"],
      deep_clean: ["deep_clean", "deep_cleaning"],
      deep_cleaning: ["deep_clean", "deep_cleaning"],
      office: ["office", "office_cleaning"],
      office_cleaning: ["office", "office_cleaning"],
      airbnb_turnover: ["airbnb_turnover"],
      post_construction: ["post_construction"],
    };
    const expandedServices = Array.from(
      new Set(form.services.flatMap((s) => SERVICE_ALIASES[s] ?? [s]))
    );

    const data = new FormData();
    data.set("dateOfBirth", form.dateOfBirth);
    data.set("jobTitle", form.jobTitle || "Home helper");
    data.set("services", expandedServices.join(","));
    data.set("suburbs", form.suburbs.join(","));
    data.set("bio", form.bio);
    data.set("experienceNote", form.experienceNote);
    data.set("rateNote", form.rateNote);
    data.set("idNumber", form.idNumber);
    data.set("referenceName", form.referenceName);
    data.set("referencePhone", form.referencePhone);
    data.set("consent", "on");
    data.set("idPhoto", form.idPhoto);
    data.set("selfieCheck", form.selfieCheck);

    try {
      const res = await fetch("/api/helper/onboarding", {
        method: "POST",
        body: data,
      });

      if (res.ok || res.status === 303) {
        setDone(true);
        return;
      }

      const json = (await res.json().catch(() => null)) as
        | { ok: false; error: { message: string } }
        | null;

      if (res.status === 409) {
        // Already submitted — treat as success
        setDone(true);
        return;
      }

      setError(json?.error?.message ?? t("helper.onboarding.error.generic"));
    } catch {
      setError(t("helper.onboarding.error.generic"));
    } finally {
      setIsLoading(false);
    }
  }

  // Done screen
  if (done) {
    return (
      <Shell>
        <div className="w-full text-center space-y-6">
          <CheckCircle2 className="size-16 text-emerald-600 mx-auto" />
          <h1 className="text-3xl font-bold tracking-tight text-black">
            {t("helper.pending.title")}
          </h1>
          <p className="text-base text-neutral-500 leading-relaxed">
            {t("helper.pending.body")}
          </p>
        </div>
      </Shell>
    );
  }

  // ── Step 0: Welcome ──────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <Shell>
        <div className="w-full space-y-6 text-center">
          <UserCheck className="size-14 text-black mx-auto" />
          <h1 className="text-3xl font-bold tracking-tight text-black leading-tight">
            {t("helper.onboarding.welcome.title", { firstName: firstName ?? "there" })}
          </h1>
          <p className="text-base text-neutral-500 leading-relaxed">
            {t("helper.onboarding.welcome.body")}
          </p>
          <Button
            type="button"
            onClick={next}
            className="w-full h-14 bg-black text-white text-base font-semibold rounded-xl mt-4 hover:bg-neutral-900 transition-all cursor-pointer"
          >
            {t("helper.onboarding.welcome.cta")}
          </Button>
        </div>
      </Shell>
    );
  }

  // ── Step 1: Date of birth ────────────────────────────────────────────────
  if (step === 1) {
    const hasDob = form.dateOfBirth !== "";
    const adult = isAdult(form.dateOfBirth);
    const isValid = hasDob && adult;
    return (
      <Shell>
        <StepProgress step={1} total={TOTAL_STEPS} />
        <StepHeading
          title={t("helper.onboarding.dob.title")}
          body={t("helper.onboarding.dob.body")}
        />
        <div className="w-full space-y-3">
          <Label htmlFor="dob" className="text-base font-medium text-black">
            {t("helper.label.date_of_birth")}
          </Label>
          <Input
            id="dob"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => update("dateOfBirth", e.target.value)}
            className="h-14 text-base border-2 border-neutral-200 rounded-xl focus:border-black transition-colors"
            max={maxDob}
            autoComplete="bday"
            aria-label={t("helper.label.date_of_birth")}
          />
          {hasDob && !adult && (
            <p className="text-sm text-red-600 font-medium">
              Helpers must be 18 or older to register.
            </p>
          )}
          <p className="text-sm text-neutral-400">{t("helper.apply.age")}</p>
        </div>
        <NavButtons onBack={back} onNext={next} nextDisabled={!isValid} />
      </Shell>
    );
  }

  // ── Step 2: Suburbs ──────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <Shell>
        <StepProgress step={2} total={TOTAL_STEPS} />
        <StepHeading
          title={t("helper.onboarding.suburbs.title")}
          body={t("helper.onboarding.suburbs.body")}
        />
        <div className="w-full grid grid-cols-2 gap-3">
          {PILOT_SUBURBS.map((suburb) => {
            const checked = form.suburbs.includes(suburb);
            return (
              <button
                key={suburb}
                type="button"
                onClick={() => toggleSuburb(suburb)}
                className={`flex items-center gap-3 px-4 py-4 rounded-xl border-2 text-left transition-all text-sm font-medium cursor-pointer ${
                  checked
                    ? "border-black bg-black text-white"
                    : "border-neutral-200 bg-white text-black hover:border-neutral-400"
                }`}
                aria-pressed={checked}
              >
                <span
                  className={`w-5 h-5 rounded flex items-center justify-center border text-xs flex-shrink-0 ${
                    checked ? "bg-white border-white text-black" : "border-neutral-300"
                  }`}
                >
                  {checked ? <Check className="size-3 text-black" /> : null}
                </span>
                {suburb}
              </button>
            );
          })}
        </div>
        <NavButtons
          onBack={back}
          onNext={next}
          nextDisabled={form.suburbs.length === 0}
        />
      </Shell>
    );
  }

  // ── Step 3: Services ─────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <Shell>
        <StepProgress step={3} total={TOTAL_STEPS} />
        <StepHeading
          title={t("helper.onboarding.services.title")}
          body={t("helper.onboarding.services.body")}
        />
        <div className="w-full space-y-3">
          {SERVICES.map(({ key, label, icon: Icon }) => {
            const checked = form.services.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleService(key)}
                className={`w-full flex items-center gap-4 px-5 py-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                  checked
                    ? "border-black bg-black text-white"
                    : "border-neutral-200 bg-white text-black hover:border-neutral-400"
                }`}
                aria-pressed={checked}
              >
                <Icon
                  className={`size-6 flex-shrink-0 ${
                    checked ? "text-white" : "text-neutral-700"
                  }`}
                />
                <span className="text-base font-medium flex-1">{label}</span>
                <span
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-sm ${
                    checked ? "bg-white border-white text-black" : "border-neutral-300"
                  }`}
                >
                  {checked ? <Check className="size-3.5 text-black" /> : null}
                </span>
              </button>
            );
          })}
        </div>
        <NavButtons
          onBack={back}
          onNext={next}
          nextDisabled={form.services.length === 0}
        />
      </Shell>
    );
  }

  // ── Step 4: About you ────────────────────────────────────────────────────
  if (step === 4) {
    return (
      <Shell>
        <StepProgress step={4} total={TOTAL_STEPS} />
        <StepHeading
          title={t("helper.onboarding.about.title")}
          body={t("helper.onboarding.about.body")}
        />
        <div className="w-full space-y-6">
          <div className="space-y-2">
            <Label htmlFor="jobTitle" className="text-base font-medium text-black">
              {t("helper.onboarding.about.job_title_label")}
            </Label>
            <Input
              id="jobTitle"
              value={form.jobTitle}
              onChange={(e) => update("jobTitle", e.target.value)}
              placeholder={t("helper.onboarding.about.job_title_placeholder")}
              maxLength={120}
              className="h-14 text-base border-2 border-neutral-200 rounded-xl focus:border-black"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-base font-medium text-black">
              {t("helper.onboarding.about.bio_label")}
            </Label>
            <Textarea
              id="bio"
              value={form.bio}
              onChange={(e) => update("bio", e.target.value)}
              placeholder={t("helper.onboarding.about.bio_placeholder")}
              maxLength={300}
              rows={4}
              className="text-base border-2 border-neutral-200 rounded-xl focus:border-black resize-none"
            />
            <p className="text-xs text-neutral-400 text-right">
              {form.bio.length}/300
            </p>
          </div>
        </div>
        <NavButtons onBack={back} onNext={next} />
      </Shell>
    );
  }

  // ── Step 5: Experience ───────────────────────────────────────────────────
  if (step === 5) {
    return (
      <Shell>
        <StepProgress step={5} total={TOTAL_STEPS} />
        <StepHeading
          title={t("helper.onboarding.experience.title")}
          body={t("helper.onboarding.experience.body")}
        />
        <div className="w-full space-y-4">
          <Textarea
            id="experienceNote"
            value={form.experienceNote}
            onChange={(e) => update("experienceNote", e.target.value)}
            placeholder={t("helper.onboarding.experience.placeholder")}
            maxLength={2000}
            rows={6}
            className="text-base border-2 border-neutral-200 rounded-xl focus:border-black resize-none"
            aria-label={t("helper.label.experience")}
          />
          <p className="text-xs text-neutral-400 text-right">
            {form.experienceNote.length}/2000
          </p>
          <div className="space-y-2 pt-2">
            <Label htmlFor="rateNote" className="text-sm font-medium text-neutral-500">
              {t("helper.onboarding.rate.title")}
            </Label>
            <Input
              id="rateNote"
              value={form.rateNote}
              onChange={(e) => update("rateNote", e.target.value)}
              placeholder={t("helper.onboarding.rate.placeholder")}
              maxLength={500}
              className="h-12 text-base border-2 border-neutral-200 rounded-xl focus:border-black"
            />
          </div>
        </div>
        <NavButtons onBack={back} onNext={next} />
      </Shell>
    );
  }

  // ── Step 6: Reference ────────────────────────────────────────────────────
  if (step === 6) {
    return (
      <Shell>
        <StepProgress step={6} total={TOTAL_STEPS} />
        <StepHeading
          title={t("helper.onboarding.reference.title")}
          body={t("helper.onboarding.reference.body")}
        />
        <div className="w-full space-y-5">
          <div className="space-y-2">
            <Label htmlFor="referenceName" className="text-base font-medium text-black">
              {t("helper.onboarding.reference.name_label")}
            </Label>
            <Input
              id="referenceName"
              value={form.referenceName}
              onChange={(e) => update("referenceName", e.target.value)}
              placeholder={t("helper.onboarding.reference.name_placeholder")}
              maxLength={120}
              className="h-14 text-base border-2 border-neutral-200 rounded-xl focus:border-black"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="referencePhone" className="text-base font-medium text-black">
              {t("helper.onboarding.reference.phone_label")}
            </Label>
            <Input
              id="referencePhone"
              type="tel"
              value={form.referencePhone}
              onChange={(e) => update("referencePhone", e.target.value)}
              placeholder={t("helper.onboarding.reference.phone_placeholder")}
              maxLength={30}
              className="h-14 text-base border-2 border-neutral-200 rounded-xl focus:border-black"
            />
          </div>
        </div>
        <p className="w-full text-xs text-neutral-400 mt-4">
          This step is optional — tap Continue to skip.
        </p>
        <NavButtons onBack={back} onNext={next} />
      </Shell>
    );
  }

  // ── Step 7: ID number ────────────────────────────────────────────────────
  if (step === 7) {
    const is13 = form.idNumber.length === 13;
    const dateOk = is13 && isValidSaIdDate(form.idNumber);
    const checkOk = is13 && isValidSaIdCheckDigit(form.idNumber);
    const isIdValid = dateOk && checkOk;

    return (
      <Shell>
        <StepProgress step={7} total={TOTAL_STEPS} />
        <StepHeading
          title={t("helper.onboarding.id.title")}
          body={t("helper.onboarding.id.body")}
        />
        <div className="w-full space-y-3">
          <Label htmlFor="idNumber" className="text-base font-medium text-black">
            {t("helper.label.id_number")}
          </Label>
          <div className="relative">
            <Input
              id="idNumber"
              type={showIdNumber ? "text" : "password"}
              value={form.idNumber}
              onChange={(e) =>
                update("idNumber", e.target.value.replace(/\D/g, "").slice(0, 13))
              }
              placeholder={t("helper.onboarding.id.placeholder")}
              maxLength={13}
              autoComplete="off"
              inputMode="numeric"
              className="h-14 text-base border-2 border-neutral-200 rounded-xl focus:border-black tracking-widest pr-12 font-mono"
              aria-label={t("helper.label.id_number")}
            />
            <button
              type="button"
              onClick={() => setShowIdNumber((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black transition-colors p-1"
              aria-label={showIdNumber ? "Hide ID number" : "Show ID number"}
            >
              {showIdNumber ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">
              {form.idNumber.length}/13 digits entered
            </span>
            {isIdValid && (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="size-3.5" /> Valid South African ID
              </span>
            )}
          </div>

          {is13 && !dateOk && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl">
              <AlertCircle className="size-4 flex-shrink-0 mt-0.5" />
              <span>The first 6 digits must be a valid birth date (YYMMDD).</span>
            </div>
          )}

          {is13 && dateOk && !checkOk && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl">
              <AlertCircle className="size-4 flex-shrink-0 mt-0.5" />
              <span>
                The ID check digit is not valid. Please verify that all 13 digits match your ID document.
              </span>
            </div>
          )}

          {/* Development / Testing quick helper */}
          {process.env.NODE_ENV !== "production" && !isIdValid && (
            <button
              type="button"
              onClick={() => update("idNumber", "9001015000085")}
              className="text-xs text-neutral-500 hover:text-black underline block pt-1 text-left"
            >
              Use test SA ID (9001015000085)
            </button>
          )}

          <div className="flex items-start gap-3 bg-neutral-50 rounded-xl p-4 mt-2">
            <ShieldCheck className="size-5 text-neutral-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-neutral-500 leading-relaxed">
              {t("helper.onboarding.id.body")}
            </p>
          </div>
        </div>
        <NavButtons
          onBack={back}
          onNext={next}
          nextDisabled={!isIdValid}
        />
      </Shell>
    );
  }

  // ── Step 8: ID photo ─────────────────────────────────────────────────────
  if (step === 8) {
    return (
      <Shell>
        <StepProgress step={8} total={TOTAL_STEPS} />
        <StepHeading
          title={t("helper.onboarding.id_photo.title")}
          body={t("helper.onboarding.id_photo.body")}
        />
        <FileUploadArea
          name="idPhoto"
          label={t("helper.label.id_photo")}
          hint="Clear photo of your SA ID document — all corners visible"
          file={form.idPhoto}
          onChange={(f) => update("idPhoto", f)}
        />
        <NavButtons
          onBack={back}
          onNext={next}
          nextDisabled={!form.idPhoto}
        />
      </Shell>
    );
  }

  // ── Step 9: Selfie ───────────────────────────────────────────────────────
  if (step === 9) {
    return (
      <Shell>
        <StepProgress step={9} total={TOTAL_STEPS} />
        <StepHeading
          title={t("helper.onboarding.selfie.title")}
          body={t("helper.onboarding.selfie.body")}
        />
        <div className="w-full space-y-4">
          <FileUploadArea
            name="selfieCheck"
            label={t("helper.label.selfie_check")}
            hint="Clear selfie in good lighting — face fully visible"
            file={form.selfieCheck}
            onChange={(f) => update("selfieCheck", f)}
          />
          <div className="flex items-start gap-3 bg-neutral-50 rounded-xl p-4">
            <Info className="size-5 text-neutral-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-neutral-500 leading-relaxed">
              {t("helper.apply.2.body")}
            </p>
          </div>
        </div>
        <NavButtons
          onBack={back}
          onNext={next}
          nextDisabled={!form.selfieCheck}
        />
      </Shell>
    );
  }

  // ── Step 10: Consent + Submit ────────────────────────────────────────────
  if (step === 10) {
    return (
      <Shell>
        <StepProgress step={10} total={TOTAL_STEPS} />
        <div className="w-full space-y-6">
          <UserCheck className="size-12 text-black mx-auto" />
          <StepHeading
            title={t("helper.onboarding.consent.title")}
            body={t("helper.onboarding.consent.body")}
          />
          {/* Summary card */}
          <div className="border border-neutral-200 rounded-2xl p-5 space-y-3 text-sm">
            <SummaryRow label="Areas" value={form.suburbs.join(", ") || "—"} />
            <SummaryRow
              label="Services"
              value={
                form.services
                  .map((k) => SERVICES.find((s) => s.key === k)?.label ?? k)
                  .join(", ") || "—"
              }
            />
            <SummaryRow
              label="ID photo"
              value={form.idPhoto ? "Added" : "Missing"}
              isOk={Boolean(form.idPhoto)}
            />
            <SummaryRow
              label="Selfie"
              value={form.selfieCheck ? "Added" : "Missing"}
              isOk={Boolean(form.selfieCheck)}
            />
          </div>

          {/* Consent checkbox */}
          <label className="flex items-start gap-4 cursor-pointer" htmlFor="consent">
            <Checkbox
              id="consent"
              checked={form.consent}
              onCheckedChange={(v) => update("consent", v === true)}
              className="mt-0.5 w-6 h-6 border-2 border-neutral-300 data-[state=checked]:bg-black data-[state=checked]:border-black rounded cursor-pointer"
            />
            <span className="text-sm text-neutral-700 leading-relaxed">
              {t("helper.onboarding.consent.check")}
            </span>
          </label>

          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 space-y-2"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="size-4 flex-shrink-0 mt-0.5 text-red-600" />
                <p className="font-medium leading-normal">{error}</p>
              </div>
              {error.toLowerCase().includes("id") && (
                <button
                  type="button"
                  onClick={() => setStep(7)}
                  className="text-xs font-semibold text-red-800 underline block pl-6"
                >
                  Edit your ID number →
                </button>
              )}
              {error.toLowerCase().includes("document") && (
                <button
                  type="button"
                  onClick={() => setStep(8)}
                  className="text-xs font-semibold text-red-800 underline block pl-6"
                >
                  Update your documents →
                </button>
              )}
              {error.toLowerCase().includes("birth") && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-red-800 underline block pl-6"
                >
                  Edit your birth date →
                </button>
              )}
            </div>
          )}
        </div>
        <NavButtons
          onBack={back}
          onNext={handleSubmit}
          nextLabel={t("helper.onboarding.submit")}
          nextDisabled={!form.consent || !form.idPhoto || !form.selfieCheck}
          isLoading={isLoading}
        />
      </Shell>
    );
  }

  return null;
}

function SummaryRow({
  label,
  value,
  isOk,
}: {
  label: string;
  value: string;
  isOk?: boolean;
}) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-neutral-400 flex-shrink-0">{label}</span>
      <span className="text-black text-right font-medium flex items-center gap-1.5">
        {isOk !== undefined &&
          (isOk ? (
            <Check className="size-3.5 text-emerald-600 inline" />
          ) : (
            <AlertCircle className="size-3.5 text-red-500 inline" />
          ))}
        {value}
      </span>
    </div>
  );
}
