"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronRight } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

type FAQItem = {
  id: number;
  question: string;
  answer: string;
};

export default function FAQSection() {
  const { t, locale } = useI18n();
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/content/faqs?locale=${locale}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!active) return;
        setFaqs(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!active) return;
        setFaqs([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [locale]);

  const toggle = useCallback((id: number) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  if (loading) {
    return (
      <section className="space-y-6">
        <h2 className="text-xl md:text-2xl font-bold text-emerald-950 text-center">
          {t("faq.title")}
        </h2>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="h-4 w-3/4 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (faqs.length === 0) return null;

  return (
    <section className="space-y-6">
      <h2 className="text-xl md:text-2xl font-bold text-emerald-950 text-center">
        {t("faq.title")}
      </h2>

      <div className="space-y-3">
        {faqs.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div
              key={faq.id}
              className={`rounded-xl border transition-all duration-200 ${
                isOpen
                  ? "border-emerald-200 bg-emerald-50/40 shadow-sm"
                  : "border-slate-200 bg-white hover:border-emerald-100 hover:shadow-sm"
              }`}
            >
              {/* Question */}
              <button
                type="button"
                onClick={() => toggle(faq.id)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left"
              >
                <ChevronRight
                  size={18}
                  className={`shrink-0 text-emerald-600 transition-transform duration-200 ${
                    isOpen ? "rotate-90" : ""
                  }`}
                />
                <span
                  className={`text-sm font-medium transition-colors ${
                    isOpen ? "text-emerald-800" : "text-slate-700"
                  }`}
                >
                  {faq.question}
                </span>
              </button>

              {/* Answer */}
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-5 pb-4 pl-11">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
