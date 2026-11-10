"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { t } from "@/content/t";
import { homeSectionRoutes } from "@/lib/public-home-content";

export function PublicHeader({ floating = false }: { floating?: boolean } = {}) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on Escape key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && menuOpen) {
        setMenuOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className="nav on-dark" id="site-nav" data-8b-section="navigation">
      <a className="public-skip-link sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-4 focus:z-50 focus:p-3 focus:bg-white focus:text-black focus:rounded-md" href="#main-content">
        {t("nav.skip")}
      </a>

      <nav className="nav__bar" aria-label="Main">
        <Link className="nav__brand" href="/" aria-label="siZa, back to top">
          <span className="nav__word">{t("site.name")}</span>
        </Link>

        <ul className="nav__links">
          <li>
            <Link href={homeSectionRoutes.services}>{t("home.services.title")}</Link>
          </li>
          <li>
            <Link href="/contact">{t("footer.contact")}</Link>
          </li>
          <li>
            <Link href={homeSectionRoutes.howItWorks}>{t("home.how.label")}</Link>
          </li>
        </ul>

        <Link className="nav__cta" href="/request">
          <span>{t("home.hero.guide")}</span>
        </Link>

        <button
          className="nav__toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? (
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
              <path d="M4 8h16M4 16h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile Drawer Menu */}
      <div
        className="menu"
        id="menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        hidden={!menuOpen}
      >
        <button
          className="menu__close"
          type="button"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" width="20" height="20">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <ul className="menu__links">
          <li>
            <Link href={homeSectionRoutes.services} onClick={() => setMenuOpen(false)}>
              {t("home.services.title")}
            </Link>
          </li>
          <li>
            <Link href="/contact" onClick={() => setMenuOpen(false)}>
              {t("footer.contact")}
            </Link>
          </li>
          <li>
            <Link href={homeSectionRoutes.howItWorks} onClick={() => setMenuOpen(false)}>
              {t("home.how.label")}
            </Link>
          </li>
          <li>
            <Link href="/login" onClick={() => setMenuOpen(false)}>
              {t("nav.login")}
            </Link>
          </li>
        </ul>

        <div className="pt-6">
          <Link
            className="hero__btn-main w-full text-center"
            href="/request"
            onClick={() => setMenuOpen(false)}
          >
            {t("home.hero.guide")}
          </Link>
        </div>
      </div>
    </header>
  );
}
