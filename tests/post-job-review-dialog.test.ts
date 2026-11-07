import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PostJobReviewDialog } from "@/components/PostJobReviewDialog";

describe("PostJobReviewDialog Component", () => {
  it("renders the trigger button initially when closed", () => {
    const html = renderToStaticMarkup(
      createElement(PostJobReviewDialog, {
        bookingId: "b-100",
        helperId: "h-200",
        helperFirstName: "Nomsa",
        initiallyOpen: false,
      })
    );

    expect(html).toContain("Rate Helper &amp; Feedback");
  });

  it("renders star rating options and helper name when open", () => {
    const html = renderToStaticMarkup(
      createElement(PostJobReviewDialog, {
        bookingId: "b-100",
        helperId: "h-200",
        helperFirstName: "Nomsa",
        initiallyOpen: true,
      })
    );

    expect(html).toContain("How was your cleaning?");
    expect(html).toContain("Nomsa");
    expect(html).toContain("Rate your helper");
    expect(html).toContain("Would you book Nomsa again?");
    expect(html).toContain("Yes, definitely");
    expect(html).toContain("Not this time");
  });

  it("renders quick positive highlight tags and submit button", () => {
    const html = renderToStaticMarkup(
      createElement(PostJobReviewDialog, {
        bookingId: "b-100",
        helperId: "h-200",
        helperFirstName: "Nomsa",
        initiallyOpen: true,
      })
    );

    expect(html).toContain("Punctual &amp; On Time");
    expect(html).toContain("Thorough Cleaning");
    expect(html).toContain("Submit Feedback");
  });
});

