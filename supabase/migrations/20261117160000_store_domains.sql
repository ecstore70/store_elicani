-- =============================================================================
-- Elicani — Domínios próprios das lojas (fase 1: fundação de dados)
-- -----------------------------------------------------------------------------
-- Adiciona:
--   • tabela `store_domains` — um domínio próprio (ex.: loja.com) por loja,
--     com estado de verificação, token de verificação e marca de primário;
--   • função `store_by_hostname(hostname)` — resolução PÚBLICA segura:
--     devolve apenas (store_id, slug, is_active) de domínios ATIVOS.
--
-- Decisões de fundação (fase 1 dos Custom Domains):
--   • hostname é ÚNICO GLOBALMENTE (não por loja): um domínio só pode
--     apontar para UMA loja em toda a plataforma;
--   • um único `is_primary` por loja (índice único parcial);
--   • status: pending | active | failed | disabled — apenas `active` resolve
--     no RPC (fail-closed: pendente/erro/desativado/desconhecido → nada);
--   • todos os hostnames da plataforma (*.elicani.site + apex) são PROIBIDOS
--     como domínio de loja (CHECK — igual ao wildcard {slug}.elicani.site);
--   • verificação completa de formato mora em src/lib/domains/hostname.ts
--     (normalizador reutilizável); aqui ficam CHECKs de defesa em profundidade
--     (lowercase, labels DNS, comprimento máximo 253);
--   • verification_token gerado no PRÓPRIO banco com CSPRNG do pgcrypto
--     (encode(gen_random_bytes(32),'hex') = 64 hex / 256 bits) — nunca
--     UUID nem valores previsíveis; privilegiado e verificado para os papéis
--     do app (authenticated/anon têm EXECUTE em extensions.gen_random_bytes);
--   • RLS: CRUD só do DONO da loja (mesmo padrão de store_faq_items); anon
--     NÃO tem política alguma na tabela — o público só passa pela RPC, que
--     devolve colunas mínimas e jamais expõe verification_token.
--
-- Nada aqui altera roteamento, Vercel, DNS, SSL ou a vitrine atual: é camada
-- de dados puramente aditiva. Lojistas existentes não precisam de nada.
--
-- Idempotente: pode ser re-executada com segurança.
-- Aplicação:  npm run db:push
-- =============================================================================

-- ── store_domains ──────────────────────────────────────────────────────────
create table if not exists public.store_domains (
  id                 uuid primary key default gen_random_uuid(),
  store_id           uuid not null
                       constraint store_domains_store_id_fkey
                         references public.stores (id) on delete cascade,
  hostname           text not null
                       constraint store_domains_hostname_len_check
                         check (char_length(hostname) between 1 and 253)
                       -- Formato de hostname normalizado: minúsculas, labels
                       -- DNS (RFC 1035), sem underscore/asterisco/espaço/hífen
                       -- inicial ou final, com pelo menos UM ponto separando
                       -- os labels (label único nunca é domínio público).
                       -- Defesa em profundidade — a validação completa
                       -- (protocolo, porta, IP, punycode, plataforma…) é a de
                       -- src/lib/domains/hostname.ts.
                       constraint store_domains_hostname_format_check
                         check (hostname ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$')
                       -- Hostnames da plataforma são PROIBIDOS: apex e
                       -- qualquer subdomínio (app., www., {slug}., valorfacil.
                       -- … cobrem o wildcard *.elicani.site).
                       constraint store_domains_hostname_platform_check
                         check (hostname <> 'elicani.site'
                                and hostname not like '%.elicani.site'),
  status             text not null default 'pending'
                       constraint store_domains_status_check
                         check (status in ('pending','active','failed','disabled')),
  verification_token text not null
                       default encode(extensions.gen_random_bytes(32),'hex')
                       constraint store_domains_verification_token_check
                         check (verification_token ~ '^[0-9a-f]{64}$'),
  verified_at        timestamptz,
  is_primary         boolean not null default false,
  vercel_status      text,
  last_error         text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ── índices ────────────────────────────────────────────────────────────────
-- Hostname ÚNICO GLOBALMENTE (uma loja por domínio em toda a plataforma).
create unique index if not exists store_domains_hostname_key
  on public.store_domains (hostname);

-- No máximo UM domínio primário por loja (índice único parcial).
create unique index if not exists store_domains_one_primary_per_store
  on public.store_domains (store_id) where is_primary;

-- Lookup do dono (RLS e listagem por loja).
create index if not exists store_domains_store_id_idx
  on public.store_domains (store_id);

comment on table public.store_domains is
  'Domínio próprio de uma loja (fase 1 dos Custom Domains): hostname único globalmente, status pending|active|failed|disabled, token de verificação CSPRNG. CRUD só do dono (RLS); o público resolve apenas via store_by_hostname.';

-- ── updated_at (mesmo trigger das demais tabelas) ──────────────────────────
drop trigger if exists set_updated_at_store_domains on public.store_domains;
create trigger set_updated_at_store_domains
  before update on public.store_domains
  for each row execute function public.set_updated_at();

-- ── RLS: CRUD apenas do DONO da loja (padrão store_faq_items) ──────────────
-- Deriva a posse da tabela filha da posse da loja (stores.owner_id).
-- anon NÃO recebe política nenhuma: leitura pública existe só via RPC.
alter table public.store_domains enable row level security;

drop policy if exists store_domains_select_own on public.store_domains;
create policy store_domains_select_own
  on public.store_domains for select to authenticated
  using (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists store_domains_insert_own on public.store_domains;
create policy store_domains_insert_own
  on public.store_domains for insert to authenticated
  with check (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists store_domains_update_own on public.store_domains;
create policy store_domains_update_own
  on public.store_domains for update to authenticated
  using (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists store_domains_delete_own on public.store_domains;
create policy store_domains_delete_own
  on public.store_domains for delete to authenticated
  using (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ));

-- ── store_by_hostname: resolução pública fail-closed ───────────────────────
-- O proxy/páginas precisam traduzir Host → loja sem ler a tabela (anon não
-- tem política nenhuma dela). SECURITY DEFINER (dono postgres, fora do RLS)
-- e devolve APENAS store_id + slug + is_active — nunca verification_token,
-- vercel_status, last_error ou qualquer outro campo privado.
--
-- Fail-closed: só `status = 'active'` E loja ativa devolvem linha; qualquer
-- outro estado (pending/failed/disabled), loja inativa ou hostname
-- desconhecido → conjunto vazio. Comparação EXATA: o chamador normaliza o
-- Host antes (src/lib/domains/hostname.ts) — punycode incluído.
create or replace function public.store_by_hostname(p_hostname text)
returns table (store_id uuid, slug text, is_active boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select d.store_id, s.slug, s.is_active
  from public.store_domains d
  join public.stores s on s.id = d.store_id
  where d.hostname = p_hostname
    and d.status = 'active'
    and s.is_active = true
$$;

comment on function public.store_by_hostname(text) is
  'Resolve um hostname normalizado para (store_id, slug, is_active) APENAS de domínio ativo e loja ativa; fail-closed (demais estados/desconhecido → nada). Nunca expõe verification_token. SECURITY DEFINER porque anon não lê store_domains.';

-- O público (anon) precisa do resultado para servir a vitrine; o
-- authenticated também (mesma lógica em qualquer contexto). O executo padrão
-- é PUBLIC — restringimos aos papéis do aplicativo.
revoke execute on function public.store_by_hostname(text) from public;
grant execute on function public.store_by_hostname(text) to anon;
grant execute on function public.store_by_hostname(text) to authenticated;
