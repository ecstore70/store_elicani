#!/usr/bin/env node
/**
 * Verifica os RELATÓRIOS contra o banco REAL do projeto Supabase.
 *
 *   node scripts/verify-reports.mjs
 *
 * O que é verificado (sem simulação):
 *   1. `record_order` (o caminho REAL do checkout, via anónimo) grava
 *      encomendas na loja-fixture `vis-test-store` — só se ainda não
 *      houver nenhuma (idempotente);
 *   2. os números exibidos pelo dashboard batem certos com contas
 *      INDEPENDENTES feitas aqui em cima das linhas cruas (vendas,
 *      contagem, ticket médio, unidades, estados, top produtos,
 *      recentes, soma da série diária);
 *   3. as colunas novas existem (`reference`, `delivery_status`).
 *
 * O módulo agregador é importado do fonte (mesmo código do dashboard);
 * as EXPECTATIVAS são calculadas de forma independente neste script.
 *
 * Credenciais: variáveis de ambiente → .env.local → ~/.supabase_anon
 * e ~/.supabase_service (mesma ordem do verify-rls.mjs).
 */
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { aggregateReport } from "../src/lib/reports/aggregate.ts";

const ROOT = process.cwd();
const STORE_SLUG = "vis-test-store";

let passed = 0;
let failed = 0;

function ok(label) {
  passed += 1;
  console.log(`  \x1b[1;32m✔\x1b[0m ${label}`);
}

function bad(label, detail) {
  failed += 1;
  console.log(`  \x1b[1;31m✖\x1b[0m ${label}`);
  if (detail !== undefined) console.log(`      ${detail}`);
}

function assert(label, condition, detail) {
  if (condition) ok(label);
  else bad(label, detail);
}

async function loadEnv() {
  const file = path.join(ROOT, ".env.local");
  if (!existsSync(file)) return;
  for (const line of (await readFile(file, "utf8")).split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, raw] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = raw.replace(/^["']|["']$/g, "");
  }
}

function secret(name, homeFile) {
  const fromEnv = process.env[name];
  if (fromEnv?.trim()) return fromEnv.trim();
  const file = path.join(homedir(), homeFile);
  if (existsSync(file)) return readFileSync(file, "utf8").trim();
  console.error(`\x1b[1;31m[reports]\x1b[0m credencial ausente: ${name}`);
  process.exit(1);
}

function errorDetail(result) {
  const error = result?.error;
  if (!error) return null;
  return `${error.code ?? "-"}: ${error.message ?? JSON.stringify(error)}`;
}

/** Mesma regra de fuso do dashboard: IANA válido, senão UTC. */
function safeTimeZone(value) {
  if (typeof value !== "string" || value.length === 0) return "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return value;
  } catch {
    return "UTC";
  }
}

const round2 = (value) => Math.round(value * 100) / 100;

await loadEnv();

const URL_BASE = secret("NEXT_PUBLIC_SUPABASE_URL", ".supabase_anon");
const ANON_KEY = secret("NEXT_PUBLIC_SUPABASE_ANON_KEY", ".supabase_anon");
const SERVICE_KEY = secret("SUPABASE_SERVICE_ROLE_KEY", ".supabase_service");

const asAnon = createClient(URL_BASE, ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const asService = createClient(URL_BASE, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log(`\x1b[1;32m[reports]\x1b[0m verificação de relatórios (loja ${STORE_SLUG})\n`);

try {
  // ── 1. Loja fixture + produto ────────────────────────────────────────────
  const storeResult = await asService
    .from("stores")
    .select("id, slug, timezone, currency, is_active")
    .eq("slug", STORE_SLUG)
    .maybeSingle();
  assert(
    `loja fixture "${STORE_SLUG}" existe`,
    !!storeResult.data,
    errorDetail(storeResult),
  );
  const store = storeResult.data;

  const productResult = await asService
    .from("products")
    .select("id, name, price, promo_price")
    .eq("store_id", store.id)
    .limit(1);
  assert(
    "loja tem pelo menos um produto",
    !productResult.error && (productResult.data ?? []).length === 1,
    errorDetail(productResult),
  );
  const product = productResult.data?.[0];

  // ── 2. Semente idempotente via o caminho REAL do checkout ───────────────
  const existing = await asService
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("store_id", store.id);

  if ((existing.count ?? 0) === 0) {
    const seeds = [
      {
        customer: {
          name: "Cliente Relatórios",
          phone: "+258840000901",
          neighborhood: "Baixa",
          address: "Rua da Sé, 10",
          reference: "Em frente ao mercado",
        },
        payment: "cash",
        qty: 2,
        status: null, // fica pending (estado inicial real)
      },
      {
        customer: {
          name: "Cliente Dois",
          phone: "+258840000902",
          neighborhood: "Alto",
        },
        payment: "transfer",
        qty: 1,
        status: "completed",
      },
      {
        customer: {
          name: "Cliente Três",
          phone: "+258840000903",
          neighborhood: "Malhangalene",
        },
        payment: "cash",
        qty: 5,
        status: "cancelled", // tem de ficar FORA das vendas
      },
    ];

    for (const seed of seeds) {
      const created = await asAnon.rpc("record_order", {
        p_store_id: store.id,
        p_customer: seed.customer,
        p_lines: [{ productId: product.id, qty: seed.qty, options: [] }],
        p_payment: seed.payment,
      });
      if (created.error || typeof created.data !== "string") {
        bad("semente: record_order criou encomenda", errorDetail(created));
        continue;
      }
      if (seed.status) {
        await asService
          .from("orders")
          .update({ status: seed.status })
          .eq("id", created.data);
      }
      ok(`semente: encomenda ${seed.status ?? "pending"} (qty ${seed.qty})`);
    }
  } else {
    ok(`loja já tem ${existing.count} encomenda(s) — a verificar sem semear`);
  }

  // ── 3. As mesmas duas consultas do dashboard (servidor) ─────────────────
  const ordersResult = await asService
    .from("orders")
    .select(
      "id, reference, status, total, created_at, customer_name, payment",
    )
    .eq("store_id", store.id)
    .order("created_at", { ascending: true });
  assert(
    "consulta de encomendas devolve linhas",
    !ordersResult.error && (ordersResult.data ?? []).length > 0,
    errorDetail(ordersResult) ?? "0 linhas",
  );
  const rawOrders = ordersResult.data ?? [];

  const itemsResult = await asService
    .from("order_items")
    .select(
      "name, qty, unit_price, product_id, order_id, orders(status, created_at)",
    )
    .eq("store_id", store.id)
    .order("created_at", { ascending: true });
  assert(
    "consulta de itens devolve linhas",
    !itemsResult.error && (itemsResult.data ?? []).length > 0,
    errorDetail(itemsResult) ?? "0 linhas",
  );
  const rawItems = itemsResult.data ?? [];

  // ── 4. Colunas novas existem ────────────────────────────────────────────
  const firstOrder = rawOrders[0];
  assert(
    "coluna reference (6 hex maiúsculos) presente",
    typeof firstOrder?.reference === "string" &&
      /^[0-9A-F]{6}$/.test(firstOrder.reference),
    `reference: ${firstOrder?.reference}`,
  );

  const withDelivery = await asService
    .from("orders")
    .select("id, delivery_status")
    .eq("store_id", store.id)
    .limit(1);
  assert(
    "coluna delivery_status presente",
    !withDelivery.error &&
      typeof withDelivery.data?.[0]?.delivery_status === "string",
    errorDetail(withDelivery),
  );

  // ── 5. Expectativas INDEPENDENTES (contas à mão em cima das linhas) ────
  const VALID = new Set(["pending", "confirmed", "completed"]);
  const validOrders = rawOrders.filter((order) => VALID.has(order.status));

  const expSales = validOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const expCount = validOrders.length;
  const expAvg = expCount > 0 ? round2(expSales / expCount) : 0;

  const orderByRow = new Map(
    rawOrders.map((order) => [order.id, order]),
  );
  let expItems = 0;
  const topByName = new Map();
  for (const item of rawItems) {
    const order = orderByRow.get(item.order_id);
    if (!order || !VALID.has(order.status)) continue;
    expItems += Number(item.qty);
    const entry = topByName.get(item.name) ?? {
      name: item.name,
      qty: 0,
      revenue: 0,
    };
    entry.qty += Number(item.qty);
    entry.revenue += Number(item.qty) * Number(item.unit_price);
    topByName.set(item.name, entry);
  }
  const expTop = [...topByName.values()]
    .sort((a, b) =>
      b.qty !== a.qty ? b.qty - a.qty : b.revenue !== a.revenue
        ? b.revenue - a.revenue
        : a.name.localeCompare(b.name),
    )
    .slice(0, 5);

  const expStatuses = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
  for (const order of rawOrders) {
    if (order.status in expStatuses) expStatuses[order.status] += 1;
  }

  const expRecent = [...validOrders]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 5)
    .map((order) => order.id);

  // ── 6. Período cobre todas as encomendas + agregação real ───────────────
  const timestamps = rawOrders
    .map((order) => Date.parse(order.created_at))
    .filter((value) => !Number.isNaN(value));
  const minMs = timestamps.length > 0 ? Math.min(...timestamps) : Date.now();
  const fromKey = new Date(minMs - 2 * 86_400_000).toISOString().slice(0, 10);
  const days = Math.max(
    1,
    Math.ceil((Date.now() + 2 * 86_400_000 - Date.parse(`${fromKey}T00:00:00Z`)) / 86_400_000) + 1,
  );
  const timeZone = safeTimeZone(store.timezone);

  const data = aggregateReport({
    orders: rawOrders.map((order) => ({
      id: order.id,
      status: order.status,
      total: Number(order.total),
      createdAt: order.created_at,
      customerName: order.customer_name,
      payment: order.payment,
    })),
    items: rawItems.map((item) => ({
      name: item.name,
      qty: Number(item.qty),
      unitPrice: Number(item.unit_price),
      productId: item.product_id,
      orderStatus: item.orders?.status ?? "pending",
      orderCreatedAt: item.orders?.created_at ?? item.created_at,
    })),
    fromKey,
    days,
    timeZone,
  });

  // ── 7. Comparações ──────────────────────────────────────────────────────
  assert(
    `vendas reais = ${expSales} (KPI do dashboard)`,
    data.kpis.sales === expSales,
    `dashboard=${data.kpis.sales} esperado=${expSales}`,
  );
  assert(
    `nº de encomendas = ${expCount}`,
    data.kpis.orderCount === expCount,
    `dashboard=${data.kpis.orderCount} esperado=${expCount}`,
  );
  assert(
    `ticket médio = ${expAvg}`,
    data.kpis.avgOrder === expAvg,
    `dashboard=${data.kpis.avgOrder} esperado=${expAvg}`,
  );
  assert(
    `unidades vendidas = ${expItems} (canceladas fora)`,
    data.kpis.itemsSold === expItems,
    `dashboard=${data.kpis.itemsSold} esperado=${expItems}`,
  );
  assert(
    "resumo de estados = contagens reais",
    JSON.stringify(data.statuses) === JSON.stringify(expStatuses),
    `dashboard=${JSON.stringify(data.statuses)} esperado=${JSON.stringify(expStatuses)}`,
  );

  const gotTop = data.topProducts.slice(0, 5).map((product) => [
    product.name,
    product.qty,
    product.revenue,
  ]);
  const wantTop = expTop.map((product) => [product.name, product.qty, product.revenue]);
  assert(
    "top produtos (qty, receita, ordem) = contas independentes",
    JSON.stringify(gotTop) === JSON.stringify(wantTop),
    `dashboard=${JSON.stringify(gotTop)} esperado=${JSON.stringify(wantTop)}`,
  );

  assert(
    "encomendas recentes = ids esperados",
    JSON.stringify(data.recent.map((order) => order.id)) === JSON.stringify(expRecent),
    `dashboard=${JSON.stringify(data.recent.map((order) => order.id))} esperado=${JSON.stringify(expRecent)}`,
  );

  const seriesSales = data.series.reduce((sum, point) => sum + point.sales, 0);
  const seriesOrders = data.series.reduce((sum, point) => sum + point.orders, 0);
  assert(
    "soma da série diária = vendas/contagem do período",
    seriesSales === expSales && seriesOrders === expCount,
    `série=${seriesSales}/${seriesOrders} esperado=${expSales}/${expCount}`,
  );

  assert(
    "sem estado vazio forjado (há vendas reais)",
    data.empty === false,
    `empty=${data.empty}`,
  );
} catch (error) {
  failed += 1;
  console.error(`\n\x1b[1;31m[reports]\x1b[0m erro inesperado: ${error.message}`);
}

console.log(
  `\n\x1b[1;32m[reports]\x1b[0m ${passed} verificação(ões) ok, ${failed} falha(s)\n`,
);
process.exit(failed > 0 ? 1 : 0);
