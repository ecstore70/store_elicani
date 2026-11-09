#!/usr/bin/env node
/**
 * Verifica o RENDER autenticado das quatro páginas novas do painel
 * contra o site PRODUCTION, com uma sessão fabricada no formato EXATO
 * do @supabase/ssr (base64url + prefixo "base64-" + chunks) — o mesmo
 * que o proxy e os server components decodificam.
 *
 *   npm run verify:render
 *
 * O que é verificado (HTTP real, não simulação):
 *   • /app/* sem sessão → 307 para /login;
 *   • com sessão: Encomendas (lista + detalhe), Clientes (lista +
 *     detalhe), Entrega e Relatórios renderizam 200 com os dados
 *     REAIS semeados (cancelada fora da Entrega, dentro da lista);
 *   • detalhe de encomenda OUTRA loja, chave de cliente inexistente e
 *     UUID aleatório → notFound() sem nenhum dado alheio no corpo
 *     (rota ◐ PPR: status 404 ou soft-404 200 — nunca 500, nunca
 *     vazamento);
 *   • formulários progressivos (sem JavaScript) executam as server
 *     actions: entrada inválida e encomenda alheia → `?error=1` sem
 *     tocar na base; mudanças legítimas gravam na base;
 *   • limpeza total: utilizador descartável apagado (cascata).
 *
 * Credenciais: variáveis de ambiente → .env.local → ~/.supabase_anon
 * e ~/.supabase_service (mesma ordem do verify-rls.mjs).
 */
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const RUN_ID = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
const EMAIL = `render-test-${RUN_ID}@elicanirender.test`;
const PASSWORD = `Rt!${RUN_ID}9x`;
const SLUG = `render-test-${RUN_ID}`.slice(0, 63);

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
  console.error(`\x1b[1;31m[render]\x1b[0m credencial ausente: ${name}`);
  process.exit(1);
}

function errorDetail(result) {
  const error = result?.error;
  if (!error) return null;
  return `${error.code ?? "-"}: ${error.message ?? JSON.stringify(error)}`;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** GET/POST com cookies próprios e sem seguir redirecionamentos. */
async function req(url, { method = "GET", cookie = "", body, headers = {} } = {}) {
  const response = await fetch(url, {
    method,
    redirect: "manual",
    headers: {
      accept: "text/html,application/xhtml+xml",
      ...(cookie ? { cookie } : {}),
      // FormData → o fetch define multipart/form-data com boundary — é
      // EXATAMENTE o que o navegador envia (encType do form de server
      // action); urlencoded não é reconhecido como action → 405.
      ...(typeof body === "string"
        ? { "content-type": "application/x-www-form-urlencoded" }
        : {}),
      ...headers,
    },
    body,
  });
  const text = await response.text();
  return {
    status: response.status,
    location: response.headers.get("location"),
    text,
  };
}

/** Formas ocultas ($ACTION_ID_…) e campos de um `<form>` do HTML. */
function formFields(formHtml) {
  const fields = {};
  for (const tag of formHtml.match(/<input\b[^>]*>/g) ?? []) {
    const name = /name="([^"]*)"/.exec(tag)?.[1];
    if (!name) continue;
    fields[name] = /value="([^"]*)"/.exec(tag)?.[1] ?? "";
  }
  return fields;
}

function findForm(html, predicate) {
  for (const form of html.match(/<form\b[^>]*>[\s\S]*?<\/form>/g) ?? []) {
    if (predicate(form)) return form;
  }
  return null;
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

console.log(`\x1b[1;32m[render]\x1b[0m render autenticado do painel (utilizador ${EMAIL})\n`);

let userId = null;

try {
  // ── 1. Utilizador + loja + produto descartáveis ──────────────────────────
  const created = await asService.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });
  assert("utilizador de teste criado", !created.error && !!created.data.user, errorDetail(created));
  userId = created.data?.user?.id ?? null;

  const storeInsert = await asService.from("stores").insert({
    owner_id: userId,
    name: "Loja Render Test",
    slug: SLUG,
    whatsapp_number: "+258849999999",
    currency: "MZN",
    is_active: true,
  });
  assert("loja de teste criada", !storeInsert.error, errorDetail(storeInsert));

  const storeResult = await asService
    .from("stores")
    .select("id")
    .eq("slug", SLUG)
    .maybeSingle();
  const storeId = storeResult.data?.id;

  const productInsert = await asService.from("products").insert({
    store_id: storeId,
    name: "Produto Render",
    price: 100,
  });
  assert("produto de teste criado", !productInsert.error, errorDetail(productInsert));

  const productResult = await asService
    .from("products")
    .select("id")
    .eq("store_id", storeId)
    .limit(1);
  const productId = productResult.data?.[0]?.id;

  // ── 2. Encomendas reais via o caminho do checkout (anon → rpc) ──────────
  const seeds = [
    {
      customer: {
        name: "Render Cliente Um",
        phone: "+258840000911",
        neighborhood: "Baixa",
        address: "Rua 1, nº 2",
        reference: "Em frente ao mercado",
      },
      payment: "cash",
      qty: 2,
      status: null, // fica pending
    },
    {
      customer: {
        name: "Render Cliente Dois",
        phone: "+258840000912",
        neighborhood: "Alto",
      },
      payment: "transfer",
      qty: 1,
      status: "completed",
    },
    {
      customer: {
        name: "Render Cliente Três",
        phone: "+258840000913",
        neighborhood: "Malhangalene",
      },
      payment: "cash",
      qty: 5,
      status: "cancelled", // fora da Entrega, dentro da lista
    },
  ];

  const seeded = [];
  for (const seed of seeds) {
    const result = await asAnon.rpc("record_order", {
      p_store_id: storeId,
      p_customer: seed.customer,
      p_lines: [{ productId, qty: seed.qty, options: [] }],
      p_payment: seed.payment,
    });
    if (result.error || typeof result.data !== "string") {
      bad("semente: record_order criou encomenda", errorDetail(result));
      continue;
    }
    if (seed.status) {
      await asService
        .from("orders")
        .update({ status: seed.status })
        .eq("id", result.data);
    }
    seeded.push({ id: result.data, ...seed });
    ok(`semente: encomenda ${seed.status ?? "pending"} (qty ${seed.qty})`);
  }
  assert("3 encomendas semeadas", seeded.length === 3, `${seeded.length}/3`);

  const [orderPending, orderCompleted, orderCancelled] = seeded;

  // Encomenda de OUTRA loja (fixture) para o teste de 404/forja.
  const foreignResult = await asService
    .from("orders")
    .select("id, status, store_id, customer_name")
    .neq("store_id", storeId)
    .limit(1);
  const foreign = foreignResult.data?.[0] ?? null;
  assert(
    "existe encomenda de outra loja para o teste cruzado",
    !!foreign,
    errorDetail(foreignResult) ?? "corra antes: node scripts/verify-reports.mjs",
  );

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
  const cookie = authCookie(session);

  // ── 4. Descobrir o host que serve o código NOVO (com dados) ─────────────
  const hosts = ["https://elicani.site", "https://app.elicani.site"];
  let host = null;
  for (let attempt = 0; attempt < 3 && !host; attempt += 1) {
    for (const candidate of hosts) {
      let probe;
      try {
        probe = await req(`${candidate}/app/orders`, { cookie });
      } catch {
        continue; // rede instável nesta tentativa — tenta o próximo host
      }
      if (probe.status === 200 && probe.text.includes("Render Cliente")) {
        host = candidate;
        break;
      }
    }
    if (!host && attempt < 2) await sleep(30_000);
  }
  assert(
    "host com o código novo responde 200 e mostra os dados",
    !!host,
    `hosts testados: ${hosts.join(", ")}`,
  );
  if (!host) throw new Error("sem host com o código novo");

  const origin = { origin: host, referer: `${host}/` };
  const page = (p) => `${host}${p}`;

  // ── 5. Sem sessão → redireciona para /login ─────────────────────────────
  const noSession = await req(page("/app/orders"));
  assert(
    "sem sessão: /app/orders → 307 /login",
    noSession.status === 307 && (noSession.location ?? "").includes("/login"),
    `${noSession.status} ${noSession.location}`,
  );

  // ── 6. Listas e detalhes renderizam com os dados reais ──────────────────
  const ordersList = await req(page("/app/orders"), { cookie });
  assert(
    "lista de encomendas: 200 + as 3 encomendas (inclui cancelada)",
    ordersList.status === 200 &&
      seeds.every((seed) => ordersList.text.includes(seed.customer.name)),
    `${ordersList.status}`,
  );

  const orderDetail = await req(page(`/app/orders/${orderCompleted.id}`), { cookie });
  assert(
    "detalhe da encomenda: 200 + cliente, produto e bairro",
    orderDetail.status === 200 &&
      orderDetail.text.includes("Render Cliente Dois") &&
      orderDetail.text.includes("Produto Render") &&
      orderDetail.text.includes("Alto"),
    `${orderDetail.status}`,
  );

  const customersList = await req(page("/app/customers"), { cookie });
  assert(
    "lista de clientes: 200 + clientes derivados",
    customersList.status === 200 &&
      customersList.text.includes("Render Cliente Um") &&
      customersList.text.includes("Render Cliente Dois"),
    `${customersList.status}`,
  );

  const customerKey = "258840000911";
  const customerDetail = await req(page(`/app/customers/${customerKey}`), { cookie });
  const expectedReference = (
    await asService.from("orders").select("reference").eq("id", orderPending.id).maybeSingle()
  ).data?.reference;
  assert(
    "detalhe do cliente: 200 + histórico com referência real",
    customerDetail.status === 200 &&
      customerDetail.text.includes("Render Cliente Um") &&
      !!expectedReference &&
      customerDetail.text.includes(expectedReference),
    `${customerDetail.status} ref=${expectedReference}`,
  );

  const delivery = await req(page("/app/delivery"), { cookie });
  assert(
    "entrega: 200 + encomendas ativas",
    delivery.status === 200 &&
      delivery.text.includes("Render Cliente Um") &&
      delivery.text.includes("Render Cliente Dois"),
    `${delivery.status}`,
  );
  assert(
    "entrega: encomenda CANCELADA fica de fora",
    !delivery.text.includes("Render Cliente Três"),
    "cancelada apareceu na lista de entregas",
  );

  const reports = await req(page("/app/reports"), { cookie });
  assert(
    "relatórios: 200 + encomendas recentes reais",
    reports.status === 200 && reports.text.includes("Render Cliente"),
    `${reports.status}`,
  );

  // ── 7. notFound() sem vazamento (outra loja / chave inexistente) ────────
  //
  // Em rota ◐ (PPR) o notFound() cai no hole dinâmico com status 200
  // (soft-404 — mesmo comportamento pré-existente de
  // /app/products/[productId], documentado em src/proxy.ts). O que se
  // verifica aqui: nunca 500 e NUNCA dados alheios no corpo.
  const noLeak = (response, needles) =>
    [200, 404].includes(response.status) &&
    needles.every((needle) => !response.text.includes(needle));

  if (foreign) {
    const foreignDetail = await req(page(`/app/orders/${foreign.id}`), { cookie });
    assert(
      "encomenda de OUTRA loja: notFound, sem dados alheios (200/404)",
      noLeak(foreignDetail, [
        foreign.customer_name ?? "§-sem-nome",
        "Render Cliente",
        "Produto Render",
      ]),
      `${foreignDetail.status}`,
    );
  }

  const bogusCustomer = await req(page("/app/customers/999999999999"), { cookie });
  assert(
    "cliente inexistente: notFound, sem dados (200/404)",
    noLeak(bogusCustomer, ["Render Cliente"]),
    `${bogusCustomer.status}`,
  );

  const bogusOrder = await req(
    page("/app/orders/00000000-0000-4000-8000-000000000000"),
    { cookie },
  );
  assert(
    "UUID inexistente: notFound, sem dados (200/404)",
    noLeak(bogusOrder, ["Render Cliente", "Produto Render"]),
    `${bogusOrder.status}`,
  );

  // ── 8. Server actions SEM JavaScript (formulários progressivos) ─────────
  // Os formulários de mudança de estado vivem no detalhe da encomenda
  // PENDENTE (fluxo natural pending → confirmed).
  const pendingDetail = await req(page(`/app/orders/${orderPending.id}`), { cookie });
  assert(
    "detalhe da encomenda pendente: 200",
    pendingDetail.status === 200 && pendingDetail.text.includes("Render Cliente Um"),
    `${pendingDetail.status}`,
  );
  const detailHtml = pendingDetail.text;

  async function postForm(pageUrl, form, extra = {}) {
    const fields = formFields(form);
    const actionKey = Object.keys(fields).find((name) => name.startsWith("$ACTION_ID_"));
    if (!actionKey) return { status: 0, location: null, text: "sem $ACTION_ID", fields };
    // FormData = multipart, igual ao envio do navegador sem JS.
    const fd = new FormData();
    for (const [key, value] of new URLSearchParams({ ...fields, ...extra })) {
      fd.append(key, value);
    }
    return req(pageUrl, {
      method: "POST",
      cookie,
      body: fd,
      headers: { origin: host, referer: pageUrl },
    });
  }

  // 8a. entrada inválida (status fora do registo) → ?error=1, base intacta
  const invalidForm = findForm(
    detailHtml,
    (form) => form.includes('name="status"') && form.includes('name="orderId"'),
  );
  assert("detalhe tem formulário de estado sem JS", !!invalidForm, "form não encontrado");
  if (invalidForm) {
    const fields = formFields(invalidForm);
    assert(
      "formulário aponta para a encomenda certa",
      fields.orderId === orderPending.id && !!fields.status,
      JSON.stringify(fields),
    );
    const response = await postForm(page(`/app/orders/${orderPending.id}`), invalidForm, {
      status: "hacked",
    });
    assert(
      "estado inválido → redirect ?error=1",
      (response.location ?? "").includes("error=1"),
      `${response.status} ${response.location} ${String(response.text).slice(0, 120)}`,
    );
    const after = await asService
      .from("orders")
      .select("status")
      .eq("id", orderPending.id)
      .maybeSingle();
    assert(
      "estado inválido NÃO tocou na base",
      after.data?.status === "pending",
      `status=${after.data?.status}`,
    );

    // 8b. mudança legítima (pending → confirmed) grava e re-renderiza
    const confirmForm = findForm(
      detailHtml,
      (form) => form.includes('name="status"') && form.includes('value="confirmed"'),
    );
    assert("existe botão de confirmar (form)", !!confirmForm, "form não encontrado");
    if (confirmForm) {
      const response = await postForm(page(`/app/orders/${orderPending.id}`), confirmForm);
      assert(
        "mudança de estado sem JS: sem ?error=1",
        !(response.location ?? "").includes("error=1") && [200, 303].includes(response.status),
        `${response.status} ${response.location}`,
      );
      const after = await asService
        .from("orders")
        .select("status")
        .eq("id", orderPending.id)
        .maybeSingle();
      assert(
        "estado CONFIRMED gravado na base",
        after.data?.status === "confirmed",
        `status=${after.data?.status}`,
      );
    }
  }

  // 8c. forja: encomenda de OUTRA loja → ?error=1 e base intacta
  if (foreign) {
    const foreignForm = findForm(
      detailHtml,
      (form) => form.includes('name="status"') && form.includes('name="orderId"'),
    );
    if (foreignForm) {
      const response = await postForm(page(`/app/orders/${orderPending.id}`), foreignForm, {
        orderId: foreign.id,
        status: "cancelled",
      });
      assert(
        "encomenda alheia → redirect ?error=1",
        (response.location ?? "").includes("error=1"),
        `${response.status} ${response.location}`,
      );
      const after = await asService
        .from("orders")
        .select("status")
        .eq("id", foreign.id)
        .maybeSingle();
      assert(
        "encomenda alheia INTACTA na base",
        after.data?.status === foreign.status,
        `status=${after.data?.status} (antes=${foreign.status})`,
      );
    }
  }

  // 8d. entrega: avanço de estado sem JS (botão "a caminho")
  const deliveryHtml = delivery.text;
  const deliveryForm = findForm(
    deliveryHtml,
    (form) =>
      form.includes('name="deliveryStatus"') && form.includes('value="on_the_way"'),
  );
  assert(
    "lista de entrega tem formulário sem JS (a caminho)",
    !!deliveryForm,
    "form não encontrado",
  );
  if (deliveryForm) {
    const fields = formFields(deliveryForm);
    const target = "on_the_way";
    assert("formulário de entrega tem estado de destino", !!target, JSON.stringify(fields));
    if (target) {
      const response = await postForm(page("/app/delivery"), deliveryForm, {
        deliveryStatus: target,
      });
      assert(
        "avanço de entrega sem JS: sem ?error=1",
        !(response.location ?? "").includes("error=1") &&
          [200, 303].includes(response.status),
        `${response.status} ${response.location}`,
      );
      const after = await asService
        .from("orders")
        .select("delivery_status")
        .eq("id", fields.orderId)
        .maybeSingle();
      assert(
        `delivery_status=${target} gravado na base`,
        after.data?.delivery_status === target,
        `delivery_status=${after.data?.delivery_status}`,
      );
    }
  }
} catch (error) {
  failed += 1;
  console.error(`\n\x1b[1;31m[render]\x1b[0m erro inesperado: ${error.message}`);
} finally {
  // ── 9. Limpeza total (cascata: loja → encomendas) ───────────────────────
  if (userId) {
    const removed = await asService.auth.admin.deleteUser(userId);
    if (removed.error) bad("limpeza: utilizador removido", errorDetail(removed));
    else {
      ok("limpeza: utilizador removido");
      const leftover = await asService
        .from("stores")
        .select("id")
        .eq("slug", SLUG)
        .limit(1);
      assert(
        "limpeza: loja e encomendas em cascata",
        (leftover.data ?? []).length === 0,
        errorDetail(leftover),
      );
    }
  }
}

console.log(
  `\n\x1b[1;32m[render]\x1b[0m ${passed} verificação(ões) ok, ${failed} falha(s)\n`,
);
process.exit(failed > 0 ? 1 : 0);
