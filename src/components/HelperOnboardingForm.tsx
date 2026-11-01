"use client";

/**
 * HelperOnboardingForm
 *
 * A full-screen, one-question-at-a-time questionnaire for helper profile
 * onboarding. Designed for helpers who may not be confident with technology:
 * large text, big touch targets, clear progress, plain language.
 *
 * On the final step the component builds a FormData and POSTs it to
 * /api/helper/onboarding (multipart/form-data) so the existing server route
 * receives the exact same field names it already validates.
 *
 * No new runtime dependencies — uses only shadcn/ui primitives already
 * installed in this project (Button, Checkbox, Input, Label, Textarea,
 * Progress) plus a hand-rolled card layout that matches the SIZA design
 * system (monochrome, Geist, editorial).
 */

import React, { useRef, useState } from "react";
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

type ServiceKey = "home_cleaning" | "deep_clean" | "airbnb_turnover" | "office_cleaning" | "post_construction";

const SERVICES: Array<{ key: ServiceKey; label: string; emoji: string }> = [
  { key: "home_cleaning",    label: t("helper.onboarding.services.home"),              emoji: "🏠" },
  { key: "deep_clean",       label: t("helper.onboarding.services.deep"),              emoji: "✨" },
  { key: "airbnb_turnover",  label: t("helper.onboarding.services.airbnb"),            emoji: "🛏️" },
  { key: "office_cleaning",  label: t("helper.onboarding.services.office"),            emoji: "🏢" },
  { key: "post_construction",label: t("helper.onboarding.services.post_construction"), emoji: "🔨" },
];

// ---------------------------------------------------------------------------
// Step names — used for the progress indicator
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 10; // Welcome is step 0 (not counted in progress bar)

// ---------------------------------------------------------------------------
// Shared layout primitives
// ---------------------------------------------------------------------------

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Sticky black header */}
      <header className="sticky top-0 z-50 bg-black text-white px-6 py-4 flex items-center justify-between">
        <span className="text-base font-semibold tracking-tight">siZa.</span>
        <span className="text-sm text-neutral-400 uppercase tracking-widest">Helper setup</span>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-lg mx-auto w-full">
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
      <h1 className="text-3xl font-bold tracking-tight text-black leading-tight mb-3">{title}</h1>
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
        className="w-full h-14 bg-black text-white text-base font-semibold rounded-xl hover:bg-neutral-900 active:bg-neutral-800 disabled:opacity-40 transition-all"
      >
        {isLoading ? "Sending…" : nextLabel}
      </Button>
      {onBack && (
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={isLoading}
          className="w-full h-12 text-neutral-500 text-sm hover:text-black transition-colors"
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
        className={`w-full border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
          file
            ? "border-black bg-neutral-50"
            : "border-neutral-200 hover:border-neutral-400 bg-white"
        }`}
        aria-describedby={`${name}-hint`}
      >
        {file ? (
          <div className="space-y-2">
            <div className="text-4xl">✅</div>
            <p className="text-sm font-medium text-black">{file.name}</p>
            <p className="text-xs text-neutral-400">Tap to change</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-4xl">📷</div>
            <p className="text-base font-semibold text-black">{label}</p>
            <p className="text-sm text-neutral-400">{hint}</p>
            <span className="inline-block mt-2 px-4 py-2 bg-black text-white text-sm rounded-lg">
              Choose photo
            </span>
          </div>
        )}
      </button>
      <p id={`${name}-hint`} className="sr-only">{hint}</p>
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
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
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

    const data = new FormData();
    data.set("dateOfBirth", form.dateOfBirth);
    data.set("jobTitle", form.jobTitle || "Home helper");
    data.set("services", form.services.join(","));
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
          <div className="text-6xl">🎉</div>
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
        <div className="w-full space-y-6">
          <div className="text-6xl text-center">👋</div>
          <h1 className="text-3xl font-bold tracking-tight text-black leading-tight text-center">
            {t("helper.onboarding.welcome.title", { firstName: firstName ?? "there" })}
          </h1>
          <p className="text-base text-neutral-500 leading-relaxed text-center">
            {t("helper.onboarding.welcome.body")}
          </p>
          <Button
            type="button"
            onClick={next}
            className="w-full h-14 bg-black text-white text-base font-semibold rounded-xl mt-4 hover:bg-neutral-900 transition-all"
          >
            {t("helper.onboarding.welcome.cta")}
          </Button>
        </div>
      </Shell>
    );
  }

  // ── Step 1: Date of birth ────────────────────────────────────────────────
  if (step === 1) {
    const isValid = form.dateOfBirth !== "";
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
            max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
            autoComplete="bday"
            aria-label={t("helper.label.date_of_birth")}
          />
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
                className={`flex items-center gap-3 px-4 py-4 rounded-xl border-2 text-left transition-all text-sm font-medium ${
                  checked
                    ? "border-black bg-black text-white"
                    : "border-neutral-200 bg-white text-black hover:border-neutral-400"
                }`}
                aria-pressed={checked}
              >
                <span className={`w-5 h-5 rounded flex items-center justify-center border text-xs flex-shrink-0 ${
                  checked ? "bg-white border-white text-black" : "border-neutral-300"
                }`}>
                  {checked ? "✓" : ""}
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
          {SERVICES.map(({ key, label, emoji }) => {
            const checked = form.services.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleService(key)}
                className={`w-full flex items-center gap-4 px-5 py-5 rounded-2xl border-2 text-left transition-all ${
                  checked
                    ? "border-black bg-black text-white"
                    : "border-neutral-200 bg-white text-black hover:border-neutral-400"
                }`}
                aria-pressed={checked}
              >
                <span className="text-2xl flex-shrink-0">{emoji}</span>
                <span className="text-base font-medium flex-1">{label}</span>
                <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-sm ${
                  checked ? "bg-white border-white text-black" : "border-neutral-300"
                }`}>
                  {checked ? "✓" : ""}
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
            <p className="text-xs text-neutral-400 text-right">{form.bio.length}/300</p>
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
          <p className="text-xs text-neutral-400 text-right">{form.experienceNote.length}/2000</p>
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
        <p className="w-full text-xs text-neutral-400 mt-4">This step is optional — tap Continue to skip.</p>
        <NavButtons onBack={back} onNext={next} />
      </Shell>
    );
  }

  // ── Step 7: ID number ────────────────────────────────────────────────────
  if (step === 7) {
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
          <Input
            id="idNumber"
            type="password"
            value={form.idNumber}
            onChange={(e) => update("idNumber", e.target.value.replace(/\D/g, "").slice(0, 13))}
            placeholder={t("helper.onboarding.id.placeholder")}
            maxLength={13}
            autoComplete="off"
            inputMode="numeric"
            className="h-14 text-base border-2 border-neutral-200 rounded-xl focus:border-black tracking-widest"
            aria-label={t("helper.label.id_number")}
          />
          <p className="text-xs text-neutral-400">
            {form.idNumber.length}/13 digits entered
          </p>
          <div className="flex items-start gap-3 bg-neutral-50 rounded-xl p-4 mt-2">
            <span className="text-xl flex-shrink-0">🔒</span>
            <p className="text-sm text-neutral-500 leading-relaxed">
              {t("helper.onboarding.id.body")}
            </p>
          </div>
        </div>
        <NavButtons
          onBack={back}
          onNext={next}
          nextDisabled={form.idNumber.length !== 13}
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
            <span className="text-xl flex-shrink-0">💡</span>
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
          <div className="text-5xl text-center">🙌</div>
          <StepHeading
            title={t("helper.onboarding.consent.title")}
            body={t("helper.onboarding.consent.body")}
          />
          {/* Summary card */}
          <div className="border border-neutral-200 rounded-2xl p-5 space-y-3 text-sm">
            <SummaryRow label="Areas" value={form.suburbs.join(", ") || "—"} />
            <SummaryRow label="Services" value={form.services.map((k) => SERVICES.find((s) => s.key === k)?.label ?? k).join(", ") || "—"} />
            <SummaryRow label="ID photo" value={form.idPhoto ? "✅ Added" : "❌ Missing"} />
            <SummaryRow label="Selfie" value={form.selfieCheck ? "✅ Added" : "❌ Missing"} />
          </div>

          {/* Consent checkbox */}
          <label className="flex items-start gap-4 cursor-pointer" htmlFor="consent">
            <Checkbox
              id="consent"
              checked={form.consent}
              onCheckedChange={(v) => update("consent", v === true)}
              className="mt-0.5 w-6 h-6 border-2 border-neutral-300 data-[state=checked]:bg-black data-[state=checked]:border-black rounded"
            />
            <span className="text-sm text-neutral-700 leading-relaxed">
              {t("helper.onboarding.consent.check")}
            </span>
          </label>

          {error && (
            <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              {error}
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-neutral-400 flex-shrink-0">{label}</span>
      <span className="text-black text-right">{value}</span>
    </div>
  );
}

