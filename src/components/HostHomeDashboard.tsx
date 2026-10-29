import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  Building,
  HeartHandshake,
  ArrowRight,
  ChevronRight,
  Clock,
  MapPin,
  Calendar,
  Home as HomeIcon,
  CheckCircle2,
} from "lucide-react";
import { t } from "@/content/t";
import { formatHostBookingDate, hostBookingStatusCopy } from "@/lib/host-booking-display";
import type { HostBookingSummary } from "@/server/views/booking-read";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

type Props = {
  requests: HostBookingSummary[];
  loadFailed: boolean;
};

const showcaseCards = [
  {
    title: "Living & Family Spaces",
    category: "Home Cleaning",
    accent: "from-neutral-900 via-neutral-800 to-neutral-700",
    badge: "Spotless & Fresh",
    description: "Dust-free surfaces, arranged cushions, vacuumed carpets, and tidy living areas.",
    icon: Sparkles,
  },
  {
    title: "Gleaming Kitchens & Counters",
    category: "Deep Clean",
    accent: "from-stone-900 via-stone-800 to-neutral-700",
    badge: "Sanitized & Degreased",
    description: "Sparkling stovetops, descaled sinks, wiped appliances, and hygienic counters.",
    icon: ShieldCheck,
  },
  {
    title: "Guest-Ready Bedrooms",
    category: "Turnover Care",
    accent: "from-zinc-900 via-zinc-800 to-neutral-700",
    badge: "Crisp & Pristine",
    description: "Hotel-grade hospital folds, fresh linens, polished mirrors, and serene atmosphere.",
    icon: Building,
  },
  {
    title: "Immaculate Bathrooms",
    category: "Sanitation Focus",
    accent: "from-neutral-900 via-stone-800 to-neutral-800",
    badge: "Descaled & Polished",
    description: "Scrubbed grout, shining chrome fixtures, sparkling mirrors, and fragrant rooms.",
    icon: HomeIcon,
  },
];

export function HostHomeDashboard({ requests, loadFailed }: Props) {
  return (
    <main className="min-h-screen bg-[#f5f5f5] text-black pb-36 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-black/95 text-white backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="text-lg font-bold tracking-tighter hover:opacity-80 transition-opacity"
            >
              siZa.
            </Link>
            <span className="text-white/30" aria-hidden="true">/</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Host
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/app/profile"
              className="text-xs font-medium text-neutral-300 hover:text-white transition-colors px-2.5 py-1 rounded-lg hover:bg-white/10"
            >
              {t("host.profile.title")}
            </Link>
            <Badge variant="outline" className="text-white/80 border-white/20 text-[11px] font-medium hidden sm:inline-flex">
              Fair Rotation · First Accept
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-12 space-y-8">
        {/* Hero Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Johannesburg
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 mb-3">
              {t("host.preview.title")}
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 mb-6 leading-relaxed">
              {t("host.app.body")}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/app/book"
                className="inline-flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-black text-white text-sm font-semibold hover:bg-neutral-800 transition-colors shadow-md cursor-pointer"
              >
                <span>{t("button.request")}</span>
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/app/profile"
                className="inline-flex items-center justify-center px-4 h-12 rounded-xl text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 text-sm font-medium transition-colors"
              >
                {t("host.profile.title")}
              </Link>
            </div>
          </div>
        </div>

        {/* Clean Spaces Carousel */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-neutral-100 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="size-4 text-neutral-800" />
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Visual Standards
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
                {t("host.home.carousel.title")}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                {t("host.home.carousel.subtitle")}
              </p>
            </div>
          </div>

          <Carousel className="w-full">
            <CarouselContent className="-ml-3">
              {showcaseCards.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <CarouselItem key={idx} className="pl-3 basis-full sm:basis-1/2">
                    <div
                      className={`h-64 sm:h-72 rounded-2xl bg-gradient-to-br ${card.accent} p-6 text-white flex flex-col justify-between shadow-sm relative overflow-hidden group`}
                    >
                      <div className="relative z-10 flex items-start justify-between">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-medium text-white/90 border border-white/15">
                          <CheckCircle2 className="size-3 text-emerald-400" />
                          {card.badge}
                        </span>
                        <div className="size-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15">
                          <Icon className="size-5 text-white/90" />
                        </div>
                      </div>

                      <div className="relative z-10 space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                          {card.category}
                        </span>
                        <h3 className="text-xl font-bold tracking-tight text-white leading-snug">
                          {card.title}
                        </h3>
                        <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                          {card.description}
                        </p>
                      </div>

                      {/* Editorial background accent lines */}
                      <div
                        className="absolute -right-8 -bottom-8 size-40 rounded-full border border-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-500"
                        aria-hidden="true"
                      />
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <div className="hidden sm:flex items-center justify-end gap-2 mt-3">
              <CarouselPrevious type="button" className="static translate-y-0 size-8" />
              <CarouselNext type="button" className="static translate-y-0 size-8" />
            </div>
          </Carousel>
        </section>

        {/* Impact Message Section */}
        <section className="bg-gradient-to-br from-neutral-900 to-black text-white rounded-3xl p-6 sm:p-8 border border-white/10 shadow-lg space-y-6">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15">
              <HeartHandshake className="size-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Community Impact
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                {t("host.home.impact.title")}
              </h2>
            </div>
          </div>

          <p className="text-sm text-neutral-300 leading-relaxed max-w-2xl font-normal">
            {t("host.home.impact.body")}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <p className="text-lg font-bold text-white tracking-tight">100%</p>
              <p className="text-xs text-neutral-400 mt-0.5">Earnings direct to helper</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <p className="text-lg font-bold text-white tracking-tight">Fair Rotation</p>
              <p className="text-xs text-neutral-400 mt-0.5">Equal job offers for all</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <p className="text-lg font-bold text-white tracking-tight">R0 Fees</p>
              <p className="text-xs text-neutral-400 mt-0.5">No wage skim on arrival</p>
            </div>
          </div>
        </section>

        {/* Recent Requests Section */}
        <section
          className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-4"
          aria-labelledby="host-home-requests-title"
        >
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-neutral-700" />
              <h2 id="host-home-requests-title" className="text-lg font-bold tracking-tight text-neutral-900">
                {t("host.home.recent_requests")}
              </h2>
            </div>
            {requests.length > 0 && (
              <Link
                href="/app/requests"
                className="text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
              >
                {t("host.home.view_requests")} &rarr;
              </Link>
            )}
          </div>

          {loadFailed ? (
            <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-900 space-y-3" role="alert">
              <p className="text-sm font-medium">{t("phase_a.error")}</p>
              <a
                href="/app"
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-red-900 text-white text-xs font-semibold hover:bg-red-800 transition-colors"
              >
                {t("button.retry")}
              </a>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-center space-y-4">
              <p className="text-sm text-neutral-600 max-w-sm mx-auto">
                {t("host.home.empty_requests")}
              </p>
              <div>
                <Link
                  href="/app/book"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-sm"
                >
                  <span>{t("button.request")}</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {requests.slice(0, 3).map((request) => (
                <li key={request.id}>
                  <Link
                    href={`/app/requests/${request.id}`}
                    className="flex items-center justify-between py-4 px-3 -mx-3 rounded-xl hover:bg-neutral-50 transition-colors group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="size-3.5 text-neutral-400" />
                        <strong className="text-sm font-semibold text-neutral-900 group-hover:text-black">
                          {request.suburb}
                        </strong>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                        <Calendar className="size-3" />
                        <time dateTime={request.startAt}>{formatHostBookingDate(request.startAt)}</time>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs font-medium">
                        {t(hostBookingStatusCopy[request.status])}
                      </Badge>
                      <ChevronRight className="size-4 text-neutral-400 group-hover:text-black transition-colors" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
