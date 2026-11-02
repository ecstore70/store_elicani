import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import manifest from "../../app/manifest.ts";

/**
 * Identidade de favicon/app-icon — a ÚNICA estratégia é a Elicani.
 *
 * O projeto já sofreu a migração completa para fora do starter
 * Next.js/Vercel (commit da identidade visual): os assets de template
 * (`public/next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg`
 * e o favicon.ico original) foram removidos e substituídos pelos assets
 * oficiais em `public/brand/`. Estas verificações impedem que qualquer
 * cópia de template volte ao repositório e garantem que os file-conventions
 * do App Router (`src/app/favicon.ico`, `icon.svg`, `apple-icon.png`) são
 * byte-a-byte os assets da marca — não há duas fontes de verdade.
 *
 * Roda com `npm test` (cwd = raiz do repositório).
 */
const ROOT = process.cwd();

function bytes(relative: string): Buffer {
  return readFileSync(path.join(ROOT, relative));
}

describe("brand: favicon/app-icon", () => {
  it("src/app/favicon.ico é exatamente o favicon da marca Elicani", () => {
    assert.ok(existsSync(path.join(ROOT, "src/app/favicon.ico")));
    assert.ok(
      bytes("src/app/favicon.ico").equals(bytes("public/brand/elicani-favicon.ico")),
      "src/app/favicon.ico diverge de public/brand/elicani-favicon.ico",
    );
  });

  it("src/app/icon.svg é exatamente o SVG de favicon da marca", () => {
    assert.ok(
      bytes("src/app/icon.svg").equals(bytes("public/brand/elicani-favicon.svg")),
      "src/app/icon.svg diverge de public/brand/elicani-favicon.svg",
    );
    // O SVG carrega o próprio nome da marca — nunca o ícone do template.
    assert.match(bytes("src/app/icon.svg").toString("utf8"), /Elicani/);
  });

  it("src/app/apple-icon.png é exatamente o apple-touch icon da marca", () => {
    assert.ok(
      bytes("src/app/apple-icon.png").equals(
        bytes("public/brand/elicani-apple-icon.png"),
      ),
      "src/app/apple-icon.png diverge de public/brand/elicani-apple-icon.png",
    );
  });

  it("nenhum asset de favicon/logo do starter Next.js/Vercel existe", () => {
    const templateAssets = [
      "public/next.svg",
      "public/vercel.svg",
      "public/file.svg",
      "public/globe.svg",
      "public/window.svg",
      "public/favicon.ico",
      "public/favicon.svg",
      "public/icon.svg",
    ];
    for (const asset of templateAssets) {
      assert.ok(
        !existsSync(path.join(ROOT, asset)),
        `asset de template ainda presente: ${asset}`,
      );
    }
  });

  it("manifest usa exclusivamente ícones da marca Elicani", () => {
    const route = manifest();
    assert.equal(route.name, "Elicani");
    assert.equal(route.short_name, "Elicani");
    const icons = route.icons;
    assert.ok(icons && icons.length >= 2);
    for (const icon of icons) {
      assert.match(
        icon.src,
        /^\/brand\/elicani-icon-(192|512)\.png$/,
        `ícone de manifest fora da marca: ${icon.src}`,
      );
    }
  });
});
