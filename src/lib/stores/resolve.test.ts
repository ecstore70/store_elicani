import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractStoreSlug, storePublicUrl } from "./resolve.ts";

const DOMAIN = "elicani.site";

describe("extractStoreSlug — {slug}.elicani.site → slug", () => {
  it("resolve lojas reais", () => {
    assert.equal(extractStoreSlug("maria.elicani.site", DOMAIN), "maria");
    assert.equal(
      extractStoreSlug("moda-fashion.elicani.site", DOMAIN),
      "moda-fashion",
    );
  });

  it("ignora a porta e a caixa alta do host", () => {
    assert.equal(extractStoreSlug("maria.elicani.site:3000", DOMAIN), "maria");
    assert.equal(extractStoreSlug("MARIA.Elicani.SITE", DOMAIN), "maria");
  });

  it("ignora o apex", () => {
    assert.equal(extractStoreSlug("elicani.site", DOMAIN), null);
    assert.equal(extractStoreSlug("elicani.site.", DOMAIN), null);
  });

  it("ignora subdomínios reservados do produto", () => {
    for (const host of [
      "www.elicani.site",
      "app.elicani.site",
      "api.elicani.site",
      "admin.elicani.site",
      "store.elicani.site",
      "status.elicani.site",
      "docs.elicani.site",
    ]) {
      assert.equal(extractStoreSlug(host, DOMAIN), null, host);
    }
  });

  it("ignora domínios alheios e hosts vazios", () => {
    assert.equal(extractStoreSlug("maria.outro-site.com", DOMAIN), null);
    assert.equal(extractStoreSlug("maria.elicani.site.com", DOMAIN), null);
    assert.equal(extractStoreSlug("", DOMAIN), null);
    assert.equal(extractStoreSlug(null, DOMAIN), null);
    assert.equal(extractStoreSlug(undefined, DOMAIN), null);
  });

  it("ignora subdomínios aninhados e slugs inválidos", () => {
    assert.equal(extractStoreSlug("a.b.elicani.site", DOMAIN), null);
    assert.equal(extractStoreSlug("-invalid.elicani.site", DOMAIN), null);
    assert.equal(extractStoreSlug("ab.elicani.site", DOMAIN), null);
    assert.equal(extractStoreSlug("tem_espaco.elicani.site", DOMAIN), null);
  });
});

describe("storePublicUrl", () => {
  it("monta a URL pública com o esquema certo", () => {
    assert.equal(storePublicUrl("maria", DOMAIN), "https://maria.elicani.site");
    assert.equal(storePublicUrl("maria", "localhost"), "http://maria.localhost");
  });
});
