import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ACTIVE_STORE_COOKIE, pickActiveStore } from "./active.ts";

/** Lista ordenada por criação (mais antiga primeiro) — como a query devolve. */
const stores = [
  { id: "store-1", name: "João Fashion" },
  { id: "store-2", name: "João Foods" },
  { id: "store-3", name: "João Electronics" },
];

describe("pickActiveStore — contexto ativo do multi-catalog", () => {
  it("sem lojas → null (onboarding)", () => {
    assert.equal(pickActiveStore([], null), null);
    assert.equal(pickActiveStore([], "store-2"), null);
  });

  it("uma loja → ela mesma, ignora qualquer cookie", () => {
    const only = [stores[0]];
    assert.equal(pickActiveStore(only, null), stores[0]);
    // Cookie de outra conta ou de loja apagada não muda o caso de uso
    // de uma única loja: o fluxo existente nunca dependeu de cookie.
    assert.equal(pickActiveStore(only, "forjado"), stores[0]);
  });

  it("cookie válido → a loja escolhida", () => {
    assert.equal(pickActiveStore(stores, "store-2"), stores[1]);
    assert.equal(pickActiveStore(stores, "store-1"), stores[0]);
    assert.equal(pickActiveStore(stores, "store-3"), stores[2]);
  });

  it("cookie ausente → a mais recente (última da lista)", () => {
    assert.equal(pickActiveStore(stores, null), stores[2]);
  });

  it("cookie inválido/expirado → fallback determinístico (mais recente)", () => {
    assert.equal(pickActiveStore(stores, "loja-apagada"), stores[2]);
    assert.equal(pickActiveStore(stores, ""), stores[2]);
  });

  it("id de OUTRA conta nunca casa com a lista → fallback do próprio dono", () => {
    const picked = pickActiveStore(stores, "loja-de-outro-lojista");
    assert.ok(picked, "o contexto ativa vem sempre da lista do próprio dono");
    assert.ok(stores.includes(picked));
    assert.equal(picked, stores[2]);
  });

  it("nunca devolve uma loja fora da lista (posse validada)", () => {
    for (const activeId of [null, "", "x", "store-2", "STORE-2"]) {
      const picked = pickActiveStore(stores, activeId);
      assert.ok(
        picked === null || stores.includes(picked),
        `id inesperado: ${activeId}`,
      );
    }
  });

  it("o nome do cookie segue o padrão elicani_*", () => {
    assert.equal(ACTIVE_STORE_COOKIE, "elicani_active_store");
  });
});
