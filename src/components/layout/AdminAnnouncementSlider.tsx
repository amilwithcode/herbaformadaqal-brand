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
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch("/api/announcements");
        if (res.ok) {
          const data = await res.json();
          setAnnouncements(Array.isArray(data) ? data : []);
        } else {
          console.error("API returned error:", res.status);
          setAnnouncements([]);
        }
      } catch (err) {
        console.error("Failed to fetch announcements:", err);
        setAnnouncements([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const goNext = useCallback(() => {
    setCurrent((prev) => {
      const next = (prev + 1) % Math.max(announcements.length, 1);
      return next;
    });
  }, [announcements.length]);

  useEffect(() => {
    if (isLoading) return;
    if (announcements.length <= 1) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(goNext, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [goNext, announcements.length, isLoading]);

  // Yüklənir göstəricisi
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 min-w-0 flex-1 max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
        <Megaphone size={14} className="text-emerald-300 shrink-0 animate-pulse" />
        <div className="h-4 w-32 bg-white/20 rounded animate-pulse" />
      </div>
    );
  }

  // Hələ heç bir məlumat yoxdursa placeholder göstər
  if (announcements.length === 0) {
    return (
      <div className="flex items-center gap-2 min-w-0 flex-1 max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
        <Megaphone size={14} className="text-emerald-300 shrink-0" />
        <span className="text-[11px] sm:text-[12px] font-medium tracking-wide text-white/80 truncate">
          Admin panelindən mesaj əlavə edin...
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 min-w-0 flex-1 max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
      <Megaphone size={14} className="text-emerald-300 shrink-0" />
      <div className="relative min-h-[20px] flex-1 overflow-hidden">
        {announcements.map((item, idx) => {
          const content = (item as any)[`content_${locale}`] || item.content_az;
          return (
            <div
              key={item.id}
              className={`absolute inset-0 flex items-center transition-all duration-500 ease-in-out ${
                idx === current
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-3 pointer-events-none"
              }`}
            >
              <span className="whitespace-nowrap text-[11px] sm:text-[12px] font-medium tracking-wide truncate block text-white">
                {content}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
