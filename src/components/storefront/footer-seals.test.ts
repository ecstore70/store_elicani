import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

/**
 * Contrato visual do RODAPÉ — lê as fontes (o runner não parseia JSX)
 * para garantir, como regressão, que:
 *
 *  • os três selos são as ARTES PNG FORNECIDAS copiadas para
 *    `public/brand/` (nada depende do caminho Android de origem, nada
 *    recriado em SVG/ícone/emoji);
 *  • o `alt` vem do i18n e descreve o que cada selo comunica;
 *  • layout responsivo sem distorção (altura fixa, largura automática,
 *    object-contain, quebra 2+1 em telas estreitas);
 *  • a hierarquia identidade → selos → links → moeda → Powered by
 *    Elicani está preservada, com folga para o botão flutuante de
 *    WhatsApp (safe-area) — e o botão continua lá.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(HERE, "../../..");
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

const SEALS = [
  "elicani-seal-catalogo-online.png",
  "elicani-seal-pedidos-whatsapp.png",
  "elicani-seal-contacto-direto.png",
] as const;

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

/** Caminhos .ts/.tsx do código (onde um dependência em runtime apareceria). */
function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

describe("selos — artes fornecidas importadas para o projeto", () => {
  it("os três PNGs existem em public/brand/ com tamanho web razoável", () => {
    for (const name of SEALS) {
      const file = path.join(PROJECT, "public/brand", name);
      assert.ok(existsSync(file), `asset ausente: ${name}`);
      const bytes = readFileSync(file);
      assert.deepEqual(
        [...bytes.subarray(0, 8)],
        [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
        `${name} deve ser PNG`,
      );
      assert.ok(
        statSync(file).size < 600_000,
        `${name} grande demais para o rodapé`,
      );
    }
  });

  it("nenhum código depende do caminho Android de origem", () => {
    const offenders = sourceFiles(path.join(PROJECT, "src"))
      .filter((file) => !file.includes(".test.")) // teste não é runtime
      .filter((file) => readFileSync(file, "utf8").includes("/storage/emulated"));
    assert.deepEqual(offenders, [], "runtime não pode ler o armazenamento local");
  });

  it("o desenho não foi recriado (sem SVG/emoji/ícone no lugar da arte)", () => {
    const src = read("footer-seals.tsx");
    assert.ok(!EMOJI.test(src), "emoji encontrado nos selos");
    assert.ok(!src.includes("<svg"), "selos devem ser as imagens fornecidas");
    assert.ok(!existsSync(path.join(HERE, "store-seal.tsx")), "SVG recriado voltou");
    assert.ok(
      !existsSync(path.join(PROJECT, "src/lib/storefront/seal-layout.ts")),
      "geometria SVG recriada voltou",
    );
  });

  it("informativos: sem link, sem botão, sem interação", () => {
    const src = read("footer-seals.tsx");
    assert.ok(!/<a[\s>]/.test(src), "selo não pode ser clicável");
    assert.ok(!/<button/.test(src), "selo não pode ser clicável");
    assert.ok(!src.includes("onClick"), "selo não pode ser clicável");
  });
});

describe("selos do rodapé — composição", () => {
  const src = read("footer-seals.tsx");

  it("renderiza as três artes via next/image, uma por linha do mapa", () => {
    assert.match(src, /import Image from "next\/image"/);
    assert.equal(src.match(/src: "\/brand\/elicani-seal-/g)?.length, 3, "três selos");
    assert.match(src, /width: 452/, "dimensões intrínsecas p/ evitar layout shift");
    assert.match(src, /height: 400/);
    assert.match(src, /sizes=/, "entrega responsiva otimizada");
  });

  it("alt do i18n descreve o que cada selo comunica (sem rótulo vazio)", () => {
    assert.match(src, /alt: strings\.sealCatalog/);
    assert.match(src, /alt: strings\.sealOrders/);
    assert.match(src, /alt: strings\.sealSupport/);
    assert.ok(!/alt:\s*"(badge|seal|image\d*)"/i.test(src), "alt genérico proibido");
    assert.ok(!src.includes("sealMenu"), "arte fixa: sem variação por template");
  });

  it("arte fixa para qualquer tipo de loja (sem sistema de categoria novo)", () => {
    assert.ok(!src.includes("template"), "nenhum acoplamento a template");
    assert.ok(!src.includes("category"), "nenhum sistema de categoria novo");
  });

  it("responsivo sem distorção: altura fixa, largura automática, contain", () => {
    assert.match(src, /h-\[5\.25rem\]/, "compacto no mobile");
    assert.match(src, /sm:h-24/, "maior no desktop");
    assert.match(src, /w-auto/, "largura segue a proporção original");
    assert.match(src, /object-contain/, "sem esticar/cortar a arte");
    assert.match(src, /flex-wrap/, "quebra para 2+1 em telas estreitas");
    assert.match(src, /justify-center/);
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

  it("selos do rodapé sem acoplamento ao template da loja", () => {
    assert.match(
      shell,
      /<FooterSeals strings=\{strings\} \/>/,
      "FooterSeals recebe apenas as strings",
    );
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

  it("CTA flutuante único do WhatsApp: uma só cápsula clicável", () => {
    assert.match(shell, /whatsappHref &&/, "botão de WhatsApp não pode sumir");
    // um único elemento flutuante fixo no shell (nada de duplicar)
    assert.equal(
      shell.match(/fixed bottom-\[calc/g)?.length,
      1,
      "apenas um CTA flutuante de WhatsApp",
    );
    // ícone + texto dentro do MESMO <a> (um só link, uma só ação)
    assert.match(shell, /aria-label=\{strings\.whatsappBuyAria\}/);
    assert.match(shell, /\{strings\.whatsappBuy\}/);
    assert.match(shell, /WhatsAppIcon className="size-5"/);
    assert.ok(!shell.includes("size-12"), "antigo botão circular eliminado");
  });

  it("cápsula no canto inferior direito, safe-area e pulso suave", () => {
    assert.match(shell, /end-4 z-40/, "inferior direito (logical end)");
    assert.match(
      shell,
      /bottom-\[calc\(1rem_\+_env\(safe-area-inset-bottom\)\)\]/,
      "bottom do botão deve respeitar a safe-area",
    );
    assert.match(shell, /sf-wa-cta/, "classe do pulso aplicada");
    const css = readFileSync(path.join(PROJECT, "src/app/globals.css"), "utf8");
    assert.match(css, /@keyframes sf-wa-cta-pulse/, "keyframes do pulso");
    assert.match(
      css,
      /prefers-reduced-motion: reduce/,
      "reduced-motion global zera a animação",
    );
  });

  it("checkout continua sem rodapé e sem botão flutuante", () => {
    const idx = shell.indexOf("<footer");
    const guardStart = shell.lastIndexOf("{!isCheckout", idx);
    assert.notEqual(guardStart, -1, "rodapé precisa continuar escondido no checkout");
    assert.match(shell, /\{!isCheckout && whatsappHref && \(/);
  });
});
