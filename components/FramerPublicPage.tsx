"use client";

import dynamic from "next/dynamic";

const FramerPublic = dynamic(() => import("@/components/FramerPublic").then((module) => module.default), { ssr: false, loading: () => <main className="framer-loading" aria-busy="true" /> });

export function FramerPublicPage() {
  return <FramerPublic />;
}
