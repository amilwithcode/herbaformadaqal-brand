"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

type ToastProps = {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose?: () => void;
};

export function Toast({ message, type = "success", duration = 3000, onClose }: ToastProps) {
  const { t } = useI18n();
  const isTranslationKey = /^(notification|cart|wishlist|programs|product|auth|common)\./.test(message);
  const displayMessage = isTranslationKey ? t(message) : message;
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose?.(), 300); // Wait for animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  const bgColor =
    type === "success"
      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
      : type === "error"
      ? "bg-red-50 border-red-200 text-red-900"
      : "bg-blue-50 border-blue-200 text-blue-900";

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg max-w-[90vw] sm:max-w-md animate-in slide-in-from-bottom-5 fade-in duration-300 ${bgColor}`}
    >
      {type === "success" && <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />}
      {type === "error" && <XCircle size={20} className="text-red-600 shrink-0" />}
      {type === "info" && <Info size={20} className="text-blue-600 shrink-0" />}
      <span className="text-sm font-medium flex-1">{displayMessage}</span>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onClose?.(), 300);
        }}
        className="text-current opacity-60 hover:opacity-100 transition-opacity shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}

type ToastManagerProps = {
  toasts: Array<{ id: string; message: string; type?: "success" | "error" | "info" }>;
  onRemove: (id: string) => void;
};

export function ToastManager({ toasts, onRemove }: ToastManagerProps) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}
