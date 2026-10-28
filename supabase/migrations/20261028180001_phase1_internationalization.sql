-- =============================================================================
-- Elicani — Fase 1: internacionalização da store + arquitetura de Storage
-- -----------------------------------------------------------------------------
-- O produto é internacional desde o primeiro dia:
--   • idioma, moeda e país são campos INDEPENDENTES
--     (ex.: país=Mozambique, idioma=en, moeda=USD é válido);
--   • idioma segue BCP 47; moeda segue ISO 4217; país segue ISO 3166-1.
--
-- Também prepara o bucket de logos (Supabase Storage) sem construir a UI
-- de upload — essa chega numa fase futura.
--
-- Idempotente: pode ser re-executada com segurança.
-- Aplicação:  npm run db:push   (ou  supabase db push)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Novas colunas
-- -----------------------------------------------------------------------------
alter table public.stores
  add column if not exists country            text,
  add column if not exists language           text        not null default 'en',
  add column if not exists timezone           text,
  add column if not exists phone_country_code text;

-- -----------------------------------------------------------------------------
-- 2. Ajustes de nullability / defaults
-- -----------------------------------------------------------------------------
-- whatsapp_number, primary_color e phone passam a ser opcionais (a spec da
-- Fase 1 os marca como nullable). O valor default de moeda passa a ser
-- internacional (USD) em vez de um país específico.
alter table public.stores
  drop constraint if exists stores_whatsapp_check,
  drop constraint if exists stores_phone_check,
  drop constraint if exists stores_primary_color_check,
  alter column whatsapp_number   drop not null,
  alter column primary_color     drop not null,
  alter column primary_color     set default null,
  alter column currency          set default 'USD';

-- -----------------------------------------------------------------------------
-- 3. Constraints de validação
-- -----------------------------------------------------------------------------
alter table public.stores
  drop constraint if exists stores_country_check,
  drop constraint if exists stores_language_check,
  drop constraint if exists stores_timezone_check,
  drop constraint if exists stores_phone_country_code_check;

-- País: ISO 3166-1 alpha-2 (ex.: "MZ", "BR", "PT") ou nulo.
alter table public.stores
  add constraint stores_country_check
  check (country is null or country ~ '^[A-Z]{2}$');

-- Idioma: BCP 47 simplificado (en, pt-BR, zh-Hans, ...) — extensível sem
-- nova migration; a lista de idiomas suportados fica na camada de aplicação.
alter table public.stores
  add constraint stores_language_check
  check (language ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$');

-- Fuso horário IANA (ex.: "Africa/Maputo", "America/Sao_Paulo").
alter table public.stores
  add constraint stores_timezone_check
  check (
    timezone is null
    or (length(timezone) between 1 and 64
        and timezone ~ '^[A-Za-z0-9_+\-/]+$')
  );

-- DDI (ex.: "+258") — independente do número, para não amarrar país ao telefone.
alter table public.stores
  add constraint stores_phone_country_code_check
  check (phone_country_code is null or phone_country_code ~ '^\+[1-9][0-9]{0,4}$');

-- Telefones: opcionais e sem amarrar a um formato de país específico.
alter table public.stores
  add constraint stores_phone_check
  check (phone is null or phone ~ '^\+?[0-9]{3,15}$');

alter table public.stores
  add constraint stores_whatsapp_check
  check (whatsapp_number is null or whatsapp_number ~ '^\+?[0-9]{7,15}$');

-- -----------------------------------------------------------------------------
-- 4. Índices
-- -----------------------------------------------------------------------------
-- slug e owner_id já possuem índices UNIQUE (stores_slug_key, stores_owner_id_key).
-- Este cobre ordenações de dashboard/listagem.
create index if not exists stores_created_at_idx
  on public.stores (created_at desc);

-- -----------------------------------------------------------------------------
-- 5. Supabase Storage — arquitetura preparada para logos
-- -----------------------------------------------------------------------------
-- Convenção de caminho: {store_id}/{filename}
-- O bucket é público (o logo aparece na vitrine), mas a ESCRITA é restrita
-- ao dono da store correspondente ao primeiro segmento do caminho.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'store-logos',
  'store-logos',
  true,
  2097152, -- 2 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

create or replace function public.owns_store_folder(object_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.stores
    where owner_id = auth.uid()
      and split_part(object_path, '/', 1) = id::text
  );
$$;

revoke execute on function public.owns_store_folder(text) from public, anon;
grant execute on function public.owns_store_folder(text) to authenticated, service_role;

drop policy if exists store_logos_public_read on storage.objects;
create policy store_logos_public_read
  on storage.objects
  for select
  to public
  using (bucket_id = 'store-logos');

drop policy if exists store_logos_owner_insert on storage.objects;
create policy store_logos_owner_insert
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'store-logos' and public.owns_store_folder(name));

drop policy if exists store_logos_owner_update on storage.objects;
create policy store_logos_owner_update
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'store-logos' and public.owns_store_folder(name))
  with check (bucket_id = 'store-logos' and public.owns_store_folder(name));

drop policy if exists store_logos_owner_delete on storage.objects;
create policy store_logos_owner_delete
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'store-logos' and public.owns_store_folder(name));
