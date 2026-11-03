import Link from "next/link";
import { User, MapPin, Building, FileText } from "lucide-react";
import { t } from "@/content/t";
import { HostAccountForm, type HostAccountNotice } from "@/components/HostAccountForm";
import type { HostAccountView } from "@/server/views/host-account";
import type { HostProfileView } from "@/server/views/host-profile";
import { Badge } from "@/components/ui/badge";

export function HostProfileForm({
  profile,
  titleKey = "host.profile.title",
  account,
  accountNotice,
}: {
  profile: HostProfileView;
  titleKey?: "host.profile.title" | "host.onboarding.title";
  account?: HostAccountView;
  accountNotice?: HostAccountNotice;
}) {
  return (
    <main className="min-h-screen bg-[#f5f5f5] text-black pb-36 font-sans phase-a-shell">
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
              {t(titleKey)}
            </span>
          </div>
          <Badge variant="outline" className="text-white/80 border-white/20 text-[11px] font-medium hidden sm:inline-flex">
            Host Profile
          </Badge>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-12 space-y-8 host-profile-stack">
        <section
          className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-6 phase-a-card"
          aria-labelledby="host-home-profile-title"
        >
          <div className="border-b border-neutral-100 pb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
              siZa / HOST
            </p>
            <h1 id="host-home-profile-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
              {t(titleKey)}
            </h1>
            <p className="text-sm text-neutral-600 mt-1">
              {t("host.onboarding.body")}
            </p>
          </div>

          <form className="space-y-4 phase-a-form" action="/api/host/onboarding" method="post">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                {t("host.label.address")}
              </label>
              <input
                name="addressLine"
                required
                maxLength={300}
                autoComplete="street-address"
                defaultValue={profile.addressLine}
                placeholder="e.g. 14 Jan Smuts Avenue"
                className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                  {t("host.label.suburb")}
                </label>
                <input
                  name="suburb"
                  required
                  maxLength={80}
                  autoComplete="address-level2"
                  defaultValue={profile.suburb}
                  placeholder="e.g. Rosebank"
                  className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                  {t("host.label.city")}
                </label>
                <input
                  name="city"
                  required
                  maxLength={80}
                  autoComplete="address-level1"
                  defaultValue={profile.city}
                  placeholder="Johannesburg"
                  className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                {t("host.label.notes")}
              </label>
              <textarea
                name="notesDefault"
                maxLength={2000}
                rows={4}
                defaultValue={profile.notesDefault}
                placeholder="Gate codes, buzzer instructions, parking location..."
                className="w-full p-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="pt-2">
              <button
                className="h-11 px-6 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-sm cursor-pointer phase-a-button"
                type="submit"
              >
                {t("button.save")}
              </button>
            </div>
          </form>
        </section>

        {account && <HostAccountForm account={account} notice={accountNotice} />}
      </div>
    </main>
  );
}
