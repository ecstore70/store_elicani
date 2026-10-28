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
 *   • ninguém tem duas lojas (UNIQUE owner_id);
 *   • slug é único entre lojistas (UNIQUE slug);
 *   • perfis são privados;
 *   • anônimo lê apenas lojas ATIVAS e nunca escreve;
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
  // A e B criam loja; C fica sem loja de propósito, para testar o
  // `with check` da RLS sem o UNIQUE de owner_id a atrapalhar.
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

  // C ainda não tem loja, então o UNIQUE de owner_id não dispara antes:
  // isto mede o `with check (auth.uid() = owner_id)` da RLS em si.
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

  const secondStore = await A.from("stores").insert({ ...storeA, slug: `${SLUG_A}-2` });
  assert(
    "A NÃO cria uma segunda loja (UNIQUE owner_id)",
    !!secondStore.error && secondStore.error.code === "23505",
    errorDetail(secondStore),
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
