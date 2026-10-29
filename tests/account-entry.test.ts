import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AccountEntry } from "@/components/AccountEntry";
import { AccountForm } from "@/components/AccountForm";
import { accountEntryRole } from "@/lib/account-entry";
import { accountDestinationForRole } from "@/lib/account-destination";
import SignupPage from "../src/app/(host)/signup/page";

describe("account entry role", () => {
  it("keeps an explicit host or helper route choice", () => {
    expect(accountEntryRole("host")).toBe("host");
    expect(accountEntryRole("helper")).toBe("helper");
  });

  it("defaults unknown or repeated route values to the host entry point", () => {
    expect(accountEntryRole(undefined)).toBe("host");
    expect(accountEntryRole("admin")).toBe("host");
    expect(accountEntryRole(["helper", "host"])).toBe("host");
  });

  it("routes only host and helper accounts to their own app surfaces", () => {
    expect(accountDestinationForRole("host")).toBe("/app");
    expect(accountDestinationForRole("helper")).toBe("/helper");
    expect(accountDestinationForRole("admin")).toBeNull();
    expect(accountDestinationForRole(null)).toBeNull();
  });
});

describe("account entry prototype state", () => {
  it("renders a non-collecting hand-off destination when prototype routes are off", async () => {
    vi.stubEnv("ALLOW_PROTOTYPE_ROUTES", "false");
    const page = await SignupPage({ searchParams: Promise.resolve({ role: "helper" }) });
    const markup = renderToStaticMarkup(page);

    expect(markup).toContain("SIZA is coming to");
    expect(markup).not.toContain("<form");
    vi.unstubAllEnvs();
  });

  it("shows only the generated holding notice when account actions are disabled", () => {
    const markup = renderToStaticMarkup(
      createElement(AccountEntry, {
        areas: "Johannesburg and the Vaal",
        enabled: false,
        mode: "signup",
        role: "helper",
        supportEmail: "support@example.test",
        turnstileSiteKey: "test-site-key",
      }),
    );

    expect(markup).toContain("SIZA is coming to");
    expect(markup).toContain("We are getting ready to open.");
    expect(markup).not.toContain("<form");
    expect(markup).not.toContain('name="email"');
  });

  it("keeps the role-specific signup form available only when the switch is enabled", () => {
    const markup = renderToStaticMarkup(
      createElement(AccountEntry, {
        areas: "Johannesburg and the Vaal",
        enabled: true,
        mode: "signup",
        role: "helper",
        supportEmail: "support@example.test",
        turnstileSiteKey: "test-site-key",
      }),
    );

    expect(markup).toContain("<form");
    expect(markup).toContain('name="role"');
    expect(markup).toContain('name="role" value="helper"');
  });

  it("shows the fixed signup role and a real Turnstile response field instead of an empty token", () => {
    const markup = renderToStaticMarkup(createElement(AccountForm, {
      mode: "signup",
      defaultRole: "helper",
      turnstileSiteKey: "test-site-key",
    }));

    expect(markup).toContain('name="role" value="helper"');
    expect(markup).not.toContain("<select");
    expect(markup).toContain('data-sitekey="test-site-key"');
    expect(markup).toContain('data-response-field-name="turnstileToken"');
    expect(markup).not.toContain('name="turnstileToken" value=""');
  });

  it("disables signup and explains the missing Turnstile setup", () => {
    const markup = renderToStaticMarkup(createElement(AccountForm, { mode: "signup", turnstileSiteKey: "" }));

    expect(markup).toContain("Turnstile is not configured");
    expect(markup).toContain("disabled");
  });
});

describe("account entry responsive form styles", () => {
  it("does not give visually hidden or hidden inputs full-width layout styles", () => {
    const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

    expect(css).toMatch(/\.phase-a-form input:not\(\.sr-only\):not\(\[type="hidden"\]\)/);
  });
});
