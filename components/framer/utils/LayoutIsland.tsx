"use client";

import { LayoutGroup } from "framer-motion";
import { useId, type ReactNode } from "react";

export default function LayoutIsland({ children }: { children: ReactNode }) {
  const id = useId();
  return <LayoutGroup id={id} inherit={false}>{children}</LayoutGroup>;
}
