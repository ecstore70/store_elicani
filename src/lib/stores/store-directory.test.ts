import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

/**
 * Contrato do diretório público `/stores` (plataforma) — lê as fontes
 * (o runner não parseia JSX) para garantir:
 *
 *  • página server-rendered, crawlável sem JS, com links REAIS para o
 *    URL canônico de cada loja (ponte elicani.site → /stores → loja);
 *  • MULTITENANT por construção: a lista nasce do banco (RLS público +
 *    filtro de ativas) — nenhum lojista/loja/slug fixo, nenhum link de
 *    painel/admin, nenhum merchant fabricado;
 *  • metadata de plataforma única (title/description/canonical/OG) e
 *    sem structured data falso;
 *  • a navegação de marketing (cabeçalho + mobile + rodapé) liga /stores
 *    pelo MESMO array de links existente — sem redesign da landing.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(HERE, "../../..");

const read = (relative: string) =>
  readFileSync(path.join(PROJECT, relative), "utf8");

/** Código sem comentários — os scans anti-mau-cheiro olham só ao código. */
function codeOnly(source: string): string {
  return source
    .split("\n")
    .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
    .join("\n");
}

const PAGE = "src/app/(marketing)/stores/page.tsx";
const LAYOUT = "src/app/(marketing)/layout.tsx";
const QUERIES = "src/lib/stores/queries.ts";

describe("/stores — diretório público crawlável", () => {
  const src = read(PAGE);
  const code = codeOnly(src);

  it("server component puro (sem \"use client\", rota instant=false)", () => {
    assert.ok(!src.includes('"use client"'), "página pública não pode ser client");
    assert.match(src, /export const instant = false;/, "rota dinâmica por requisição");
  });

  it("metadata de plataforma: título absoluto, description, canonical /stores, OG", () => {
    assert.match(src, /title: \{ absolute: title \}/, "título absoluto da plataforma");
    assert.match(src, /alternates: \{ canonical: "\/stores" \}/, "canonical única");
    assert.match(src, /url: "\/stores"/, "OG url = /stores");
    assert.match(src, /type: "website"/, "OG type website");
    // description própria (i18n), não a genérica da plataforma
    assert.match(src, /const description = t\("stores\.intro"\)/);
  });

  it("lista lojas ATIVAS do banco — multitenant, zero valores fixos", () => {
    assert.match(code, /listActivePublicStores\(\)/, "fonte = consulta pública do banco");
    // Nada de merchant/loja/slug/hardcode de ambiente:
    assert.ok(!code.includes('"shop"'), "sem loja fixa");
    assert.ok(!code.includes("vis-test-store"), "sem slug fixo de teste");
    assert.ok(!code.includes("elicani.site"), "sem host fixo");
    assert.ok(!code.includes("localhost"), "sem ambiente fixo");
    assert.ok(!code.includes("https://"), "sem URL absoluta montada à mão");
    // Nada de rotas privadas:
    assert.ok(!code.includes('"/app"'), "sem rota de painel");
    assert.ok(!code.includes("dashboard"), "sem link de dashboard");
    assert.ok(!code.includes("admin"), "sem link de admin");
  });

  it("links REAIS <a href> no URL canônico da loja (storePublicUrl)", () => {
    assert.match(code, /<a/, "elemento âncora nativo");
    assert.match(
      code,
      /href=\{storePublicUrl\(store\.slug\)\}/,
      "href = mesmo helper canônico do sitemap",
    );
    assert.match(code, /store\.name/, "texto do link = nome real da loja");
  });

  it("sem structured data falso (nenhum JSON-LD nesta página)", () => {
    assert.ok(!code.includes("@type"), "nada de schema.org inventado");
    assert.ok(!code.includes("application/ld+json"), "nada de JSON-LD");
  });

  it("estado vazio honesto (sem fabricar lojas inexistentes)", () => {
    assert.match(code, /stores\.length === 0/, "ramo de lista vazia");
    assert.match(code, /t\("stores\.empty"\)/, "mensagem i18n do estado vazio");
  });
});

describe("consulta do diretório (listActivePublicStores)", () => {
  const src = read(QUERIES);
  const start = src.indexOf("export async function listActivePublicStores");
  assert.ok(start >= 0, "função deve existir em stores/queries.ts");
  const end = src.indexOf("\nexport ", start + 10);
  const fn = src.slice(start, end);

  it("só lojas ativas (RLS + filtro redundante de propósito)", () => {
    assert.ok(fn.includes('.eq("is_active", true)'), "filtro explícito de ativas");
  });

  it("campos mínimos de cartão, selecionados explicitamente", () => {
    assert.ok(
      fn.includes('select("id, name, slug, description, logo_url, banner_url")'),
      "select explícito (nunca *)",
    );
    assert.ok(!fn.includes("owner_id"), "owner_id nunca sai daqui");
    assert.ok(!fn.includes("whatsapp"), "sem contato pessoal no cartão");
  });

  it("ordem estável por nome; falha de consulta → exceção (convenção das vitrines)", () => {
    assert.ok(fn.includes('.order("name", { ascending: true })'));
    assert.ok(fn.includes("throw new Error("), "erro propaga como nas queries públicas");
  });
});

describe("ponte de navegação marketing → /stores", () => {
  const src = read(LAYOUT);

  it("link no array `links` existente (cabeçalho + mobile + rodapé)", () => {
    assert.ok(
      src.includes('{ href: "/stores", label: t("landing.navStores") }'),
      "entrada no MESMO array usado pelo cabeçalho/menu/rodapé",
    );
  });

  it("cabeçalho e rodapé consomem o array `links` (link real nos dois)", () => {
    const maps = src.match(/links\.map\(/g) ?? [];
    assert.ok(maps.length >= 2, `esperados ≥2 usos de links.map, há ${maps.length}`);
  });

  it("sem redesign: só a entrada nova no array (demais links intactos)", () => {
    assert.ok(src.includes('{ href: "/#features"'), "link de features intacto");
    assert.ok(src.includes('{ href: "/#how-it-works"'), "link de how intacto");
  });
});
