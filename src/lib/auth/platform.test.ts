import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isPlatformOwner } from "./platform.ts";

describe("isPlatformOwner", () => {
  it("aceita apenas a claim platform_owner === true em app_metadata", () => {
    assert.equal(isPlatformOwner({ app_metadata: { platform_owner: true } }), true);
  });

  it("rejeita claim ausente, falsa ou de outro tipo", () => {
    assert.equal(isPlatformOwner({ app_metadata: {} }), false);
    assert.equal(isPlatformOwner({ app_metadata: { platform_owner: false } }), false);
    assert.equal(isPlatformOwner({ app_metadata: { platform_owner: "true" } }), false);
    assert.equal(
      isPlatformOwner({ app_metadata: { provider: "google", providers: ["google"] } }),
      false,
    );
  });

  it("rejeita usuário nulo/indefinido", () => {
    assert.equal(isPlatformOwner(null), false);
    assert.equal(isPlatformOwner(undefined), false);
  });

  it("NÃO aceita a elevação vinda de user_metadata", () => {
    // user_metadata é gravável pelo próprio usuário — nunca autoriza.
    const forged = {
      app_metadata: { provider: "google" },
      user_metadata: { platform_owner: true },
    };
    assert.equal(isPlatformOwner(forged), false);
  });
});
