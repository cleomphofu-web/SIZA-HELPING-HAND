import Link from "next/link";

export function SizaHeader() {
  return (
    <header className="bg-black text-white border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
      <Link
        href="/admin"
        className="text-base font-bold tracking-tight hover:text-neutral-300 transition-colors"
      >
        siZa.{" "}
        <span className="text-xs text-neutral-400 font-normal uppercase tracking-wider ml-1">
          Admin
        </span>
      </Link>
      <nav className="flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-neutral-300">
        <Link href="/admin/helpers" className="hover:text-white transition-colors">
          Helpers
        </Link>
        <Link href="/admin/bookings" className="hover:text-white transition-colors">
          Bookings
        </Link>
        <Link href="/admin/reports" className="hover:text-white transition-colors">
          Reports
        </Link>
        <Link href="/admin/overview" className="hover:text-white transition-colors">
          Overview
        </Link>
      </nav>
    </header>
  );
}
