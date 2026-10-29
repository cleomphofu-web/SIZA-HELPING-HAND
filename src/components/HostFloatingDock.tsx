"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarPlus, ClipboardList, User } from "lucide-react";
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
    href: "/app",
    icon: Home,
    activeMatch: (p) => Boolean(p && p === "/app"),
  },
  {
    label: "Book",
    href: "/app/book",
    icon: CalendarPlus,
    activeMatch: (p) => Boolean(p && p.startsWith("/app/book")),
  },
  {
    label: "Requests",
    href: "/app/requests",
    icon: ClipboardList,
    activeMatch: (p) => Boolean(p && p.startsWith("/app/requests")),
  },
  {
    label: "Profile",
    href: "/app/profile",
    icon: User,
    activeMatch: (p) => Boolean(p && p.startsWith("/app/profile")),
  },
];

export function HostFloatingDock() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="Host Navigation"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 p-1.5 rounded-full bg-black/90 text-white shadow-2xl backdrop-blur-xl border border-white/15 transition-all duration-300 hover:scale-[1.02]"
    >
      <div className="flex items-center gap-1 px-1">
        <Link
          href="/app"
          className="px-2.5 py-1 text-xs font-bold tracking-tighter text-neutral-300 hover:text-white transition-colors"
        >
          siZa.
        </Link>
        <div className="h-4 w-px bg-white/20 mx-1" aria-hidden="true" />
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
                "relative group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                isActive
                  ? "bg-white text-black shadow-sm font-semibold"
                  : "text-neutral-400 hover:text-white hover:bg-white/10"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={cn("size-3.5", isActive ? "text-black" : "text-neutral-400 group-hover:text-white")} />
              <span className="hidden sm:inline-block">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
