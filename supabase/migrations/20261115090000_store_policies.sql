-- =============================================================================
-- Elicani — Políticas e FAQ da loja (terms / privacy_policy / store_faq_items)
-- -----------------------------------------------------------------------------
-- Adiciona ao catálogo da loja conteúdo EDITÁVEL PELO COMERCIANTE em dois
-- campos de texto (terms, privacy_policy) e uma lista estruturada de perguntas
-- frequentes (store_faq_items) — cada item pertence a UMA store.
--
-- Reuso de arquitetura:
--   • colunas vivem na própria tabela `stores` (conteúdo institucional da
--     loja, igual a description/opening_hours — nada de tabela global);
--   • `store_faq_items` segue o padrão de `product_page_blocks`: store_id
--     denormalizado para RLS direto, CRUD só do DONO, leitura pública apenas
--     de lojas ATIVAS;
--   • `updated_at` usa o MESMO trigger `set_updated_at()` das demais tabelas.
--
-- Isolamento: um lojista só escreve nas políticas/FAQ da PRÓPRIA loja; o
-- público (anon) só lê conteúdo de lojas ATIVAS. Não enfraquece políticas
-- existentes — apenas adiciona colunas/tabela novas.
--
-- Idempotente: pode ser re-executada com segurança.
-- Aplicação:  npm run db:push
-- =============================================================================

-- ── stores: conteúdo de políticas da loja ───────────────────────────────────
alter table public.stores
  add column if not exists terms text,
  add column if not exists privacy_policy text;

-- ── store_faq_items ─────────────────────────────────────────────────────────
create table if not exists public.store_faq_items (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null
                constraint store_faq_items_store_id_fkey
                  references public.stores (id) on delete cascade,
  question    text not null
                constraint store_faq_items_question_check
                  check (char_length(question) between 1 and 300),
  answer      text not null
                constraint store_faq_items_answer_check
                  check (char_length(answer) between 1 and 5000),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists store_faq_items_store_id_sort_order_idx
  on public.store_faq_items (store_id, sort_order);

drop trigger if exists set_updated_at_store_faq_items on public.store_faq_items;
create trigger set_updated_at_store_faq_items
  before update on public.store_faq_items
  for each row execute function public.set_updated_at();

-- ── RLS (mesmos padrões de product_page_blocks) ─────────────────────────────
alter table public.store_faq_items enable row level security;

drop policy if exists store_faq_items_select_own on public.store_faq_items;
create policy store_faq_items_select_own
  on public.store_faq_items for select to authenticated
  using (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists store_faq_items_insert_own on public.store_faq_items;
create policy store_faq_items_insert_own
  on public.store_faq_items for insert to authenticated
  with check (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists store_faq_items_update_own on public.store_faq_items;
create policy store_faq_items_update_own
  on public.store_faq_items for update to authenticated
  using (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists store_faq_items_delete_own on public.store_faq_items;
create policy store_faq_items_delete_own
  on public.store_faq_items for delete to authenticated
  using (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ));

-- Leitura pública: apenas lojas ATIVAS (mesma regra da vitrine).
drop policy if exists store_faq_items_public_select_active on public.store_faq_items;
create policy store_faq_items_public_select_active
  on public.store_faq_items for select to anon
  using (exists (
    select 1 from public.stores s
    where s.id = store_id and s.is_active
  ));
