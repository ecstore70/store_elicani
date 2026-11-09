import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  aggregateReport,
  isValidSale,
  type ReportItemRow,
  type ReportOrderRow,
} from "./aggregate.ts";

const UTC = "UTC";

function order(overrides: Partial<ReportOrderRow> = {}): ReportOrderRow {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    status: "pending",
    total: 100,
    createdAt: "2026-01-01T10:00:00.000Z",
    customerName: "Cliente",
    payment: null,
    ...overrides,
  };
}

function item(overrides: Partial<ReportItemRow> = {}): ReportItemRow {
  return {
    name: "Produto",
    qty: 1,
    unitPrice: 50,
    productId: "22222222-2222-4222-8222-222222222222",
    orderStatus: "pending",
    orderCreatedAt: "2026-01-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("aggregate: regra de venda válida (whitelist)", () => {
  it("pendente/confirmado/concluído contam; cancelado e desconhecidos não", () => {
    assert.ok(isValidSale("pending"));
    assert.ok(isValidSale("confirmed"));
    assert.ok(isValidSale("completed"));
    assert.ok(!isValidSale("cancelled"));
    assert.ok(!isValidSale("qualquer-coisa")); // estado futuro: não vira venda
  });
});

describe("aggregate: KPIs", () => {
  it("soma vendas, conta pedidos e calcula ticket médio (cancelados fora)", () => {
    const data = aggregateReport({
      orders: [
        order({ total: 100 }),
        order({ total: 200, status: "confirmed" }),
        order({ total: 999, status: "cancelled" }),
      ],
      items: [],
      fromKey: "2026-01-01",
      days: 1,
      timeZone: UTC,
    });

    assert.equal(data.empty, false);
    assert.equal(data.kpis.sales, 300);
    assert.equal(data.kpis.orderCount, 2);
    assert.equal(data.kpis.avgOrder, 150);
  });

  it("ticket médio arredonda a 2 casas", () => {
    const data = aggregateReport({
      orders: [order({ total: 100 }), order({ total: 100 }), order({ total: 101 })],
      items: [],
      fromKey: "2026-01-01",
      days: 1,
      timeZone: UTC,
    });
    // 301 / 3 = 100.333… → 100.33
    assert.equal(data.kpis.avgOrder, 100.33);
  });

  it("sem pedidos válidos: zeros coerentes (não NaN)", () => {
    const data = aggregateReport({
      orders: [order({ status: "cancelled" })],
      items: [item({ orderStatus: "cancelled" })],
      fromKey: "2026-01-01",
      days: 1,
      timeZone: UTC,
    });
    assert.equal(data.empty, false); // há pedido (cancelado) — não é "sem dados"
    assert.equal(data.kpis.sales, 0);
    assert.equal(data.kpis.orderCount, 0);
    assert.equal(data.kpis.avgOrder, 0);
    assert.equal(data.kpis.itemsSold, 0);
    assert.equal(data.statuses.cancelled, 1);
    assert.equal(data.recent.length, 0);
    assert.equal(data.topProducts.length, 0);
  });

  it("estado vazio de verdade: nenhum pedido no período", () => {
    const data = aggregateReport({
      orders: [],
      items: [],
      fromKey: "2026-01-01",
      days: 7,
      timeZone: UTC,
    });
    assert.equal(data.empty, true);
    assert.equal(data.series.length, 7);
    assert.ok(data.series.every((point) => point.sales === 0 && point.orders === 0));
  });

  it("unidades vendidas ignoram linhas de encomendas canceladas", () => {
    const data = aggregateReport({
      orders: [
        order({ id: "a", status: "pending" }),
        order({ id: "b", status: "cancelled", createdAt: "2026-01-01T11:00:00.000Z" }),
      ],
      items: [
        item({ qty: 3, orderStatus: "pending" }),
        item({ qty: 50, orderStatus: "cancelled" }),
      ],
      fromKey: "2026-01-01",
      days: 1,
      timeZone: UTC,
    });
    assert.equal(data.kpis.itemsSold, 3);
  });
});

describe("aggregate: série diária", () => {
  it("preenche zeros e soma por dia local", () => {
    const data = aggregateReport({
      orders: [
        order({ total: 100, createdAt: "2026-01-01T10:00:00.000Z" }),
        order({ total: 50, createdAt: "2026-01-03T10:00:00.000Z" }),
      ],
      items: [],
      fromKey: "2026-01-01",
      days: 5,
      timeZone: UTC,
    });
    assert.deepEqual(
      data.series.map((p) => [p.dateKey, p.sales, p.orders]),
      [
        ["2026-01-01", 100, 1],
        ["2026-01-02", 0, 0],
        ["2026-01-03", 50, 1],
        ["2026-01-04", 0, 0],
        ["2026-01-05", 0, 0],
      ],
    );
  });

  it("agrupa pelo DIA LOCAL da loja (não por UTC)", () => {
    // 03:00 UTC de 2 Jan = 22:00 de 1 Jan em Nova Iorque (EST, -5).
    const data = aggregateReport({
      orders: [order({ total: 70, createdAt: "2026-01-02T03:00:00.000Z" })],
      items: [],
      fromKey: "2026-01-01",
      days: 2,
      timeZone: "America/New_York",
    });
    assert.equal(data.series[0].sales, 70); // dia 1 local
    assert.equal(data.series[1].sales, 0); // dia 2 local
  });

  it("pedidos fora do período não corrompem a série", () => {
    const data = aggregateReport({
      orders: [order({ total: 100, createdAt: "2026-02-01T10:00:00.000Z" })],
      items: [],
      fromKey: "2026-01-01",
      days: 3,
      timeZone: UTC,
    });
    assert.ok(data.series.every((p) => p.sales === 0));
    // mas o KPI é soma das linhas recebidas (a consulta é quem filtra)
    assert.equal(data.kpis.sales, 100);
  });
});

describe("aggregate: estados", () => {
  it("conta os quatro estados existentes", () => {
    const data = aggregateReport({
      orders: [
        order({ status: "pending" }),
        order({ status: "pending" }),
        order({ status: "confirmed" }),
        order({ status: "completed" }),
        order({ status: "cancelled" }),
      ],
      items: [],
      fromKey: "2026-01-01",
      days: 1,
      timeZone: UTC,
    });
    assert.deepEqual(data.statuses, {
      pending: 2,
      confirmed: 1,
      completed: 1,
      cancelled: 1,
    });
  });
});

describe("aggregate: top produtos", () => {
  it("ordena por unidades, calcula receita e participação", () => {
    const data = aggregateReport({
      orders: [order({ total: 300 })],
      items: [
        item({ name: "Pouco", qty: 2, unitPrice: 50, productId: "p1" }),
        item({ name: "Muito", qty: 10, unitPrice: 20, productId: "p2" }),
      ],
      fromKey: "2026-01-01",
      days: 1,
      timeZone: UTC,
    });
    assert.deepEqual(
      data.topProducts.map((p) => [p.name, p.qty, p.revenue, p.share]),
      [
        ["Muito", 10, 200, 0.6667],
        ["Pouco", 2, 100, 0.3333],
      ],
    );
  });

  it("agrupa por produto mesmo com renome (snapshot)", () => {
    const data = aggregateReport({
      orders: [order({ total: 300 })],
      items: [
        item({ name: "Nome antigo", qty: 1, unitPrice: 100, productId: "p1" }),
        item({ name: "Nome novo", qty: 2, unitPrice: 100, productId: "p1" }),
      ],
      fromKey: "2026-01-01",
      days: 1,
      timeZone: UTC,
    });
    assert.equal(data.topProducts.length, 1);
    assert.equal(data.topProducts[0].qty, 3);
    assert.equal(data.topProducts[0].revenue, 300);
  });

  it("produto apagado (productId nulo) agrupa por nome", () => {
    const data = aggregateReport({
      orders: [order({ total: 200 })],
      items: [
        item({ name: "Apagado", qty: 1, unitPrice: 100, productId: null }),
        item({ name: "Apagado", qty: 1, unitPrice: 100, productId: null }),
        item({ name: "Outro", qty: 5, unitPrice: 10, productId: null }),
      ],
      fromKey: "2026-01-01",
      days: 1,
      timeZone: UTC,
    });
    const names = data.topProducts.map((p) => `${p.name}:${p.qty}`);
    assert.deepEqual(names, ["Outro:5", "Apagado:2"]); //5 unidades vence 2
  });

  it("respeita o limite e exclui itens de encomendas canceladas", () => {
    const items = Array.from({ length: 15 }, (_, index) =>
      item({ name: `P${index}`, qty: index + 1, productId: `p${index}` }),
    );
    items.push(item({ name: "Cancelado", qty: 999, productId: "px", orderStatus: "cancelled" }));
    const data = aggregateReport({
      orders: [order({ total: 1000 })],
      items,
      fromKey: "2026-01-01",
      days: 1,
      timeZone: UTC,
      topLimit: 5,
    });
    assert.equal(data.topProducts.length, 5);
    assert.equal(data.topProducts[0].qty, 15); // não o cancelado (999)
  });
});

describe("aggregate: recentes", () => {
  it("só válidos, do mais recente para o mais antigo, com limite", () => {
    const data = aggregateReport({
      orders: [
        order({ id: "antigo", createdAt: "2026-01-01T10:00:00.000Z" }),
        order({ id: "novo", createdAt: "2026-01-03T10:00:00.000Z" }),
        order({ id: "meio", createdAt: "2026-01-02T10:00:00.000Z" }),
        order({ id: "cancelado", status: "cancelled", createdAt: "2026-01-04T10:00:00.000Z" }),
      ],
      items: [],
      fromKey: "2026-01-01",
      days: 3,
      timeZone: UTC,
      recentLimit: 2,
    });
    assert.deepEqual(
      data.recent.map((r) => r.id),
      ["novo", "meio"],
    );
  });
});
