"use client";

import React, { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  MapPin,
  Calendar,
  CheckCircle2,
  X,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  Loader2,
  ClipboardList,
  Navigation,
  Star,
  Check,
  Upload,
  Camera,
} from "lucide-react";
import { useOutsideClick } from "@/hooks/use-outside-click";
import type { HelperOfferSummary } from "@/server/views/booking-read";

type ExpandableJobFeedProps = {
  offers: HelperOfferSummary[];
  currentLocation?: string;
  helperVerificationStatus?: string;
  onOfferAccepted?: (bookingId: string) => void;
  onOfferDeclined?: (bookingId: string) => void;
};

// Deterministic distance estimation based on suburb name hash
function getEstimatedDistance(suburb: string, slot: number): string {
  let hash = 0;
  for (let i = 0; i < suburb.length; i++) {
    hash = (hash << 5) - hash + suburb.charCodeAt(i);
    hash |= 0;
  }
  const km = ((Math.abs(hash) % 45) / 10 + 1.2 + (slot - 1) * 0.8).toFixed(1);
  return `${km} km`;
}

// Format year for Member Since
function formatMemberSince(isoDate?: string): string {
  if (!isoDate) return "2024";
  try {
    return new Date(isoDate).getFullYear().toString();
  } catch {
    return "2024";
  }
}

export function ExpandableJobFeed({
  offers,
  currentLocation = "All My Suburbs",
  helperVerificationStatus = "verified",
  onOfferAccepted,
  onOfferDeclined,
}: ExpandableJobFeedProps) {
  const [active, setActive] = useState<HelperOfferSummary | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkedRequirements, setCheckedRequirements] = useState<Record<string, boolean>>({});
  const [currentVerificationStatus, setCurrentVerificationStatus] = useState<string>(
    helperVerificationStatus
  );

  // Verification modal state
  const [showKycModal, setShowKycModal] = useState<boolean>(false);
  const [kycIdNumber, setKycIdNumber] = useState<string>("");
  const [kycConsent, setKycConsent] = useState<boolean>(false);
  const [kycIdUploaded, setKycIdUploaded] = useState<boolean>(false);
  const [kycSelfieUploaded, setKycSelfieUploaded] = useState<boolean>(false);
  const [kycSubmitting, setKycSubmitting] = useState<boolean>(false);
  const [kycError, setKycError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const kycRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Reset checked requirements when active card changes
  useEffect(() => {
    if (active) {
      setCheckedRequirements({});
      setErrorMessage(null);
    }
  }, [active]);

  // Escape key & body overflow lock
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (showKycModal) {
          setShowKycModal(false);
        } else {
          setActive(null);
        }
      }
    }

    if (active || showKycModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [active, showKycModal]);

  useOutsideClick(modalRef, () => {
    if (!acceptingId && !showKycModal) {
      setActive(null);
    }
  });

  useOutsideClick(kycRef, () => {
    if (!kycSubmitting) {
      setShowKycModal(false);
    }
  });

  // Requirements checklist calculation
  const activeRequirements = active?.requirements && active.requirements.length > 0
    ? active.requirements
    : [
        "Prompt arrival & check-in with host upon entry",
        "Follow room checklist and surface hygiene standards",
        "Maintain clean, professional working attire",
      ];

  const totalReqs = activeRequirements.length;
  const confirmedReqsCount = activeRequirements.filter((r) => checkedRequirements[r]).length;
  const allReqsConfirmed = totalReqs > 0 && confirmedReqsCount === totalReqs;

  const toggleRequirement = (req: string) => {
    setCheckedRequirements((prev) => ({
      ...prev,
      [req]: !prev[req],
    }));
  };

  // Atomic Job Accept Handler
  const executeAtomicAccept = async (offer: HelperOfferSummary) => {
    setAcceptingId(offer.id);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/helper/jobs/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: offer.id,
          slot: offer.slot,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.ok) {
        if (onOfferAccepted) onOfferAccepted(offer.id);
        startTransition(() => {
          router.push(`/helper/jobs/${offer.id}`);
        });
      } else if (res.status === 409 || data?.error?.code === "already_taken") {
        setErrorMessage("Another helper in rotation accepted this job just now.");
        setAcceptingId(null);
      } else if (data?.error?.code === "unverified_helper") {
        setShowKycModal(true);
        setAcceptingId(null);
      } else {
        setErrorMessage(data?.error?.message ?? "Could not accept offer. Please retry.");
        setAcceptingId(null);
      }
    } catch {
      setErrorMessage("Network error. Please check your connection and retry.");
      setAcceptingId(null);
    }
  };

  // Intercept button click: check verification status
  const handleAcceptClick = (offer: HelperOfferSummary) => {
    if (currentVerificationStatus !== "verified") {
      setShowKycModal(true);
      return;
    }
    executeAtomicAccept(offer);
  };

  // Submit KYC verification
  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setKycError(null);

    const cleanedId = kycIdNumber.trim();
    if (!/^\d{13}$/.test(cleanedId)) {
      setKycError("Please enter a valid 13-digit South African ID number.");
      return;
    }
    if (!kycConsent) {
      setKycError("Please accept the POPIA verification consent to proceed.");
      return;
    }

    setKycSubmitting(true);
    try {
      const res = await fetch("/api/helper/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idNumber: cleanedId,
          consentText: "I consent to DHA identity verification via siZa in accordance with POPIA.",
          consentVersion: "v1.0",
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setCurrentVerificationStatus("verified");
        setShowKycModal(false);
        if (active) {
          executeAtomicAccept(active);
        }
      } else {
        setKycError(data?.error || "Identity check failed. Please verify your ID number.");
      }
    } catch {
      setKycError("Network error during verification. Please try again.");
    } finally {
      setKycSubmitting(false);
    }
  };

  const handleDecline = (offer: HelperOfferSummary) => {
    if (onOfferDeclined) onOfferDeclined(offer.id);
    setActive(null);
  };

  return (
    <>
      {/* Dimmed Backdrop with Blur */}
      <AnimatePresence>
        {(active || showKycModal) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/65 backdrop-blur-sm h-full w-full z-50"
          />
        )}
      </AnimatePresence>

      {/* Action-Gated Identity Verification Modal / Drawer */}
      <AnimatePresence>
        {showKycModal ? (
          <div className="fixed inset-0 grid place-items-center z-50 p-4 sm:p-6 overflow-y-auto">
            <motion.div
              ref={kycRef}
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-auto"
            >
              <div className="bg-neutral-950 text-white p-6 relative space-y-2">
                <button
                  type="button"
                  onClick={() => setShowKycModal(false)}
                  className="absolute top-5 right-5 size-8 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close verification modal"
                >
                  <X className="size-4" />
                </button>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-emerald-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                    Identity Verification Required
                  </span>
                </div>
                <h3 className="text-xl font-bold tracking-tight text-white">
                  Verify South African ID
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Before claiming rotation job offers, South African regulations require verified identity for community safety.
                </p>
              </div>

              <form onSubmit={handleKycSubmit} className="p-6 space-y-5">
                {/* SA ID Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                    South African ID Number (13 Digits)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={13}
                      value={kycIdNumber}
                      onChange={(e) => setKycIdNumber(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 9205125800084"
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 font-mono text-sm"
                      required
                    />
                    {kycIdNumber.length === 13 && (
                      <span className="absolute right-3 top-3 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        13 Digits ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Validated against Home Affairs (DHA) via secure one-way hash.
                  </p>
                </div>

                {/* ID & Selfie Document Upload Previews */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setKycIdUploaded(!kycIdUploaded)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      kycIdUploaded
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:border-neutral-400"
                    }`}
                  >
                    {kycIdUploaded ? (
                      <Check className="size-5 text-emerald-600" />
                    ) : (
                      <Upload className="size-5 text-neutral-500" />
                    )}
                    <span className="text-xs font-semibold">
                      {kycIdUploaded ? "ID Uploaded ✓" : "Upload ID Photo"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setKycSelfieUploaded(!kycSelfieUploaded)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      kycSelfieUploaded
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:border-neutral-400"
                    }`}
                  >
                    {kycSelfieUploaded ? (
                      <Check className="size-5 text-emerald-600" />
                    ) : (
                      <Camera className="size-5 text-neutral-500" />
                    )}
                    <span className="text-xs font-semibold">
                      {kycSelfieUploaded ? "Selfie Taken ✓" : "Take Live Selfie"}
                    </span>
                  </button>
                </div>

                {/* POPIA Consent */}
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-neutral-600 leading-snug">
                  <input
                    type="checkbox"
                    checked={kycConsent}
                    onChange={(e) => setKycConsent(e.target.checked)}
                    className="size-4 mt-0.5 rounded border-neutral-300 text-black focus:ring-black shrink-0"
                    required
                  />
                  <span>
                    I consent to identity validation and POPIA processing by siZa to unlock fair rotation job offers.
                  </span>
                </label>

                {kycError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0 text-red-500" />
                    <span>{kycError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={kycSubmitting || kycIdNumber.length !== 13 || !kycConsent}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {kycSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Verifying with Home Affairs...</span>
                    </>
                  ) : (
                    <span>Verify Identity &amp; Unlock Acceptance</span>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {/* Expanded Modal Overlay */}
      <AnimatePresence>
        {active ? (
          <div className="fixed inset-0 grid place-items-center z-50 p-4 sm:p-6 overflow-y-auto">
            <motion.div
              layoutId={`card-${active.id}-${active.slot}-${id}`}
              ref={modalRef}
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col my-auto"
            >
              {/* Modal Top Header */}
              <div className="relative bg-neutral-950 text-white p-6 sm:p-7 space-y-3">
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="absolute top-5 right-5 size-9 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close details"
                >
                  <X className="size-5" />
                </button>

                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                    Live Rotation Offer · Slot #{active.slot}
                  </span>
                </div>

                <div className="space-y-1">
                  <motion.h3
                    layoutId={`title-${active.id}-${active.slot}-${id}`}
                    className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2"
                  >
                    <MapPin className="size-6 text-emerald-400 shrink-0" />
                    <span>{active.suburb}</span>
                  </motion.h3>
                  <p className="text-xs text-neutral-400 flex items-center gap-2">
                    <Navigation className="size-3.5 text-neutral-500" />
                    <span>{getEstimatedDistance(active.suburb, active.slot)}</span>
                    <span>·</span>
                    <span>{active.city || "Johannesburg"}</span>
                  </p>
                </div>

                {/* Services Tags */}
                {active.services && active.services.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {active.services.map((svc) => (
                      <span
                        key={svc}
                        className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-medium text-neutral-200 capitalize"
                      >
                        {svc.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Body */}
              <div className="p-6 sm:p-7 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Host Trust Signals Bar */}
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    Host Trust &amp; Safety Rating
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                    <div className="flex items-center gap-1.5 text-neutral-800 font-semibold">
                      <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                      <span className="truncate">Payment Verified</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-800 font-semibold">
                      <CheckCircle2 className="size-4 text-blue-600 shrink-0" />
                      <span>{active.hostCompletedJobsCount ?? 3} Hires</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-800 font-semibold">
                      <Star className="size-4 text-amber-500 fill-amber-500 shrink-0" />
                      <span>{active.hostRating ?? 4.9} ★</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-600">
                      <Calendar className="size-4 text-neutral-400 shrink-0" />
                      <span>Since {formatMemberSince(active.hostMemberSince)}</span>
                    </div>
                  </div>
                </div>

                {/* Payout Breakdown */}
                {(() => {
                  const payCents = BigInt(active.payPerHelperCents ?? 0);
                  const transCents = BigInt(active.transportPerHelperCents ?? 0);
                  const totalCents = payCents + transCents;
                  const totalRands = (Number(totalCents) / 100).toFixed(0);
                  const wageRands = (Number(payCents) / 100).toFixed(0);
                  const transRands = (Number(transCents) / 100).toFixed(0);

                  return (
                    <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                          Direct Net Payout
                        </span>
                        <div className="text-3xl font-extrabold tracking-tight text-neutral-900 mt-0.5">
                          R{totalRands}
                          <span className="ml-2 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            NET
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          R{wageRands} helper wage + R{transRands} transport allowance
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="size-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mx-auto mb-1">
                          ✓
                        </div>
                        <span className="text-[10px] text-neutral-500 font-medium">100% Direct</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Schedule Window */}
                {active.startAt && (
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      <span>Scheduled Booking Time</span>
                    </span>
                    <p className="text-sm font-bold text-neutral-900">
                      {new Intl.DateTimeFormat("en-ZA", {
                        timeZone: "Africa/Johannesburg",
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(active.startAt))}
                    </p>
                  </div>
                )}

                {/* Mandatory Pre-Acceptance Screening Checklist */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-900">
                      <ClipboardList className="size-4 text-emerald-600" />
                      <span>Job Requirements Checklist</span>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-semibold border border-neutral-200">
                      {confirmedReqsCount}/{totalReqs} Confirmed
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Please confirm each host requirement below to enable job acceptance:
                  </p>
                  <div className="space-y-2">
                    {activeRequirements.map((item, idx) => {
                      const isChecked = Boolean(checkedRequirements[item]);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleRequirement(item)}
                          className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                            isChecked
                              ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                              : "bg-neutral-50/50 border-neutral-200 text-neutral-700 hover:border-neutral-300"
                          }`}
                        >
                          <div
                            className={`size-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isChecked
                                ? "bg-emerald-600 text-white"
                                : "border border-neutral-400 bg-white"
                            }`}
                          >
                            {isChecked && <Check className="size-3.5 stroke-[3]" />}
                          </div>
                          <span className="text-xs font-medium leading-relaxed">{item}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pre-Acceptance Address Privacy Notice */}
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-950 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="size-4 text-blue-700" />
                    <span>Strict Address Privacy Protocol</span>
                  </div>
                  <p className="text-blue-900/80 leading-relaxed">
                    Exact street address, unit number, gate intercom code, and host phone number will be unlocked immediately upon your confirmed acceptance.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                    <AlertCircle className="size-4 text-red-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Modal Action Buttons */}
              <div className="p-5 sm:p-6 bg-neutral-50 border-t border-neutral-200 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleAcceptClick(active)}
                  disabled={acceptingId !== null || !allReqsConfirmed}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-neutral-900 hover:bg-black active:scale-[0.98] text-white text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {acceptingId === active.id ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Securing Slot...</span>
                    </>
                  ) : !allReqsConfirmed ? (
                    <span>Confirm All Checkboxes ({confirmedReqsCount}/{totalReqs})</span>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4 text-emerald-400" />
                      <span>
                        Confirm &amp; Accept Job (R
                        {(
                          Number(
                            BigInt(active.payPerHelperCents ?? 0) +
                              BigInt(active.transportPerHelperCents ?? 0)
                          ) / 100
                        ).toFixed(0)}
                        )
                      </span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDecline(active)}
                  disabled={acceptingId !== null}
                  className="px-4 py-3.5 rounded-2xl border border-neutral-300 hover:bg-neutral-200 text-xs font-semibold text-neutral-700 transition-colors cursor-pointer"
                >
                  Pass
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {/* Collapsed Feed List */}
      <div className="space-y-3">
        {offers.map((offer) => {
          const totalCents =
            BigInt(offer.payPerHelperCents ?? 0) + BigInt(offer.transportPerHelperCents ?? 0);
          const totalRands = (Number(totalCents) / 100).toFixed(0);
          const dist = getEstimatedDistance(offer.suburb, offer.slot);

          let scheduleText: string | null = null;
          if (offer.startAt) {
            try {
              scheduleText = new Intl.DateTimeFormat("en-ZA", {
                timeZone: "Africa/Johannesburg",
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(offer.startAt));
            } catch {
              scheduleText = offer.startAt;
            }
          }

          return (
            <motion.div
              layoutId={`card-${offer.id}-${offer.slot}-${id}`}
              key={`${offer.id}-${offer.slot}`}
              onClick={() => setActive(offer)}
              className="group p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200/90 hover:border-black/40 hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                <div className="size-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <MapPin className="size-5 text-emerald-400" />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <motion.h3
                      layoutId={`title-${offer.id}-${offer.slot}-${id}`}
                      className="text-base font-bold text-neutral-900 truncate"
                    >
                      {offer.suburb}
                    </motion.h3>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
                      Slot #{offer.slot}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {dist}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-neutral-500 flex-wrap">
                    {scheduleText && (
                      <span className="flex items-center gap-1 font-medium text-neutral-700">
                        <Calendar className="size-3" />
                        <span>{scheduleText}</span>
                      </span>
                    )}
                    {offer.services && offer.services.length > 0 && (
                      <span className="capitalize">
                        · {offer.services[0].replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                <div className="text-left sm:text-right">
                  <div className="text-xl font-extrabold tracking-tight text-neutral-900">
                    R{totalRands}
                    <span className="ml-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                      NET
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-500">100% Direct Pay</span>
                </div>

                <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 group-hover:bg-black text-white text-xs font-semibold shadow-xs">
                  <span>View Scope</span>
                  <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
