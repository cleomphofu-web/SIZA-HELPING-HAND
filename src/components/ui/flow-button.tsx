"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FlowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Text to display inside the button */
  text?: string;
  /** Optional href to render the button as a Next.js Link */
  href?: string;
  /** Link target (only used with href) */
  target?: string;
  /** Link rel (only used with href) */
  rel?: string;
  /** Visual variant */
  variant?: "primary" | "secondary" | "emerald" | "outline" | "ghost";
  /** Size options with mobile touch-friendly minimum targets */
  size?: "sm" | "md" | "lg";
  /** Optional icon to replace the default trailing ArrowRight */
  icon?: React.ReactNode;
  /** Show loading state with a spinner */
  loading?: boolean;
  /** Custom children (overrides text prop if provided) */
  children?: React.ReactNode;
  /** Full width on mobile/container */
  fullWidth?: boolean;
}

/**
 * FlowButton — inspired by @xubohuah/components/flow-button on 21st.dev.
 *
 * A tactile, high-conversion button with fluid hover flow, subtle border sheen,
 * animated trailing arrow, responsive touch scaling, and full keyboard/screen-reader accessibility.
 */
export const FlowButton = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  FlowButtonProps
>(
  (
    {
      text,
      href,
      target,
      rel,
      variant = "primary",
      size = "md",
      icon,
      loading = false,
      children,
      fullWidth = false,
      className,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "h-10 px-4 py-2 text-xs gap-2 min-h-[40px]",
      md: "h-12 px-6 py-3 text-sm gap-2.5 min-h-[48px]",
      lg: "h-14 px-8 py-3.5 text-base gap-3 min-h-[56px]",
    }[size];

    const variantClasses = {
      primary:
        "bg-neutral-950 text-white border border-white/20 hover:border-white/40 hover:bg-black shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_25px_-4px_rgba(0,0,0,0.7)]",
      secondary:
        "bg-white text-neutral-950 border border-neutral-300 hover:border-neutral-900 hover:bg-neutral-50 shadow-sm",
      emerald:
        "bg-emerald-600 text-white border border-emerald-500/40 hover:bg-emerald-500 hover:border-emerald-400 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.3)]",
      outline:
        "bg-transparent text-white border border-white/30 hover:border-white hover:bg-white/10 backdrop-blur-sm",
      ghost:
        "bg-transparent text-neutral-800 hover:bg-neutral-100 hover:text-black border border-transparent",
    }[variant];

    const baseClasses = cn(
      "group relative inline-flex items-center justify-center font-semibold tracking-wide rounded-xl select-none",
      "transition-all duration-300 ease-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
      "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none",
      fullWidth ? "w-full" : "w-auto",
      sizeClasses,
      variantClasses,
      className
    );

    const content = (
      <>
        {/* Subtle hover gradient flow sheen */}
        <span
          className="pointer-events-none absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-transparent via-white/[0.08] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden="true"
        />

        {/* Content & Icon */}
        <span className="relative z-10 flex items-center gap-2">
          {loading ? (
            <Loader2 className="size-4 animate-spin shrink-0" aria-hidden="true" />
          ) : null}
          <span>{children ?? text}</span>
        </span>

        {/* Trailing arrow with fluid slide transition */}
        {!loading && (
          <span
            className="relative z-10 shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-1"
            aria-hidden="true"
          >
            {icon ?? <ArrowRight className="size-4" />}
          </span>
        )}
      </>
    );

    if (href) {
      return (
        <Link
          href={href}
          target={target}
          rel={rel}
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={baseClasses}
          aria-disabled={disabled || loading}
          tabIndex={disabled || loading ? -1 : undefined}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type}
        disabled={disabled || loading}
        className={baseClasses}
        {...props}
      >
        {content}
      </button>
    );
  }
);

FlowButton.displayName = "FlowButton";

