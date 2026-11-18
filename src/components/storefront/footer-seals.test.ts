import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

/**
 * Contrato visual do RODAPÉ — lê as fontes (o runner não parseia JSX)
 * para garantir, como regressão, que:
 *
 *  • o selo é SVG puro com texto acessível, não interativo, sem emoji e
 *    inteiramente temático (variáveis --sf-*);
 *  • os três selos usam os textos i18n (com a variação restaurante do
 *    template já existente) e são compactos/responsivos;
 *  • a hierarquia identidade → selos → links → moeda → Powered by
 *    Elicani está preservada, com folga para o botão flutuante de
 *    WhatsApp (safe-area) — e o botão continua lá.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

function read(name: string): string {
  return readFileSync(path.join(HERE, name), "utf8");
}

/** Trecho do rodapé entre `<footer` e `</footer>`. */
function footerSlice(source: string): string {
  const start = source.indexOf("<footer");
  assert.notEqual(start, -1, "rodapé não encontrado");
  const end = source.indexOf("</footer>", start);
  assert.notEqual(end, -1, "fecho do rodapé não encontrado");
  return source.slice(start, end);
}

describe("selo — implementação vetorial", () => {
  const src = read("store-seal.tsx");

  it("SVG com role=img + rótulo (texto legível por leitor de tela)", () => {
    assert.match(src, /role="img"/);
    assert.match(src, /aria-label=\{text\}/);
    assert.match(src, /viewBox="0 0 100 100"/);
  });

  it("informativo: sem link, sem botão, sem interação", () => {
    assert.ok(!/<a[\s>]/.test(src), "selo não pode ser clicável");
    assert.ok(!/<button/.test(src), "selo não pode ser clicável");
    assert.ok(!src.includes("onClick"), "selo não pode ser clicável");
  });

  it("nada de emoji — o desenho é roseta + anéis + texto via fórmula", () => {
    assert.ok(!EMOJI.test(src), "emoji encontrado no selo");
    assert.match(src, /layoutSeal/);
    assert.match(src, /ROSETTE_PATH/);
    assert.match(src, /textPath/);
  });

  it("cores inteiramente temáticas (nenhuma cor fixa no componente)", () => {
    assert.match(src, /var\(--sf-primary\)/);
    assert.match(src, /var\(--sf-fg\)/);
    assert.ok(!/#[0-9a-fA-F]{3,8}/.test(src), "cor hex fixa no selo");
  });
});

describe("selos do rodapé — composição", () => {
  const src = read("footer-seals.tsx");

  it("três selos com textos i18n (catálogo/cardápio, pedidos, contacto)", () => {
    assert.match(src, /strings\.sealCatalog/);
    assert.match(src, /strings\.sealMenu/);
    assert.match(src, /strings\.sealOrders/);
    assert.match(src, /strings\.sealSupport/);
    assert.equal(src.match(/<StoreSeal/g)?.length, 1, "um só mapeamento → 3 selos");
  });

  it("variante restaurante vem do template EXISTENTE (sem sistema novo)", () => {
    assert.match(src, /template === "restaurant"/);
    assert.ok(!src.includes("category"), "nenhum sistema de categoria novo");
  });

  it("compactos e responsivos: fileira no mobile, maiores no desktop", () => {
    assert.match(src, /size-\[5\.25rem\] sm:size-24/);
    assert.match(src, /flex-wrap/, "quebra para 2+1 em telas estreitas");
    assert.match(src, /justify-center/);
    assert.ok(!EMOJI.test(src));
  });
});

describe("rodapé — hierarquia, safe-area e WhatsApp", () => {
  const shell = read("store-shell.tsx");
  const footer = footerSlice(shell);

  it("hierarquia: identidade → selos → links → moeda → Powered by", () => {
    const order = [
      footer.indexOf("{store.name}"),
      footer.indexOf("<FooterSeals"),
      footer.indexOf("footerNav"),
      footer.indexOf("strings.poweredBy"),
    ];
    assert.ok(order.every((i) => i >= 0), "marcador da hierarquia ausente");
    for (let i = 1; i < order.length; i++) {
      assert.ok(order[i - 1] < order[i], `posição ${i} fora de ordem: [${order}]`);
    }
  });

  it("identidade presente e crédito da plataforma menor que ela", () => {
    assert.match(footer, /text-sm font-semibold/, "identidade do comerciante");
    assert.match(footer, /text-xs font-medium/, "crédito em texto menor");
    assert.match(footer, /href="https:\/\/elicani\.site"/, "Powered by continua linkado");
    assert.match(footer, /<Logo/, "Powered by mantém a marca");
  });

  it("links de políticas e moeda preservados", () => {
    assert.match(footer, /policyLinks\.map/);
    assert.match(footer, /store\.currency/);
    assert.match(footer, /aria-label=\{strings\.footerNav\}/);
  });

  it("folga inferior reserva o espaço do botão flutuante (safe-area)", () => {
    assert.match(
      footer,
      /pb-\[calc\(4\.5rem_\+_env\(safe-area-inset-bottom\)\)\]/,
      "rodapé precisa de folga para o WhatsApp no mobile",
    );
  });

  it("botão flutuante de WhatsApp preservado e com safe-area própria", () => {
    assert.match(shell, /whatsappHref &&/, "botão de WhatsApp não pode sumir");
    assert.match(shell, /WhatsAppIcon className="size-7"/);
    assert.match(
      shell,
      /bottom-\[calc\(1rem_\+_env\(safe-area-inset-bottom\)\)\]/,
      "bottom do botão deve respeitar a safe-area",
    );
  });

  it("checkout continua sem rodapé e sem botão flutuante", () => {
    const idx = shell.indexOf("<footer");
    const guardStart = shell.lastIndexOf("{!isCheckout", idx);
    assert.notEqual(guardStart, -1, "rodapé precisa continuar escondido no checkout");
    assert.match(shell, /\{!isCheckout && whatsappHref && \(/);
  });
});
