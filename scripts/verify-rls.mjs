#!/usr/bin/env node
/**
 * Verifica o isolamento multi-tenant (RLS) contra o projeto Supabase REAL.
 *
 *   npm run test:rls
 *
 * O que é verificado (não é simulação: usa o Postgres de produção):
 *   • lojista A cria/lê/atualiza a loja A e o lojista B o equivalente;
 *   • B NÃO lê nem atualiza a loja A (nem por UUID direto);
 *   • ninguém cria loja em nome de outro lojista (RLS with check);
 *   • multi-catalog: uma conta cria N lojas; o dono lê/edita as SUAS e os
 *     outros lojistas não leem nenhuma (RLS por linha);
 *   • produtos e FAQ ficam associados à loja certa dentro da conta;
 *   • slug é único entre lojistas (UNIQUE slug);
 *   • perfis são privados;
 *   • anônimo lê apenas lojas ATIVAS e nunca escreve;
 *   • encomendas são idempotentes por token, os campos comerciais ficam
 *     congelados após a criação (trigger) e eventos anónimos são isolados
 *     por loja (escrita só via RPC, leitura só do dono);
 *   • o bucket de logos aceita escrita só na pasta do próprio lojista.
 *
 * Credenciais (nesta ordem):
 *   1. variáveis de ambiente
 *   2. .env.local
 *   3. ~/.supabase_anon  e  ~/.supabase_service   (arquivos de uma linha)
 *
 * Os utilizadores de teste são APAGADOS no fim (mesmo com falha).
 */
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const RUN_ID = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
const SLUG_A = `rls-a-${RUN_ID}`.slice(0, 63);
const SLUG_B = `rls-b-${RUN_ID}`.slice(0, 63);

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

  console.error(`\x1b[1;31m[rls]\x1b[0m credencial ausente: ${name} (ou ${homeFile})`);
  process.exit(1);
}

function errorDetail(result) {
  const error = result?.error;
  if (!error) return null;
  return `${error.code ?? "-"}: ${error.message ?? JSON.stringify(error)}`;
}

async function admin(pathname, init) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1${pathname}`, {
    ...init,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`admin ${pathname} → HTTP ${response.status}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

await loadEnv();

const URL_BASE = secret("NEXT_PUBLIC_SUPABASE_URL", ".supabase_anon");
process.env.NEXT_PUBLIC_SUPABASE_URL = URL_BASE;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = secret("NEXT_PUBLIC_SUPABASE_ANON_KEY", ".supabase_anon");
process.env.SUPABASE_SERVICE_ROLE_KEY = secret("SUPABASE_SERVICE_ROLE_KEY", ".supabase_service");

const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const createdUsers = [];

console.log(`\x1b[1;32m[rls]\x1b[0m verificação de isolamento multi-tenant\n`);

try {
  // ── 1. Três lojistas de teste (e-mail já confirmado) ─────────────────────
  // A e B criam loja; C fica sem loja de propósito — para testar o
  // `with check` da RLS em si (sem nenhuma linha de C no caminho).
  const email = (letter) => `rls-${letter}-${RUN_ID}@elicani.test`;
  const password = "TestOnly!12345";

  for (const letter of ["a", "b", "c"]) {
    const user = await admin("/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email: email(letter),
        password,
        email_confirm: true,
      }),
    });
    createdUsers.push(user.id);
  }
  ok(`criados 3 lojistas de teste (${createdUsers.length} ids)`);

  // ── 2. Sessões reais de cada lojista (JWT via anon key) ──────────────────
  const sessions = {};
  for (const letter of ["a", "b", "c"]) {
    const client = createClient(URL_BASE, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.signInWithPassword({
      email: email(letter),
      password,
    });
    assert(`login do lojista ${letter.toUpperCase()}`, !error && !!data.session, errorDetail({ error }));
    sessions[letter] = data.session;
  }

  // Cliente que emula cada lojista autenticado (todas as queries levam o JWT).
  const asUser = (letter) =>
    createClient(URL_BASE, anonKey, {
      global: { headers: { Authorization: `Bearer ${sessions[letter].access_token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

  // Cliente anônimo — o mesmo que usa a vitrine pública.
  const asAnon = createClient(URL_BASE, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const A = asUser("a");
  const B = asUser("b");
  const C = asUser("c");

  // ── 3. Criação de lojas ──────────────────────────────────────────────────
  // A cria com país=MZ, idioma=en e moeda=USD: prova que são INDEPENDENTES.
  const storeA = {
    owner_id: createdUsers[0],
    name: "Lojista A",
    slug: SLUG_A,
    country: "MZ",
    language: "en",
    currency: "USD",
    whatsapp_number: "+258840000001",
  };
  const storeB = {
    owner_id: createdUsers[1],
    name: "Lojista B",
    slug: SLUG_B,
    country: "BR",
    language: "pt-BR",
    currency: "BRL",
    whatsapp_number: "+5511900000002",
  };

  const insertA = await A.from("stores").insert(storeA).select("id").single();
  assert("A cria a loja A", !insertA.error && !!insertA.data, errorDetail(insertA));

  const insertB = await B.from("stores").insert(storeB).select("id").single();
  assert("B cria a loja B", !insertB.error && !!insertB.data, errorDetail(insertB));

  const idA = insertA.data?.id;
  const idB = insertB.data?.id;

  const readOwnA = await A.from("stores").select("*").eq("id", idA).maybeSingle();
  assert("A lê a própria loja", !!readOwnA.data, errorDetail(readOwnA));

  const updateA = await A.from("stores").update({ name: "Lojista A editada" }).eq("id", idA).select("id");
  assert("A atualiza a própria loja", !updateA.error && updateA.data?.length === 1, errorDetail(updateA));

  const updateB = await B.from("stores").update({ name: "Lojista B editada" }).eq("id", idB).select("id");
  assert("B atualiza a própria loja", !updateB.error && updateB.data?.length === 1, errorDetail(updateB));

  // ── 4. Isolamento entre lojistas ─────────────────────────────────────────
  const crossRead = await A.from("stores").select("id, name, owner_id").eq("id", idB);
  assert(
    "A NÃO lê a loja B (por UUID direto)",
    !crossRead.error && crossRead.data?.length === 0,
    `linhas devolvidas: ${JSON.stringify(crossRead.data)} ${errorDetail(crossRead) ?? ""}`,
  );

  const crossUpdate = await A.from("stores").update({ name: "INVADIDA" }).eq("id", idB).select("id");
  assert(
    "A NÃO atualiza a loja B",
    !crossUpdate.error && crossUpdate.data?.length === 0,
    `linhas afetadas: ${JSON.stringify(crossUpdate.data)}`,
  );

  const crossDelete = await B.from("stores").delete().eq("id", idA);
  assert(
    "B NÃO apaga a loja A",
    !crossDelete.error,
    errorDetail(crossDelete),
  );
  const stillThere = await A.from("stores").select("id").eq("id", idA).maybeSingle();
  assert("a loja A continua existente", !!stillThere.data);

  // C ainda não tem loja: isto mede o `with check (auth.uid() = owner_id)`
  // da RLS em si — nenhuma restrição de esquema fica no caminho.
  const stealOwner = await C.from("stores").insert({
    ...storeA,
    owner_id: createdUsers[0],
    slug: `steal-${SLUG_A}`,
  });
  assert(
    "C NÃO cria loja em nome de A (RLS with check)",
    !!stealOwner.error && stealOwner.error.code === "42501",
    errorDetail(stealOwner),
  );

  const cReadsA = await C.from("stores").select("id, name, owner_id").eq("id", idA);
  assert(
    "C (sem loja) NÃO lê a loja A",
    !cReadsA.error && cReadsA.data?.length === 0,
    `linhas devolvidas: ${JSON.stringify(cReadsA.data)}`,
  );

  // ── 4b. Multi-catalog: uma conta → N lojas ──────────────────────────────
  // A Fase 1 tinha UNIQUE em owner_id; a migração multi-catalog removeu-o.
  // O dono cria uma SEGUNDA loja e o isolamento continua por linha: os
  // outros lojistas não leem nenhuma das duas; produtos e FAQ ficam
  // associados à loja certa dentro da mesma conta.
  const secondStore = await A.from("stores")
    .insert({ ...storeA, name: "Lojista A 2", slug: `${SLUG_A}-2` })
    .select("id")
    .single();
  assert(
    "A cria uma segunda loja (multi-catalog)",
    !secondStore.error && !!secondStore.data,
    errorDetail(secondStore),
  );
  const idA2 = secondStore.data?.id;

  const ownStoresA = await A.from("stores").select("id").eq("owner_id", createdUsers[0]);
  assert(
    "A lê as SUAS duas lojas",
    !ownStoresA.error && ownStoresA.data?.length === 2,
    `linhas: ${JSON.stringify(ownStoresA.data)} ${errorDetail(ownStoresA) ?? ""}`,
  );

  const crossReadA2 = await B.from("stores").select("id").eq("id", idA2);
  assert(
    "B NÃO lê a segunda loja de A (por UUID direto)",
    !crossReadA2.error && crossReadA2.data?.length === 0,
    `linhas devolvidas: ${JSON.stringify(crossReadA2.data)} ${errorDetail(crossReadA2) ?? ""}`,
  );

  const crossUpdateA2 = await B.from("stores").update({ name: "INVADIDA" }).eq("id", idA2).select("id");
  assert(
    "B NÃO atualiza a segunda loja de A",
    !crossUpdateA2.error && crossUpdateA2.data?.length === 0,
    `linhas afetadas: ${JSON.stringify(crossUpdateA2.data)}`,
  );

  const renameA2 = await A.from("stores").update({ name: "Lojista A 2 editada" }).eq("id", idA2).select("id");
  assert(
    "A atualiza a segunda loja",
    !renameA2.error && renameA2.data?.length === 1,
    errorDetail(renameA2),
  );
  const firstNameA = await A.from("stores").select("name").eq("id", idA).maybeSingle();
  assert(
    "a primeira loja de A fica intacta ao editar a segunda",
    firstNameA.data?.name === "Lojista A editada",
    `nome: ${firstNameA.data?.name} ${errorDetail(firstNameA) ?? ""}`,
  );

  const productA2 = await A.from("products")
    .insert({
      store_id: idA2,
      category_id: null,
      name: `Produto A2 ${RUN_ID}`,
      price: 50,
      is_featured: false,
    })
    .select("id, store_id")
    .single();
  assert(
    "A cria produto na segunda loja",
    !productA2.error && !!productA2.data && productA2.data.store_id === idA2,
    errorDetail(productA2),
  );

  const a2Products = await A.from("products").select("id").eq("store_id", idA2);
  assert(
    "a segunda loja tem o SEU produto",
    !a2Products.error && a2Products.data?.length === 1,
    errorDetail(a2Products),
  );

  const crossProductsA2 = await B.from("products").select("id").eq("store_id", idA2);
  assert(
    "B NÃO vê os produtos da segunda loja de A",
    !crossProductsA2.error && crossProductsA2.data?.length === 0,
    errorDetail(crossProductsA2),
  );

  const faqA2 = await A.from("store_faq_items")
    .insert({
      store_id: idA2,
      question: `Pergunta A2 ${RUN_ID}?`,
      answer: "Resposta de teste.",
      sort_order: 0,
    })
    .select("id")
    .single();
  assert(
    "A cria FAQ na segunda loja",
    !faqA2.error && !!faqA2.data,
    errorDetail(faqA2),
  );

  const faqInA1 = await A.from("store_faq_items").select("id").eq("store_id", idA);
  const faqInA2 = await A.from("store_faq_items").select("id").eq("store_id", idA2);
  assert(
    "FAQ fica na loja certa (A2 tem a sua; A1 fica sem)",
    !faqInA1.error && !faqInA2.error &&
      faqInA1.data?.length === 0 && faqInA2.data?.length === 1,
    `A1=${JSON.stringify(faqInA1.data)} A2=${JSON.stringify(faqInA2.data)}`,
  );

  const crossFaqA2 = await B.from("store_faq_items").select("id").eq("store_id", idA2);
  assert(
    "B NÃO lê o FAQ da segunda loja de A",
    !crossFaqA2.error && crossFaqA2.data?.length === 0,
    errorDetail(crossFaqA2),
  );

  // Limpeza: a segunda loja sai daqui (o cascata remove produto e FAQ
  // dela) — o resto da suíte continua a medir o caso de UMA loja por
  // conta, como na Fase 1.
  const cleanupA2 = await A.from("stores").delete().eq("id", idA2).select("id");
  assert(
    "A apaga a segunda loja (limpeza multi-catalog)",
    !cleanupA2.error && cleanupA2.data?.length === 1,
    errorDetail(cleanupA2),
  );

  const duplicateSlug = await B.from("stores").insert({ ...storeB, slug: SLUG_A });
  assert(
    "B NÃO reusa o slug da loja A (UNIQUE slug)",
    !!duplicateSlug.error && duplicateSlug.error.code === "23505",
    errorDetail(duplicateSlug),
  );

  // ── 5. Perfis são privados ───────────────────────────────────────────────
  const profileRead = await A.from("profiles").select("id").eq("id", createdUsers[1]);
  assert(
    "A NÃO lê o perfil de B",
    !profileRead.error && profileRead.data?.length === 0,
    `linhas devolvidas: ${JSON.stringify(profileRead.data)}`,
  );

  const profileUpdate = await A.from("profiles")
    .update({ full_name: "INVADIDO" })
    .eq("id", createdUsers[1])
    .select("id");
  assert(
    "A NÃO atualiza o perfil de B",
    !profileUpdate.error && profileUpdate.data?.length === 0,
    `linhas afetadas: ${JSON.stringify(profileUpdate.data)}`,
  );

  const ownProfile = await A.from("profiles").select("id").eq("id", createdUsers[0]).maybeSingle();
  assert("A lê o próprio perfil", !!ownProfile.data);

  // ── 6. Visitante anônimo (vitrine pública) ──────────────────────────────
  const anonActive = await asAnon.from("stores").select("id, name, slug, currency").eq("id", idA);
  assert(
    "anônimo lê a loja ATIVA (vitrine)",
    !anonActive.error && anonActive.data?.length === 1,
    errorDetail(anonActive),
  );

  // Nota de projeto (não é falha do RLS): a política pública devolve a LINHA
  // inteira de lojas ativas, portanto `owner_id` é visível para quem quiser
  // consultar a API diretamente. O UUID não concede acesso algum (todas as
  // políticas comparam com o próprio auth.uid()), e a aplicação NUNCA o
  // seleciona publicamente — `PublicStore` nem sequer o inclui. Deixar de
  // expor a coluna exige uma view pública dedicada: endurecimento para a
  // Fase 2, fora do escopo daqui.
  const anonPublic = await asAnon
    .from("stores")
    .select("id, name, slug, description, currency, language")
    .eq("id", idA)
    .maybeSingle();
  assert(
    "a consulta pública usa apenas colunas de vitrine",
    !!anonPublic.data && !("owner_id" in anonPublic.data),
    errorDetail(anonPublic),
  );

  const anonWrite = await asAnon
    .from("stores")
    .update({ name: "VANDALIZADA" })
    .eq("id", idA)
    .select("id");
  assert(
    "anônimo NÃO atualiza loja alguma",
    !anonWrite.error && anonWrite.data?.length === 0,
    `linhas afetadas: ${JSON.stringify(anonWrite.data)} ${errorDetail(anonWrite) ?? ""}`,
  );

  const anonInsert = await asAnon.from("stores").insert({ ...storeA, slug: `anon-${SLUG_A}` });
  assert("anônimo NÃO cria loja", !!anonInsert.error, errorDetail(anonInsert));

  // Loja inativa some da vitrine
  await A.from("stores").update({ is_active: false }).eq("id", idA);
  const anonInactive = await asAnon.from("stores").select("id").eq("id", idA);
  assert(
    "anônimo NÃO lê loja INATIVA",
    !anonInactive.error && anonInactive.data?.length === 0,
    `linhas devolvidas: ${JSON.stringify(anonInactive.data)}`,
  );
  await A.from("stores").update({ is_active: true }).eq("id", idA);

  // ── 7. Storage: logos restritos à pasta do lojista ──────────────────────
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  );

  const ownUpload = await A.storage
    .from("store-logos")
    .upload(`${idA}/logo.png`, png, { contentType: "image/png" });
  assert("A envia logo para a pasta da própria loja", !ownUpload.error, errorDetail(ownUpload));

  const foreignUpload = await B.storage
    .from("store-logos")
    .upload(`${idA}/logo.png`, png, { contentType: "image/png" });
  assert(
    "B NÃO envia logo para a pasta da loja A",
    !!foreignUpload.error,
    errorDetail(foreignUpload),
  );

  const anonUpload = await asAnon.storage
    .from("store-logos")
    .upload(`anon/${SLUG_A}.png`, png, { contentType: "image/png" });
  assert("anônimo NÃO envia logo", !!anonUpload.error, errorDetail(anonUpload));

  // ── 8. Catálogo: produtos e categorias isolados por loja ────────────────
  const categoryA = await A.from("categories")
    .insert({ store_id: idA, name: `Cat A ${RUN_ID}` })
    .select("id").single();
  assert("A cria categoria na própria loja", !categoryA.error && !!categoryA.data, errorDetail(categoryA));

  const productA = await A.from("products")
    .insert({
      store_id: idA,
      category_id: categoryA.data?.id ?? null,
      name: `Produto A ${RUN_ID}`,
      price: 100,
      is_featured: true,
    })
    .select("id").single();
  assert("A cria produto na própria loja", !productA.error && !!productA.data, errorDetail(productA));

  // B: leitura cruzada negativa (mesma técnica da secção 4).
  const crossProducts = await B.from("products").select("id, name").eq("id", productA.data?.id);
  assert(
    "B NÃO lê o produto de A (por UUID direto)",
    !crossProducts.error && crossProducts.data?.length === 0,
    `linhas devolvidas: ${JSON.stringify(crossProducts.data)}`,
  );

  const crossCategories = await B.from("categories").select("id, name").eq("id", categoryA.data?.id);
  assert(
    "B NÃO lê a categoria de A",
    !crossCategories.error && crossCategories.data?.length === 0,
    `linhas devolvidas: ${JSON.stringify(crossCategories.data)}`,
  );

  const crossProductUpdate = await B.from("products")
    .update({ name: "INVADIDO" })
    .eq("id", productA.data?.id)
    .select("id");
  assert(
    "B NÃO atualiza o produto de A",
    !crossProductUpdate.error && crossProductUpdate.data?.length === 0,
    `linhas afetadas: ${JSON.stringify(crossProductUpdate.data)}`,
  );

  const crossProductDelete = await B.from("products").delete().eq("id", productA.data?.id);
  assert("B NÃO apaga o produto de A", !crossProductDelete.error, errorDetail(crossProductDelete));

  const crossCategoryDelete = await B.from("categories").delete().eq("id", categoryA.data?.id);
  assert("B NÃO apaga a categoria de A", !crossCategoryDelete.error, errorDetail(crossCategoryDelete));

  // B não injeta produto apontando para a loja A (RLS with check).
  const forgedProduct = await B.from("products").insert({
    store_id: idA,
    name: `Forjado ${RUN_ID}`,
    price: 1,
  });
  assert(
    "B NÃO cria produto na loja A (RLS with check)",
    !!forgedProduct.error && forgedProduct.error.code === "42501",
    errorDetail(forgedProduct),
  );

  const ownProductRead = await A.from("products").select("id").eq("id", productA.data?.id).maybeSingle();
  assert("A lê o próprio produto", !!ownProductRead.data);

  // ── Blocos de conteúdo da página do produto ─────────────────────────────
  const blockA = await A.from("product_page_blocks")
    .insert({
      product_id: productA.data?.id,
      store_id: idA,
      type: "text",
      content: `Olá ${RUN_ID}`,
      sort_order: 0,
    })
    .select("id")
    .single();
  assert(
    "A cria bloco no próprio produto",
    !blockA.error && !!blockA.data,
    errorDetail(blockA),
  );

  const crossBlockRead = await B.from("product_page_blocks")
    .select("id, content")
    .eq("id", blockA.data?.id);
  assert(
    "B NÃO lê o bloco de A (por UUID direto)",
    !crossBlockRead.error && crossBlockRead.data?.length === 0,
    `linhas devolvidas: ${JSON.stringify(crossBlockRead.data)}`,
  );

  const crossBlockUpdate = await B.from("product_page_blocks")
    .update({ content: "INVADIDO" })
    .eq("id", blockA.data?.id)
    .select("id");
  assert(
    "B NÃO atualiza o bloco de A",
    !crossBlockUpdate.error && crossBlockUpdate.data?.length === 0,
    `linhas afetadas: ${JSON.stringify(crossBlockUpdate.data)}`,
  );

  const forgedBlock = await B.from("product_page_blocks").insert({
    product_id: productA.data?.id,
    store_id: idA,
    type: "text",
    content: "Forjado",
    sort_order: 1,
  });
  assert(
    "B NÃO cria bloco no produto de A (RLS with check)",
    !!forgedBlock.error && forgedBlock.error.code === "42501",
    errorDetail(forgedBlock),
  );

  const crossBlockDelete = await B.from("product_page_blocks")
    .delete()
    .eq("id", blockA.data?.id);
  assert(
    "B NÃO apaga o bloco de A",
    !crossBlockDelete.error,
    errorDetail(crossBlockDelete),
  );

  const ownBlockRead = await A.from("product_page_blocks")
    .select("id")
    .eq("id", blockA.data?.id)
    .maybeSingle();
  assert("A lê o próprio bloco", !!ownBlockRead.data);

  const anonBlockRead = await asAnon.from("product_page_blocks")
    .select("id")
    .eq("product_id", productA.data?.id);
  assert(
    "anônimo lê blocos da loja ATIVA",
    !anonBlockRead.error && anonBlockRead.data?.length === 1,
    errorDetail(anonBlockRead),
  );

  await A.from("stores").update({ is_active: false }).eq("id", idA);
  const anonHiddenBlocks = await asAnon.from("product_page_blocks")
    .select("id")
    .eq("product_id", productA.data?.id);
  assert(
    "anônimo NÃO lê blocos de loja INATIVA",
    !anonHiddenBlocks.error && anonHiddenBlocks.data?.length === 0,
    `linhas devolvidas: ${JSON.stringify(anonHiddenBlocks.data)}`,
  );
  await A.from("stores").update({ is_active: true }).eq("id", idA);

  const anonBlockWrite = await asAnon.from("product_page_blocks").insert({
    product_id: productA.data?.id,
    store_id: idA,
    type: "text",
    content: "Vândalo",
    sort_order: 2,
  });
  assert(
    "anônimo NÃO cria bloco",
    !!anonBlockWrite.error,
    errorDetail(anonBlockWrite),
  );

  // ── 9. Vitrine (anon) lê o catálogo apenas de lojas ATIVAS ──────────────
  const anonCatalog = await asAnon.from("products").select("id").eq("id", productA.data?.id);
  assert(
    "anônimo lê produtos da loja ATIVA",
    !anonCatalog.error && anonCatalog.data?.length === 1,
    errorDetail(anonCatalog),
  );

  const anonCategory = await asAnon.from("categories").select("id").eq("id", categoryA.data?.id);
  assert(
    "anônimo lê categorias da loja ATIVA",
    !anonCategory.error && anonCategory.data?.length === 1,
    errorDetail(anonCategory),
  );

  await A.from("stores").update({ is_active: false }).eq("id", idA);
  const anonHiddenCatalog = await asAnon.from("products").select("id").eq("id", productA.data?.id);
  assert(
    "anônimo NÃO lê produtos de loja INATIVA",
    !anonHiddenCatalog.error && anonHiddenCatalog.data?.length === 0,
    `linhas devolvidas: ${JSON.stringify(anonHiddenCatalog.data)}`,
  );
  await A.from("stores").update({ is_active: true }).eq("id", idA);

  const anonProductWrite = await asAnon.from("products")
    .insert({ store_id: idA, name: `Vândalo ${RUN_ID}`, price: 1 });
  assert("anônimo NÃO cria produto", !!anonProductWrite.error, errorDetail(anonProductWrite));

  const anonCategoryWrite = await asAnon.from("categories")
    .insert({ store_id: idA, name: `Vândalo ${RUN_ID}` });
  assert("anônimo NÃO cria categoria", !!anonCategoryWrite.error, errorDetail(anonCategoryWrite));

  // Apagar categoria NÃO apaga produtos (FK on delete set null).
  await A.from("categories").delete().eq("id", categoryA.data?.id);
  const productAfterCategoryDelete = await A.from("products")
    .select("id, category_id")
    .eq("id", productA.data?.id)
    .maybeSingle();
  assert(
    "apagar categoria mantém o produto (category_id → null)",
    !!productAfterCategoryDelete.data && productAfterCategoryDelete.data.category_id === null,
    errorDetail(productAfterCategoryDelete),
  );

  // ── 9b. ENCOMENDAS: gravação, isolamento e estados ──────────────────────
  // Cliente service role (compartilhado com a secção 10, verificação de
  // dados "por baixo" do RLS).
  const asService = createClient(URL_BASE, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // `record_order` (SECURITY DEFINER) é o ÚNICO caminho de escrita do
  // checkout: valida loja ativa, produto da loja e campos obrigatórios.
  const orderCustomer = {
    name: `Cliente RLS ${RUN_ID}`,
    phone: "+258841112233",
    neighborhood: `Bairro ${RUN_ID}`,
    address: "Rua 1, nº 2",
    reference: "Em frente à praça",
    notes: "Entregar depois das 18h",
  };
  const orderLines = [{ productId: productA.data.id, qty: 2, options: [] }];

  const created = await asAnon.rpc("record_order", {
    p_store_id: idA,
    p_customer: orderCustomer,
    p_lines: orderLines,
    p_payment: "cash",
  });
  assert(
    "rpc record_order cria encomenda (anon, loja ativa)",
    !created.error && typeof created.data === "string",
    errorDetail(created),
  );
  const orderAId = created.data;

  const orderRow = await asService
    .from("orders")
    .select(
      "id, reference, status, delivery_status, subtotal, total, payment",
    )
    .eq("id", orderAId)
    .maybeSingle();
  assert(
    "encomenda tem referência, estados e pagamento",
    !!orderRow.data &&
      /^[0-9A-F]{6}$/.test(orderRow.data.reference) &&
      orderRow.data.status === "pending" &&
      orderRow.data.delivery_status === "pending" &&
      orderRow.data.payment === "cash",
    JSON.stringify(orderRow.data) + (errorDetail(orderRow) ?? ""),
  );

  assert(
    "total recalculado no banco (2 × preço 100 = 200)",
    orderRow.data?.subtotal === 200 && orderRow.data?.total === 200,
    `subtotal=${orderRow.data?.subtotal} total=${orderRow.data?.total}`,
  );

  const itemsA = await asService
    .from("order_items")
    .select("name, qty, unit_price, product_id")
    .eq("order_id", orderAId);
  assert(
    "order_items guarda snapshot (nome/preço do banco)",
    !itemsA.error &&
      itemsA.data?.length === 1 &&
      itemsA.data[0].qty === 2 &&
      itemsA.data[0].unit_price === 100 &&
      itemsA.data[0].product_id === productA.data.id,
    errorDetail(itemsA) ?? JSON.stringify(itemsA.data),
  );

  // ── isolamento multi-tenant das encomendas ──────────────────────────────
  const crossOrderRead = await B.from("orders").select("id").eq("id", orderAId);
  assert(
    "B NÃO lê a encomenda de A (por UUID direto)",
    !crossOrderRead.error && crossOrderRead.data?.length === 0,
    `linhas devolvidas: ${JSON.stringify(crossOrderRead.data)}`,
  );

  const crossItemRead = await B.from("order_items")
    .select("id")
    .eq("order_id", orderAId);
  assert(
    "B NÃO lê os itens da encomenda de A",
    !crossItemRead.error && crossItemRead.data?.length === 0,
    `linhas devolvidas: ${JSON.stringify(crossItemRead.data)}`,
  );

  const anonOrderRead = await asAnon.from("orders").select("id").eq("id", orderAId);
  assert(
    "anônimo NÃO lê encomendas",
    !anonOrderRead.error && anonOrderRead.data?.length === 0,
    `linhas devolvidas: ${JSON.stringify(anonOrderRead.data)}`,
  );

  const anonOrderInsert = await asAnon.from("orders").insert({
    store_id: idA,
    customer_name: "Hacker",
    customer_phone: "+258840000000",
    customer_neighborhood: "Baixa",
    subtotal: 1,
    total: 1,
  });
  assert(
    "anônimo NÃO cria encomenda direto (REST)",
    !!anonOrderInsert.error && anonOrderInsert.error.code === "42501",
    errorDetail(anonOrderInsert),
  );

  const anonOrderUpdate = await asAnon
    .from("orders")
    .update({ status: "completed" })
    .eq("id", orderAId)
    .select("id");
  assert(
    "anônimo NÃO atualiza encomenda",
    !anonOrderUpdate.error && anonOrderUpdate.data?.length === 0,
    `linhas afetadas: ${JSON.stringify(anonOrderUpdate.data)} ${errorDetail(anonOrderUpdate) ?? ""}`,
  );

  const anonItemInsert = await asAnon.from("order_items").insert({
    order_id: orderAId,
    store_id: idA,
    name: "Fake",
    qty: 1,
    unit_price: 0,
  });
  assert(
    "anônimo NÃO cria item de encomenda",
    !!anonItemInsert.error && anonItemInsert.error.code === "42501",
    errorDetail(anonItemInsert),
  );

  // ── estados: o dono atualiza (policy orders_update_own) ─────────────────
  const ownStatusUpdate = await A.from("orders")
    .update({ status: "confirmed" })
    .eq("id", orderAId)
    .select("status");
  assert(
    "A atualiza o estado da própria encomenda",
    !ownStatusUpdate.error &&
      ownStatusUpdate.data?.[0]?.status === "confirmed",
    errorDetail(ownStatusUpdate) ?? JSON.stringify(ownStatusUpdate.data),
  );

  const ownDeliveryUpdate = await A.from("orders")
    .update({ delivery_status: "on_the_way" })
    .eq("id", orderAId)
    .select("delivery_status");
  assert(
    "A atualiza o estado de entrega da própria encomenda",
    !ownDeliveryUpdate.error &&
      ownDeliveryUpdate.data?.[0]?.delivery_status === "on_the_way",
    errorDetail(ownDeliveryUpdate) ?? JSON.stringify(ownDeliveryUpdate.data),
  );

  const crossStatusUpdate = await B.from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderAId)
    .select("id");
  assert(
    "B NÃO atualiza o estado da encomenda de A",
    !crossStatusUpdate.error && crossStatusUpdate.data?.length === 0,
    `linhas afetadas: ${JSON.stringify(crossStatusUpdate.data)}`,
  );

  const crossDeliveryUpdate = await B.from("orders")
    .update({ delivery_status: "delivered" })
    .eq("id", orderAId)
    .select("id");
  assert(
    "B NÃO atualiza a entrega da encomenda de A",
    !crossDeliveryUpdate.error && crossDeliveryUpdate.data?.length === 0,
    `linhas afetadas: ${JSON.stringify(crossDeliveryUpdate.data)}`,
  );

  // ── validações do record_order (regras do checkout, no banco) ───────────
  const foreignProduct = await B.from("products")
    .insert({ store_id: idB, name: `Produto B ${RUN_ID}`, price: 50 })
    .select("id")
    .single();
  assert(
    "B cria produto próprio para o teste cruzado",
    !foreignProduct.error && !!foreignProduct.data,
    errorDetail(foreignProduct),
  );

  const wrongProduct = await asAnon.rpc("record_order", {
    p_store_id: idA,
    p_customer: orderCustomer,
    p_lines: [
      {
        productId:
          foreignProduct.data?.id ?? "00000000-0000-4000-8000-000000000000",
        qty: 1,
        options: [],
      },
    ],
    p_payment: null,
  });
  assert(
    "record_order REJEITA produto de outra loja",
    !!wrongProduct.error,
    errorDetail(wrongProduct) ?? `criou: ${wrongProduct.data}`,
  );

  const missingNeighborhood = await asAnon.rpc("record_order", {
    p_store_id: idA,
    p_customer: { ...orderCustomer, neighborhood: "" },
    p_lines: orderLines,
    p_payment: null,
  });
  assert(
    "record_order REJEITA encomenda sem bairro",
    !!missingNeighborhood.error,
    errorDetail(missingNeighborhood) ?? `criou: ${missingNeighborhood.data}`,
  );

  const badPhone = await asAnon.rpc("record_order", {
    p_store_id: idA,
    p_customer: { ...orderCustomer, phone: "12" },
    p_lines: orderLines,
    p_payment: null,
  });
  assert(
    "record_order REJEITA telefone inválido",
    !!badPhone.error,
    errorDetail(badPhone) ?? `criou: ${badPhone.data}`,
  );

  await A.from("stores").update({ is_active: false }).eq("id", idA);
  const inactiveOrder = await asAnon.rpc("record_order", {
    p_store_id: idA,
    p_customer: orderCustomer,
    p_lines: orderLines,
    p_payment: null,
  });
  assert(
    "record_order REJEITA loja inativa",
    !!inactiveOrder.error,
    errorDetail(inactiveOrder) ?? `criou: ${inactiveOrder.data}`,
  );
  await A.from("stores").update({ is_active: true }).eq("id", idA);

  const ownOrderRead = await A.from("orders")
    .select("id, reference, customer_phone, total, status, delivery_status")
    .eq("id", orderAId)
    .maybeSingle();
  assert(
    "A lê a própria encomenda (painel)",
    !!ownOrderRead.data && ownOrderRead.data.status === "confirmed",
    errorDetail(ownOrderRead),
  );

  // ── 9c. CHECKOUT PERSISTENTE: idempotência, marca de WhatsApp, guard ─────
  // Token de idempotência (uuid por envio): repetir o MESMO envio devolve a
  // MESMA encomenda — duplo toque/rede instável nunca duplicam linhas.

  const clientToken = globalThis.crypto.randomUUID();
  const idemFirst = await asAnon.rpc("record_order", {
    p_store_id: idA,
    p_customer: orderCustomer,
    p_lines: orderLines,
    p_payment: "cash",
    p_client_token: clientToken,
  });
  const idemSecond = await asAnon.rpc("record_order", {
    p_store_id: idA,
    p_customer: orderCustomer,
    p_lines: orderLines,
    p_payment: "cash",
    p_client_token: clientToken,
  });
  assert(
    "idempotência: 2.ª chamada devolve a MESMA encomenda",
    typeof idemFirst.data === "string" && idemFirst.data === idemSecond.data,
    `${errorDetail(idemFirst) ?? idemFirst.data} / ${errorDetail(idemSecond) ?? idemSecond.data}`,
  );
  const idemId = typeof idemFirst.data === "string" ? idemFirst.data : null;

  const tokenRows = await asService
    .from("orders")
    .select("id, client_token, whatsapp_opened_at, total")
    .eq("client_token", clientToken);
  assert(
    "idempotência: UMA única linha com o token",
    tokenRows.data?.length === 1,
    errorDetail(tokenRows) ?? JSON.stringify(tokenRows.data),
  );

  const idemItems = await asService
    .from("order_items")
    .select("qty")
    .eq("order_id", idemId ?? "00000000-0000-4000-8000-000000000000");
  assert(
    "idempotência: itens NÃO duplicados na repetição",
    !idemItems.error && idemItems.data?.length === 1 && idemItems.data[0].qty === 2,
    errorDetail(idemItems) ?? JSON.stringify(idemItems.data),
  );

  assert(
    "whatsapp_opened_at registado na criação (início do handoff)",
    !!tokenRows.data?.[0]?.whatsapp_opened_at,
    JSON.stringify(tokenRows.data),
  );

  // Compatibilidade: o código em produção chama com 4 args nomeados (sem
  // token). A assinatura nova mantém default no 5.º → a chamada resolve.
  const legacyCall = await asAnon.rpc("record_order", {
    p_store_id: idA,
    p_customer: orderCustomer,
    p_lines: orderLines,
    p_payment: "cash",
  });
  assert(
    "chamada antiga de 4 args continua a criar encomenda",
    typeof legacyCall.data === "string",
    errorDetail(legacyCall) ?? `criou: ${legacyCall.data}`,
  );
  const legacyRow = await asService
    .from("orders")
    .select("client_token, whatsapp_opened_at")
    .eq("id", legacyCall.data ?? "00000000-0000-4000-8000-000000000000")
    .maybeSingle();
  assert(
    "4 args → token null e whatsapp_opened_at preenchido",
    legacyRow.data?.client_token === null && !!legacyRow.data?.whatsapp_opened_at,
    errorDetail(legacyRow) ?? JSON.stringify(legacyRow.data),
  );

  // ── guard de integridade comercial (trigger antes de UPDATE) ─────────────
  const guardTotal = await A.from("orders")
    .update({ total: 1 })
    .eq("id", orderAId)
    .select("id");
  assert(
    "guard: dono NÃO altera o total (trigger comercial)",
    !!guardTotal.error &&
      guardTotal.error.message?.includes("orders_commercial_fields_frozen"),
    errorDetail(guardTotal) ?? `afetadas: ${JSON.stringify(guardTotal.data)}`,
  );

  const guardCustomer = await A.from("orders")
    .update({ customer_phone: "+258849999999", payment: "transfer" })
    .eq("id", orderAId)
    .select("id");
  assert(
    "guard: dono NÃO altera dados do cliente/pagamento",
    !!guardCustomer.error &&
      guardCustomer.error.message?.includes("orders_commercial_fields_frozen"),
    errorDetail(guardCustomer) ?? `afetadas: ${JSON.stringify(guardCustomer.data)}`,
  );

  // ── estados de entrega: 'failed' é destino legítimo ──────────────────────
  const failedDelivery = await A.from("orders")
    .update({ delivery_status: "failed" })
    .eq("id", orderAId)
    .select("delivery_status");
  assert(
    "estado de entrega 'failed' aceite (novo estado)",
    !failedDelivery.error && failedDelivery.data?.[0]?.delivery_status === "failed",
    errorDetail(failedDelivery) ?? JSON.stringify(failedDelivery.data),
  );

  const badDelivery = await A.from("orders")
    .update({ delivery_status: "teleportado" })
    .eq("id", orderAId)
    .select("id");
  assert(
    "estado de entrega inválido REJEITADO (check constraint)",
    !!badDelivery.error && badDelivery.error.code === "23514",
    errorDetail(badDelivery),
  );

  // ── eventos anónimos: whitelist, isolamento e sem escrita direta ─────────
  const evOk = await asAnon.rpc("record_event", {
    p_store_id: idA,
    p_event: "catalog_view",
    p_product_id: null,
  });
  assert("record_event aceita evento da whitelist (anon)", !evOk.error, errorDetail(evOk));

  const evWithProduct = await asAnon.rpc("record_event", {
    p_store_id: idA,
    p_event: "product_view",
    p_product_id: productA.data.id,
  });
  assert(
    "record_event aceita produto da própria loja",
    !evWithProduct.error,
    errorDetail(evWithProduct),
  );

  const evBadEvent = await asAnon.rpc("record_event", {
    p_store_id: idA,
    p_event: "pii_dump",
    p_product_id: null,
  });
  assert(
    "record_event REJEITA evento fora da whitelist",
    !!evBadEvent.error,
    errorDetail(evBadEvent) ?? `criou: ${evBadEvent.data}`,
  );

  const evForeignProduct = await asAnon.rpc("record_event", {
    p_store_id: idA,
    p_event: "product_view",
    p_product_id: foreignProduct.data?.id ?? "00000000-0000-4000-8000-000000000000",
  });
  assert(
    "record_event REJEITA produto de outra loja",
    !!evForeignProduct.error,
    errorDetail(evForeignProduct) ?? `criou: ${evForeignProduct.data}`,
  );

  const evReadAnon = await asAnon.from("store_events").select("id").eq("store_id", idA);
  assert(
    "anônimo NÃO lê store_events",
    !evReadAnon.error && evReadAnon.data?.length === 0,
    `linhas devolvidas: ${JSON.stringify(evReadAnon.data)}`,
  );

  const evReadA = await A.from("store_events").select("id, event").eq("store_id", idA);
  assert(
    "dono lê os eventos da própria loja",
    !evReadA.error && (evReadA.data?.length ?? 0) >= 2,
    errorDetail(evReadA) ?? JSON.stringify(evReadA.data),
  );

  const evReadB = await B.from("store_events").select("id").eq("store_id", idA);
  assert(
    "B NÃO lê eventos da loja A",
    !evReadB.error && evReadB.data?.length === 0,
    `linhas devolvidas: ${JSON.stringify(evReadB.data)}`,
  );

  const evInsertAnon = await asAnon.from("store_events").insert({
    store_id: idA,
    event: "catalog_view",
  });
  assert(
    "anônimo NÃO insere store_events direto (REST)",
    !!evInsertAnon.error && evInsertAnon.error.code === "42501",
    errorDetail(evInsertAnon),
  );

  const evInsertB = await B.from("store_events").insert({
    store_id: idA,
    event: "catalog_view",
  });
  assert(
    "B NÃO insere eventos na loja A",
    !!evInsertB.error && evInsertB.error.code === "42501",
    errorDetail(evInsertB),
  );

  // ── 10. Ciclo de vida do catálogo: RPC de status + exclusão segura ──────
  // O RLS esconde lojas inativas do anon, mas o proxy e as páginas precisam
  // DISTINGUIR "inativa" (estado indisponível, 200) de "inexistente" (404).
  // A função SECURITY DEFINER `store_public_status` expõe só o estado.

  const statusActive = await asAnon.rpc("store_public_status", { p_slug: SLUG_A });
  assert("rpc: loja ativa → 'active'", statusActive.data === "active", errorDetail(statusActive));

  const statusMissing = await asAnon.rpc("store_public_status", {
    p_slug: `nao-existe-${RUN_ID}`,
  });
  assert("rpc: loja inexistente → null", statusMissing.data === null, errorDetail(statusMissing));

  await A.from("stores").update({ is_active: false }).eq("id", idA);
  const statusInactive = await asAnon.rpc("store_public_status", { p_slug: SLUG_A });
  assert("rpc: loja inativa → 'inactive'", statusInactive.data === "inactive", errorDetail(statusInactive));

  const anonInactiveStore = await asAnon.from("stores").select("id").eq("id", idA);
  assert(
    "anon continua sem ler a loja inativa",
    !anonInactiveStore.error && anonInactiveStore.data?.length === 0,
    `linhas devolvidas: ${JSON.stringify(anonInactiveStore.data)}`,
  );

  await A.from("stores").update({ is_active: true }).eq("id", idA);
  const statusReactivated = await asAnon.rpc("store_public_status", { p_slug: SLUG_A });
  assert("rpc: reativada → 'active'", statusReactivated.data === "active", errorDetail(statusReactivated));

  // ── 10b. Políticas e FAQ da loja (terms/privacy/store_faq_items) ────────
  // Conteúdo do COMERCIANTE com as mesmas regras do catálogo: escrita só
  // do dono, leitura pública só de loja ATIVA, e um lojista nunca
  // alcança políticas/FAQ de outro (update, insert com store_id alheio,
  // leitura autenticada). O editor do painel usa sessão própria — por
  // isso as políticas `*_own` não dependem de is_active.

  const setPolicies = await A.from("stores")
    .update({ terms: "Termos da loja A", privacy_policy: "Privacidade da loja A" })
    .eq("id", idA)
    .select("id");
  assert(
    "A grava as próprias políticas",
    !setPolicies.error && setPolicies.data?.length === 1,
    errorDetail(setPolicies),
  );

  const policiesByB = await B.from("stores")
    .update({ terms: "Termos invasivos" })
    .eq("id", idA)
    .select("id");
  assert(
    "B NÃO altera as políticas da loja A",
    !policiesByB.error && policiesByB.data?.length === 0,
    errorDetail(policiesByB),
  );

  const policiesReadB = await B.from("stores").select("terms").eq("id", idA).maybeSingle();
  assert(
    "B não lê as políticas da loja A",
    !policiesReadB.data,
    errorDetail(policiesReadB),
  );

  const policiesAnon = await asAnon
    .from("stores")
    .select("terms, privacy_policy")
    .eq("id", idA)
    .maybeSingle();
  assert(
    "anon lê as políticas da loja ATIVA (vitrine)",
    policiesAnon.data?.terms === "Termos da loja A",
    errorDetail(policiesAnon),
  );

  const faqCreateA = await A.from("store_faq_items")
    .insert({
      store_id: idA,
      question: "Como faço um pedido?",
      answer: "Fale conosco no WhatsApp.",
      sort_order: 0,
    })
    .select("id")
    .single();
  assert(
    "A cria pergunta na própria loja",
    !faqCreateA.error && !!faqCreateA.data,
    errorDetail(faqCreateA),
  );

  const faqCreateB = await B.from("store_faq_items")
    .insert({ store_id: idA, question: "Invasão", answer: "x", sort_order: 1 })
    .select("id");
  assert(
    "B NÃO cria FAQ na loja A (with check do dono)",
    faqCreateB.data?.length === 0 || faqCreateB.error?.code === "42501",
    errorDetail(faqCreateB),
  );

  const faqCreateAnon = await asAnon
    .from("store_faq_items")
    .insert({ store_id: idA, question: "Anon", answer: "x", sort_order: 2 })
    .select("id");
  assert(
    "anon NÃO cria FAQ (sem política de insert)",
    faqCreateAnon.data?.length === 0 || faqCreateAnon.error?.code === "42501",
    errorDetail(faqCreateAnon),
  );

  const faqCreateC = await C.from("store_faq_items")
    .insert({ store_id: idA, question: "C sem loja", answer: "x", sort_order: 3 })
    .select("id");
  assert(
    "C (sem loja) NÃO cria FAQ na loja A",
    faqCreateC.data?.length === 0 || faqCreateC.error?.code === "42501",
    errorDetail(faqCreateC),
  );

  const faqReadB = await B.from("store_faq_items").select("id").eq("store_id", idA);
  assert(
    "B não lê o FAQ da loja A (authenticated sem política pública)",
    !faqReadB.error && faqReadB.data?.length === 0,
    errorDetail(faqReadB),
  );

  const faqReadAnon = await asAnon.from("store_faq_items").select("id, question").eq("store_id", idA);
  assert(
    "anon lê o FAQ da loja ATIVA (vitrine)",
    !faqReadAnon.error && faqReadAnon.data?.length === 1,
    errorDetail(faqReadAnon),
  );

  const faqUpdateByB = await B.from("store_faq_items")
    .update({ question: "Hackeada" })
    .eq("id", faqCreateA.data.id)
    .select("id");
  assert(
    "B não edita a FAQ da loja A",
    !faqUpdateByB.error && faqUpdateByB.data?.length === 0,
    errorDetail(faqUpdateByB),
  );

  const faqDeleteByB = await B.from("store_faq_items")
    .delete()
    .eq("id", faqCreateA.data.id)
    .select("id");
  assert(
    "B não apaga a FAQ da loja A",
    !faqDeleteByB.error && faqDeleteByB.data?.length === 0,
    errorDetail(faqDeleteByB),
  );

  // Loja INATIVA: políticas e FAQ somem da leitura pública — nada de
  // conteúdo de loja desativada na vitrine (o link no rodapé também some
  // porque a loja inteira nem é resolvida).
  await A.from("stores").update({ is_active: false }).eq("id", idA);

  const policiesHidden = await asAnon.from("stores").select("id").eq("id", idA).maybeSingle();
  assert(
    "anon não lê políticas da loja INATIVA",
    !policiesHidden.data,
    errorDetail(policiesHidden),
  );

  const faqHidden = await asAnon.from("store_faq_items").select("id").eq("store_id", idA);
  assert(
    "anon não lê o FAQ da loja INATIVA",
    !faqHidden.error && faqHidden.data?.length === 0,
    errorDetail(faqHidden),
  );

  const faqOwnInactive = await A.from("store_faq_items").select("id").eq("store_id", idA);
  assert(
    "dono lê o próprio FAQ mesmo com loja inativa (editor)",
    !faqOwnInactive.error && faqOwnInactive.data?.length === 1,
    errorDetail(faqOwnInactive),
  );

  await A.from("stores").update({ is_active: true }).eq("id", idA);

  // Exclusão do catálogo pelo DONO (a loja É o catálogo): o cascata remove
  // os produtos desta loja, mas perfil e auth ficam intactos. Verificado com
  // service role para provar que as linhas sumiram (RLS não esconderia).
  const deleteOwn = await A.from("stores").delete().eq("id", idA).select("id");
  assert(
    "dono apaga a própria loja",
    !deleteOwn.error && deleteOwn.data?.length === 1,
    errorDetail(deleteOwn),
  );

  const storeGone = await asService.from("stores").select("id").eq("id", idA);
  assert("loja apagada não existe mais", storeGone.data?.length === 0, errorDetail(storeGone));

  const productsGone = await asService.from("products").select("id").eq("store_id", idA);
  assert(
    "cascata apaga os produtos do catálogo",
    !productsGone.error && productsGone.data?.length === 0,
    errorDetail(productsGone),
  );

  const ordersGone = await asService.from("orders").select("id").eq("store_id", idA);
  assert(
    "cascata apaga as encomendas do catálogo",
    !ordersGone.error && ordersGone.data?.length === 0,
    errorDetail(ordersGone),
  );

  const eventsGone = await asService.from("store_events").select("id").eq("store_id", idA);
  assert(
    "cascata apaga os eventos anónimos da loja",
    !eventsGone.error && eventsGone.data?.length === 0,
    errorDetail(eventsGone),
  );

  const faqGone = await asService.from("store_faq_items").select("id").eq("store_id", idA);
  assert(
    "cascata apaga as perguntas FAQ do catálogo",
    !faqGone.error && faqGone.data?.length === 0,
    errorDetail(faqGone),
  );

  const profileSurvives = await A.from("profiles")
    .select("id")
    .eq("id", createdUsers[0])
    .maybeSingle();
  assert(
    "excluir catálogo mantém o perfil/auth do lojista",
    !!profileSurvives.data,
    errorDetail(profileSurvives),
  );

  // Recomeçar do zero depois de apagar: nenhuma restrição de conta fica
  // no caminho (o UNIQUE de owner_id saiu na migração multi-catalog).
  const recreate = await A.from("stores")
    .insert({
      owner_id: createdUsers[0],
      name: "Lojista A 2",
      slug: `${SLUG_A}-2`.slice(0, 63),
      country: "MZ",
      language: "en",
      currency: "USD",
      whatsapp_number: "+258840000001",
    })
    .select("id")
    .single();
  assert(
    "dono pode recriar loja após excluir",
    !recreate.error && !!recreate.data,
    errorDetail(recreate),
  );
} catch (error) {
  failed += 1;
  console.error(`\n\x1b[1;31m[rls]\x1b[0m erro inesperado: ${error.message}`);
} finally {
  // ── Limpeza ──────────────────────────────────────────────────────────────
  for (const id of createdUsers) {
    try {
      await admin(`/admin/users/${id}`, { method: "DELETE" });
    } catch (error) {
      console.error(`  \x1b[1;33m!\x1b[0m não foi possível apagar o utilizador ${id}: ${error.message}`);
    }
  }
  if (createdUsers.length > 0) {
    console.log(`\n\x1b[1;32m[rls]\x1b[0m ${createdUsers.length} utilizador(es) de teste removidos.`);
  }
}

console.log(
  `\n\x1b[1;32m[rls]\x1b[0m ${passed} verificação(ões) ok, ${failed} falha(s)\n`,
);

process.exit(failed > 0 ? 1 : 0);
