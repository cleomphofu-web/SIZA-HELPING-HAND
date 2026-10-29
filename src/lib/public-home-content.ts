import type { CopyKey } from "@/content/copy.generated";

export const homeSectionRoutes = {
  services: "/#services",
  howItWorks: "/#how-it-works",
} as const;

export const homeHowSteps = [
  { label: "home.how.host.1.label", title: "home.how.host.1.title", body: "home.how.host.1.body" },
  { label: "home.how.host.2.label", title: "home.how.host.2.title", body: "home.how.host.2.body" },
  { label: "home.how.host.3.label", title: "home.how.host.3.title", body: "home.how.host.3.body" },
  { label: "home.how.host.4.label", title: "home.how.host.4.title", body: "home.how.host.4.body" },
] satisfies readonly { label: CopyKey; title: CopyKey; body: CopyKey }[];

export const homeServices = [
  { title: "service.home_cleaning.title", body: "service.home_cleaning.body", available: true, comingSoon: false },
  { title: "service.airbnb_turnover.title", body: "service.airbnb_turnover.body", available: true, comingSoon: false },
  { title: "service.office.title", body: "service.office.body", available: false, comingSoon: true },
  { title: "service.garden.title", body: "service.garden.body", available: false, comingSoon: true },
  { title: "service.handyman.title", body: "service.handyman.body", available: false, comingSoon: true },
  { title: "service.custom.title", body: "service.custom.body", available: false, comingSoon: true },
] satisfies readonly { title: CopyKey; body: CopyKey; available: boolean; comingSoon: boolean }[];

export const homeReasons = [
  { title: "home.why.price.title", body: "home.why.price.body" },
  { title: "home.why.address.title", body: "home.why.address.body" },
  { title: "home.why.code.title", body: "home.why.code.body" },
  { title: "home.why.fair.title", body: "home.why.fair.body" },
] satisfies readonly { title: CopyKey; body: CopyKey }[];

export const homeFaq = [
  { question: "faq.1.q", answer: "faq.1.a" },
  { question: "faq.2.q", answer: "faq.2.a" },
  { question: "faq.3.q", answer: "faq.3.a" },
  { question: "faq.4.q", answer: "faq.4.a" },
  { question: "faq.6.q", answer: "faq.6.a" },
  { question: "faq.8.q", answer: "faq.8.a" },
  { question: "faq.9.q", answer: "faq.9.a" },
  { question: "faq.11.q", answer: "faq.11.a" },
  { question: "faq.12.q", answer: "faq.12.a" },
] satisfies readonly { question: CopyKey; answer: CopyKey }[];
