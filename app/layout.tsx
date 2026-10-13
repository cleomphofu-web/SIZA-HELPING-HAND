import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIZA — Cleaning, properly arranged",
  description: "Request a clean from a vetted SIZA cleaner in Johannesburg.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-ZA">
      <body>{children}</body>
    </html>
  );
}
