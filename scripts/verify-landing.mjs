#!/usr/bin/env node
/**
 * Verifica a LANDING (secção de comparação) e a FAQ (objeções) no site
 * PRODUCTION — A1/A2 do roadmap de valor.
 *
 *   npm run verify:landing
 *
 * O que é verificado (HTTP real, sem simulação):
 *   • / tem a secção de comparação (âncora do título, tabela com 4
 *     cabeçalhos de coluna e 5 linhas de recurso);
 *   • /faq tem as três perguntas de objeção novas VISÍVEIS e também no
 *     FAQPage JSON-LD (regra de ouro: markup só espelha conteúdo
 *     visível — cada pergunta aparece ≥ 2 vezes);
 *   • a FAQ da plataforma continua com as 14 perguntas.
 *
 * Credenciais: nenhuma — páginas públicas.
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

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

/** Ocorrências de uma agulha no texto (≥ 2 = visível + JSON-LD). */
function count(text, needle) {
  return text.split(needle).length - 1;
}

await loadEnv();
const BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://elicani.site").replace(
  /\/$/,
  "",
);

console.log(`\x1b[1;32m[landing]\x1b[0m comparação (A1) + objeções da FAQ (A2) em ${BASE}\n`);

async function get(pathname) {
  const response = await fetch(`${BASE}${pathname}`, {
    headers: { accept: "text/html,application/xhtml+xml" },
  });
  return { status: response.status, text: await response.text() };
}

try {
  // ── A1. secção de comparação na landing ─────────────────────────────────
  const home = await get("/");
  assert("landing responde 200", home.status === 200, `${home.status}`);
  assert(
    "secção de comparação presente (âncora compare-title)",
    home.text.includes('id="compare-title"'),
    "âncora não encontrada",
  );
  assert(
    "tabela com 4 cabeçalhos de coluna",
    (home.text.match(/scope="col"/g) ?? []).length >= 4,
    `${(home.text.match(/scope="col"/g) ?? []).length}`,
  );
  assert(
    "tabela com 5 linhas de recurso",
    (home.text.match(/scope="row"/g) ?? []).length >= 5,
    `${(home.text.match(/scope="row"/g) ?? []).length}`,
  );

  // ── A2. objeções na FAQ (visível + JSON-LD do MESMO array) ─────────────
  const faq = await get("/faq");
  assert("faq responde 200", faq.status === 200, `${faq.status}`);
  assert(
    "FAQ da plataforma com 14 perguntas",
    (faq.text.match(/<h2/g) ?? []).length >= 14,
    `${(faq.text.match(/<h2/g) ?? []).length}`,
  );

  const objections = [
    "How can a customer follow their order?",
    "Why not just use WhatsApp's own catalog?",
    "Why not build my own website?",
  ];
  for (const question of objections) {
    const occurrences = count(faq.text, question);
    assert(
      `objeção visível + JSON-LD: "${question}"`,
      occurrences >= 2,
      `${occurrences} ocorrência(s)`,
    );
  }
} catch (error) {
  failed += 1;
  console.error(`\n\x1b[1;31m[landing]\x1b[0m erro inesperado: ${error.message}`);
}

console.log(
  `\n\x1b[1;32m[landing]\x1b[0m ${passed} verificação(ões) ok, ${failed} falha(s)\n`,
);
process.exit(failed > 0 ? 1 : 0);
