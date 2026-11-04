"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

/**
 * Hook for scoped GSAP animations inside any React component.
 * Automatically handles cleanup with gsap.context() on unmount.
 */
export function useGsapContext(
  animationFn: (context: gsap.Context) => void,
  deps: unknown[] = []
) {
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    const ctx = gsap.context(() => {
      animationFn(ctx);
    }, containerRef.current);

    return () => {
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return containerRef;
}

/**
 * Hook for animated numerical counter
 */
export function useGsapCounter(targetValue: number, prefix = "", suffix = "") {
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el || typeof window === "undefined") return;

    if (prefersReducedMotion()) {
      el.textContent = `${prefix}${targetValue}${suffix}`;
      return;
    }

    const obj = { val: 0 };
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        val: targetValue,
        duration: 1.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
          once: true,
        },
        onUpdate: () => {
          el.textContent = `${prefix}${Math.round(obj.val)}${suffix}`;
        },
      });
    });

    return () => ctx.revert();
  }, [targetValue, prefix, suffix]);

  return elementRef;
}
