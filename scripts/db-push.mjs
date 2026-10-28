#!/usr/bin/env node
/**
 * Aplica as migrations locais no projeto Supabase vinculado.
 *
 *   npm run db:push
 *
 * Por que um script e não `supabase db push`?
 *   O `db push` conecta direto no Postgres e exige a senha do banco.
 *   Este script usa a Management API (o mesmo caminho do dashboard),
 *   autenticando com o access token já salvo pelo `supabase login`.
 *
 * Tokens suportados (nesta ordem):
 *   1. SUPABASE_ACCESS_TOKEN (env)
 *   2. ~/.supabase/access-token (gravado pelo CLI)
 *
 * As migrations deste repositório são idempotentes, então re-executar é seguro.
 * Alternativa oficial:  SUPABASE_DB_PASSWORD=... npx supabase db push
 */
import { readFile, readdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const ROOT = process.cwd();
const MIGRATIONS_DIR = path.join(ROOT, "supabase", "migrations");

function fail(message) {
  console.error(`\x1b[1;31m[db:push]\x1b[0m ${message}`);
  process.exit(1);
}

function projectRef() {
  const fromEnv = process.env.SUPABASE_PROJECT_REF;
  if (fromEnv) return fromEnv;

  const refFile = path.join(ROOT, "supabase", ".temp", "project-ref");
  if (existsSync(refFile)) return readFileSync(refFile, "utf8").trim();

  fail(
    "Projeto não vinculado. Rode: npx supabase link --project-ref <REF>",
  );
}

function accessToken() {
  const fromEnv = process.env.SUPABASE_ACCESS_TOKEN;
  if (fromEnv) return fromEnv.trim();

  const tokenFile = path.join(homedir(), ".supabase", "access-token");
  if (existsSync(tokenFile)) return readFileSync(tokenFile, "utf8").trim();

  fail(
    "Não autenticado. Rode: npx supabase login --token <TOKEN> " +
      "(ou exporte SUPABASE_ACCESS_TOKEN)",
  );
}

async function migrationFiles() {
  if (!existsSync(MIGRATIONS_DIR)) fail(`Pasta não encontrada: ${MIGRATIONS_DIR}`);

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  if (files.length === 0) fail("Nenhuma migration encontrada.");

  return files;
}

async function runQuery(ref, token, query) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${ref}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );

  const body = await response.text();

  if (!response.ok) {
    let detail = body;
    try {
      const parsed = JSON.parse(body);
      detail = parsed.message ?? parsed.hint ?? body;
    } catch {
      // corpo não-JSON: mantém como está
    }
    fail(`HTTP ${response.status} em migration: ${detail}`);
  }

  return body;
}

const ref = projectRef();
const token = accessToken();
const files = await migrationFiles();

console.log(`\x1b[1;32m[db:push]\x1b[0m projeto ${ref} — ${files.length} migration(s)`);

for (const file of files) {
  const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
  process.stdout.write(`  → ${file} ... `);
  await runQuery(ref, token, sql);
  process.stdout.write("ok\n");
}

console.log("\x1b[1;32m[db:push]\x1b[0m concluído.");
