"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useI18n } from "@/contexts/I18nContext";
import { Megaphone } from "lucide-react";

type Announcement = {
  id: string;
  content_az: string;
  content_en: string;
  content_ru: string;
  content_tr: string;
};

export default function AdminAnnouncementSlider() {
  const { locale } = useI18n();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch("/api/announcements");
        if (res.ok) {
          const data = await res.json();
          setAnnouncements(data);
        }
      } catch (err) {
        console.error("Failed to fetch announcements:", err);
      }
    };
    fetchAnnouncements();
  }, []);

  const goNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % announcements.length);
  }, [announcements.length]);

  useEffect(() => {
    if (announcements.length <= 1) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(goNext, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [goNext, announcements.length]);

  if (announcements.length === 0) return null;

  return (
    <div className="flex items-center gap-2 min-w-0 flex-1 max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
      <Megaphone size={14} className="text-emerald-300 shrink-0" />
      <div className="relative min-h-[20px] flex-1 overflow-hidden">
        {announcements.map((item, idx) => (
          <div
            key={item.id}
            className={`absolute inset-0 flex items-center transition-all duration-500 ease-in-out ${
              idx === current
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-3 pointer-events-none"
            }`}
          >
            <span className="whitespace-nowrap text-[11px] sm:text-[12px] font-medium tracking-wide truncate block">
              {(item as any)[`content_${locale}`] || item.content_az}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
