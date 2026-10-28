-- =============================================================================
-- Elicani — Fase 1: Row Level Security (isolamento multi-tenant)
-- -----------------------------------------------------------------------------
-- Regras obrigatórias desta fase:
--   • autenticado lê o PRÓPRIO profile
--   • autenticado lê/atualiza a PRÓPRIA store
--   • autenticado NÃO lê/NÃO modifica store de outro lojista
--
-- A segurança é aplicada por PostgreSQL RLS, não pelo frontend.
--
-- Idempotente: pode ser re-executada com segurança.
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.stores enable row level security;

-- Sem "open" policies: RLS nega por padrão a quem não casa com nenhuma regra.

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
-- Leitura: apenas o próprio profile.
-- (Não existe política de INSERT: o row é criado pelo trigger security definer
--  handle_new_user, garantindo que nenhum cliente forje perfis alheios.)
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

-- Atualização: apenas o próprio profile.
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- -----------------------------------------------------------------------------
-- stores
-- -----------------------------------------------------------------------------
-- Inserção: o lojista só pode criar store própria (owner_id = auth.uid()).
-- Como owner_id é UNIQUE, isso também garante "uma store por lojista".
drop policy if exists stores_insert_own on public.stores;
create policy stores_insert_own
  on public.stores
  for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

-- Leitura própria (inclusive stores inativas).
drop policy if exists stores_select_own on public.stores;
create policy stores_select_own
  on public.stores
  for select
  to authenticated
  using ((select auth.uid()) = owner_id);

-- Atualização própria. O WITH CHECK impede trocar owner_id por terceiro.
drop policy if exists stores_update_own on public.stores;
create policy stores_update_own
  on public.stores
  for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- Remoção da própria store (UI de exclusão chega numa fase futura).
drop policy if exists stores_delete_own on public.stores;
create policy stores_delete_own
  on public.stores
  for delete
  to authenticated
  using ((select auth.uid()) = owner_id);

-- -----------------------------------------------------------------------------
-- storefront público
-- -----------------------------------------------------------------------------
-- Lojas ATIVAS são legíveis publicamente — é o que permite resolver
-- {slug}.elicani.site → store sem usar credencial privilegiada.
-- Políticas em PostgreSQL são combinadas com OU: o lojista continua lendo a
-- própria store mesmo com is_active = false.
drop policy if exists stores_public_select_active on public.stores;
create policy stores_public_select_active
  on public.stores
  for select
  to anon, authenticated
  using (is_active);
