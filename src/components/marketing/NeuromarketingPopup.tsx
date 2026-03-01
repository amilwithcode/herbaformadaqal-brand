"use client";

import { useState, useEffect, useCallback } from "react";
import { X, CheckCircle, User, ShoppingBag } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type Notification = {
  id: number;
  name: string;
  city: string;
  product: string;
  action: string;
  timeAgo: string;
};

type ApiData = {
  profiles: Array<{ full_name: string; city?: string; created_at: string }>;
  orders: Array<{
    id: number;
    profiles: { full_name: string; city?: string };
    created_at: string;
    total: number;
  }>;
};

export default function NeuromarketingPopup() {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [realData, setRealData] = useState<ApiData | null>(null);

  const showRandomNotification = useCallback(() => {
    if (document.hidden) return; // Don't show if tab is not active

    // STRICTLY USE REAL DATA ONLY
    // If no real data is available yet, do not show anything.
    if (!realData || (realData.profiles.length === 0 && realData.orders.length === 0)) {
      return;
    }

    let name, city, product, action, timeAgoVal;

    // Decide whether to show an order or a registration
    // If we have orders, prioritize them slightly (60% chance)
    const hasOrders = realData.orders.length > 0;
    const hasProfiles = realData.profiles.length > 0;
    
    let useOrder = false;
    if (hasOrders && hasProfiles) {
      useOrder = Math.random() > 0.4;
    } else if (hasOrders) {
      useOrder = true;
    } else if (hasProfiles) {
      useOrder = false;
    } else {
      return;
    }

    if (useOrder) {
      // Show recent order
      const order = realData.orders[Math.floor(Math.random() * realData.orders.length)];
      name = order.profiles?.full_name || "Müştəri";
      city = order.profiles?.city || "Azərbaycan";
      product = "Məhsul"; // Generic for now as we don't fetch order items details deep enough
      action = "sifariş etdi";
      
      const diff = Date.now() - new Date(order.created_at).getTime();
      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(mins / 60);
      
      if (mins < 1) timeAgoVal = "indi";
      else if (mins < 60) timeAgoVal = `${mins} dəqiqə əvvəl`;
      else if (hours < 24) timeAgoVal = `${hours} saat əvvəl`;
      else timeAgoVal = "bu gün";
    } else {
      // Show recent registration
      const profile = realData.profiles[Math.floor(Math.random() * realData.profiles.length)];
      name = profile.full_name || "Yeni istifadəçi";
      city = profile.city || "Azərbaycan";
      product = "platformaya";
      action = "qoşuldu";
       
      const diff = Date.now() - new Date(profile.created_at).getTime();
      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(mins / 60);

      if (mins < 1) timeAgoVal = "indi";
      else if (mins < 60) timeAgoVal = `${mins} dəqiqə əvvəl`;
      else if (hours < 24) timeAgoVal = `${hours} saat əvvəl`;
      else timeAgoVal = "bu gün";
    }

    setNotification({
      id: Date.now(),
      name,
      city,
      product,
      action,
      timeAgo: timeAgoVal,
    });
    setIsVisible(true);

    // Hide after 6 seconds
    setTimeout(() => {
      setIsVisible(false);
    }, 6000);
  }, [realData]);

  useEffect(() => {
    // Fetch real data on mount
    fetch("/api/marketing/activity")
      .then((res) => res.json())
      .then((data) => {
        if (data && (data.profiles?.length > 0 || data.orders?.length > 0)) {
          setRealData(data);
        }
      })
      .catch((err) => console.error("Failed to fetch marketing activity:", err));

    // Initial delay
    const initialTimeout = setTimeout(() => {
      showRandomNotification();
    }, 5000);

    // Loop interval
    const interval = setInterval(() => {
      showRandomNotification();
    }, Math.random() * 20000 + 15000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [showRandomNotification]);

  // Update realData periodically to get fresh registrations/orders
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetch("/api/marketing/activity")
        .then((res) => res.json())
        .then((data) => {
          if (data && (data.profiles?.length > 0 || data.orders?.length > 0)) {
            setRealData(data);
          }
        })
        .catch((err) => console.error("Failed to refresh marketing activity:", err));
    }, 60000);

    return () => clearInterval(refreshInterval);
  }, []);

  const closeNotification = () => {
    setIsVisible(false);
  };

  if (!notification) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: -50 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 20, x: -20 }}
          transition={{ duration: 0.5 }}
          className="fixed bottom-4 left-4 z-50 max-w-sm w-full md:w-auto"
        >
          <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-4 flex items-start gap-3 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full -z-10 opacity-50" />
            
            <div className="bg-emerald-100 p-2 rounded-full flex-shrink-0">
              {notification.action === "qoşuldu" ? (
                <User size={20} className="text-emerald-600" />
              ) : notification.action === "sifariş etdi" ? (
                <ShoppingBag size={20} className="text-emerald-600" />
              ) : (
                <CheckCircle size={20} className="text-emerald-600" />
              )}
            </div>
            
            <div className="flex-1 pr-6">
              <p className="text-sm text-emerald-950 font-medium">
                <span className="font-bold">{notification.name}</span> <span className="text-slate-500 font-normal text-xs">({notification.city})</span>
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                {notification.product} {notification.action}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                {notification.timeAgo}
              </p>
            </div>

            <button 
              onClick={closeNotification}
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
