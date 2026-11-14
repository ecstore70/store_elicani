#!/usr/bin/env node
/**
 * Preenche `products.slug` nos produtos existentes — roda DEPOIS da
 * migration 20261114160000_product_slugs.sql (npm run db:push).
 *
 *   node scripts/backfill-product-slugs.mjs           # aplica
 *   node scripts/backfill-product-slugs.mjs --dry-run # só mostra o plano
 *
 * Usa o MESMO algoritmo da aplicação (src/lib/catalog/product-slug.ts,
 * importado direto — o Node ≥22 roda TS com type-stripping), ordem
 * determinística (created_at, id): mesmos dados → mesmos slugs.
 *
 * Idempotente: produto com slug definido nunca é tocado (renomes não
 * alteram URL). Nome que não produz slug ASCII vira null → o produto
 * continua publicando pelo UUID (fallback da própria aplicação).
 *
 * Credenciais: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY do
 * .env.local (mesmo caminho dos demais scripts). Nunca imprime segredos.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const { slugifyProductName, uniqueProductSlug } = await import(
  new URL("../src/lib/catalog/product-slug.ts", import.meta.url).href
);

function env(name) {
  const file = readFileSync(path.join(ROOT, ".env.local"), "utf8");
  const value = file.match(new RegExp(`^${name}=(.*)$`, "m"))?.[1]?.trim();
  if (!value) {
    console.error(`[backfill] variável ausente: ${name}`);
    process.exit(1);
  }
  return value;
}

const url = env("NEXT_PUBLIC_SUPABASE_URL");
const key = env("SUPABASE_SERVICE_ROLE_KEY");
const dryRun = process.argv.includes("--dry-run");
const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

const response = await fetch(
  `${url}/rest/v1/products?select=id,store_id,name,slug,created_at&order=created_at.asc,id.asc`,
  { headers },
);
if (!response.ok) {
  console.error(`[backfill] leitura falhou: HTTP ${response.status}`);
  process.exit(1);
}
const products = await response.json();

// Slugs já ocupados por loja (inclui os já preenchidos por esta execução).
const takenByStore = new Map();
for (const product of products) {
  if (!product.slug) continue;
  const set = takenByStore.get(product.store_id) ?? new Set();
  set.add(product.slug);
  takenByStore.set(product.store_id, set);
}

const plan = [];
let skipped = 0;
let emptyName = 0;

for (const product of products) {
  if (product.slug) {
    skipped += 1;
    continue;
  }
  const base = slugifyProductName(product.name ?? "");
  if (!base) {
    emptyName += 1;
    console.log(
      `  ! sem slug ASCII: "${product.name}" → permanece pelo UUID`,
    );
    continue;
  }
  const taken = takenByStore.get(product.store_id) ?? new Set();
  const slug = uniqueProductSlug(base, taken);
  taken.add(slug);
  takenByStore.set(product.store_id, taken);
  plan.push({ id: product.id, name: product.name, slug });
}

console.log(
  `[backfill] ${products.length} produto(s) · ${skipped} já com slug · ${plan.length} a preencher · ${emptyName} sem nome ASCII`,
);

if (dryRun) {
  for (const item of plan) console.log(`  ~ ${item.name} → ${item.slug}`);
  console.log("[backfill] dry-run: nada foi gravado.");
  process.exit(0);
}

let updated = 0;
for (const item of plan) {
  const res = await fetch(`${url}/rest/v1/products?id=eq.${item.id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ slug: item.slug }),
  });
  if (!res.ok) {
    console.error(`  ✗ ${item.name}: HTTP ${res.status}`);
    process.exitCode = 1;
    continue;
  }
  updated += 1;
  console.log(`  ✓ ${item.name} → ${item.slug}`);
}

console.log(`[backfill] concluído: ${updated} produto(s) atualizado(s).`);
