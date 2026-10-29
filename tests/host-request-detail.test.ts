import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { t } from "@/content/t";
import { HostRequestDetails, HostRequestLoadError } from "@/components/HostRequestDetails";
import { formatZarCents } from "@/lib/money";
import type { HostBookingView } from "@/server/views/booking";

const booking: HostBookingView = {
  audience: "host",
  id: "request-1",
  suburb: "Soweto",
  city: "Johannesburg",
  address: "12 Example Road",
  accessNotes: "Use the side gate",
  services: ["home"],
  helpersNeeded: 1,
  startAt: "2026-10-20T09:00:00.000Z",
  endAt: "2026-10-20T13:00:00.000Z",
  status: "assigned",
  payPerHelperCents: "55000",
  transportPerHelperCents: "6000",
  assignedHelpers: [{ helperId: "helper-1", firstName: "Sam", phone: "+27829876543", checkedInAt: null }],
    noShowSlots: [],
  noShowRecoveryMinutes: null,
};

describe("host request detail screen", () => {
  it("shows generated status, Johannesburg time, address, access notes and saved amounts", () => {
    const markup = renderToStaticMarkup(createElement(HostRequestDetails, { booking }));
    expect(markup).toContain(t("host.home.status.assigned"));
    expect(markup).toContain("20 Oct 2026");
    expect(markup).toContain("11:00");
    expect(markup).toContain("15:00");
    expect(markup).toContain("12 Example Road");
    expect(markup).toContain("Use the side gate");
    expect(markup).toContain(formatZarCents(55000));
    expect(markup).toContain(formatZarCents(6000));
  });

  it("links to WhatsApp only when the host view contains an assigned helper phone", () => {
    const assigned = renderToStaticMarkup(createElement(HostRequestDetails, { booking }));
    expect(assigned).toContain('href="https://wa.me/27829876543"');
    expect(assigned).toContain(t("button.message_whatsapp"));

    const open = renderToStaticMarkup(createElement(HostRequestDetails, {
      booking: { ...booking, status: "open", assignedHelpers: [] },
    }));
    expect(open).not.toContain("27829876543");
    expect(open).not.toContain("wa.me");
  });

  it("offers check-in for an assigned job but confirmation only for an in-progress job", () => {
    const assigned = renderToStaticMarkup(createElement(HostRequestDetails, { booking }));
    expect(assigned).toContain(t("host.request.issue_code"));
    expect(assigned).not.toContain(t("host.finish.confirm"));

    const inProgress = renderToStaticMarkup(createElement(HostRequestDetails, {
      booking: { ...booking, status: "in_progress" },
    }));
    expect(inProgress).toContain(t("host.finish.confirm"));

    const completed = renderToStaticMarkup(createElement(HostRequestDetails, {
      booking: { ...booking, status: "completed" },
    }));
    expect(completed).not.toContain(t("host.finish.confirm"));
  });

  it("keeps the report action and gives a retry for a temporary read failure", () => {
    const details = renderToStaticMarkup(createElement(HostRequestDetails, { booking }));
    expect(details).toContain('href="/app/report?bookingId=request-1"');
    expect(details).toContain(t("host.request.report"));

    const error = renderToStaticMarkup(createElement(HostRequestLoadError, { bookingId: "request-1" }));
    expect(error).toContain('role="alert"');
    expect(error).toContain(t("phase_a.error"));
    expect(error).toContain('href="/app/requests/request-1"');
    expect(error).toContain(t("button.retry"));
  });

  it("shows host resolution choices only after the configured recovery interval", () => {
    const now = Date.now();
    const pending = renderToStaticMarkup(createElement(HostRequestDetails, {
      booking: { ...booking, status: "in_progress", noShowSlots: [{ slot: 1, noShowAt: new Date(now - 61 * 60_000).toISOString(), resolution: null, canResolve: false, canProceedWithFewer: false }], noShowRecoveryMinutes: 60 },
    }));
    expect(pending).not.toContain(t("host.request.no_show_resolution.proceed"));
    expect(pending).toContain(t("host.request.no_show_resolution.waiting", { minutes: "60" }));

    const available = renderToStaticMarkup(createElement(HostRequestDetails, {
      booking: { ...booking, status: "in_progress", noShowSlots: [{ slot: 1, noShowAt: new Date(now - 61 * 60_000).toISOString(), resolution: null, canResolve: true, canProceedWithFewer: true }], noShowRecoveryMinutes: 60 },
    }));
    expect(available).toContain(t("host.request.no_show_resolution.proceed"));
    expect(available).toContain(t("host.request.no_show_resolution.close"));
    expect(available).toContain('name="slot" value="1"');
    expect(available).toContain('value="proceed_fewer"');
  });

  it("does not offer proceeding with fewer helpers when none remain assigned", () => {
    const onlySlotNoShow = renderToStaticMarkup(createElement(HostRequestDetails, {
      booking: {
        ...booking,
        status: "in_progress",
        assignedHelpers: [],
        noShowSlots: [{ slot: 1, noShowAt: new Date().toISOString(), resolution: null, canResolve: true, canProceedWithFewer: false }],
        noShowRecoveryMinutes: 60,
      } as HostBookingView,
    }));

    expect(onlySlotNoShow).not.toContain(t("host.request.no_show_resolution.proceed"));
    expect(onlySlotNoShow).toContain(t("host.request.no_show_resolution.close"));
  });

  it("reports a saved resolution and never offers another choice", () => {
    const markup = renderToStaticMarkup(createElement(HostRequestDetails, {
      booking: { ...booking, status: "in_progress", noShowSlots: [{ slot: 1, noShowAt: new Date(Date.now() - 90 * 60_000).toISOString(), resolution: "close_vacant_slot", canResolve: false, canProceedWithFewer: false }], noShowRecoveryMinutes: 60 },
    }));
    expect(markup).toContain(t("host.request.no_show_resolution.done_close"));
    expect(markup).not.toContain('name="resolution"');
  });

  it("formats integer cents without floating-point rounding", () => {
    expect(formatZarCents("55001")).toBe("R 550,01");
    expect(formatZarCents(0)).toBe("R 0,00");
  });
});
