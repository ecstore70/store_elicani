// Import de tipos sem extensão: `import type` é apagado na compilação — o
// módulo continua PURO e roda nos testes de `node --test` (que só resolvem
// imports runtime, e estes usam extensão .ts).
import type { StorefrontStrings } from "./strings";

/**
 * Regras de validação do checkout — PURAS e testáveis.
 *
 * O checkout pede apenas o que a mensagem do WhatsApp precisa para ser
 * útil ao comerciante: nome, telefone e bairro/localização são OBRIGATÓRIOS;
 * morada, referência, notas e forma de pagamento continuam opcionais (a
 * Fase 1 não tem configuração que os exija — nada é inventado aqui).
 *
 * A UI usa estas funções para três momentos:
 *  1. `isCheckoutComplete` → desabilitar o CTA antes de o cliente preencher;
 *  2. `validateCheckoutField` → aviso IMEDIATO ao sair do campo (blur);
 *  3. `validateCheckout` → guarda final no envio (defesa em profundidade).
 */

export type CheckoutForm = {
  name: string;
  phone: string;
  address: string;
  neighborhood: string;
  reference: string;
  notes: string;
  payment: string;
};

/** Campos com preenchimento obrigatório. */
export type RequiredCheckoutField = "name" | "phone" | "neighborhood";

export const REQUIRED_CHECKOUT_FIELDS = [
  "name",
  "phone",
  "neighborhood",
] as const satisfies readonly RequiredCheckoutField[];

export type CheckoutErrors = Partial<Record<RequiredCheckoutField, string>>;

type ValidationStrings = Pick<
  StorefrontStrings,
  "nameRequired" | "phoneRequired" | "neighborhoodRequired"
>;

/** Telefone: dígitos suférios para um número WhatsApp real (mesma regra de sempre). */
export function isPhoneValid(phone: string): boolean {
  return phone.replace(/\D/g, "").length >= 7;
}

/** Valor preenchido (só espaços conta como vazio). */
function isFilled(value: string): boolean {
  return value.trim().length > 0;
}

/** Valida UM campo no blur — devolve a mensagem ou `undefined`. */
export function validateCheckoutField(
  field: RequiredCheckoutField,
  form: CheckoutForm,
  strings: ValidationStrings,
): string | undefined {
  switch (field) {
    case "name":
      return isFilled(form.name) ? undefined : strings.nameRequired;
    case "phone":
      return isPhoneValid(form.phone) ? undefined : strings.phoneRequired;
    case "neighborhood":
      return isFilled(form.neighborhood)
        ? undefined
        : strings.neighborhoodRequired;
  }
}

/** Valida TODOS os campos obrigatórios (envio + estado do CTA). */
export function validateCheckout(
  form: CheckoutForm,
  strings: ValidationStrings,
): CheckoutErrors {
  const errors: CheckoutErrors = {};
  for (const field of REQUIRED_CHECKOUT_FIELDS) {
    const message = validateCheckoutField(field, form, strings);
    if (message) errors[field] = message;
  }
  return errors;
}

/** CTA habilitado somente com todos os obrigatórios prontos. */
export function isCheckoutComplete(form: CheckoutForm): boolean {
  return REQUIRED_CHECKOUT_FIELDS.every((field) => {
    switch (field) {
      case "name":
        return isFilled(form.name);
      case "phone":
        return isPhoneValid(form.phone);
      case "neighborhood":
        return isFilled(form.neighborhood);
    }
  });
}
