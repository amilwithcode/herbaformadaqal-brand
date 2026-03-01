"use client";

import { useI18n } from "@/contexts/I18nContext";
import { LayoutGrid, List, Search } from "lucide-react";

type CategoryOption = {
  id: number;
  label: string;
};

type ProductsFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  categoryId: number | "all";
  onCategoryChange: (value: number | "all") => void;
  sort: string;
  onSortChange: (value: string) => void;
  categories: CategoryOption[];
  viewMode: "grid" | "list";
  onViewChange: (mode: "grid" | "list") => void;
};

export default function ProductsFilters(props: ProductsFiltersProps) {
  const {
    search,
    onSearchChange,
    categoryId,
    onCategoryChange,
    sort,
    onSortChange,
    categories,
    viewMode,
    onViewChange,
  } = props;
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-white p-2 shadow-sm ring-1 ring-emerald-100 md:flex-row md:items-center md:justify-between md:p-3">
      <div className="flex-1">
        <div className="flex items-center gap-3 rounded-full bg-emerald-50/50 px-4 py-2.5 transition-colors focus-within:bg-emerald-50">
          <Search className="text-emerald-400" size={20} />
          <input
            className="flex-1 bg-transparent text-sm text-emerald-950 outline-none placeholder:text-emerald-400/80"
            placeholder={t("products.filters.search_placeholder")}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:items-center md:gap-3">
        <button
          onClick={() => onViewChange(viewMode === "grid" ? "list" : "grid")}
          className="hidden h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition-all hover:bg-emerald-100 hover:text-emerald-700 active:scale-95 md:flex"
          title={viewMode === "grid" ? "List View" : "Grid View"}
        >
          {viewMode === "grid" ? <List size={20} /> : <LayoutGrid size={20} />}
        </button>
        
        <div className="hidden h-8 w-px bg-emerald-100 md:block" />

        <select
          className="h-10 w-full rounded-full bg-emerald-50 px-2 text-xs font-medium text-emerald-700 outline-none transition-colors hover:bg-emerald-100 md:w-auto md:px-4 md:text-sm"
          value={categoryId === "all" ? "all" : String(categoryId)}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "all") onCategoryChange("all");
            else onCategoryChange(Number(val));
          }}
        >
          <option value="all">{t("products.filters.all_categories")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          className="h-10 w-full rounded-full bg-emerald-50 px-2 text-xs font-medium text-emerald-700 outline-none transition-colors hover:bg-emerald-100 md:w-auto md:px-4 md:text-sm"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="popular">{t("products.filters.sort.popular")}</option>
          <option value="price_low">
            {t("products.filters.sort.price_low")}
          </option>
          <option value="price_high">
            {t("products.filters.sort.price_high")}
          </option>
        </select>
      </div>
    </div>
  );
}
