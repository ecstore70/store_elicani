import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import manifest from "../../app/manifest.ts";
import { PLATFORM_ICONS, PLATFORM_OG_IMAGE } from "../stores/metadata.ts";

/**
 * Identidade de favicon/app-icon — a ÚNICA estratégia é a Elicani.
 *
 * O projeto já sofreu a migração completa para fora do starter
 * Next.js/Vercel: os assets de template (`public/next.svg`, `vercel.svg`,
 * `file.svg`, `globe.svg`, `window.svg` e o favicon.ico original) foram
 * removidos e substituídos pelos assets oficiais em `public/brand/`.
 *
 * Regra arquitetural desta geração (ver src/lib/stores/metadata.ts):
 *  1. file-conventions de ícone em `src/app/` (favicon.ico, icon.svg,
 *     apple-icon.png) são PROIBIDAS — o Next as anteponha no <head> às
 *     declarações do segmento filho e o favicon configurado pelo
 *     comerciante perderia sempre para o da plataforma;
 *  2. a fonte de verdade é o objeto `metadata.icons` do root layout
 *     (PLATFORM_ICONS), que as páginas de loja/produto substituem quando o
 *     comerciante tem branding próprio (e herdam quando não têm);
 *  3. `public/favicon.ico` continua a responder a pedidos diretos legados
 *     (`/favicon.ico`) com os bytes da marca — fora de `src/app/` não gera
 *     nenhuma declaração automática.
 *
 * Roda com `npm test` (cwd = raiz do repositório).
 */
const ROOT = process.cwd();

function bytes(relative: string): Buffer {
  return readFileSync(path.join(ROOT, relative));
}

describe("brand: favicon/app-icon", () => {
  it("public/favicon.ico é exatamente o favicon da marca Elicani", () => {
    assert.ok(existsSync(path.join(ROOT, "public/favicon.ico")));
    assert.ok(
      bytes("public/favicon.ico").equals(
        bytes("public/brand/elicani-favicon.ico"),
      ),
      "public/favicon.ico diverge de public/brand/elicani-favicon.ico",
    );
  });

  it("nenhuma file-convention de ícone em src/app/ (fonte única: metadata)", () => {
    for (const file of ["favicon.ico", "icon.svg", "apple-icon.png"]) {
      assert.ok(
        !existsSync(path.join(ROOT, "src/app", file)),
        `src/app/${file} reintroduzida — geraria declaração automática no <head> e sobreporia o favicon do comerciante`,
      );
    }
  });

  it("root layout declara os ícones da plataforma via PLATFORM_ICONS", () => {
    const layout = bytes("src/app/layout.tsx").toString("utf8");
    assert.match(layout, /icons:\s*PLATFORM_ICONS/);

    const icons = PLATFORM_ICONS as {
      icon?: Array<{ url: string }>;
      apple?: Array<{ url: string }>;
    };
    const urls = [...(icons.icon ?? []), ...(icons.apple ?? [])];
    assert.ok(urls.length >= 3, "plataforma declara ico + svg + apple");
    for (const entry of urls) {
      assert.match(entry.url, /^\/(favicon\.ico|brand\/elicani-)/);
      assert.ok(
        existsSync(path.join(ROOT, "public", entry.url.replace(/^\//, ""))),
        `asset em falta: ${entry.url}`,
      );
    }
  });

  it("og:image da plataforma existe em public/brand/", () => {
    assert.equal(PLATFORM_OG_IMAGE, "/brand/elicani-og.png");
    assert.ok(existsSync(path.join(ROOT, "public", PLATFORM_OG_IMAGE.slice(1))));
  });

  it("assets de marca oficiais presentes e o SVG carrega o nome Elicani", () => {
    assert.match(
      bytes("public/brand/elicani-favicon.svg").toString("utf8"),
      /Elicani/,
    );
    for (const asset of [
      "elicani-favicon.ico",
      "elicani-apple-icon.png",
      "elicani-og.png",
      "elicani-logo.svg",
      "elicani-mark.svg",
      "elicani-icon-192.png",
      "elicani-icon-512.png",
    ]) {
      assert.ok(
        existsSync(path.join(ROOT, "public/brand", asset)),
        `public/brand/${asset} em falta`,
      );
    }
  });

  it("nenhum asset de template Next.js/Vercel no repositório", () => {
    for (const asset of [
      "next.svg",
      "vercel.svg",
      "file.svg",
      "globe.svg",
      "window.svg",
      "icon.svg",
      "apple-icon.png",
    ]) {
      assert.ok(
        !existsSync(path.join(ROOT, "public", asset)),
        `public/${asset} é asset de template ou duplicado`,
      );
      assert.ok(
        !existsSync(path.join(ROOT, "src/app", asset)),
        `src/app/${asset} proibido (file-conventions conflitam com a identidade da loja)`,
      );
    }
  });

  it("manifest usa exclusivamente ícones da marca", () => {
    const route = manifest();
    assert.equal(route.name, "Elicani");
    assert.ok(Array.isArray(route.icons) && route.icons.length > 0);
    for (const icon of route.icons) {
      assert.match(icon.src, /^\/brand\/elicani-/);
    }
  });
});
