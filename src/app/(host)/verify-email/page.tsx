import Link from "next/link";
import { MailCheck } from "lucide-react";
import { t } from "@/content/t";

export default function VerifyEmailPage() {
  return (
    <main className="phase-a-shell flex min-h-[70vh] items-center justify-center px-4 py-12">
      <section className="phase-a-card w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <MailCheck className="h-6 w-6" aria-hidden="true" />
        </div>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-900">
          {t("account.verify_email.title")}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          {t("account.verify_email.body")}
        </p>

        <div className="mt-6">
          <Link
            href="/login"
            className="inline-block rounded-lg bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-black focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2"
          >
            {t("account.verify_email.back")}
          </Link>
        </div>
      </section>
    </main>
  );
}
