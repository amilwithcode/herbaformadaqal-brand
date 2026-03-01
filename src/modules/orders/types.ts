export type OrderStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "shipped"
  | "completed"
  | "refunded";

export type CartLineInput = {
  productId: number;
  variantId?: number;
  quantity: number;
};

export type PricingResult = {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponId: number | null;
  shippingMethodId: number | null;
  shippingAddress: Record<string, unknown> | null;
};

