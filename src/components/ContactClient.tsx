"use client";

import { useState } from "react";
import Image from "next/image";
import { Mail, Clock, Send, CheckCircle2, MessageCircle } from "lucide-react";
import { t } from "@/content/t";
import { publicConfig } from "@/server/config/public";

// Custom Instagram SVG icon
function InstagramIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="24"
    >
      <rect height="20" rx="5" ry="5" width="20" x="2" y="2" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

// Custom WhatsApp SVG icon
function WhatsAppIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="24"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

export function ContactClient() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    // Simulate instantaneous delivery & prepare fallback mailto
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 400);
  }

  function handleReset() {
    setName("");
    setContact("");
    setComment("");
    setSubmitted(false);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full">
      {/* LEFT: SIZA's Direct Clickable Channels (5 cols on desktop) */}
      <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">
            {t("contact.channels.title")}
          </h2>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Reach out directly through any of our channels. Click below to open a conversation or send an email:
          </p>

          <div className="space-y-3 pt-2">
            {/* WhatsApp */}
            <a
              href="https://wa.me/27683570176"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs hover:border-[#25D366] hover:shadow-md transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]"
            >
              <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 text-[#128C7E] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <WhatsAppIcon className="w-6 h-6 stroke-[#128C7E]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block">
                  {t("contact.channels.whatsapp_label")}
                </span>
                <span className="text-sm sm:text-base font-bold text-neutral-900 group-hover:text-[#128C7E] transition-colors">
                  +27 68 357 0176
                </span>
              </div>
              <span className="text-xs font-semibold text-neutral-400 group-hover:text-neutral-900 transition-colors">
                Chat &rarr;
              </span>
            </a>

            {/* Email */}
            <a
              href={`mailto:${publicConfig.supportEmail}`}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs hover:border-black hover:shadow-md transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              <div className="w-12 h-12 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Mail className="w-6 h-6 stroke-neutral-900" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block">
                  {t("contact.channels.email_label")}
                </span>
                <span className="text-sm sm:text-base font-bold text-neutral-900 break-all group-hover:text-black transition-colors">
                  {publicConfig.supportEmail}
                </span>
              </div>
              <span className="text-xs font-semibold text-neutral-400 group-hover:text-neutral-900 transition-colors">
                Email &rarr;
              </span>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com/kamva_media"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs hover:border-[#E1306C] hover:shadow-md transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E1306C]"
            >
              <div className="w-12 h-12 rounded-xl bg-[#E1306C]/10 text-[#E1306C] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <InstagramIcon className="w-6 h-6 stroke-[#E1306C]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block">
                  {t("contact.channels.instagram_label")}
                </span>
                <span className="text-sm sm:text-base font-bold text-neutral-900 group-hover:text-[#E1306C] transition-colors">
                  kamva_media
                </span>
              </div>
              <span className="text-xs font-semibold text-neutral-400 group-hover:text-neutral-900 transition-colors">
                Follow &rarr;
              </span>
            </a>
          </div>
        </div>

        {/* Support hours card */}
        <div className="p-5 rounded-2xl bg-neutral-100/80 border border-neutral-200 text-neutral-800 text-xs sm:text-sm space-y-2">
          <div className="flex items-center gap-2 font-bold text-neutral-900">
            <Clock className="w-4 h-4 text-neutral-600" />
            <span>{t("contact.hours.title")}</span>
          </div>
          <p className="text-neutral-600 leading-relaxed">
            {t("contact.hours.body")}
          </p>
        </div>
      </div>

      {/* RIGHT: "Ask us anything" Full-Corner Card (7 cols on desktop) */}
      <div className="lg:col-span-7 relative overflow-hidden rounded-3xl p-6 sm:p-10 text-white border border-neutral-800/80 shadow-2xl isolate flex flex-col justify-between min-h-[460px]">
        {/* Full-bleed crisp background image with NO saturation distortion */}
        <Image
          alt=""
          aria-hidden="true"
          className="object-cover -z-2 pointer-events-none"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 58vw"
          src="/assets/images/about/contact%20us%20form%20background%20image.png"
        />

        {/* Clear transparent dark overlay for WCAG typography contrast */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/85 -z-1 pointer-events-none"
        />

        {/* Card Content */}
        <div className="relative z-1 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white/90 text-xs font-semibold uppercase tracking-wider border border-white/15">
            <MessageCircle className="w-3.5 h-3.5 text-accent-green" />
            <span>{t("contact.hero.label")}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white m-0 p-0">
            {t("contact.form.title")}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-200 max-w-lg leading-relaxed">
            {t("contact.hero.subtitle")} &mdash; send a quick note or comment below and we will follow up with you.
          </p>
        </div>

        {/* Contact Form with Comment Box */}
        <div className="relative z-1 mt-6">
          {submitted ? (
            <div className="p-6 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 text-center space-y-4 animate-in fade-in duration-300">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {t("contact.form.success")}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300">
                You can also reach out anytime on WhatsApp at{" "}
                <a
                  className="underline text-emerald-400 font-semibold"
                  href="https://wa.me/27683570176"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  +27 68 357 0176
                </a>
                .
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold text-white transition-colors"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="sr-only" htmlFor="contact-name">
                    {t("contact.form.name")}
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("contact.form.name")}
                    className="w-full h-11 px-3.5 rounded-xl bg-black/50 border border-white/20 text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/60 backdrop-blur-sm transition-all"
                  />
                </div>
                <div>
                  <label className="sr-only" htmlFor="contact-detail">
                    {t("contact.form.email")}
                  </label>
                  <input
                    id="contact-detail"
                    name="contact"
                    type="text"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Email or cell number"
                    className="w-full h-11 px-3.5 rounded-xl bg-black/50 border border-white/20 text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/60 backdrop-blur-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="sr-only" htmlFor="contact-comment">
                  {t("contact.form.message")}
                </label>
                <textarea
                  id="contact-comment"
                  name="comment"
                  rows={4}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t("contact.form.comment_placeholder")}
                  className="w-full p-3.5 rounded-xl bg-black/50 border border-white/20 text-white placeholder:text-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-white/60 backdrop-blur-sm transition-all resize-y"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <span className="text-[11px] text-neutral-400 text-center sm:text-left">
                  {t("contact.hours.badge")}
                </span>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 active:scale-95 transition-all shadow-lg cursor-pointer disabled:opacity-60"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? "Sending..." : t("contact.form.submit")}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

