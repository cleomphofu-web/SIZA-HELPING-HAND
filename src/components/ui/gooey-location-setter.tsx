"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, Navigation, Search, Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type GooeyLocationSetterProps = {
  currentLocation: string;
  onLocationChange: (suburb: string) => void;
  registeredSuburbs?: string[];
  popularSuburbs?: string[];
  gpsDetected?: boolean;
  onDetectGPS?: () => void;
  isLocating?: boolean;
  className?: string;
};

export function GooeyLocationSetter({
  currentLocation,
  onLocationChange,
  registeredSuburbs = [],
  popularSuburbs = [],
  gpsDetected = false,
  onDetectGPS,
  isLocating = false,
  className,
}: GooeyLocationSetterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    }
    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
      // Auto-focus input when expanded
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded]);

  function handleSelect(suburb: string) {
    onLocationChange(suburb);
    setIsExpanded(false);
    setSearchQuery("");
  }

  // Filter suburbs by search query
  const allChoices = Array.from(
    new Set([...registeredSuburbs, ...popularSuburbs])
  );
  const filteredChoices = searchQuery.trim()
    ? allChoices.filter((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : allChoices;

  return (
    <div ref={containerRef} className={cn("relative w-full transition-all duration-300", className)}>
      {!isExpanded ? (
        /* UNEXPANDED RESTING STATE: Sleek Morphing Pill */
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-white border border-neutral-300/90 hover:border-black/40 hover:shadow-md transition-all shadow-xs cursor-pointer group text-left"
          aria-expanded={false}
          aria-label={`Current location: ${currentLocation}. Tap to change suburb.`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-9 rounded-xl bg-black text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <MapPin className="size-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block leading-tight">
                Active Area
              </span>
              <p className="text-sm font-bold text-neutral-900 truncate">
                {currentLocation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {gpsDetected && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                <Check className="size-3" /> GPS
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-neutral-100 group-hover:bg-neutral-200 text-neutral-700 transition-colors">
              <span>Change</span>
              <ChevronDown className="size-3.5 transition-transform group-hover:translate-y-0.5" />
            </span>
          </div>
        </button>
      ) : (
        /* EXPANDED INTERACTIVE STATE: Search, Suburb Pills, and GPS */
        <div className="w-full p-4 sm:p-5 rounded-3xl bg-white border border-neutral-300 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 tracking-tight flex items-center gap-1.5">
                <MapPin className="size-4 text-black" />
                <span>Select Active Suburb</span>
              </h3>
              <p className="text-[11px] text-neutral-500">
                Filter open jobs near your working location
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="size-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close location selector"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* Interactive Search + GPS bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="size-4 text-neutral-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search suburb (e.g. Sandton, Soweto)..."
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-neutral-50 border border-neutral-300 focus:bg-white focus:border-black text-xs font-semibold text-neutral-900 outline-none transition-all placeholder:text-neutral-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 text-neutral-400 hover:text-black text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {onDetectGPS && (
              <button
                type="button"
                onClick={onDetectGPS}
                disabled={isLocating}
                className="h-11 px-3.5 rounded-xl bg-black hover:bg-neutral-800 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer disabled:opacity-60"
              >
                <Navigation className={cn("size-3.5", isLocating && "animate-spin")} />
                <span className="hidden sm:inline">{isLocating ? "Locating…" : "GPS"}</span>
              </button>
            )}
          </div>

          {/* Quick Suburb Suggestions */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">
              Quick Suggestions
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => handleSelect("All My Suburbs")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border",
                  currentLocation === "All My Suburbs"
                    ? "bg-black text-white border-black shadow-xs"
                    : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-black/30 hover:bg-white"
                )}
              >
                All My Suburbs
              </button>

              {filteredChoices
                .filter((s) => s !== "All My Suburbs")
                .map((suburb) => {
                  const isRegistered = registeredSuburbs.includes(suburb);
                  const isCurrent = currentLocation.toLowerCase() === suburb.toLowerCase();

                  return (
                    <button
                      key={suburb}
                      type="button"
                      onClick={() => handleSelect(suburb)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1",
                        isCurrent
                          ? "bg-black text-white border-black shadow-xs"
                          : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-black/30 hover:bg-white"
                      )}
                    >
                      {isRegistered && (
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            isCurrent ? "bg-emerald-400" : "bg-emerald-600"
                          )}
                          title="Registered in your profile"
                        />
                      )}
                      <span>{suburb}</span>
                      {isCurrent && <Check className="size-3 ml-0.5" />}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

