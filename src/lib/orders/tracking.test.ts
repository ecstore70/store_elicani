/**
 * Estado público da encomenda — parser defensivo + linha do tempo.
 *
 * O parser é a última barreira antes do render: payload quebrado tem de
 * virar `null` (404), nunca dados a meio. Os passos cobrem o fluxo normal
 * e os estados FORA do fluxo (cancelada/falhada) que a página trata à
 * parte.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  deliveryStatusSteps,
  isDeliveryInFlow,
  isOrderInFlow,
  orderStatusSteps,
  parseOrderTracking,
} from "./tracking.ts";

const VALID = {
  reference: "A3F9C2",
  status: "confirmed",
  delivery_status: "preparing",
  created_at: "2026-11-26T12:00:00Z",
  subtotal: 100,
  delivery_fee: 10,
  total: 110,
  items: [
    {
      name: "T-shirt",
      qty: 2,
      unit_price: 50,
      options: [{ groupLabel: "Size", choiceLabel: "M", priceDelta: 0 }],
    },
  ],
};

describe("parseOrderTracking", () => {
  it("aceita o payload completo do RPC (forma camelsCase)", () => {
    const parsed = parseOrderTracking(VALID);
    assert.ok(parsed);
    assert.equal(parsed.reference, "A3F9C2");
    assert.equal(parsed.status, "confirmed");
    assert.equal(parsed.deliveryStatus, "preparing");
    assert.equal(parsed.createdAt, "2026-11-26T12:00:00Z");
    assert.equal(parsed.subtotal, 100);
    assert.equal(parsed.deliveryFee, 10);
    assert.equal(parsed.total, 110);
    assert.equal(parsed.items.length, 1);
    assert.equal(parsed.items[0].name, "T-shirt");
    assert.equal(parsed.items[0].qty, 2);
    assert.equal(parsed.items[0].unitPrice, 50);
    assert.deepEqual(parsed.items[0].options, [
      { groupLabel: "Size", choiceLabel: "M" },
    ]);
  });

  it("aceita delivery_fee null e sem itens", () => {
    const parsed = parseOrderTracking({
      ...VALID,
      delivery_fee: null,
      items: [],
    });
    assert.ok(parsed);
    assert.equal(parsed.deliveryFee, null);
    assert.deepEqual(parsed.items, []);
  });

  it("rejeita null, primitivos e objetos incompletos", () => {
    assert.equal(parseOrderTracking(null), null);
    assert.equal(parseOrderTracking("A3F9C2"), null);
    assert.equal(parseOrderTracking({}), null);
    assert.equal(parseOrderTracking({ ...VALID, reference: "" }), null);
  });

  it("rejeita estados fora dos constraints da base de dados", () => {
    assert.equal(parseOrderTracking({ ...VALID, status: "shipped" }), null);
    assert.equal(
      parseOrderTracking({ ...VALID, delivery_status: "lost" }),
      null,
    );
  });

  it("rejeita datas que new Date() não interpreta", () => {
    assert.equal(parseOrderTracking({ ...VALID, created_at: "ontem" }), null);
    assert.equal(parseOrderTracking({ ...VALID, created_at: 42 }), null);
  });

  it("rejeita totais negativos, NaN e delivery_fee malformado", () => {
    assert.equal(parseOrderTracking({ ...VALID, total: -1 }), null);
    assert.equal(parseOrderTracking({ ...VALID, subtotal: NaN }), null);
    assert.equal(parseOrderTracking({ ...VALID, delivery_fee: "10" }), null);
  });

  it("rejeita itens malformados (nome, qty e opções)", () => {
    assert.equal(
      parseOrderTracking({ ...VALID, items: [{ ...VALID.items[0], qty: 0 }] }),
      null,
    );
    assert.equal(
      parseOrderTracking({
        ...VALID,
        items: [{ ...VALID.items[0], name: "" }],
      }),
      null,
    );
    assert.equal(
      parseOrderTracking({
        ...VALID,
        items: [{ ...VALID.items[0], options: ["Size"] }],
      }),
      null,
    );
    assert.equal(
      parseOrderTracking({
        ...VALID,
        items: [{ ...VALID.items[0], options: [{ groupLabel: 1 }] }],
      }),
      null,
    );
    assert.equal(parseOrderTracking({ ...VALID, items: "nada" }), null);
  });
});

describe("linha do tempo", () => {
  it("encomenda: pending → confirmed → completed com estados done/current/todo", () => {
    assert.deepEqual(orderStatusSteps("pending"), [
      { value: "pending", state: "current" },
      { value: "confirmed", state: "todo" },
      { value: "completed", state: "todo" },
    ]);
    assert.deepEqual(orderStatusSteps("confirmed"), [
      { value: "pending", state: "done" },
      { value: "confirmed", state: "current" },
      { value: "completed", state: "todo" },
    ]);
    assert.deepEqual(orderStatusSteps("completed"), [
      { value: "pending", state: "done" },
      { value: "confirmed", state: "done" },
      { value: "completed", state: "current" },
    ]);
  });

  it("entrega: quatro passos; cancelada/falhada ficam FORA do fluxo", () => {
    assert.equal(deliveryStatusSteps("on_the_way").length, 4);
    assert.equal(
      deliveryStatusSteps("on_the_way")[2].state,
      "current",
    );
    assert.equal(isOrderInFlow("cancelled"), false);
    assert.equal(isOrderInFlow("pending"), true);
    assert.equal(isDeliveryInFlow("failed"), false);
    assert.equal(isDeliveryInFlow("delivered"), true);
  });
});
