-- Identidade de catálogo/loja (nível 2 da hierarquia Elicani → loja → produto).
--
-- Coluna MÍNIMA: `logo_url` já cobre a marca/branding e `banner_url` já é a
-- capa/thumbnail social (usada como og:image) — favicon é o único conceito
-- em falta (ícone de browser/busca do catálogo). Sem campos duplicados.
--
-- Null = sem favicon configurado → cadeia de fallback documentada em
-- src/lib/stores/metadata.ts: favicon → logo → favicon da plataforma
-- (Elicani). Mesmas políticas RLS/row-level da tabela — sem nada novo.
alter table public.stores
  add column if not exists favicon_url text;

comment on column public.stores.favicon_url is
  'URL do favicon do catálogo público (aba do browser, resultados de busca). Null → fallback para logo_url, depois favicon da plataforma Elicani.';
