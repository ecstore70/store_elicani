-- =============================================================================
-- Elicani — Fase 1: leitura pública restrita ao papel ANON
-- -----------------------------------------------------------------------------
-- Motivo (encontrado pela verificação automática `npm run test:rls`):
--
-- A política pública anterior era `to anon, authenticated`. Como um lojista
-- autenticado consegue consultar a API diretamente (não só pela UI), isso
-- permitia que o LOJISTA A lesse a linha completa da LOJISTA B — exatamente
-- o que a especificação proíbe ("um merchant nunca deve acessar a store de
-- outro merchant").
--
-- Correção: a leitura pública passa a valer apenas para o papel ANON, que é
-- o que a VITRINE usa. Assim:
--   • visitante (anon)     → lê lojas ATIVAS (vitrine pública) ✓
--   • lojista (authicated) → lê APENAS a própria loja          ✓
--
-- A aplicação usa um cliente sem sessão (`createPublicClient`) para
-- resolver {slug}.elicani.site, portanto um lojista logado continua a
-- ver a própria vitrine normalmente.
--
-- Idempotente: pode ser re-executada com segurança.
-- =============================================================================

drop policy if exists stores_public_select_active on public.stores;

create policy stores_public_select_active
  on public.stores
  for select
  to anon
  using (is_active);
