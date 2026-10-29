import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIZA",
  description: "SIZA is getting ready to open in Johannesburg.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-ZA">
      <body>{children}</body>
    </html>
  );
}
