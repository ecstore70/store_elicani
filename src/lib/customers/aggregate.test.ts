import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  customerKey,
  summarizeCustomers,
  type CustomerOrderRow,
} from "./aggregate.ts";

function row(overrides: Partial<CustomerOrderRow> = {}): CustomerOrderRow {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    reference: "AAAA11",
    status: "pending",
    total: 100,
    createdAt: "2026-01-01T10:00:00.000Z",
    customerName: "João Manuel",
    customerPhone: "+258 84 123 4567",
    ...overrides,
  };
}

describe("customers: chave do cliente", () => {
  it("normaliza para só dígitos — formatação não divide clientes", () => {
    assert.equal(customerKey("+258 84 123 4567"), "258841234567");
    assert.equal(customerKey("258841234567"), "258841234567");
    assert.equal(customerKey("+258 (84) 123-4567"), "258841234567");
  });

  it("telefone sem dígitos cai para trecho URL-seguro (nunca vazio)", () => {
    assert.equal(customerKey("  N/A  "), "n-a");
    assert.equal(customerKey("   "), "sem-telefone");
  });
});

describe("customers: agregação", () => {
  it("agrupa por telefone e soma só vendas válidas", () => {
    const customers = summarizeCustomers([
      row({ id: "a", total: 500, status: "completed" }),
      row({ id: "b", total: 350, status: "pending" }),
      row({ id: "c", total: 999, status: "cancelled" }),
      row({
        id: "d",
        total: 700,
        status: "pending",
        customerPhone: "+258841234567", // mesma pessoa, outra formatação
        customerName: "Maria Silva",
        createdAt: "2026-02-01T10:00:00.000Z",
      }),
    ]);

    assert.equal(customers.length, 1);
    const cliente = customers[0];
    assert.equal(cliente.key, "258841234567");
    // 3 válidas (500 + 350 + 700); a cancelada (999) fica de fora
    assert.equal(cliente.orderCount, 3);
    assert.equal(cliente.totalSpent, 1550);
    // última encomenda (a de fev) manda no nome exibido
    assert.equal(cliente.displayName, "Maria Silva");
    assert.equal(cliente.history.length, 4); // histórico mostra TODAS
  });

  it("histórico ordenado do mais recente para o mais antigo", () => {
    const customers = summarizeCustomers([
      row({ id: "antiga", createdAt: "2026-01-01T10:00:00.000Z" }),
      row({ id: "nova", createdAt: "2026-03-01T10:00:00.000Z" }),
      row({ id: "meio", createdAt: "2026-02-01T10:00:00.000Z" }),
    ]);
    assert.deepEqual(
      customers[0].history.map((order) => order.id),
      ["nova", "meio", "antiga"],
    );
    assert.equal(customers[0].lastOrderAt, "2026-03-01T10:00:00.000Z");
  });

  it("lista ordenada pela última encomenda (depois nome)", () => {
    const customers = summarizeCustomers([
      row({
        id: "a",
        customerPhone: "111",
        customerName: "Zé",
        createdAt: "2026-01-01T10:00:00.000Z",
      }),
      row({
        id: "b",
        customerPhone: "222",
        customerName: "Ana",
        createdAt: "2026-03-01T10:00:00.000Z",
      }),
      row({
        id: "c",
        customerPhone: "333",
        customerName: "Bia",
        createdAt: "2026-02-01T10:00:00.000Z",
      }),
    ]);
    assert.deepEqual(
      customers.map((customer) => customer.displayName),
      ["Ana", "Bia", "Zé"],
    );
  });

  it("só canceladas: conta 0, total 0, mas o histórico existe", () => {
    const customers = summarizeCustomers([
      row({ status: "cancelled", total: 400 }),
    ]);
    assert.equal(customers[0].orderCount, 0);
    assert.equal(customers[0].totalSpent, 0);
    assert.equal(customers[0].history.length, 1);
    assert.equal(customers[0].history[0].status, "cancelled");
  });

  it("total não numérico é tratado como 0 (não vira NaN)", () => {
    const customers = summarizeCustomers([
      row({ total: Number.NaN as unknown as number }),
    ]);
    assert.equal(customers[0].totalSpent, 0);
  });

  it("entradas vazias → lista vazia", () => {
    assert.deepEqual(summarizeCustomers([]), []);
  });
});
