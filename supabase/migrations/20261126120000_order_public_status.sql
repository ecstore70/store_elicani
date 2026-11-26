-- =============================================================================
-- Elicani — Estado público da encomenda (página de seguimento do comprador)
-- -----------------------------------------------------------------------------
-- Adiciona:
--   • função order_public_status(store_slug, order_id) — devolve jsonb | null
--
-- Por que existe: o RLS de SELECT de `orders` é do DONO da loja — o
-- comprador (anon) não pode ler a própria encomenda. A página pública
-- /store/{slug}/order/{uuid} (capability URL: uuid v4 com 122 bits é a
-- autorização) precisa do estado SEM expor PII: a função devolve apenas
-- referência, estado da encomenda, estado da entrega, data, totais e
-- itens (nome/qtd/preço/opções) — NUNCA nome, telefone, morada, notas
-- ou pagamento do cliente. URL cruzada (encomenda de OUTRA loja) → null
-- → 404 (o proxy confirma antes do render, ramo 1f).
--
-- SECURITY DEFINER (dono postgres, fora do RLS) — mesmo motivo da
-- `store_public_status`: o anon não tem SELECT em `orders`.
-- Idempotente: pode ser re-executada com segurança.
-- Aplicação:  npm run db:push
-- =============================================================================

create or replace function public.order_public_status(
  p_store_slug text,
  p_order_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'reference', o.reference,
    'status', o.status,
    'delivery_status', o.delivery_status,
    -- ISO-8601 em UTC — formato que `new Date()` interpreta em qualquer runtime
    'created_at', to_char(o.created_at at time zone 'UTC',
                          'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'subtotal', o.subtotal,
    'delivery_fee', o.delivery_fee,
    'total', o.total,
    'items', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'name', oi.name,
            'qty', oi.qty,
            'unit_price', oi.unit_price,
            'options', oi.options
          )
          order by oi.created_at, oi.id
        )
        from public.order_items oi
        where oi.order_id = o.id
      ),
      '[]'::jsonb
    )
  )
  from public.orders o
  join public.stores s on s.id = o.store_id
  where s.slug = p_store_slug
    and o.id = p_order_id;
$$;

comment on function public.order_public_status(text, uuid) is
  'Estado público da encomenda para a página de seguimento do comprador (capability URL por uuid). Devolve só estado/totais/itens — NUNCA PII do cliente. SECURITY DEFINER porque o RLS de orders é do dono da loja.';

-- O público (anon) precisa do resultado para servir a página de
-- seguimento; o authenticated também (mesma lógica em qualquer contexto).
revoke execute on function public.order_public_status(text, uuid) from public;
grant execute on function public.order_public_status(text, uuid) to anon;
grant execute on function public.order_public_status(text, uuid) to authenticated;
