"use client";

import { useEffect, useState, useRef } from "react";
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
  const [mounted, setMounted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchAnnouncements = async () => {
      try {
        const res = await fetch("/api/announcements");
        if (res.ok) {
          const data = await res.json();
          setAnnouncements(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to fetch announcements:", err);
      }
    };
    fetchAnnouncements();
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (announcements.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % announcements.length);
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [announcements.length, mounted]);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 min-w-0 flex-1 max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
        <Megaphone size={14} className="text-emerald-300 shrink-0" />
        <div className="h-4 w-32 bg-white/20 rounded animate-pulse" />
      </div>
    );
  }

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

  const content = ((announcements[current] as any)[`content_${locale}`] || announcements[current].content_az || "").slice(0, 60);

  return (
    <div className="flex items-center gap-2 min-w-0 flex-1 max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
      <Megaphone size={14} className="text-emerald-300 shrink-0" />
      <span className="whitespace-nowrap text-[11px] sm:text-[12px] font-medium tracking-wide truncate block text-white">
        {content}
      </span>
    </div>
  );
}
