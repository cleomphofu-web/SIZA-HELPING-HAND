import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BentoGridProps = {
  children: ReactNode;
  className?: string;
};

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid w-full grid-cols-1 md:grid-cols-3 gap-4 auto-rows-auto",
        className
      )}
    >
      {children}
    </div>
  );
}

export type BentoCardProps = {
  children: ReactNode;
  className?: string;
  dark?: boolean;
};

export function BentoCard({ children, className, dark = false }: BentoCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-3xl p-6 sm:p-7 transition-all shadow-sm",
        dark
          ? "bg-neutral-950 text-white border border-neutral-800 shadow-md"
          : "bg-white text-neutral-900 border border-neutral-200/80 hover:border-black/30",
        className
      )}
    >
      {children}
    </div>
  );
}

