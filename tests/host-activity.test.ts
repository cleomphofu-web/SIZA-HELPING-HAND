import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { t } from "@/content/t";
import { HostRequestsList } from "@/components/HostRequestsList";
import { hostBookingStatusCopy } from "@/lib/host-booking-display";
import type { HostBookingSummary } from "@/server/views/booking-read";
import HostRequestsLoading from "@/app/(host)/app/requests/loading";

const booking: HostBookingSummary = {
  id: "request-1",
  suburb: "Soweto",
  startAt: "2026-10-20T09:00:00.000Z",
  status: "open",
  helpersNeeded: 1,
};

describe("host Activity request list", () => {
  it("shows an accessible loading skeleton", () => {
    const markup = renderToStaticMarkup(createElement(HostRequestsLoading));
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain('role="status"');
    expect(markup).toContain('class="host-activity-skeleton"');
  });

  it("shows an empty state with a clear next step", () => {
    const markup = renderToStaticMarkup(createElement(HostRequestsList, { requests: [], loadFailed: false }));
    expect(markup).toContain(t("phase_a.empty_requests"));
    expect(markup).toContain('href="/app/book"');
    expect(markup).toContain(t("button.request"));
  });

  it("shows a retry state instead of misreporting a read failure as empty", () => {
    const markup = renderToStaticMarkup(createElement(HostRequestsList, { requests: [], loadFailed: true }));
    expect(markup).toContain('role="alert"');
    expect(markup).toContain(t("phase_a.error"));
    expect(markup).toContain('href="/app/requests"');
    expect(markup).toContain(t("button.retry"));
    expect(markup).not.toContain(t("phase_a.empty_requests"));
  });

  it("shows the suburb, Johannesburg-local time, generated status and matching detail link", () => {
    const record = { ...booking, address: "Private address", hostPhone: "+27821234567" } as HostBookingSummary;
    const markup = renderToStaticMarkup(createElement(HostRequestsList, { requests: [record], loadFailed: false }));
    expect(markup).toContain('href="/app/requests/request-1"');
    expect(markup).toContain("Soweto");
    expect(markup).toContain("20 Oct 2026");
    expect(markup).toContain("11:00");
    expect(markup).toContain(t("host.home.status.open"));
    expect(markup).not.toContain("Private address");
    expect(markup).not.toContain("+27821234567");
  });

  it.each(Object.entries(hostBookingStatusCopy))("uses generated copy for the %s status", (status, key) => {
    const markup = renderToStaticMarkup(createElement(HostRequestsList, {
      requests: [{ ...booking, status: status as HostBookingSummary["status"] }],
      loadFailed: false,
    }));
    expect(markup).toContain(t(key));
  });
});
