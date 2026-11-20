import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

/**
 * Contrato do "Share product" (plataforma) — lê as fontes (o runner não
 * parseia JSX) para garantir:
 *
 *  • toda rota de produto renderiza o botão com o produto DESTA página
 *    (nome + URL canónica vindos do servidor, nada de estado global);
 *  • o componente é client-isolado, acessível e sem valores fixos de
 *    loja/mercador/produto;
 *  • a ação é separada do CTA de WhatsApp (regressão sensível: os
 *    contratos do CTA continuam nos seus próprios testes, intactos).
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(HERE, "../../..");
const COMPONENT = path.join(HERE, "product-share.tsx");
const PAGE = path.join(
  PROJECT,
  "src/app/store/[slug]/products/[productId]/page.tsx",
);

const read = (file: string) => readFileSync(file, "utf8");

/** Código sem comentários — os scans anti-mau-cheiro olham só ao código. */
function codeOnly(source: string): string {
  return source
    .split("\n")
    .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
    .join("\n");
}

describe("product-share — componente client isolado", () => {
  const src = read(COMPONENT);

  it("\"use client\" — só esta parte toca navigator.share/clipboard", () => {
    assert.match(src, /^"use client";/, "componente de interação deve ser client");
    assert.match(src, /navigator\.share/, "usa o Web Share API nativo");
    assert.match(src, /navigator\.clipboard\?\.writeText/, "fallback de clipboard defensivo");
    assert.match(src, /shareProduct\(/, "lógica pura partilhada do lib");
  });

  it("botão acessível: type=button, rótulo visível, foco visível, ícone decorativo", () => {
    assert.match(src, /<button type="button" onClick=/, "botão nativo (teclado de graça)");
    assert.match(src, /\{strings\.shareProduct\}/, "nome acessível = rótulo visível i18n");
    assert.match(src, /<Share2 aria-hidden="true"/, "ícone decorativo (lucide, sem dependência nova)");
    assert.match(src, /focus-visible:outline-2/, "estado de foco visível");
    assert.match(src, /focus-visible:outline-offset-2/);
  });

  it("confirmação 'Link copied' acessível e não-bloqueante", () => {
    assert.match(src, /role="status"/, "anúncio para leitores de ecrã");
    assert.match(src, /aria-live="polite"/);
    assert.match(src, /\{copied \? strings\.linkCopied : ""\}/, "só aparece após cópia real");
  });

  it("sem estado global de produto e sem valores fixos de mercador", () => {
    const code = codeOnly(src);
    for (const banned of ["localStorage", "sessionStorage", "document.cookie", "globalThis"]) {
      assert.ok(!code.includes(banned), `proibido: ${banned}`);
    }
    for (const hardcoded of ["/store/", "shop", "elicani.site", "wa.me"]) {
      assert.ok(!code.includes(hardcoded), `sem valor fixo: ${hardcoded}`);
    }
    // ação SEPARADA do CTA: nenhuma lógica de WhatsApp aqui (a menção
    // documental no comentário não é implementação).
    assert.ok(!code.includes("whatsappHref"), "sem href do CTA");
    assert.ok(!code.includes("productInquiry"), "sem mensagem de inquiry");
    assert.ok(!code.includes("buildOrderMessage"), "sem geração de pedido");
  });
});

describe("product-share — integração na rota de produto (todas as lojas)", () => {
  const page = read(PAGE);

  it("toda página de produto renderiza o Share com o produto DESTA rota", () => {
    assert.match(page, /<ProductShare/, "botão presente na rota dinâmica [slug]/[productId]");
    assert.match(page, /productName=\{product\.name\}/, "nome do produto em exibição");
    assert.match(page, /productUrl=\{productUrl\}/, "URL canónica da própria página");
  });

  it("productUrl é o canónico gerado pela rota (não construído no cliente)", () => {
    assert.match(page, /productCanonicalUrl\(/, "fonte canónica existente reutilizada");
    // o valor passado ao share é a MESMA variável usada em JSON-LD/breadcrumb.
    const shareBlock = page.slice(page.indexOf("<ProductShare"), page.indexOf("/>", page.indexOf("<ProductShare")) + 2);
    assert.ok(shareBlock.includes("productUrl"), "share usa a variável canónica, não uma string");
    assert.ok(!shareBlock.includes("https://"), "nenhuma URL absoluta fixa no bloco do share");
  });

  it("nenhum outro componente/partilha duplicada na página", () => {
    assert.equal(page.match(/<ProductShare/g)?.length, 1, "um único botão de partilha");
    assert.ok(!page.includes("navigator.share"), "browser API só no componente client");
  });

  it("CTA de WhatsApp da página permanece intacto (área sensível)", () => {
    // a rota continua a passar o contexto de produto ao shell — os
    // contratos completos do CTA estão em footer-seals.test.ts.
    assert.match(page, /whatsappProduct=\{\{/, "contexto do CTA inalterado");
    assert.match(page, /<ProductPurchase/, "painel de compra inalterado");
  });
});
