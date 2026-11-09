import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  countByDeliveryStatus,
  isDeliveryStatus,
  DELIVERY_STATUSES,
} from "./status.ts";

describe("delivery: estados válidos", () => {
  it("aceita os quatro estados e rejeita o resto", () => {
    for (const status of DELIVERY_STATUSES) {
      assert.ok(isDeliveryStatus(status));
    }
    assert.ok(!isDeliveryStatus("pending ")); // espaços contam
    assert.ok(!isDeliveryStatus("shipped"));
    assert.ok(!isDeliveryStatus(42));
  });
});

describe("delivery: contagens", () => {
  it("conta por estado e ignora valores desconhecidos", () => {
    const counts = countByDeliveryStatus([
      { delivery_status: "pending" },
      { delivery_status: "pending" },
      { delivery_status: "preparing" },
      { delivery_status: "on_the_way" },
      { delivery_status: "delivered" },
      { delivery_status: "delivered" },
      { delivery_status: "delivered" },
      { delivery_status: "estranho" }, // não corrompe
    ]);
    assert.deepEqual(counts, {
      pending: 2,
      preparing: 1,
      on_the_way: 1,
      delivered: 3,
    });
  });

  it("sem linhas → zeros coerentes", () => {
    assert.deepEqual(countByDeliveryStatus([]), {
      pending: 0,
      preparing: 0,
      on_the_way: 0,
      delivered: 0,
    });
  });
});
