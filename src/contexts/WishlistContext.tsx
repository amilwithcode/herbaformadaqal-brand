"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { Product } from "@/types";

type WishlistContextValue = {
  items: Product[];
  add: (product: Product) => void;
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
};

const WishlistContext = createContext<WishlistContextValue | undefined>(
  undefined
);

const STORAGE_KEY = "eshop_wishlist";

export function WishlistProvider({ 
  children,
  showToast 
}: { 
  children: React.ReactNode;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}) {
  const [items, setItems] = useState<Product[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const add = (product: Product) => {
    setItems((prev) => {
      if (prev.find((p) => p.id === product.id)) return prev;
      return [...prev, product];
    });
    // Show toast notification
    if (showToast) {
      showToast("notification.added_to_wishlist", "success");
    }
  };

  const remove = (productId: string) => {
    setItems((prev) => prev.filter((p) => p.id !== productId));
  };

  const has = (productId: string) => items.some((p) => p.id === productId);

  return (
    <WishlistContext.Provider value={{ items, add, remove, has }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("WishlistContext not found");
  return ctx;
}

