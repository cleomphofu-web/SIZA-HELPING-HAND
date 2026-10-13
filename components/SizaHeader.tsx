import Link from "next/link";

type SizaHeaderProps = { admin?: boolean };

export function SizaHeader({ admin = false }: SizaHeaderProps) {
  return (
    <header className={`siza-header ${admin ? "siza-header-admin" : ""}`}>
      <Link className="siza-wordmark" href={admin ? "/admin" : "/"} aria-label="SIZA home">
        siZa<span aria-hidden="true">.</span>
      </Link>
      {admin ? (
        <nav className="siza-nav" aria-label="Admin navigation">
          <Link href="/admin/cleaners">Cleaners</Link>
          <Link href="/admin/bookings">Bookings</Link>
        </nav>
      ) : (
        <nav className="siza-nav" aria-label="Main navigation">
          <Link href="/#about">About</Link>
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/cleaners/apply">Become a cleaner</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
      )}
      <Link className="siza-header-action" href={admin ? "/" : "/book"}>
        {admin ? "Public site" : "Request a clean"} <span aria-hidden="true">↗</span>
      </Link>
    </header>
  );
}

