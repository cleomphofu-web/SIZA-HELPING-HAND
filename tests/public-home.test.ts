import { describe, expect, it } from "vitest";
import { copy } from "@/content/copy.generated";
import { homeFaq, homeHowSteps, homeReasons, homeServices, homeSectionRoutes } from "@/lib/public-home-content";

describe("public home content", () => {
  it("uses generated copy keys for every rendered home section", () => {
    const keys = [
      ...homeHowSteps.flatMap((step) => [step.label, step.title, step.body]),
      ...homeServices.flatMap((service) => [service.title, service.body]),
      ...homeReasons.flatMap((reason) => [reason.title, reason.body]),
      ...homeFaq.flatMap((faq) => [faq.question, faq.answer]),
    ];

    expect(keys.every((key) => key in copy)).toBe(true);
  });

  it("routes service and how-it-works links to home sections", () => {
    expect(homeSectionRoutes.services).toBe("/#services");
    expect(homeSectionRoutes.howItWorks).toBe("/#how-it-works");
  });

  it("does not render unresolved or price-variable FAQ answers", () => {
    const answers = homeFaq.map(({ answer }) => copy[answer]);

    expect(answers.some((answer) => /\[(?:OWNER|CONFIRM):|\{subscriptionPrice\}|\{subscriptionDays\}/.test(answer))).toBe(false);
  });

  it("keeps services outside the initial home-cleaning scope marked as coming soon", () => {
    expect(homeServices.filter((service) => !service.available).length).toBeGreaterThan(0);
    expect(homeServices.every((service) => service.available || service.comingSoon)).toBe(true);
  });
});
