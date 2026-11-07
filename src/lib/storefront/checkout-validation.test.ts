import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isCheckoutComplete,
  isPhoneValid,
  validateCheckout,
  validateCheckoutField,
  type CheckoutForm,
} from "./checkout-validation.ts";

// Strings mínimas para o teste — o módulo é puro e não importa catálogo.
const strings = {
  nameRequired: "Name required",
  phoneRequired: "Phone required",
  neighborhoodRequired: "Location required",
};

function form(overrides: Partial<CheckoutForm> = {}): CheckoutForm {
  return {
    name: "",
    phone: "",
    address: "",
    neighborhood: "",
    reference: "",
    notes: "",
    payment: "",
    ...overrides,
  };
}

describe("validação do checkout", () => {
  it("nome: obrigatório, aceita espaços à volta mas exige conteúdo", () => {
    assert.equal(
      validateCheckoutField("name", form(), strings),
      "Name required",
    );
    assert.equal(
      validateCheckoutField("name", form({ name: "   " }), strings),
      "Name required",
    );
    assert.equal(
      validateCheckoutField("name", form({ name: "João Manuel" }), strings),
      undefined,
    );
  });

  it("telefone: exige 7+ dígitos (ignora espaços, +, parênteses)", () => {
    assert.ok(!isPhoneValid("123456"));
    assert.ok(isPhoneValid("84 123 4567"));
    assert.ok(isPhoneValid("+258 84 123 456"));
    assert.ok(!isPhoneValid("abcdefgh"));
    assert.equal(
      validateCheckoutField("phone", form({ phone: "12" }), strings),
      "Phone required",
    );
    assert.equal(
      validateCheckoutField("phone", form({ phone: "841234567" }), strings),
      undefined,
    );
  });

  it("localização/bairro: obrigatório (o comerciante precisa dele para entregar)", () => {
    assert.equal(
      validateCheckoutField("neighborhood", form(), strings),
      "Location required",
    );
    assert.equal(
      validateCheckoutField(
        "neighborhood",
        form({ neighborhood: "Polana" }),
        strings,
      ),
      undefined,
    );
  });

  it("morada, referência, notas e pagamento continuam OPCIONAIS", () => {
    // Sem morada nem pagamento, só com os obrigatórios → válido e completo.
    const ready = form({
      name: "João",
      phone: "841234567",
      neighborhood: "Polana",
    });
    assert.deepEqual(validateCheckout(ready, strings), {});
    assert.ok(isCheckoutComplete(ready));
  });

  it("validateCheckout reúne todos os erros de uma vez", () => {
    const errors = validateCheckout(form(), strings);
    assert.deepEqual(Object.keys(errors).sort(), [
      "name",
      "neighborhood",
      "phone",
    ]);
    assert.equal(errors.name, "Name required");
    assert.equal(errors.neighborhood, "Location required");
    assert.equal(errors.phone, "Phone required");
  });

  it("isCheckoutComplete acompanha o preenchimento campo a campo", () => {
    assert.ok(!isCheckoutComplete(form()));
    assert.ok(!isCheckoutComplete(form({ name: "João" })));
    assert.ok(!isCheckoutComplete(form({ name: "João", phone: "841234567" })));
    assert.ok(
      isCheckoutComplete(
        form({ name: "João", phone: "841234567", neighborhood: "Polana" }),
      ),
    );
    // Telefone com menos de 7 dígitos nunca completa.
    assert.ok(
      !isCheckoutComplete(
        form({ name: "João", phone: "12", neighborhood: "Polana" }),
      ),
    );
  });
});
