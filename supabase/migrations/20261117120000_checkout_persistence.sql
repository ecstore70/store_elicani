-- ── Camada de dados COMERCIAIS do checkout existente ─────────────────────────
--
-- O checkout já gravava `orders` + `order_items` via `record_order`; esta
-- migração fecha os gaps de persistência sem mudar o fluxo do cliente:
--   1. IDEMPOTÊNCIA — `orders.client_token` (token por envio) impede que um
--      duplo toque/repetição crie encomendas duplicadas;
--   2. MARCA DE WHATSAPP — `orders.whatsapp_opened_at` regista quando o
--      checkout acionou a abertura do WhatsApp (handoff; NÃO confirma
--      entrega nem leitura da mensagem);
--   3. ESTADO DE ENTREGA — `failed` passa a ser um destino legítimo (uma
--      entrega que falhou deixa de ficar presa em "on_the_way");
--   4. EVENTOS ANÓNIMOS — `store_events` (catálogo/produto/carrinho/checkout)
--      sem PII, escrita SÓ pela RPC `record_event`, leitura só do dono;
--   5. INTEGRIDADE — trigger que congela campos comerciais de `orders`
--      (nome/valores/pagamento) em updates do REST: só `status` e
--      `delivery_status` mudam depois de criada a encomenda.
--
-- Compatibilidade: `record_order` mantém os 4 primeiros parâmetros (o 5.º
-- tem default) — o código em produção continua a funcionar durante o deploy.

-- ── 1+2. colunas novas em orders ─────────────────────────────────────────────
alter table public.orders
  add column if not exists whatsapp_opened_at timestamptz,
  add column if not exists client_token uuid;

comment on column public.orders.whatsapp_opened_at is
  'Momento em que o checkout acionou a abertura do WhatsApp (wa.me) ao criar a encomenda. Marca de INÍCIO de contacto — não confirma que a mensagem foi entregue ou lida.';
comment on column public.orders.client_token is
  'Token idempotente gerado pelo checkout para o envio — repetição do mesmo envio devolve a MESMA encomenda em vez de duplicar.';

-- Token único (NULLs livres: encomendas antigas/ferramentas sem token).
create unique index if not exists orders_client_token_key
  on public.orders (client_token);

-- ── 3. delivery_status: incluir 'failed' ─────────────────────────────────────
alter table public.orders drop constraint if exists orders_delivery_status_check;
alter table public.orders add constraint orders_delivery_status_check
  check (delivery_status in ('pending', 'preparing', 'on_the_way', 'delivered', 'failed'));

-- ── 5. trigger de integridade comercial ──────────────────────────────────────
-- Só `status`, `delivery_status` e `updated_at` mudam após a criação. O RLS
-- de UPDATE autoriza o dono pela LINHA; este trigger protege os NÚMEROS e os
-- dados do cliente contra updates arbitrários por REST (a gravação dos
-- valores acontece única e exclusivamente na inserção feita por `record_order`).
create or replace function public.guard_orders_commercial_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.customer_name      is distinct from old.customer_name
     or new.customer_phone   is distinct from old.customer_phone
     or new.customer_address is distinct from old.customer_address
     or new.customer_neighborhood is distinct from old.customer_neighborhood
     or new.customer_reference    is distinct from old.customer_reference
     or new.customer_notes        is distinct from old.customer_notes
     or new.payment         is distinct from old.payment
     or new.subtotal        is distinct from old.subtotal
     or new.delivery_fee    is distinct from old.delivery_fee
     or new.total           is distinct from old.total
     or new.store_id        is distinct from old.store_id
     or new.created_at      is distinct from old.created_at
     or new.client_token    is distinct from old.client_token
     or new.whatsapp_opened_at is distinct from old.whatsapp_opened_at
  then
    raise exception 'orders_commercial_fields_frozen';
  end if;
  return new;
end;
$$;

drop trigger if exists orders_guard_commercial_fields on public.orders;
create trigger orders_guard_commercial_fields
  before update on public.orders
  for each row execute function public.guard_orders_commercial_fields();

-- ── 4. store_events: eventos anónimos da vitrine ─────────────────────────────
create table if not exists public.store_events (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null
                constraint store_events_store_id_fkey
                  references public.stores (id) on delete cascade,
  -- whitelist fechada — o cliente escolhe APENAS entre estes quatro.
  event       text not null
                constraint store_events_event_check
                  check (event in ('catalog_view', 'product_view', 'add_to_cart', 'checkout_started')),
  product_id  uuid
                constraint store_events_product_id_fkey
                  references public.products (id) on delete set null,
  created_at  timestamptz not null default now()
);

comment on table public.store_events is
  'Eventos anónimos de comportamento (sem PII): visita de catálogo/produto, adição ao carrinho e início de checkout. Encomendas/clientes NÃO vivem aqui.';

create index if not exists store_events_store_created_idx
  on public.store_events (store_id, created_at desc);
create index if not exists store_events_store_event_idx
  on public.store_events (store_id, event);

alter table public.store_events enable row level security;

-- Leitura: só o dono da loja (fundação para relatórios futuros).
drop policy if exists store_events_select_own on public.store_events;
create policy store_events_select_own
  on public.store_events for select to authenticated
  using (exists (
    select 1 from public.stores s
    where s.id = store_id and s.owner_id = (select auth.uid())
  ));

-- Sem políticas de insert/update/delete: escrita SÓ via `record_event`
-- (SECURITY DEFINER, com validação de loja ativa/whitelist/produto).

create or replace function public.record_event(
  p_store_id uuid,
  p_event text,
  p_product_id uuid default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_active boolean;
begin
  select s.is_active into v_active from public.stores s where s.id = p_store_id;
  if v_active is distinct from true then
    raise exception 'store_unavailable';
  end if;
  if p_event not in ('catalog_view', 'product_view', 'add_to_cart', 'checkout_started') then
    raise exception 'invalid_event';
  end if;
  if p_product_id is not null
     and not exists (select 1 from public.products p where p.id = p_product_id and p.store_id = p_store_id) then
    raise exception 'unknown_product';
  end if;
  insert into public.store_events (store_id, event, product_id)
  values (p_store_id, p_event, p_product_id);
end;
$$;

comment on function public.record_event(uuid, text, uuid) is
  'Regista um evento anónimo da vitrine (whitelist fechada, loja ativa, produto da loja). SECURITY DEFINER: único caminho de escrita de store_events.';

revoke execute on function public.record_event(uuid, text, uuid) from public;
grant execute on function public.record_event(uuid, text, uuid)
  to anon, authenticated, service_role;

-- ── 1+3. record_order: idempotente + marca de WhatsApp ───────────────────────
-- Substitui a assinatura de 4 por 5 parâmetros (5.º com default): as chamadas
-- antigas de 4 argumentos continuam a resolver nesta única função.
drop function if exists public.record_order(uuid, jsonb, jsonb, text);

create or replace function public.record_order(
  p_store_id uuid,
  p_customer jsonb,
  p_lines jsonb,
  p_payment text default null,
  p_client_token uuid default null
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
  -- idempotência: o MESMO envio (token repetido) devolve a encomenda já
  -- criada — duplo toque/rede instável nunca duplica o pedido. Antes de
  -- tudo: uma repetição de um envio bem-sucedido NÃO revalida nem recria.
  if p_client_token is not null then
    select id into v_order_id from public.orders where client_token = p_client_token;
    if v_order_id is not null then
      return v_order_id;
    end if;
  end if;

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

  -- Fase 1: sem configuração de entrega → total = subtotal.
  -- `whatsapp_opened_at` marca o momento do envio: o checkout abre o
  -- WhatsApp logo a seguir (a própria submissão É a acção do CTA).
  insert into public.orders (
    store_id, status, customer_name, customer_phone, customer_address,
    customer_neighborhood, customer_reference, customer_notes, payment,
    subtotal, delivery_fee, total, client_token, whatsapp_opened_at
  ) values (
    p_store_id, 'pending', v_name, v_phone, v_address,
    v_neighborhood, v_reference, v_notes, p_payment,
    v_subtotal, null, v_subtotal, p_client_token, now()
  )
  on conflict (client_token) do nothing
  returning id into v_order_id;

  if v_order_id is null then
    -- corrida com uma chamada simultânea do mesmo token: a outra criou o
    -- pedido — devolvemos o MESMO id e não inserimos itens em duplicado.
    select id into v_order_id from public.orders where client_token = p_client_token;
    if v_order_id is null then
      raise exception 'insert_conflict';
    end if;
    return v_order_id;
  end if;

  v_i := 1;
  while v_i <= array_length(v_pids, 1) loop
    insert into public.order_items (order_id, store_id, product_id, name, qty, unit_price, options)
    values (v_order_id, p_store_id, v_pids[v_i], v_names[v_i], v_qtys[v_i], v_units[v_i], v_opts[v_i]);
    v_i := v_i + 1;
  end loop;

  return v_order_id;
end;
$$;

comment on function public.record_order(uuid, jsonb, jsonb, text, uuid) is
  'Grava um pedido validado (loja ativa, cliente, produtos da loja, preços recalculados do banco) de forma ATÔMICA e IDEMPOTENTE (p_client_token). SECURITY DEFINER: único caminho de escrita de orders/order_items.';

revoke execute on function public.record_order(uuid, jsonb, jsonb, text, uuid) from public;
grant execute on function public.record_order(uuid, jsonb, jsonb, text, uuid)
  to anon, authenticated, service_role;
