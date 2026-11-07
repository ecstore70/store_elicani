-- =============================================================================
-- Elicani — Status público do catálogo (ativo / inativo / inexistente)
-- -----------------------------------------------------------------------------
-- Adiciona:
--   • função store_public_status(slug) — devolve 'active' | 'inactive' | null
--
-- Por que existe: o RLS esconde lojas INATIVAS do papel `anon`
-- (stores_public_select_active), por isso nem o proxy nem as páginas da
-- vitrine conseguem distinguir "loja inativa" (estado indisponível, HTTP 200)
-- de "loja inexistente" (404 real) consultando a tabela diretamente.
--
-- A função roda como SECURITY DEFINER (dono postgres, fora do RLS) e expõe
-- APENAS o estado do slug pedido — nenhum dado do comerciante. O proxy usa-a
-- para decidir 404 vs. página indisponível; as páginas usam-na de reserva.
--
-- Idempotente: pode ser re-executada com segurança.
-- Aplicação:  npm run db:push
-- =============================================================================

create or replace function public.store_public_status(p_slug text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (
      select 1 from public.stores
      where slug = p_slug and is_active = true
    ) then 'active'
    when exists (
      select 1 from public.stores
      where slug = p_slug
    ) then 'inactive'
    else null
  end;
$$;

comment on function public.store_public_status(text) is
  'Status público de um slug de loja: active | inactive | null (inexistente). SECURITY DEFINER porque o RLS esconde lojas inativas do anon — o proxy/páginas precisam distinguir indisponível de 404.';

-- O público (anon) precisa do resultado para servir a vitrine; o authenticated
-- também (mesma lógica em qualquer contexto). O executo padrão é PUBLIC —
-- restringimos aos papéis do aplicativo.
revoke execute on function public.store_public_status(text) from public;
grant execute on function public.store_public_status(text) to anon;
grant execute on function public.store_public_status(text) to authenticated;
