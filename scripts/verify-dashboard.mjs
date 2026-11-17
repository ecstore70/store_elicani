#!/usr/bin/env node
/**
 * Verifica os CARTÕES DE RESUMO do dashboard (Produtos / Encomendas /
 * Clientes) contra o site PRODUCTION, com TRÊS lojas descartáveis do
 * MESMO dono e dados diferentes em cada uma (multi-catalog real).
 *
 *   node scripts/verify-dashboard.mjs
 *
 * O que é verificado (HTTP real, não simulação):
 *   • cada cartão mostra a contagem REAL da loja ATIVA (A=3/2/1,
 *     B=7/5/4, C=vazia=0/0/0) — nunca agregado de lojas;
 *   • os números do dashboard batem certo com as páginas
 *     correspondentes (produtos/encomendas/clientes) E com a base;
 *   • "Disponível numa fase posterior" desapareceu (zero é dado real);
 *   • trocar a loja ativa (cookie elicani_active_store) atualiza os
 *     três números; voltar a A repete 3/2/1 (sem estado obsoleto);
 *   • refresh (GET repetido) preserva os valores;
 *   • o card da loja e as restantes secções do dashboard continuam
 *     intactos (200);
 *   • limpeza total: utilizador descartável apagado (cascata das 3
 *     lojas → produtos → encomendas).
 *
 * Credenciais: variáveis de ambiente → .env.local → ~/.supabase_anon
 * e ~/.supabase_service (mesma ordem do verify-render.mjs).
 */
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const RUN_ID = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
const EMAIL = `dash-test-${RUN_ID}@elicanidash.test`;
const PASSWORD = `Dt!${RUN_ID}9x`;

/** Cookie da loja ativa — mesmo nome de src/lib/stores/active.ts. */
const ACTIVE_STORE_COOKIE = "elicani_active_store";

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
  console.error(`\x1b[1;31m[dash]\x1b[0m credencial ausente: ${name}`);
  process.exit(1);
}

function errorDetail(result) {
  const error = result?.error;
  if (!error) return null;
  return `${error.code ?? "-"}: ${error.message ?? JSON.stringify(error)}`;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** GET com cookies próprios e sem seguir redirecionamentos. */
async function req(url, { cookie = "" } = {}) {
  const response = await fetch(url, {
    method: "GET",
    redirect: "manual",
    headers: {
      accept: "text/html,application/xhtml+xml",
      ...(cookie ? { cookie } : {}),
    },
  });
  const text = await response.text();
  return { status: response.status, location: response.headers.get("location"), text };
}

await loadEnv();

const URL_BASE = secret("NEXT_PUBLIC_SUPABASE_URL", ".supabase_anon");
const ANON_KEY = secret("NEXT_PUBLIC_SUPABASE_ANON_KEY", ".supabase_anon");
const SERVICE_KEY = secret("SUPABASE_SERVICE_ROLE_KEY", ".supabase_service");
const PROJECT_REF = new URL(URL_BASE).hostname.split(".")[0];

const asAnon = createClient(URL_BASE, ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const asService = createClient(URL_BASE, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Codificação idêntica à do @supabase/ssr (funções internas do pacote).
const { createChunks } = await import(
  pathToFileURL(
    path.join(ROOT, "node_modules/@supabase/ssr/dist/module/utils/chunker.js"),
  ).href
);
const { stringToBase64URL } = await import(
  pathToFileURL(
    path.join(ROOT, "node_modules/@supabase/ssr/dist/module/utils/base64url.js"),
  ).href
);

function authCookie(session) {
  const key = `sb-${PROJECT_REF}-auth-token`;
  const payload = {
    ...session,
    expires_at:
      session.expires_at ?? Math.floor(Date.now() / 1000) + (session.expires_in ?? 3600),
  };
  const encoded = `base64-${stringToBase64URL(JSON.stringify(payload))}`;
  return createChunks(key, encoded)
    .map((chunk) => `${chunk.name}=${chunk.value}`)
    .join("; ");
}

/**
 * Os três valores dos cartões, na ordem fixa do dashboard
 * (Produtos, Encomendas, Clientes). Só `<p>` — o `<h1>` do PageHeader
 * partilha a mesma classe e fica de fora.
 */
function summaryValues(html) {
  const matches = [
    ...html.matchAll(
      /<p class="text-2xl font-semibold tracking-tight">([^<]*)<\/p>/g,
    ),
  ];
  return matches.map((match) => Number(match[1].replace(/[^\d]/g, "")));
}

const countLinks = (html, pattern) => (html.match(pattern) ?? []).length;
const PRODUCT_LINKS = /href="\/app\/products\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"/g;
const ORDER_LINKS = /href="\/app\/orders\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"/g;
const CUSTOMER_LINKS = /href="\/app\/customers\/[0-9]+"/g;

console.log(
  `\x1b[1;32m[dash]\x1b[0m cartões de resumo do dashboard — 3 lojas descartáveis (utilizador ${EMAIL})\n`,
);

let userId = null;

try {
  // ── 1. Utilizador + TRÊS lojas com dados diferentes ──────────────────────
  const created = await asService.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });
  assert("utilizador de teste criado", !created.error && !!created.data.user, errorDetail(created));
  userId = created.data?.user?.id ?? null;

  const plans = [
    { key: "A", name: "Dash Loja A", products: 3, orders: 2, customers: 1 },
    { key: "B", name: "Dash Loja B", products: 7, orders: 5, customers: 4 },
    { key: "C", name: "Dash Loja C", products: 0, orders: 0, customers: 0 },
  ];

  const stores = {};
  for (const plan of plans) {
    const slug = `dash-${plan.key.toLowerCase()}-${RUN_ID}`.slice(0, 63);
    const insert = await asService.from("stores").insert({
      owner_id: userId,
      name: plan.name,
      slug,
      whatsapp_number: "+258849999999",
      currency: "MZN",
      is_active: true,
    });
    assert(`loja ${plan.key} criada`, !insert.error, errorDetail(insert));
    const row = await asService.from("stores").select("id").eq("slug", slug).maybeSingle();
    stores[plan.key] = { ...plan, slug, id: row.data?.id };
  }

  // Produtos: A=3, B=7, C=0 (nomes próprios por loja para detetar fugas).
  for (const plan of [stores.A, stores.B]) {
    const rows = Array.from({ length: plan.products }, (_, index) => ({
      store_id: plan.id,
      name: `Dash${plan.key} Prod ${index + 1}`,
      price: 100 + index,
    }));
    const insert = await asService.from("products").insert(rows);
    assert(`loja ${plan.key}: ${plan.products} produtos`, !insert.error, errorDetail(insert));
  }

  // Encomendas via o caminho real do checkout (anon → rpc record_order).
  // A: 2 encomendas, MESMO telefone → 1 cliente.
  // B: 5 encomendas, 4 telefones distintos (um repete) → 4 clientes.
  const seedPhones = {
    A: ["+258841110001", "+258841110001"],
    B: ["+258842220001", "+258842220001", "+258842220002", "+258842220003", "+258842220004"],
  };

  const firstProduct = async (storeId) => {
    const row = await asService
      .from("products")
      .select("id")
      .eq("store_id", storeId)
      .order("created_at", { ascending: true })
      .limit(1);
    return row.data?.[0]?.id;
  };

  for (const plan of [stores.A, stores.B]) {
    const productId = await firstProduct(plan.id);
    let seeded = 0;
    for (let index = 0; index < plan.orders; index += 1) {
      const result = await asAnon.rpc("record_order", {
        p_store_id: plan.id,
        p_customer: {
          name: `Dash${plan.key} Cliente ${index + 1}`,
          phone: seedPhones[plan.key][index],
          neighborhood: "Centro",
        },
        p_lines: [{ productId, qty: 1 + (index % 3), options: [] }],
        p_payment: "cash",
      });
      if (!result.error && typeof result.data === "string") seeded += 1;
      else bad(`loja ${plan.key}: encomenda ${index + 1} criada`, errorDetail(result));
    }
    assert(`loja ${plan.key}: ${plan.orders} encomendas semeadas`, seeded === plan.orders, `${seeded}/${plan.orders}`);
  }

  // ── 2. Verdade da base (service role) por loja ───────────────────────────
  const dbTruth = {};
  for (const plan of [stores.A, stores.B, stores.C]) {
    const products = await asService
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("store_id", plan.id);
    const orders = await asService
      .from("orders")
      .select("customer_phone")
      .eq("store_id", plan.id);
    const phones = new Set((orders.data ?? []).map((row) => row.customer_phone));
    dbTruth[plan.key] = {
      products: products.count ?? -1,
      orders: (orders.data ?? []).length,
      customers: phones.size,
    };
    assert(
      `base: loja ${plan.key} = ${plan.products}/${plan.orders}/${plan.customers} (verdade)`,
      dbTruth[plan.key].products === plan.products &&
        dbTruth[plan.key].orders === plan.orders &&
        dbTruth[plan.key].customers === plan.customers,
      JSON.stringify(dbTruth[plan.key]),
    );
  }

  // ── 3. Sessão real (password grant) → cookie no formato do ssr ──────────
  const tokenResponse = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "content-type": "application/json", apikey: ANON_KEY },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const session = await tokenResponse.json();
  assert(
    "sessão obtida (grant de palavra-passe)",
    !!session.access_token && !!session.refresh_token,
    `HTTP ${tokenResponse.status} ${JSON.stringify(session).slice(0, 160)}`,
  );
  const baseCookie = authCookie(session);
  const cookieFor = (store) => `${baseCookie}; ${ACTIVE_STORE_COOKIE}=${store.id}`;

  // ── 4. Descobrir o host que serve o código NOVO ─────────────────────────
  // Marcador duplo: nome da loja A no card + ABSENCIA do placeholder
  // antigo (código velho mostra "Available in a later phase").
  // DASH_HOST=http://localhost:3113 força um host (teste local).
  const hosts = process.env.DASH_HOST
    ? [process.env.DASH_HOST]
    : ["https://elicani.site", "https://app.elicani.site"];
  let host = null;
  for (let attempt = 0; attempt < 3 && !host; attempt += 1) {
    for (const candidate of hosts) {
      let probe;
      try {
        probe = await req(`${candidate}/app`, { cookie: cookieFor(stores.A) });
      } catch {
        continue;
      }
      if (
        probe.status === 200 &&
        probe.text.includes("Dash Loja A") &&
        !probe.text.includes("Available in a later phase")
      ) {
        host = candidate;
        break;
      }
    }
    if (!host && attempt < 2) await sleep(30_000);
  }
  assert(
    "host com o código novo responde 200 e mostra os dados reais",
    !!host,
    `hosts testados: ${hosts.join(", ")} (corra após o deploy)`,
  );
  if (!host) throw new Error("sem host com o código novo");

  const page = (p) => `${host}${p}`;
  const fetchSummary = async (store) => {
    const response = await req(page("/app"), { cookie: cookieFor(store) });
    return { ...response, values: summaryValues(response.text) };
  };
  const expectSummary = (label, response, expected) =>
    assert(
      label,
      response.status === 200 &&
        response.values.length === 3 &&
        response.values.every((value, index) => value === expected[index]),
      `HTTP ${response.status} valores=[${response.values}] esperado=[${expected}]`,
    );

  // ── 5. Loja ATIVA = A → 3/2/1 e bat certo com páginas e base ────────────
  const dashA = await fetchSummary(stores.A);
  expectSummary("dashboard (loja A ativa): 3 produtos / 2 encomendas / 1 cliente", dashA, [
    dbTruth.A.products,
    dbTruth.A.orders,
    dbTruth.A.customers,
  ]);
  assert(
    "placeholder 'Available in a later phase' eliminado do dashboard",
    !dashA.text.includes("Available in a later phase"),
    "placeholder ainda presente",
  );
  assert(
    "card da loja ativa intacto (nome + morada)",
    dashA.text.includes("Dash Loja A") && dashA.text.includes(stores.A.slug),
    "card da loja não renderizou",
  );

  const productsA = await req(page("/app/products"), { cookie: cookieFor(stores.A) });
  assert(
    "página de produtos (A): 200 + 3 linhas — igual ao dashboard",
    productsA.status === 200 && countLinks(productsA.text, PRODUCT_LINKS) === 3,
    `HTTP ${productsA.status} linhas=${countLinks(productsA.text, PRODUCT_LINKS)}`,
  );
  assert(
    "página de produtos (A): NADA da loja B (isolamento)",
    !productsA.text.includes("DashB Prod"),
    "produto da loja B apareceu na página da loja A",
  );

  const ordersA = await req(page("/app/orders"), { cookie: cookieFor(stores.A) });
  assert(
    "página de encomendas (A): 200 + 2 linhas — igual ao dashboard",
    ordersA.status === 200 && countLinks(ordersA.text, ORDER_LINKS) === 2,
    `HTTP ${ordersA.status} linhas=${countLinks(ordersA.text, ORDER_LINKS)}`,
  );

  const customersA = await req(page("/app/customers"), { cookie: cookieFor(stores.A) });
  assert(
    "página de clientes (A): 200 + 1 linha — igual ao dashboard",
    customersA.status === 200 && countLinks(customersA.text, CUSTOMER_LINKS) === 1,
    `HTTP ${customersA.status} linhas=${countLinks(customersA.text, CUSTOMER_LINKS)}`,
  );

  // ── 6. Trocar para a loja B → 7/5/4 (sem agregado, sem estado velho) ────
  const dashB = await fetchSummary(stores.B);
  expectSummary("dashboard (loja B ativa): 7 produtos / 5 encomendas / 4 clientes", dashB, [
    dbTruth.B.products,
    dbTruth.B.orders,
    dbTruth.B.customers,
  ]);
  assert(
    "dashboard (B): card mostra a loja B, não a A",
    dashB.text.includes("Dash Loja B") && !dashB.text.includes("Dash Loja A"),
    "card da loja errado",
  );

  const productsB = await req(page("/app/products"), { cookie: cookieFor(stores.B) });
  const ordersB = await req(page("/app/orders"), { cookie: cookieFor(stores.B) });
  const customersB = await req(page("/app/customers"), { cookie: cookieFor(stores.B) });
  assert(
    "páginas da loja B: 7 produtos / 5 encomendas / 4 clientes — iguais ao dashboard",
    productsB.status === 200 &&
      countLinks(productsB.text, PRODUCT_LINKS) === 7 &&
      ordersB.status === 200 &&
      countLinks(ordersB.text, ORDER_LINKS) === 5 &&
      customersB.status === 200 &&
      countLinks(customersB.text, CUSTOMER_LINKS) === 4,
    `prod=${countLinks(productsB.text, PRODUCT_LINKS)} enc=${countLinks(ordersB.text, ORDER_LINKS)} cli=${countLinks(customersB.text, CUSTOMER_LINKS)}`,
  );

  // ── 7. Voltar a A → 3/2/1 (sem estado obsoleto) + refresh ───────────────
  const dashA2 = await fetchSummary(stores.A);
  expectSummary("dashboard (volta a A): 3/2/1 outra vez", dashA2, [3, 2, 1]);
  const dashA3 = await fetchSummary(stores.A);
  expectSummary("dashboard (refresh de A): valores preservados", dashA3, [3, 2, 1]);

  // ── 8. Loja C vazia → 0/0/0 é DADO REAL, não "funcionalidade" ──────────
  const dashC = await fetchSummary(stores.C);
  expectSummary("dashboard (loja C vazia): 0/0/0", dashC, [0, 0, 0]);
  assert(
    "loja vazia: sem placeholder de 'fase posterior'",
    !dashC.text.includes("Available in a later phase"),
    "placeholder presente com zero real",
  );

  const productsC = await req(page("/app/products"), { cookie: cookieFor(stores.C) });
  const ordersC = await req(page("/app/orders"), { cookie: cookieFor(stores.C) });
  const customersC = await req(page("/app/customers"), { cookie: cookieFor(stores.C) });
  assert(
    "loja vazia: páginas correspondentes também vazias (0 linhas)",
    productsC.status === 200 &&
      countLinks(productsC.text, PRODUCT_LINKS) === 0 &&
      ordersC.status === 200 &&
      countLinks(ordersC.text, ORDER_LINKS) === 0 &&
      customersC.status === 200 &&
      countLinks(customersC.text, CUSTOMER_LINKS) === 0,
    `prod=${countLinks(productsC.text, PRODUCT_LINKS)} enc=${countLinks(ordersC.text, ORDER_LINKS)} cli=${countLinks(customersC.text, CUSTOMER_LINKS)}`,
  );

  // ── 9. Restantes secções do dashboard continuam intactas ────────────────
  for (const target of ["/app/reports", "/app/delivery"]) {
    const response = await req(page(target), { cookie: cookieFor(stores.A) });
    assert(`${target}: 200 (secção existente intacta)`, response.status === 200, `${response.status}`);
  }
} catch (error) {
  failed += 1;
  console.error(`\n\x1b[1;31m[dash]\x1b[0m erro inesperado: ${error.message}`);
} finally {
  // ── 10. Limpeza total (cascata: utilizador → 3 lojas → dados) ───────────
  if (userId) {
    const removed = await asService.auth.admin.deleteUser(userId);
    if (removed.error) bad("limpeza: utilizador removido", errorDetail(removed));
    else {
      ok("limpeza: utilizador removido");
      const leftover = await asService
        .from("stores")
        .select("id")
        .like("slug", `dash-%-${RUN_ID}`)
        .limit(5);
      assert(
        "limpeza: 3 lojas e dados em cascata",
        (leftover.data ?? []).length === 0,
        errorDetail(leftover),
      );
    }
  }
}

console.log(
  `\n\x1b[1;32m[dash]\x1b[0m ${passed} verificação(ões) ok, ${failed} falha(s)\n`,
);
process.exit(failed > 0 ? 1 : 0);
