-- =============================================================================
-- Elicani — Pedidos (orders + order_items)
-- -----------------------------------------------------------------------------
-- A Fase 1 enviava pedidos APENAS por WhatsApp (nenhuma tabela). Esta
-- migration adiciona a GRAVAÇÃO de pedidos: o checkout passa a registar cada
-- pedido na base (mesmo fluxo do WhatsApp continua intacto — a gravação é
-- adicional e nunca bloqueia o envio) e a secção Relatórios lê daqui.
--
-- Modelo (espelha o que a mensagem do WhatsApp já coleta):
--   • orders      — estado, cliente, pagamento, totais;
--   • order_items — linhas com snapshot de nome/preço (produto pode ser
--                   apagado sem perder o histórico) + opções escolhidas.
--
-- Estados (definidos aqui — a Fase 1 não tinha nenhum):
--   pending → confirmado → concluído | cancelado
--   Venda VÁLIDA = qualquer estado EXCETO 'cancelled' (num fluxo WhatsApp o
--   pedido é uma venda real desde que não seja cancelado).
--
-- Segurança (duas camadas):
--   • gravação EXCLUSIVAMENTE pela função `record_order` (SECURITY DEFINER):
--     valida loja ativa, cliente, produtos PERTENCENTES À LOJA e recalcula
--     preços/totais a partir do banco — o cliente nunca envia valores
--     confiáveis. Sem políticas INSERT/UPDATE/DELETE → REST não escreve.
--   • leitura: apenas o dono da loja (RLS). Anon não lê pedidos.
--
-- Idempotente: pode ser re-executada com segurança.
-- Aplicação:  npm run db:push
-- =============================================================================

-- ── orders ──────────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id                   uuid primary key default gen_random_uuid(),
  -- referência humana derivada do id (6 hex maiúsculos): `#A3F9C2`.
  reference            text generated always as (upper(substr(id::text, 1, 6))) stored,
  store_id             uuid not null
                         constraint orders_store_id_fkey
                           references public.stores (id) on delete cascade,
  status               text not null default 'pending'
                         constraint orders_status_check
                           check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  customer_name        text not null
                         constraint orders_customer_name_check
                           check (length(customer_name) between 1 and 120),
  customer_phone       text not null
                         constraint orders_customer_phone_check
                           check (length(customer_phone) between 7 and 32),
  customer_address     text
                         constraint orders_customer_address_check
                           check (customer_address is null or length(customer_address) <= 300),
  customer_neighborhood text
                         constraint orders_customer_neighborhood_check
                           check (customer_neighborhood is null or length(customer_neighborhood) <= 120),
  customer_reference   text
                         constraint orders_customer_reference_check
                           check (customer_reference is null or length(customer_reference) <= 200),
  customer_notes       text
                         constraint orders_customer_notes_check
                           check (customer_notes is null or length(customer_notes) <= 1000),
  payment              text
                         constraint orders_payment_check
                           check (payment is null or payment in ('cash', 'transfer', 'other')),
  subtotal             numeric(12,2) not null
                         constraint orders_subtotal_check
                           check (subtotal >= 0),
  delivery_fee         numeric(12,2)
                         constraint orders_delivery_fee_check
                           check (delivery_fee is null or delivery_fee >= 0),
  -- Estado de ENTREGA separado do estado do encomenda (não corrompe o
  -- modelo de status): pendente → em preparação → a caminho → entregue.
  delivery_status      text not null default 'pending'
                         constraint orders_delivery_status_check
                           check (delivery_status in ('pending', 'preparing', 'on_the_way', 'delivered')),
  total                numeric(12,2) not null
                         constraint orders_total_check
                           check (total >= 0),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

comment on table public.orders is
  'Pedido registado pelo checkout (Fase 1: mensagem de WhatsApp; agora também persistida para os Relatórios).';

create index if not exists orders_store_created_idx
  on public.orders (store_id, created_at desc);

create index if not exists orders_store_status_idx
  on public.orders (store_id, status);

create index if not exists orders_store_delivery_status_idx
  on public.orders (store_id, delivery_status);

create index if not exists orders_store_reference_idx
  on public.orders (store_id, reference);

drop trigger if exists set_updated_at_orders on public.orders;
create trigger set_updated_at_orders
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ── order_items ─────────────────────────────────────────────────────────────
create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null
                constraint order_items_order_id_fkey
                  references public.orders (id) on delete cascade,
  store_id    uuid not null
                constraint order_items_store_id_fkey
                  references public.stores (id) on delete cascade,
  product_id  uuid
                constraint order_items_product_id_fkey
                  references public.products (id) on delete set null,
  -- snapshot: nome e preço VENDIDOS na época (sobrevive a renomes/apagados)
  name        text not null
                constraint order_items_name_check
                  check (length(name) between 1 and 200),
  qty         integer not null
                constraint order_items_qty_check
                  check (qty between 1 and 99),
  unit_price  numeric(12,2) not null
                constraint order_items_unit_price_check
                  check (unit_price >= 0),
  options     jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

comment on table public.order_items is
  'Linhas de um pedido com snapshot de nome/preço e opções escolhidas.';

create index if not exists order_items_order_id_idx
  on public.order_items (order_id);

create index if not exists order_items_store_product_idx
  on public.order_items (store_id, product_id);

-- ── RLS: leitura apenas do dono; escrita SÓ via record_order ────────────────
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists orders_select_own on public.orders;
create policy orders_select_own
  on public.orders for select to authenticated
  using (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ));

drop policy if exists order_items_select_own on public.order_items;
create policy order_items_select_own
  on public.order_items for select to authenticated
  using (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ));

-- O dono ATUALIZA o próprio pedido (estado + estado de entrega) — as
-- ações do painel restringem os campos; o RLS garante a linha/loja.
drop policy if exists orders_update_own on public.orders;
create policy orders_update_own
  on public.orders for update to authenticated
  using (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ));

-- Sem políticas de insert/update/delete: REST não grava pedidos.
-- (O checkout grava via função SECURITY DEFINER abaixo.)

-- ── record_order: gravação validada e atômica ───────────────────────────────
-- O cliente envia APENAS identidade (produto, quantidade, opções); nome,
-- preço unitário e totais são recalculados aqui a partir do banco.
-- security definer: o dono da função (postgres) ignora RLS para INSERIR
-- (a validação interna é a autorização); a leitura continua protegida.
create or replace function public.record_order(
  p_store_id uuid,
  p_customer jsonb,
  p_lines jsonb,
  p_payment text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_active     boolean;
  v_name       text;
  v_phone      text;
  v_neighborhood text;
  v_address    text;
  v_reference  text;
  v_notes      text;
  v_line       jsonb;
  v_opt        jsonb;
  v_product    record;
  v_qty        numeric;
  v_delta      numeric;
  v_d          numeric;
  v_unit       numeric;
  v_subtotal   numeric := 0;
  v_order_id   uuid;
  v_pids       uuid[] := '{}';
  v_names      text[] := '{}';
  v_qtys       integer[] := '{}';
  v_units      numeric[] := '{}';
  v_opts       jsonb[] := '{}';
  v_opt_count  integer;
  v_i          integer := 0;
begin
  -- loja existe e está ativa (mesma regra do checkout público)
  select s.is_active into v_active from public.stores s where s.id = p_store_id;
  if v_active is distinct from true then
    raise exception 'store_unavailable';
  end if;

  if p_payment is not null and p_payment not in ('cash', 'transfer', 'other') then
    raise exception 'invalid_payment';
  end if;

  -- cliente: mesmas regras obrigatórias do checkout (nome, telefone, bairro)
  v_name         := trim(coalesce(p_customer->>'name', ''));
  v_phone        := trim(coalesce(p_customer->>'phone', ''));
  v_neighborhood := trim(coalesce(p_customer->>'neighborhood', ''));
  if length(v_name) < 1 or length(v_name) > 120 then
    raise exception 'invalid_name';
  end if;
  if length(regexp_replace(v_phone, '\D', '', 'g')) < 7 or length(v_phone) > 32 then
    raise exception 'invalid_phone';
  end if;
  if length(v_neighborhood) < 1 or length(v_neighborhood) > 120 then
    raise exception 'invalid_neighborhood';
  end if;
  v_address   := nullif(trim(coalesce(p_customer->>'address', '')), '');
  v_reference := nullif(trim(coalesce(p_customer->>'reference', '')), '');
  v_notes     := nullif(trim(coalesce(p_customer->>'notes', '')), '');
  if v_address is not null and length(v_address) > 300 then
    raise exception 'invalid_address';
  end if;
  if v_reference is not null and length(v_reference) > 200 then
    raise exception 'invalid_reference';
  end if;
  if v_notes is not null and length(v_notes) > 1000 then
    raise exception 'invalid_notes';
  end if;

  -- linhas: 1..30, qty inteira 1..99
  if jsonb_typeof(p_lines) is distinct from 'array'
     or jsonb_array_length(p_lines) < 1
     or jsonb_array_length(p_lines) > 30 then
    raise exception 'invalid_lines';
  end if;

  while v_i < jsonb_array_length(p_lines) loop
    v_line := p_lines->v_i;

    v_qty := (v_line->>'qty')::numeric;
    if v_qty is null or v_qty <> trunc(v_qty) or v_qty < 1 or v_qty > 99 then
      raise exception 'invalid_qty';
    end if;

    -- produto PERTENCE À LOJA; nome e preço vêm do BANCO (nunca do cliente)
    select p.id, p.name, p.price, p.promo_price into v_product
      from public.products p
     where p.id = (v_line->>'productId')::uuid
       and p.store_id = p_store_id;
    if v_product.id is null then
      raise exception 'unknown_product';
    end if;

    -- opções escolhidas: estrutura saneada (o delta não é verificável sem
    -- opções persistidas no banco — limitado a valores plausíveis)
    v_opt_count := jsonb_array_length(coalesce(v_line->'options', '[]'::jsonb));
    if v_opt_count > 20 then
      raise exception 'invalid_options';
    end if;
    v_delta := 0;
    for v_opt in
      select * from jsonb_array_elements(coalesce(v_line->'options', '[]'::jsonb))
    loop
      if coalesce(length(v_opt->>'groupLabel'), 0) > 80
         or coalesce(length(v_opt->>'choiceLabel'), 0) > 80 then
        raise exception 'invalid_option_label';
      end if;
      v_d := (v_opt->>'priceDelta')::numeric;
      if v_d is null or v_d > 1000000 or v_d < -1000000 then
        raise exception 'invalid_option_delta';
      end if;
      v_delta := v_delta + v_d;
    end loop;

    v_unit := coalesce(v_product.promo_price, v_product.price) + v_delta;
    if v_unit < 0 then
      raise exception 'invalid_price';
    end if;
    v_subtotal := v_subtotal + v_qty * v_unit;

    v_pids  := array_append(v_pids, v_product.id);
    v_names := array_append(v_names, v_product.name);
    v_qtys  := array_append(v_qtys, v_qty::integer);
    v_units := array_append(v_units, v_unit);
    v_opts  := array_append(v_opts, coalesce(v_line->'options', '[]'::jsonb));

    v_i := v_i + 1;
  end loop;

  -- Fase 1: sem configuração de entrega → total = subtotal
  insert into public.orders (
    store_id, status, customer_name, customer_phone, customer_address,
    customer_neighborhood, customer_reference, customer_notes, payment,
    subtotal, delivery_fee, total
  ) values (
    p_store_id, 'pending', v_name, v_phone, v_address,
    v_neighborhood, v_reference, v_notes, p_payment,
    v_subtotal, null, v_subtotal
  )
  returning id into v_order_id;

  v_i := 1;
  while v_i <= array_length(v_pids, 1) loop
    insert into public.order_items (order_id, store_id, product_id, name, qty, unit_price, options)
    values (v_order_id, p_store_id, v_pids[v_i], v_names[v_i], v_qtys[v_i], v_units[v_i], v_opts[v_i]);
    v_i := v_i + 1;
  end loop;

  return v_order_id;
end;
$$;

comment on function public.record_order(uuid, jsonb, jsonb, text) is
  'Grava um pedido validado (loja ativa, cliente, produtos da loja, preços recalculados do banco). SECURITY DEFINER: único caminho de escrita de orders/order_items.';

revoke execute on function public.record_order(uuid, jsonb, jsonb, text) from public;
grant execute on function public.record_order(uuid, jsonb, jsonb, text)
  to anon, authenticated, service_role;
