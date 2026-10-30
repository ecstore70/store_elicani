-- =============================================================================
-- Elicani — Catálogo da vitrine + sistema de aparência (multi-tenant)
-- -----------------------------------------------------------------------------
-- Adiciona:
--   • categories  — categorias do comerciante (por loja)
--   • products    — produtos do comerciante (por loja)
--   • colunas de APARÊNCIA em stores (template, cores, layout, estilo)
--
-- Isolamento: tudo pertence a store_id e é protegido por RLS — um lojista
-- só toca nos produtos/categorias da PRÓPRIA loja; o público (anon) só lê
-- produtos de lojas ATIVAS.
--
-- Idempotente: pode ser re-executada com segurança.
-- Aplicação:  npm run db:push
-- =============================================================================

-- -----------------------------------------------------------------------------
-- categories
-- -----------------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null
                constraint categories_store_id_fkey
                  references public.stores (id) on delete cascade,
  name        text not null
                constraint categories_name_check
                  check (length(name) between 1 and 60),
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.categories is
  'Categorias de produtos de uma loja (tenant). Filtráveis na vitrine.';

create index if not exists categories_store_id_idx
  on public.categories (store_id, sort_order);

drop trigger if exists set_updated_at_categories on public.categories;
create trigger set_updated_at_categories
  before update on public.categories
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- products
-- -----------------------------------------------------------------------------
-- promo_price > 0 e distinto do price (tratado na app também; CHECK de base).
-- category_id ON DELETE SET NULL: apagar categoria não apaga produtos.
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null
                 constraint products_store_id_fkey
                   references public.stores (id) on delete cascade,
  category_id  uuid
                 constraint products_category_id_fkey
                   references public.categories (id) on delete set null,
  name         text not null
                 constraint products_name_check
                   check (length(name) between 1 and 120),
  description  text
                 constraint products_description_check
                   check (description is null or length(description) <= 1000),
  price        numeric(12,2) not null
                 constraint products_price_check
                   check (price >= 0),
  promo_price  numeric(12,2)
                 constraint products_promo_price_check
                   check (promo_price is null or promo_price > 0),
  image_url    text,
  is_available boolean not null default true,
  is_featured  boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.products is
  'Produtos de uma loja (tenant). Ordenáveis (sort_order) e destaque (is_featured).';

create index if not exists products_store_id_idx
  on public.products (store_id, sort_order);
create index if not exists products_store_featured_idx
  on public.products (store_id) where is_featured;
create index if not exists products_category_id_idx
  on public.products (category_id);

drop trigger if exists set_updated_at_products on public.products;
create trigger set_updated_at_products
  before update on public.products
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- stores — colunas de aparência (extende a tabela existente)
-- -----------------------------------------------------------------------------
-- O template controla a apresentação; a funcionalidade de comércio é comum.
do $$
begin
  alter table public.stores
    add column if not exists template text not null default 'minimal',
    add column if not exists button_color text,
    add column if not exists accent_color text,
    add column if not exists background_color text,
    add column if not exists product_layout text not null default 'grid',
    add column if not exists image_ratio text not null default 'square',
    add column if not exists button_style text not null default 'rounded',
    add column if not exists card_style text not null default 'subtle';
exception
  when duplicate_column then null; -- idempotente
end $$;

-- CHECKs (if not exists não existe para constraints; usa-los de forma segura)
do $$
begin
  alter table public.stores
    add constraint stores_template_check
      check (template in ('minimal','market','fashion','restaurant'));
exception when duplicate_object then null; end $$;

do $$
begin
  alter table public.stores
    add constraint stores_button_color_check
      check (button_color is null or button_color ~ '^#[0-9a-fA-F]{6}$');
exception when duplicate_object then null; end $$;

do $$
begin
  alter table public.stores
    add constraint stores_accent_color_check
      check (accent_color is null or accent_color ~ '^#[0-9a-fA-F]{6}$');
exception when duplicate_object then null; end $$;

do $$
begin
  alter table public.stores
    add constraint stores_background_color_check
      check (background_color is null or background_color ~ '^#[0-9a-fA-F]{6}$');
exception when duplicate_object then null; end $$;

do $$
begin
  alter table public.stores
    add constraint stores_product_layout_check
      check (product_layout in ('grid','list'));
exception when duplicate_object then null; end $$;

do $$
begin
  alter table public.stores
    add constraint stores_image_ratio_check
      check (image_ratio in ('square','portrait','landscape'));
exception when duplicate_object then null; end $$;

do $$
begin
  alter table public.stores
    add constraint stores_button_style_check
      check (button_style in ('rounded','soft','compact'));
exception when duplicate_object then null; end $$;

do $$
begin
  alter table public.stores
    add constraint stores_card_style_check
      check (card_style in ('subtle','rounded','minimal'));
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.products enable row level security;

-- ── categories: lojista toca apenas na própria loja ─────────────────────────
drop policy if exists categories_select_own on public.categories;
create policy categories_select_own
  on public.categories for select to authenticated
  using (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists categories_insert_own on public.categories;
create policy categories_insert_own
  on public.categories for insert to authenticated
  with check (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists categories_update_own on public.categories;
create policy categories_update_own
  on public.categories for update to authenticated
  using (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists categories_delete_own on public.categories;
create policy categories_delete_own
  on public.categories for delete to authenticated
  using (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ));

-- Leitura pública: categorias de lojas ATIVAS (vitrine usa cliente anon).
drop policy if exists categories_public_select_active on public.categories;
create policy categories_public_select_active
  on public.categories for select to anon
  using (exists (
    select 1 from public.stores s
    where s.id = store_id and s.is_active
  ));

-- ── products: espelha categories ────────────────────────────────────────────
drop policy if exists products_select_own on public.products;
create policy products_select_own
  on public.products for select to authenticated
  using (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists products_insert_own on public.products;
create policy products_insert_own
  on public.products for insert to authenticated
  with check (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists products_update_own on public.products;
create policy products_update_own
  on public.products for update to authenticated
  using (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists products_delete_own on public.products;
create policy products_delete_own
  on public.products for delete to authenticated
  using (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists products_public_select_active on public.products;
create policy products_public_select_active
  on public.products for select to anon
  using (exists (
    select 1 from public.stores s
    where s.id = store_id and s.is_active
  ));
