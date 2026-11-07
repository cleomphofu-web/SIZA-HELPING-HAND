import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HelperSafetyReportModal } from "@/components/HelperSafetyReportModal";

describe("HelperSafetyReportModal Component", () => {
  it("renders trigger button initially when closed", () => {
    const html = renderToStaticMarkup(
      createElement(HelperSafetyReportModal, {
        bookingId: "b-100",
        initiallyOpen: false,
      })
    );

    expect(html).toContain("Report Issue / Safety Help");
  });

  it("renders South African emergency hotlines 10111 and 10177 when open", () => {
    const html = renderToStaticMarkup(
      createElement(HelperSafetyReportModal, {
        bookingId: "b-100",
        initiallyOpen: true,
      })
    );

    expect(html).toContain("10111");
    expect(html).toContain("10177");
    expect(html).toContain("tel:10111");
    expect(html).toContain("tel:10177");
  });

  it("renders categories and preset chips for quick mobile reporting", () => {
    const html = renderToStaticMarkup(
      createElement(HelperSafetyReportModal, {
        bookingId: "b-100",
        initiallyOpen: true,
      })
    );

    expect(html).toContain("Safety Concern / Unsafe");
    expect(html).toContain("Host Unreachable / Locked Out");
    expect(html).toContain("Payment / Rate Issue");
    expect(html).toContain("Submit Urgent Report");
  });
});

