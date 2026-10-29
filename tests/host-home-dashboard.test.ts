import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HostHomeDashboard } from "@/components/HostHomeDashboard";

const request = {
  id: "a0000000-0000-4000-8000-000000000001",
  suburb: "Braamfontein",
  startAt: "2026-10-30T08:00:00.000Z",
  status: "open" as const,
  helpersNeeded: 1,
};

describe("host home dashboard", () => {
  it("gives a host a clear request action and next steps when they have no requests", () => {
    const markup = renderToStaticMarkup(createElement(HostHomeDashboard, { requests: [], loadFailed: false }));

    expect(markup).toContain("What can we help with?");
    expect(markup).toContain('href="/app/book"');
    expect(markup).toContain("No requests yet. Start by telling us what you need.");
    expect(markup).toContain('href="/app/profile"');
  });

  it("shows only the redacted host request summary and links to its detail", () => {
    const markup = renderToStaticMarkup(createElement(HostHomeDashboard, { requests: [request], loadFailed: false }));

    expect(markup).toContain("Braamfontein");
    expect(markup).toContain('href="/app/requests/a0000000-0000-4000-8000-000000000001"');
    expect(markup).toContain("Looking for a helper");
    expect(markup).not.toContain("helpersNeeded");
    expect(markup).not.toContain("accessNotes");
  });

  it("shows a generic recovery state when host requests cannot be loaded", () => {
    const markup = renderToStaticMarkup(createElement(HostHomeDashboard, { requests: [], loadFailed: true }));

    expect(markup).toContain("Something went wrong on our side. Try again in a minute.");
    expect(markup).toContain('href="/app"');
  });
});
