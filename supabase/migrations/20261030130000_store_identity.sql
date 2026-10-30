-- =============================================================================
-- Elicani — identidade da loja (campos de vitrine)
-- -----------------------------------------------------------------------------
-- Separa IDENTIDADE (conteúdo do comerciante) da APARÊNCIA (template/cores).
-- Adiciona colunas opcionais usadas pela seção de informação da vitrine:
--   • banner_url      — imagem de capa da loja
--   • opening_hours   — horário de atendimento (texto livre do comerciante)
--   • instagram_url   — link social (opcional)
--   • facebook_url    — link social (opcional)
--
-- Idempotente: pode ser re-executada com segurança.
-- Aplicação:  npm run db:push
-- =============================================================================

alter table public.stores
  add column if not exists banner_url text,
  add column if not exists opening_hours text,
  add column if not exists instagram_url text,
  add column if not exists facebook_url text;

do $$
begin
  alter table public.stores
    add constraint stores_banner_url_check
      check (banner_url is null or (length(banner_url) <= 2048 and banner_url ~ '^https?://'));
exception when duplicate_object then null; end $$;

do $$
begin
  alter table public.stores
    add constraint stores_opening_hours_check
      check (opening_hours is null or length(opening_hours) <= 300);
exception when duplicate_object then null; end $$;

do $$
begin
  alter table public.stores
    add constraint stores_instagram_url_check
      check (instagram_url is null or (length(instagram_url) <= 2048 and instagram_url ~ '^https?://'));
exception when duplicate_object then null; end $$;

do $$
begin
  alter table public.stores
    add constraint stores_facebook_url_check
      check (facebook_url is null or (length(facebook_url) <= 2048 and facebook_url ~ '^https?://'));
exception when duplicate_object then null; end $$;
