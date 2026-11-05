"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { MapPin, Navigation, Clock, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MapMarkerTooltipProps {
  /** Title or label for the location (e.g. Suburb or Helper name) */
  title: string;
  /** Subtitle or address line */
  subtitle?: string;
  /** Status text (e.g. "On the way", "Arrived", "Scheduled") */
  statusText?: string;
  /** Estimated arrival time in minutes (if on the way) */
  etaMinutes?: number | null;
  /** Latitude coordinate (optional for display) */
  lat?: number;
  /** Longitude coordinate (optional for display) */
  lng?: number;
  /** Accuracy in meters */
  accuracyM?: number | null;
  /** Last updated time string */
  recordedAt?: string;
  /** Pulse beacon animation (true when active / on the way) */
  isLive?: boolean;
  /** Custom trigger element (optional, defaults to pulsing pin) */
  children?: React.ReactNode;
  /** Tooltip placement */
  placement?: "top" | "bottom";
  className?: string;
}

/**
 * MapMarkerTooltip — inspired by @mapcn/components/mapcn-marker-tooltip on 21st.dev.
 *
 * A theme-aware, accessible map marker with interactive radar pulse and smooth hover/tap tooltip.
 * Provides touch-friendly toggle on mobile and hover on desktop.
 */
export function MapMarkerTooltip({
  title,
  subtitle,
  statusText = "Location Verified",
  etaMinutes,
  accuracyM,
  recordedAt,
  isLive = true,
  children,
  placement = "top",
  className,
}: MapMarkerTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-flex items-center justify-center", className)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Marker Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onFocus={() => setIsOpen(true)}
        aria-expanded={isOpen}
        aria-label={`${title} - ${statusText}`}
        className="group relative flex items-center justify-center p-2 rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-transform active:scale-95"
      >
        {children ? (
          children
        ) : (
          <div className="relative flex items-center justify-center">
            {/* Pulsing Radar Ring (when live) */}
            {isLive && (
              <>
                <span
                  className="absolute -inset-2.5 rounded-full bg-emerald-400/30 animate-ping opacity-75"
                  aria-hidden="true"
                />
                <span
                  className="absolute -inset-1 rounded-full bg-emerald-500/20 animate-pulse"
                  aria-hidden="true"
                />
              </>
            )}

            {/* Core Pin Badge */}
            <div
              className={cn(
                "relative z-10 flex items-center justify-center size-9 rounded-full shadow-lg border-2 transition-all duration-300",
                isLive
                  ? "bg-emerald-600 text-white border-white shadow-emerald-900/30 group-hover:bg-emerald-500 group-hover:scale-110"
                  : "bg-neutral-900 text-white border-white/40 shadow-black/40 group-hover:scale-105"
              )}
            >
              {isLive ? (
                <Navigation className="size-4 animate-bounce" />
              ) : (
                <MapPin className="size-4" />
              )}
            </div>
          </div>
        )}
      </button>

      {/* Floating Marker Tooltip Popup */}
      <div
        role="tooltip"
        aria-hidden={!isOpen}
        className={cn(
          "absolute z-50 w-64 sm:w-72 p-4 rounded-2xl bg-neutral-950/95 text-white border border-white/20 shadow-2xl backdrop-blur-xl transition-all duration-200 pointer-events-auto",
          placement === "top"
            ? "bottom-full mb-3 origin-bottom"
            : "top-full mt-3 origin-top",
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 pointer-events-none translate-y-1"
        )}
      >
        {/* Close Button for Touch Devices */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
          className="absolute top-2.5 right-2.5 p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 sm:hidden transition-colors"
          aria-label="Close tooltip"
        >
          <X className="size-3.5" />
        </button>

        {/* Header / Suburb Title */}
        <div className="flex items-start gap-2.5 pr-4">
          <div className="size-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="size-3.5" />
          </div>
          <div>
            <h4 className="text-sm font-bold tracking-tight text-white leading-tight">
              {title}
            </h4>
            {subtitle && (
              <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Status & ETA Badge */}
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {statusText}
          </span>
          {typeof etaMinutes === "number" && etaMinutes > 0 && (
            <span className="inline-flex items-center gap-1 text-neutral-300 font-semibold bg-white/10 px-2 py-0.5 rounded-md">
              <Clock className="size-3 text-neutral-400" />
              ~{etaMinutes} min
            </span>
          )}
        </div>

        {/* Accuracy and Verification footer */}
        <div className="mt-2 text-[10px] text-neutral-400 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-neutral-400">
            <ShieldCheck className="size-3 text-neutral-400" />
            Verified GPS
          </span>
          {accuracyM && (
            <span>±{Math.round(accuracyM)}m accuracy</span>
          )}
          {recordedAt && (
            <span>{new Date(recordedAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}</span>
          )}
        </div>

        {/* Downward triangle arrow */}
        <div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 size-2.5 rotate-45 bg-neutral-950 border-white/20",
            placement === "top"
              ? "-bottom-1.5 border-r border-b"
              : "-top-1.5 border-l border-t"
          )}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

/**
 * JohannesburgTrackingCard — A styled preview card embedding the map marker tooltip,
 * designed for host booking details and helper live on-the-way tracking screens.
 */
export function JohannesburgTrackingCard({
  suburb,
  helperName,
  etaMinutes,
  isLive = true,
  recordedAt,
}: {
  suburb: string;
  helperName?: string;
  etaMinutes?: number | null;
  isLive?: boolean;
  recordedAt?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-900 text-white shadow-sm p-4 sm:p-5">
      {/* Decorative Stylized Grid Map Background */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        aria-hidden="true"
      >
        <svg
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          fill="none"
        >
          <defs>
            <pattern
              id="jhb-grid"
              width="36"
              height="36"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 36 0 L 0 0 0 36"
                fill="none"
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#jhb-grid)" />
          {/* Subtle curved transit contour */}
          <path
            d="M -20,120 Q 140,40 320,100 T 600,60"
            stroke="rgba(16, 185, 129, 0.3)"
            strokeWidth="3"
            strokeDasharray="6 6"
            fill="none"
          />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              {isLive ? "Live Helper Location" : "Service Suburb"}
            </span>
          </div>
          <h3 className="text-lg font-bold tracking-tight text-white">
            {suburb}
          </h3>
          <p className="text-xs text-neutral-400">
            {helperName
              ? `${helperName} is on the way`
              : "Johannesburg Fair Rotation Region"}
          </p>
        </div>

        {/* Center / Right Interactive Map Marker */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          <MapMarkerTooltip
            title={helperName ? `${helperName} (Helper)` : suburb}
            subtitle={`${suburb}, Johannesburg`}
            statusText={isLive ? "On the way" : "Confirmed"}
            etaMinutes={etaMinutes}
            isLive={isLive}
            recordedAt={recordedAt}
          />
          <div className="text-right">
            <span className="block text-xs font-semibold text-neutral-200">
              Tap pin for ETA
            </span>
            <span className="block text-[10px] text-neutral-500">
              Johannesburg GPS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

