export type Category = {
  id: number;
  slug: string;
  name: string;
  icon: string | null;
  description?: string | null;
};

export type Product = {
  id: number;
  slug: string;
  category_id: number | null;
  base_price: number;
  discount_percent: number;
  stock: number;
  is_active: boolean;
  weight_goal_tag: "loss" | "gain" | "neutral";
  program_id?: number | null;
  image_url: string | null;
  points: number; // Added points field
  usage_count?: string | null; // e.g. "1", "2" — displayed as "1x", "2x"
  badge_color?: string | null; // hex color for the usage badge
  translations?: ProductTranslation[];
  product_images?: ProductImage[];
  reviews?: ProductReview[];
  rating_average?: number;
  review_count?: number;
};

export type ProductTranslation = {
  id: number;
  entity_table: string;
  entity_id: number;
  language: string;
  field: string;
  value: string;
};

export type ProductImage = {
  id: number;
  product_id: number;
  url: string;
  alt: string | null;
  position: number;
};

export type ProductReview = {
  id: number;
  product_id: number;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
};

export type ProductVariant = {
  id: number;
  product_id: number;
  name: string;
  sku: string | null;
  extra_price: number;
  stock: number;
};
