import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// SSR-safe registration of ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Check if user prefers reduced motion (WCAG AA accessibility requirement)
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Hero Entrance Animation
 * Subtle floating 3D breathing effect for the marshmallow wordmark and crisp entry
 */
export function animateHero(
  wordmarkRef: HTMLElement | null,
  bgRef: HTMLElement | null,
  ctaRef?: HTMLElement | null
): gsap.Context | null {
  if (!wordmarkRef || typeof window === "undefined") return null;

  const reduced = prefersReducedMotion();
  const ctx = gsap.context(() => {
    // Entrance reveal
    gsap.fromTo(
      wordmarkRef,
      { opacity: 0, scale: 0.94, y: 20 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: reduced ? 0 : 1.1,
        ease: "power3.out",
        onComplete: () => {
          if (!reduced) {
            // Subtle, elegant floating loop
            gsap.to(wordmarkRef, {
              y: "-=10",
              duration: 3,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
            });
          }
        },
      }
    );

    if (ctaRef && !reduced) {
      gsap.fromTo(
        ctaRef,
        { opacity: 0, scale: 0.92, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.8, delay: 0.35, ease: "power2.out" }
      );
    }

    if (bgRef && !reduced) {
      gsap.fromTo(
        bgRef,
        { scale: 1.06, opacity: 0.7 },
        { scale: 1, opacity: 1, duration: 1.6, ease: "power2.out" }
      );
    }
  });

  return ctx;
}

/**
 * Staggered Scroll-Triggered Reveal
 */
export function animateScrollStagger(
  container: HTMLElement | null,
  childSelector: string,
  options?: { yOffset?: number; stagger?: number; delay?: number }
): gsap.Context | null {
  if (!container || typeof window === "undefined") return null;

  const reduced = prefersReducedMotion();
  const yOffset = options?.yOffset ?? 32;
  const stagger = options?.stagger ?? 0.12;

  const ctx = gsap.context(() => {
    const items = container.querySelectorAll(childSelector);
    if (!items.length) return;

    if (reduced) {
      gsap.set(items, { opacity: 1, y: 0 });
      return;
    }

    gsap.fromTo(
      items,
      { opacity: 0, y: yOffset },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger,
        ease: "power2.out",
        scrollTrigger: {
          trigger: container,
          start: "top 82%",
          once: true,
        },
      }
    );
  }, container);

  return ctx;
}

/**
 * Animated Number Counter
 */
export function animateCounter(
  element: HTMLElement | null,
  targetValue: number,
  prefix = "",
  suffix = ""
): gsap.Context | null {
  if (!element || typeof window === "undefined") return null;

  const reduced = prefersReducedMotion();
  if (reduced) {
    element.textContent = `${prefix}${targetValue}${suffix}`;
    return null;
  }

  const obj = { val: 0 };
  const ctx = gsap.context(() => {
    gsap.to(obj, {
      val: targetValue,
      duration: 1.2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: element,
        start: "top 90%",
        once: true,
      },
      onUpdate: () => {
        element.textContent = `${prefix}${Math.round(obj.val)}${suffix}`;
      },
    });
  });

  return ctx;
}

export { gsap, ScrollTrigger };
