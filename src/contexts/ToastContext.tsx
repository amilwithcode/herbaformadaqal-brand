"use client";

import { createContext, useContext } from "react";

export type ToastType = "success" | "error" | "info";

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useGlobalToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: (message: string) => {
        if (typeof window !== "undefined") console.warn("[Toast] useGlobalToast used outside provider:", message);
      },
    };
  }
  return ctx;
}

export function ToastProvider({
  children,
  showToast,
}: {
  children: React.ReactNode;
  showToast: (message: string, type?: ToastType) => void;
}) {
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
}
