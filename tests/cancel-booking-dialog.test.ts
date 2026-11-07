import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CancelBookingDialog } from "@/components/CancelBookingDialog";

describe("CancelBookingDialog Component", () => {
  it("renders trigger button with cancel label", () => {
    const html = renderToStaticMarkup(
      createElement(CancelBookingDialog, {
        bookingId: "b-1",
        startAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        hasAssignedHelper: true,
        isEnRoute: false,
      }),
    );

    expect(html).toContain("Cancel Request");
  });

  it("indicates free cancellation when more than 4 hours before start", () => {
    const now = Date.now();
    const futureDate = new Date(now + 10 * 3600 * 1000).toISOString();
    const html = renderToStaticMarkup(
      createElement(CancelBookingDialog, {
        bookingId: "b-1",
        startAt: futureDate,
        hasAssignedHelper: true,
        isEnRoute: false,
        initiallyOpen: true,
        currentTimeMs: now,
      }),
    );

    expect(html).toContain("Free Cancellation");
    expect(html).toContain("full refund");
  });

  it("indicates R100 helper transport compensation when less than 4 hours before start", () => {
    const now = Date.now();
    const nearDate = new Date(now + 2 * 3600 * 1000).toISOString();
    const html = renderToStaticMarkup(
      createElement(CancelBookingDialog, {
        bookingId: "b-1",
        startAt: nearDate,
        hasAssignedHelper: true,
        isEnRoute: false,
        initiallyOpen: true,
        currentTimeMs: now,
      }),
    );

    expect(html).toContain("R100");
    expect(html).toContain("transport compensation");
  });

  it("indicates R100 helper transport compensation when helper is already en route", () => {
    const futureDate = new Date(Date.now() + 10 * 3600 * 1000).toISOString();
    const html = renderToStaticMarkup(
      createElement(CancelBookingDialog, {
        bookingId: "b-1",
        startAt: futureDate,
        hasAssignedHelper: true,
        isEnRoute: true,
        initiallyOpen: true,
      }),
    );

    expect(html).toContain("R100");
    expect(html).toContain("transport compensation");
  });
});
