"use client";

import { Phone, Mail, MapPin, Send, CheckCircle2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";

type Props = {
  initialPhone: string;
  initialEmail: string;
  initialAddress: string;
};

export default function ContactClient({
  initialPhone,
  initialEmail,
  initialAddress,
}: Props) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmitted(false);
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (!res.ok) {
        setError(t("contact.form.error"));
      } else {
        setSubmitted(true);
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      }
    } catch {
      setError(t("contact.form.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <section className="border-b border-emerald-100 bg-[#e3f3ea]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-10 text-center">
          <h1 className="text-3xl font-semibold text-emerald-950 md:text-4xl">
            {t("contact.title")}
          </h1>
          <p className="max-w-2xl text-sm text-emerald-800 md:text-base">
            {t("contact.subtitle")}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          {/* ── Contact info (server-dən gəlir, layout shift yoxdur) ── */}
          <div className="space-y-6 text-sm text-emerald-900">
            <h2 className="text-base font-semibold text-emerald-950">
              {t("contact.info.title")}
            </h2>
            <p className="text-xs text-emerald-700">{t("contact.subtitle")}</p>
            <div className="space-y-6">
              <div className="flex items-start gap-4 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Phone size={24} />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    {t("contact.info.phone_label")}
                  </div>
                  <div className="text-base font-medium text-emerald-950">
                    {initialPhone || t("footer.contact.phone")}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Mail size={24} />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    {t("contact.info.email_label")}
                  </div>
                  <div className="text-base font-medium text-emerald-950">
                    {initialEmail || t("footer.contact.email")}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <MapPin size={24} />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    {t("contact.info.address_label")}
                  </div>
                  <div className="text-base font-medium text-emerald-950">
                    {initialAddress || t("footer.contact.address")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Form ── */}
          {submitted ? (
            <div className="flex flex-col items-center justify-center gap-5 rounded-3xl border border-emerald-100 bg-white px-6 py-12 text-center shadow-sm shadow-emerald-50">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 size={44} className="text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-emerald-950">
                  {t("contact.form.success_title")}
                </h3>
                <p className="text-sm text-emerald-700">
                  {t("contact.form.success")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                <RefreshCw size={14} />
                {t("contact.form.send_another")}
              </button>
            </div>
          ) : (
            <form
              className="space-y-4 rounded-3xl border border-emerald-100 bg-white px-6 py-6 text-sm text-emerald-900 shadow-sm shadow-emerald-50"
              onSubmit={handleSubmit}
            >
              <div>
                <label className="block text-xs font-medium text-emerald-800">
                  {t("contact.form.name_label")}
                </label>
                <input
                  className="mt-1 w-full rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 outline-none placeholder:text-emerald-400"
                  placeholder={t("contact.form.name_placeholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-emerald-800">
                  {t("contact.form.email_label")}
                </label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 outline-none placeholder:text-emerald-400"
                  placeholder={t("contact.form.email_placeholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-emerald-800">
                  {t("contact.form.subject_label")}
                </label>
                <input
                  className="mt-1 w-full rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 outline-none placeholder:text-emerald-400"
                  placeholder={t("contact.form.subject_placeholder")}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-emerald-800">
                  {t("contact.form.message_label")}
                </label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 outline-none placeholder:text-emerald-400"
                  rows={4}
                  placeholder={t("contact.form.message_placeholder")}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                  <span className="mt-0.5 text-red-500">&#9888;</span>
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}
              <button
                type="submit"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                disabled={submitting}
              >
                <Send size={16} />
                <span>
                  {submitting
                    ? t("contact.form.submitting")
                    : t("contact.form.submit")}
                </span>
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
