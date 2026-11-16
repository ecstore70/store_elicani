-- =============================================================================
-- Multi-catalog / multi-store: uma conta → N lojas.
--
-- A Fase 1 impunha "uma loja por lojista" com UNIQUE em owner_id
-- (stores_owner_id_key). Esta fase abre a relação para N:1 mantendo o UUID
-- interno da loja como identificador autoritativo — slugs continuam únicos
-- globalmente (URLs públicas /store/{slug} e {slug}.elicani.site).
--
-- O RLS já era POR LINHA (`auth.uid() = owner_id` em insert/select/update/
-- delete) — nenhuma política muda: o dono continua autorizado apenas nas
-- próprias linhas, agora em N lojas. As entidades (products, orders,
-- store_faq_items, ...) já apontam para stores.id e herdam o mesmo limite.
--
-- Backward compatible: não há mudança de dados — só sai a restrição.
-- Lojas existentes (e os respectivos produtos/pedidos/políticas) não são
-- tocadas.
-- -----------------------------------------------------------------------------

alter table public.stores
  drop constraint if exists stores_owner_id_key;

-- O UNIQUE garantia índice em owner_id; o índice comum mantém o mesmo
-- desempenho para as consultas "lojas do lojista" (painel + validação do
-- cookie da loja ativa).
create index if not exists stores_owner_id_idx
  on public.stores (owner_id);
