-- =============================================================================
-- Elicani — Fase 1: schema inicial (multi-tenant)
-- -----------------------------------------------------------------------------
-- Modelo: User → Store → dados pertencentes à store (store_id).
-- Um único banco compartilhado; isolamento por store_id + RLS.
--
-- Idempotente: pode ser re-executada com segurança.
-- Aplicação:  npm run db:push   (ou  supabase db push)
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- profiles — espelho mínimo do usuário autenticado (auth.users)
-- -----------------------------------------------------------------------------
-- email é OPCIONAL de propósito: a Fase 1 usa email+senha, mas a arquitetura
-- já aceita verificação por telefone no futuro sem redesenhar a tabela
-- (usuários só-telefone teriam auth.users.email nulo).
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_len_check
    check (email is null or (length(email) > 0 and length(email) <= 254)),
  constraint profiles_full_name_len_check
    check (full_name is null or length(full_name) <= 120)
);

comment on table public.profiles is
  'Perfil do lojista. id = auth.users.id (Supabase Auth).';

-- -----------------------------------------------------------------------------
-- stores — a unidade de tenant
-- -----------------------------------------------------------------------------
-- owner_id UNIQUE  →  um lojista possui no máximo uma store (regra da Fase 1).
-- Todas as entidades futuras (products, categories, orders, ...) apontam
-- para stores.id como store_id.
create table if not exists public.stores (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null
                    constraint stores_owner_id_key unique
                    references public.profiles (id) on delete cascade,
  name            text not null
                    constraint stores_name_check
                      check (length(name) between 2 and 80),
  slug            text not null
                    constraint stores_slug_key unique
                    constraint stores_slug_format_check
                      check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
                             and length(slug) between 3 and 63),
  description     text
                    constraint stores_description_check
                      check (description is null or length(description) <= 500),
  logo_url        text,
  phone           text
                    constraint stores_phone_check
                      check (phone is null or phone ~ '^\+?[0-9]{7,15}$'),
  whatsapp_number text not null
                    constraint stores_whatsapp_check
                      check (whatsapp_number ~ '^\+?[0-9]{7,15}$'),
  primary_color   text not null default '#0f172a'
                    constraint stores_primary_color_check
                      check (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  currency        text not null default 'MZN'
                    constraint stores_currency_check
                      check (currency ~ '^[A-Z]{3}$'),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.stores is
  'Store (tenant) de um lojista. Entidades futuras referenciam stores.id.';

-- -----------------------------------------------------------------------------
-- updated_at automático
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_stores on public.stores;
create trigger set_updated_at_stores
  before update on public.stores
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- criação do profile no signup (server-side, não depende do cliente)
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER + search_path vazio: único caminho de escrita em profiles
-- que não depende de política de RLS.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    nullif(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Índices de apoio: slug e owner_id já são UNIQUE (portanto indexados).
