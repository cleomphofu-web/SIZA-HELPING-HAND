"use client";

import { useEffect, useState, type ComponentType } from "react";

const breakpoints = { base: 0, sm: 390, md: 810, lg: 1200, xl: 1440, "2xl": 1920 } as const;
type Variants = Partial<Record<keyof typeof breakpoints, string>>;

function pickVariant(width: number, variants: Variants) {
  return (["2xl", "xl", "lg", "md", "sm", "base"] as const).find((key) => width >= breakpoints[key] && variants[key])
    ? variants[(["2xl", "xl", "lg", "md", "sm", "base"] as const).find((key) => width >= breakpoints[key] && variants[key])!]
    : variants.base;
}

export default function ResponsiveWrapper<P extends { variant?: string }>({ Component, variants, ...props }: { Component: ComponentType<P>; variants: Variants } & Omit<P, "variant">) {
  const [variant, setVariant] = useState<string | undefined>(variants.lg ?? variants.base);
  useEffect(() => {
    const update = () => setVariant(pickVariant(window.innerWidth, variants));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [variants]);
  return <Component {...(props as unknown as P)} variant={variant} />;
}
