-- =============================================================================
-- Elicani — slug público de categoria
-- -----------------------------------------------------------------------------
-- A URL pública da categoria ganha um segmento legível:
--   antes: /store/{loja}/categories/{UUID}
--   depois: /store/{loja}/categories/{slug}
-- O UUID continua válido para SEMPRE: o proxy (src/proxy.ts) responde 301
-- da forma antiga para a nova — nenhum link indexado ou compartilhado quebra.
--
-- Coluna aditiva e anulável:
--   • slug null → a categoria publica pelo UUID (fallback honesto);
--   • a GERAÇÃO é da aplicação (src/lib/catalog/category-slug.ts, que
--     partilha o MESMO algoritmo de produto) para valer o mesmo algoritmo
--     em criação e no backfill de dados existentes
--     (scripts/backfill-category-slugs.mjs, executado após este push);
--   • UNIQUE por loja: o caminho público já carrega a loja — colisão entre
--     lojas não existe; dentro da loja o sufixo -2, -3… resolve.
--
-- O slug é ESTÁVEL: renomear a categoria não altera a URL (renomear o slug
-- futuramente exigirá histórico de redirects — fora do escopo desta fase).
--
-- Idempotente: pode ser re-executada com segurança.
-- Aplicação:  npm run db:push
-- =============================================================================

alter table public.categories
  add column if not exists slug text;

do $$
begin
  alter table public.categories
    add constraint categories_slug_format_check
      check (
        slug is null
        or (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 63)
      );
exception when duplicate_object then null; end $$;

-- Índice único por loja (NULLs distintos no Postgres: categorias sem slug
-- convivem sem conflitar).
create unique index if not exists categories_store_id_slug_key
  on public.categories (store_id, slug);
