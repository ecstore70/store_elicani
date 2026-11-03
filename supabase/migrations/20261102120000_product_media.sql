-- =============================================================================
-- Elicani — Galeria de mídia de produto (product_media)
-- -----------------------------------------------------------------------------
-- Adiciona:
--   • product_media — múltiplas imagens + vídeos por produto (tabela
--     dedicada, em vez de uma coleção arbitrária de URLs no produto)
--   • bucket `product-media` (público) com políticas de escrita por loja
--     (reutiliza public.owns_store_folder — primeiro segmento = store_id)
--   • backfill: a image_url existente vira a primeira mídia (image, order 0)
--
-- Compatibilidade: products.image_url continua sendo o ESPELHO da imagem
-- primária (cards, carrinho, OG e previews não mudam). A aplicação mantém o
-- espelho sincronizado ao salvar a galeria; produtos antigos continuam
-- funcionando mesmo antes de qualquer edição.
--
-- Isolamento: product_media pertence a store_id (denormalizado para RLS
-- direto) — o dono só toca nas mídias da PRÓPRIA loja; o público (anon) só
-- lê mídias de produtos de lojas ATIVAS.
--
-- Idempotente: pode ser re-executada com segurança.
-- Aplicação:  npm run db:push
-- =============================================================================

-- ── product_media ───────────────────────────────────────────────────────────
create table if not exists public.product_media (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null
                  constraint product_media_product_id_fkey
                    references public.products (id) on delete cascade,
  store_id      uuid not null
                  constraint product_media_store_id_fkey
                    references public.stores (id) on delete cascade,
  media_type    text not null
                  constraint product_media_media_type_check
                    check (media_type in ('image', 'video')),
  source_url    text not null
                  constraint product_media_source_url_check
                    check (length(source_url) between 1 and 2048),
  display_order integer not null default 0,
  created_at    timestamptz not null default now()
);

comment on table public.product_media is
  'Mídias da galeria de um produto (tenant): imagens e vídeos (upload próprio ou YouTube). A primeira imagem é a primária (espelhada em products.image_url).';

create index if not exists product_media_product_order_idx
  on public.product_media (product_id, display_order);

create index if not exists product_media_store_id_idx
  on public.product_media (store_id);

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.product_media enable row level security;

drop policy if exists product_media_select_own on public.product_media;
create policy product_media_select_own
  on public.product_media for select to authenticated
  using (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists product_media_insert_own on public.product_media;
create policy product_media_insert_own
  on public.product_media for insert to authenticated
  with check (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists product_media_update_own on public.product_media;
create policy product_media_update_own
  on public.product_media for update to authenticated
  using (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists product_media_delete_own on public.product_media;
create policy product_media_delete_own
  on public.product_media for delete to authenticated
  using (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists product_media_public_select_active on public.product_media;
create policy product_media_public_select_active
  on public.product_media for select to anon
  using (exists (
    select 1 from public.stores s
    where s.id = store_id and s.is_active
  ));

-- ── backfill: imagem única existente → primeira mídia ───────────────────────
-- Idempotente: só preenche produtos que ainda NÃO têm nenhuma mídia.
insert into public.product_media (product_id, store_id, media_type, source_url, display_order)
select p.id, p.store_id, 'image', p.image_url, 0
from public.products p
where p.image_url is not null
  and p.image_url <> ''
  and not exists (
    select 1 from public.product_media m
    where m.product_id = p.id
  );

-- ── bucket product-media ────────────────────────────────────────────────────
-- Convenção de caminho: {store_id}/{arquivo} (mesmo helper dos logos).
-- Limite generoso por arquivo (imagens pequenas, vídeos do comerciante);
-- a aplicação valida por tipo (imagem ≤ 10 MB, vídeo ≤ 100 MB).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-media',
  'product-media',
  true,
  104857600, -- 100 MB
  array[
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
)
on conflict (id) do nothing;

drop policy if exists product_media_public_read on storage.objects;
create policy product_media_public_read
  on storage.objects
  for select
  to public
  using (bucket_id = 'product-media');

drop policy if exists product_media_owner_insert on storage.objects;
create policy product_media_owner_insert
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'product-media' and public.owns_store_folder(name));

drop policy if exists product_media_owner_update on storage.objects;
create policy product_media_owner_update
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'product-media' and public.owns_store_folder(name))
  with check (bucket_id = 'product-media' and public.owns_store_folder(name));

drop policy if exists product_media_owner_delete on storage.objects;
create policy product_media_owner_delete
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'product-media' and public.owns_store_folder(name));
