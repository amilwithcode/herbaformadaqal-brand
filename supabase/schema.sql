create type public.language_code as enum ('az', 'ru', 'en', 'tr');
create type public.currency_code as enum ('AZN', 'USD', 'EUR', 'TRY');
create type public.order_status as enum ('pending', 'paid', 'failed', 'cancelled', 'shipped', 'completed', 'refunded');
create type public.program_type as enum ('weight_loss', 'weight_gain', 'lifestyle');
create type public.campaign_type as enum ('discount', 'bundle', 'bogo');
create type public.coupon_type as enum ('percentage', 'fixed', 'free_shipping');
create type public.shipping_method_type as enum ('fast', 'postal');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  default_currency currency_code default 'AZN',
  is_admin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index profiles_is_admin_idx on public.profiles(is_admin);

create table public.categories (
  id bigserial primary key,
  slug text unique not null,
  icon text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.programs (
  id bigserial primary key,
  slug text unique not null,
  program_type program_type not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.campaigns (
  id bigserial primary key,
  slug text unique not null,
  campaign_type campaign_type not null,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.products (
  id bigserial primary key,
  slug text unique not null,
  category_id bigint references public.categories(id) on delete set null,
  base_price numeric(10,2) not null,
  discount_percent numeric(5,2) default 0,
  stock int not null default 0,
  is_active boolean default true,
  weight_goal_tag text check (weight_goal_tag in ('loss','gain','neutral')),
  program_id bigint references public.programs(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.product_variants (
  id bigserial primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  name text not null,
  sku text unique,
  extra_price numeric(10,2) default 0,
  stock int not null default 0,
  created_at timestamptz default now()
);

create table public.coupons (
  id bigserial primary key,
  code text unique not null,
  coupon_type coupon_type not null,
  value numeric(10,2) not null,
  min_order_amount numeric(10,2) default 0,
  max_discount_amount numeric(10,2),
  usage_limit int,
  used_count int default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.coupon_products (
  coupon_id bigint references public.coupons(id) on delete cascade,
  product_id bigint references public.products(id) on delete cascade,
  primary key (coupon_id, product_id)
);

create table public.coupon_programs (
  coupon_id bigint references public.coupons(id) on delete cascade,
  program_id bigint references public.programs(id) on delete cascade,
  primary key (coupon_id, program_id)
);

create table public.shipping_methods (
  id bigserial primary key,
  method_type shipping_method_type not null,
  name text not null,
  base_price numeric(10,2) not null,
  per_kg_price numeric(10,2) default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.orders (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete set null,
  status order_status not null default 'pending',
  currency currency_code not null default 'AZN',
  subtotal numeric(10,2) not null default 0,
  discount_total numeric(10,2) not null default 0,
  shipping_total numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  coupon_id bigint references public.coupons(id),
  shipping_method_id bigint references public.shipping_methods(id),
  shipping_address jsonb,
  payment_provider text,
  payment_reference text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.order_items (
  id bigserial primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  product_id bigint not null references public.products(id),
  variant_id bigint references public.product_variants(id),
  quantity int not null,
  unit_price numeric(10,2) not null,
  total_price numeric(10,2) not null
);

create table public.wishlist_items (
  user_id uuid references public.profiles(id) on delete cascade,
  product_id bigint references public.products(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, product_id)
);

create table public.translations (
  id bigserial primary key,
  entity_table text not null,
  entity_id bigint not null,
  field text not null,
  language language_code not null,
  value text not null,
  unique (entity_table, entity_id, field, language)
);

create table public.product_images (
  id bigserial primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  url text not null,
  alt text,
  position int default 0
);

create index products_category_idx on public.products(category_id);
create index products_weight_goal_idx on public.products(weight_goal_tag);
create index products_active_idx on public.products(is_active);
create index programs_type_idx on public.programs(program_type);
create index campaigns_active_idx on public.campaigns(is_active);
create index orders_user_id_idx on public.orders(user_id);
create index orders_status_idx on public.orders(status);
create index orders_created_at_idx on public.orders(created_at);
create index order_items_order_id_idx on public.order_items(order_id);
create index translations_entity_idx on public.translations(entity_table, entity_id, language);
create index product_images_product_id_idx on public.product_images(product_id);

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.wishlist_items enable row level security;

create policy profiles_select_own on public.profiles
for select using (auth.uid() = id);

create policy profiles_update_own on public.profiles
for update using (auth.uid() = id);

create policy orders_select_own on public.orders
for select using (auth.uid() = user_id);

create policy orders_insert_own on public.orders
for insert with check (auth.uid() = user_id);

create policy wishlist_select_own on public.wishlist_items
for select using (auth.uid() = user_id);

create policy wishlist_modify_own on public.wishlist_items
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

