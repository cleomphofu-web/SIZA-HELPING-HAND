import Link from "next/link";

export function SizaFooter() {
  return (
    <footer className="siza-footer">
      <div>
        <p className="siza-kicker">Johannesburg, South Africa</p>
        <p className="siza-footer-note">Now onboarding the first SIZA cleaners.</p>
      </div>
      <div className="siza-footer-links">
        <Link href="/">Home</Link>
        <Link href="/book">Request a clean</Link>
        <Link href="/cleaners/apply">Become a cleaner</Link>
        <Link href="/privacy">Privacy</Link>
      </div>
      <p className="siza-footer-mark">© SIZA</p>
    </footer>
  );
}

