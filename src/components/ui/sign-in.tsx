"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, ShieldCheck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Testimonial {
  avatarSrc?: string;
  name: string;
  role: string;
  suburb: string;
  text: string;
  rating?: number;
}

export const defaultMarketplaceTestimonials: Testimonial[] = [
  {
    name: "Lerato M.",
    role: "Host",
    suburb: "Sandton",
    text: "Booked our helper for Sandton in under two minutes. Arrived punctually with check-in code verification and did exceptional work.",
    rating: 5,
  },
  {
    name: "Thabo N.",
    role: "Approved Helper",
    suburb: "Rosebank",
    text: "Fair rotation and direct payments make SIZA the only platform I trust. No bidding wars, just honest bookings and respectful hosts.",
    rating: 5,
  },
  {
    name: "David K.",
    role: "Host",
    suburb: "Randburg",
    text: "No cash hassles, clear upfront pricing, and absolute peace of mind. The transparent check-in system sets SIZA far apart.",
    rating: 5,
  },
];

export interface SignInPageLayoutProps {
  /** The authentication form element (e.g. AccountForm contents) */
  children?: React.ReactNode;
  /** Custom list of testimonials */
  testimonials?: Testimonial[];
  /** Subtitle or eyebrow badge text */
  eyebrow?: string;
  /** Active role ("host" | "helper") */
  role?: "host" | "helper";
  /** Current mode ("login" | "signup") */
  mode?: "login" | "signup";
}

/**
 * SignInPageLayout — inspired by @jahed/components/sign-in on 21st.dev.
 *
 * A modern split-screen authentication layout pairing a clean, focused login form
 * with an engaging social proof and testimonial showcase on larger displays.
 * Fully responsive down to 375px mobile screens.
 */
export function SignInPageLayout({
  children,
  testimonials = defaultMarketplaceTestimonials,
}: SignInPageLayoutProps) {
  const [activeTestimonial, setActiveTestimonial] = React.useState(0);

  // Auto-rotate testimonials gently
  React.useEffect(() => {
    if (testimonials.length <= 1) return;
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const current = testimonials[activeTestimonial] || testimonials[0];

  return (
    <main className="relative min-h-screen w-full flex flex-col lg:flex-row bg-black text-white overflow-x-hidden">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/assets/images/hero/background%20home%20page%20hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center filter brightness-[0.25] contrast-[1.15]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/95 backdrop-blur-[2px]" />
        <div
          aria-hidden="true"
          className="absolute -top-32 left-1/4 w-[600px] h-[300px] bg-gradient-to-b from-white/10 to-transparent blur-3xl opacity-40 rounded-full"
        />
      </div>

      {/* Left/Form Container: Focused and tactile */}
      <section
        className="relative z-10 w-full lg:w-7/12 xl:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-10 lg:p-12"
        aria-label="Account sign in"
      >
        <div className="w-full max-w-[480px] my-auto">
          {children}
        </div>
      </section>

      {/* Right/Social Proof Showcase: Visible on lg+ displays (Jahed-style split) */}
      <aside
        className="relative z-10 hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between p-10 xl:p-16 border-l border-white/10 bg-neutral-950/40 backdrop-blur-xl"
        aria-label="Community reviews and trust"
      >
        {/* Top Wordmark & Trust Badge */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tighter hover:opacity-80 transition-opacity text-white"
          >
            siZa.
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-semibold text-neutral-200">
            <ShieldCheck className="size-3.5 text-emerald-400" />
            <span>Verified Helpers · Fair Rotation</span>
          </div>
        </div>

        {/* Center Testimonial Card */}
        <div className="my-auto py-12 max-w-lg">
          <div className="space-y-6">
            {/* Star Rating */}
            <div className="flex items-center gap-1" aria-label="5 star rating">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="size-4 fill-amber-400 text-amber-400"
                  aria-hidden="true"
                />
              ))}
            </div>

            {/* Testimonial Quote */}
            <blockquote className="text-xl xl:text-2xl font-medium tracking-tight text-white leading-relaxed">
              &ldquo;{current.text}&rdquo;
            </blockquote>

            {/* Author Info */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="font-semibold text-white text-base">
                  {current.name}
                </p>
                <p className="text-xs text-neutral-400">
                  {current.role} · {current.suburb}, Johannesburg
                </p>
              </div>

              {/* Indicator Dots */}
              {testimonials.length > 1 && (
                <div
                  className="flex items-center gap-1.5"
                  role="tablist"
                  aria-label="Testimonials"
                >
                  {testimonials.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      role="tab"
                      aria-selected={activeTestimonial === idx}
                      aria-label={`Testimonial ${idx + 1}`}
                      onClick={() => setActiveTestimonial(idx)}
                      className={cn(
                        "size-2 rounded-full transition-all duration-300",
                        activeTestimonial === idx
                          ? "w-6 bg-white"
                          : "bg-white/30 hover:bg-white/60"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Value Props Row */}
          <div className="mt-12 pt-8 border-t border-white/15 grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-white">Direct Phone & WhatsApp</p>
                <p className="text-[11px] text-neutral-400">Direct contact after acceptance</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-white">4-Digit Check-In Codes</p>
                <p className="text-[11px] text-neutral-400">Verification upon arrival</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] text-neutral-400">
          <span>Johannesburg &middot; Sandton &middot; Rosebank &middot; Randburg</span>
          <span className="text-emerald-400 font-medium">South Africa</span>
        </div>
      </aside>
    </main>
  );
}

