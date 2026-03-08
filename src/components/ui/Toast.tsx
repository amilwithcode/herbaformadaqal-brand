"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastItemProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Giriş animasiyası
    const showTimer = setTimeout(() => setVisible(true), 10);
    // 4 saniyə sonra avtomatik bağla
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose(toast.id), 300);
    }, 4000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [toast.id, onClose]);

  const styles = {
    success: {
      container: "border-emerald-200 bg-white",
      icon: "text-emerald-500",
      title: "text-emerald-900",
      message: "text-emerald-700",
      bar: "bg-emerald-500",
    },
    error: {
      container: "border-red-200 bg-white",
      icon: "text-red-500",
      title: "text-red-900",
      message: "text-red-700",
      bar: "bg-red-500",
    },
    info: {
      container: "border-blue-200 bg-white",
      icon: "text-blue-500",
      title: "text-blue-900",
      message: "text-blue-700",
      bar: "bg-blue-500",
    },
  };

  const icons = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    info: <Info size={20} />,
  };

  const s = styles[toast.type];

  return (
    <div
      className={`
        relative w-80 overflow-hidden rounded-2xl border shadow-lg
        transition-all duration-300 ease-out
        ${s.container}
        ${visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
      `}
    >
      {/* Üst rəngli xətt */}
      <div className={`h-1 w-full ${s.bar}`} />

      <div className="flex items-start gap-3 px-4 py-3">
        <span className={`mt-0.5 shrink-0 ${s.icon}`}>
          {icons[toast.type]}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${s.title}`}>{toast.title}</p>
          {toast.message && (
            <p className={`mt-0.5 text-xs leading-relaxed ${s.message}`}>
              {toast.message}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(() => onClose(toast.id), 300);
          }}
          className="shrink-0 rounded-full p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <div
        className={`h-0.5 w-full origin-left ${s.bar} opacity-30`}
        style={{
          animation: visible ? "shrink 4s linear forwards" : "none",
        }}
      />

      <style>{`
        @keyframes shrink {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

// Hook — asanlıqla istifadə üçün
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const show = (type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const close = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    toasts,
    close,
    success: (title: string, message?: string) => show("success", title, message),
    error: (title: string, message?: string) => show("error", title, message),
    info: (title: string, message?: string) => show("info", title, message),
  };
}
