import { t } from "@/content/t";
import type { HostAccountView } from "@/server/views/host-account";

export type HostAccountNotice = "saved" | "failed" | "rate_limited";

export function HostAccountForm({ account, notice }: { account: HostAccountView; notice?: HostAccountNotice }) {
  return (
    <section
      className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-6 phase-a-card host-account-card"
      aria-labelledby="host-contact-title"
    >
      <div className="border-b border-neutral-100 pb-4">
        <h2 id="host-contact-title" className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
          {t("host.account.contact.title")}
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          {t("host.account.contact.body")}
        </p>
      </div>

      <div className="p-3.5 rounded-xl bg-neutral-100/80 border border-neutral-200 text-xs text-neutral-600 phase-a-notice">
        {t("host.account.contact.phone_not_verified")}
      </div>

      {notice === "saved" && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium host-account-result" role="status">
          {t("host.account.contact.saved")}
        </div>
      )}
      {notice === "failed" && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium host-account-result" role="alert">
          {t("host.account.contact.failed")}
        </div>
      )}
      {notice === "rate_limited" && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium host-account-result" role="alert">
          {t("host.account.contact.rate_limited")}
        </div>
      )}

      <form className="space-y-4 phase-a-form" action="/api/host/account" method="post">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              {t("account.label.first_name")}
            </label>
            <input
              name="firstName"
              required
              maxLength={80}
              autoComplete="given-name"
              defaultValue={account.firstName}
              placeholder="First name"
              className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              {t("account.label.last_name")}
            </label>
            <input
              name="lastName"
              required
              maxLength={120}
              autoComplete="family-name"
              defaultValue={account.lastName}
              placeholder="Last name"
              className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
            {t("account.label.phone")}
          </label>
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            required
            maxLength={20}
            autoComplete="tel"
            defaultValue={account.phone}
            placeholder="082 123 4567"
            className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-black"
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
  );
}
