"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Briefcase, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type DockItem = {
  label: string;
  href: string;
  icon: typeof Home;
  activeMatch: (pathname: string) => boolean;
};

const items: DockItem[] = [
  {
    label: "Home",
    href: "/helper",
    icon: Home,
    activeMatch: (p) => Boolean(p && p === "/helper"),
  },
  {
    label: "Profile",
    href: "/helper/profile",
    icon: User,
    activeMatch: (p) => Boolean(p && p.startsWith("/helper/profile")),
  },
  {
    label: "Jobs",
    href: "/helper/jobs",
    icon: Briefcase,
    activeMatch: (p) => Boolean(p && p.startsWith("/helper/jobs")),
  },
  {
    label: "Settings",
    href: "/helper/account",
    icon: Settings,
    activeMatch: (p) => Boolean(p && p.startsWith("/helper/account")),
  },
];

export function HelperFloatingDock() {
  const pathname = usePathname() ?? "";

  // Do not show the floating dock on the focused onboarding questionnaire flow
  if (pathname.startsWith("/helper/onboarding")) {
    return null;
  }

  return (
    <nav
      aria-label="Helper Navigation"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 p-1.5 rounded-full bg-black/90 text-white shadow-2xl backdrop-blur-xl border border-white/15 transition-all duration-300 hover:scale-[1.02]"
    >
      <div className="flex items-center gap-1 pl-1">
        <Link
          href="/helper"
          className="min-h-[44px] inline-flex items-center px-2.5 text-xs font-bold tracking-tighter text-neutral-300 hover:text-white transition-colors"
        >
          siZa.
        </Link>
        <div className="h-4 w-px bg-white/20 mr-1" aria-hidden="true" />
      </div>

      <div className="flex items-center gap-1">
        {items.map((item) => {
          const isActive = item.activeMatch(pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative group flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-200 select-none",
                isActive
                  ? "bg-white text-black shadow-sm font-semibold"
                  : "text-neutral-400 hover:text-white hover:bg-white/10"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  isActive
                    ? "text-black"
                    : "text-neutral-400 group-hover:text-white"
                )}
              />
              <span className="hidden sm:inline-block">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
