"use client";

import Link from "next/link";
import { useState } from "react";

type PublicMenuLink = {
  href: string;
  label: string;
};

type PublicMenuProps = {
  links: PublicMenuLink[];
  menuLabel: string;
};

export function PublicMenu({ links, menuLabel }: PublicMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <details
      className="public-menu"
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      open={isOpen}
      suppressHydrationWarning
    >
      <summary aria-label={menuLabel}>
        <span aria-hidden="true" className="public-menu-icon" />
      </summary>
      <nav aria-label={menuLabel} className="public-menu-links">
        {links.map(({ href, label }) => <Link href={href} key={href}>{label}</Link>)}
      </nav>
    </details>
  );
}
