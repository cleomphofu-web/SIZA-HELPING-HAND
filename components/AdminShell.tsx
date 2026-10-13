import type { ReactNode } from "react";
import { SizaHeader } from "@/components/SizaHeader";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <main className="admin-shell">
      <SizaHeader admin />
      {children}
    </main>
  );
}

