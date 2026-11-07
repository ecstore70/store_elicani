import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CATALOG_DELETE_WORD, isCatalogDeleteConfirmation } from "./lifecycle.ts";

describe("confirmação de exclusão do catálogo", () => {
  it("só a palavra exata confirma", () => {
    assert.equal(CATALOG_DELETE_WORD, "DELETE");
    assert.equal(isCatalogDeleteConfirmation("DELETE"), true);
  });

  it("não é case-insensitive — variações não habilitam a exclusão", () => {
    assert.equal(isCatalogDeleteConfirmation("delete"), false);
    assert.equal(isCatalogDeleteConfirmation("Delete"), false);
    assert.equal(isCatalogDeleteConfirmation("DELETe"), false);
  });

  it("ignora apenas espaços à volta", () => {
    assert.equal(isCatalogDeleteConfirmation("  DELETE  "), true);
    assert.equal(isCatalogDeleteConfirmation("\tDELETE\n"), true);
  });

  it("rejeita vazio, parcial ou texto colado", () => {
    assert.equal(isCatalogDeleteConfirmation(""), false);
    assert.equal(isCatalogDeleteConfirmation("   "), false);
    assert.equal(isCatalogDeleteConfirmation("DELET"), false);
    assert.equal(isCatalogDeleteConfirmation("DELETE it"), false);
    assert.equal(isCatalogDeleteConfirmation("XXDELETE"), false);
  });
});
