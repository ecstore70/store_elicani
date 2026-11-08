-- =============================================================================
-- Elicani — Blocos de conteúdo da página do produto (product_page_blocks)
-- -----------------------------------------------------------------------------
-- Adiciona uma sequência OPCIONAL de blocos (imagem / texto / vídeo) por
-- produto, exibida abaixo das informações do produto na vitrine.
--
-- Compatibilidade: produtos SEM blocos continuam exatamente como hoje — não
-- há backfill nem mudança de página. A descrição do produto continua sendo
-- a descrição principal (os blocos são conteúdo EXTRA, não substituem nada).
--
-- Reuso de arquitetura:
--   • imagens/vídeos enviados usam o MESMO bucket `product-media` (nada de
--     segundo sistema de armazenamento);
--   • vídeos do YouTube são gravados como URL canônica e derivados no
--     render (sem coluna extra);
--   • blocos pertencem a store_id (denormalizado para RLS direto), igual a
--     product_media.
--
-- Isolamento: dono só toca nos blocos da PRÓPRIA loja; o público (anon) só
-- lê blocos de produtos de lojas ATIVAS — mesmas políticas de product_media.
--
-- Idempotente: pode ser re-executada com segurança.
-- Aplicação:  npm run db:push
-- =============================================================================

-- ── product_page_blocks ─────────────────────────────────────────────────────
create table if not exists public.product_page_blocks (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null
                constraint product_page_blocks_product_id_fkey
                  references public.products (id) on delete cascade,
  store_id    uuid not null
                constraint product_page_blocks_store_id_fkey
                  references public.stores (id) on delete cascade,
  type        text not null
                constraint product_page_blocks_type_check
                  check (type in ('image', 'text', 'video')),
  sort_order  integer not null default 0,
  content     text
                constraint product_page_blocks_content_check
                  check (content is null or length(content) <= 10000),
  media_url   text
                constraint product_page_blocks_media_url_check
                  check (media_url is null or (length(media_url) between 1 and 2048)),
  caption     text
                constraint product_page_blocks_caption_check
                  check (caption is null or length(caption) <= 300),
  alt_text    text
                constraint product_page_blocks_alt_text_check
                  check (alt_text is null or length(alt_text) <= 200),
  created_at  timestamptz not null default now()
);

comment on table public.product_page_blocks is
  'Sequência opcional de blocos de conteúdo (imagem/texto/vídeo) exibida abaixo das informações do produto na vitrine.';

create index if not exists product_page_blocks_product_order_idx
  on public.product_page_blocks (product_id, sort_order);

create index if not exists product_page_blocks_store_id_idx
  on public.product_page_blocks (store_id);

-- ── RLS (mesmos padrões de product_media) ───────────────────────────────────
alter table public.product_page_blocks enable row level security;

drop policy if exists product_page_blocks_select_own on public.product_page_blocks;
create policy product_page_blocks_select_own
  on public.product_page_blocks for select to authenticated
  using (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists product_page_blocks_insert_own on public.product_page_blocks;
create policy product_page_blocks_insert_own
  on public.product_page_blocks for insert to authenticated
  with check (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists product_page_blocks_update_own on public.product_page_blocks;
create policy product_page_blocks_update_own
  on public.product_page_blocks for update to authenticated
  using (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists product_page_blocks_delete_own on public.product_page_blocks;
create policy product_page_blocks_delete_own
  on public.product_page_blocks for delete to authenticated
  using (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists product_page_blocks_public_select_active on public.product_page_blocks;
create policy product_page_blocks_public_select_active
  on public.product_page_blocks for select to anon
  using (exists (
    select 1 from public.stores s
    where s.id = store_id and s.is_active
  ));
