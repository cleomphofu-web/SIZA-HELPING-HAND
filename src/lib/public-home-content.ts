import type { CopyKey } from "@/content/copy.generated";

export const homeSectionRoutes = {
  services: "/#services",
  howItWorks: "/#how-it-works",
} as const;

export const homeHowSteps = [
  {
    label: "home.how.host.1.label",
    title: "home.how.host.1.title",
    body: "home.how.host.1.body",
    image: "/assets/images/clay-banks-IE0m2PUI4Fg-unsplash.jpg",
  },
  {
    label: "home.how.host.2.label",
    title: "home.how.host.2.title",
    body: "home.how.host.2.body",
    image: "/assets/images/caroline-badran-xTmez98cqAM-unsplash.jpg",
  },
  {
    label: "home.how.host.3.label",
    title: "home.how.host.3.title",
    body: "home.how.host.3.body",
    image: "/assets/images/ashwini-chaudhary-monty-Iu6parQAO-U-unsplash.jpg",
  },
  {
    label: "home.how.host.4.label",
    title: "home.how.host.4.title",
    body: "home.how.host.4.body",
    image: "/assets/images/franco-debartolo-LKI3Dd146vI-unsplash.jpg",
  },
] satisfies readonly { label: CopyKey; title: CopyKey; body: CopyKey; image: string }[];

export const homeServices = [
  {
    title: "service.home_cleaning.title",
    body: "service.home_cleaning.body",
    available: true,
    comingSoon: false,
    image: "/assets/images/christian-mackie-cc0Gg3BegjE-unsplash.jpg",
  },
  {
    title: "service.airbnb_turnover.title",
    body: "service.airbnb_turnover.body",
    available: true,
    comingSoon: false,
    image: "/assets/images/clay-banks-zAvzWN6CE5w-unsplash.jpg",
  },
  {
    title: "service.office.title",
    body: "service.office.body",
    available: false,
    comingSoon: true,
    image: "/assets/images/aalo-lens-QVVHV24DA_o-unsplash.jpg",
  },
  {
    title: "service.garden.title",
    body: "service.garden.body",
    available: true,
    comingSoon: false,
    image: "/assets/images/crystal-jo-PKcTuA_CRAo-unsplash.jpg",
  },
  {
    title: "service.handyman.title",
    body: "service.handyman.body",
    available: false,
    comingSoon: true,
    image: "/assets/images/erik-mclean-RfkaDKptt-A-unsplash.jpg",
  },
  {
    title: "service.custom.title",
    body: "service.custom.body",
    available: false,
    comingSoon: true,
    image: "/assets/images/stefan-lehner-biRt6RXejuk-unsplash.jpg",
  },
] satisfies readonly { title: CopyKey; body: CopyKey; available: boolean; comingSoon: boolean; image: string }[];


export const homeReasons = [
  { title: "home.why.price.title", body: "home.why.price.body" },
  { title: "home.why.address.title", body: "home.why.address.body" },
  { title: "home.why.code.title", body: "home.why.code.body" },
  { title: "home.why.fair.title", body: "home.why.fair.body" },
] satisfies readonly { title: CopyKey; body: CopyKey }[];

export const homeSpotlightItems = [
  {
    badge: "home.spotlight.residential.badge",
    title: "home.spotlight.residential.title",
    body: "home.spotlight.residential.body",
    image: "/assets/images/christian-mackie-cc0Gg3BegjE-unsplash.jpg",
  },
  {
    badge: "home.spotlight.turnover.badge",
    title: "home.spotlight.turnover.title",
    body: "home.spotlight.turnover.body",
    image: "/assets/images/clay-banks-zAvzWN6CE5w-unsplash.jpg",
  },
  {
    badge: "home.spotlight.grounds.badge",
    title: "home.spotlight.grounds.title",
    body: "home.spotlight.grounds.body",
    image: "/assets/images/crystal-jo-PKcTuA_CRAo-unsplash.jpg",
  },
] satisfies readonly { badge: CopyKey; title: CopyKey; body: CopyKey; image: string }[];

export const homePricingTiers = {
  host: {
    label: "home.pricing.host.title",
    price: "home.pricing.host.price",
    period: "home.pricing.host.period",
    benefits: [
      "home.pricing.host.benefit1",
      "home.pricing.host.benefit2",
      "home.pricing.host.benefit3",
      "home.pricing.host.benefit4",
    ],
    cta: "button.request",
    href: "/request",
  },
  helper: {
    label: "home.pricing.helper.title",
    price: "home.pricing.helper.price",
    period: "home.pricing.helper.period",
    benefits: [
      "home.pricing.helper.benefit1",
      "home.pricing.helper.benefit2",
      "home.pricing.helper.benefit3",
      "home.pricing.helper.benefit4",
    ],
    cta: "button.apply",
    href: "/apply",
  },
} as const;

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
