"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { requireStore } from "@/lib/stores/queries";
import { createClient } from "@/lib/supabase/server";
import type { SelectedOption } from "@/lib/storefront/product-options";

/**
 * Gravação de PEDIDOS a partir do checkout — Server Action chamada pelo
 * `CheckoutProvider` como passo ADICIONAL ao envio do WhatsApp.
 *
 * Contrato de segurança:
 *   • o cliente manda APENAS identidade (produto, quantidade, opções);
 *   • nome, preço unitário e totais são recalculados pela função
 *     `record_order` (SECURITY DEFINER) a partir do banco — valores do
 *     navegador nunca entram nos números;
 *   • qualquer falha vira `{ ok: false, code }` — NUNCA lança para cima:
 *     o chamador (checkout) continua para o WhatsApp sempre.
 */
export type RecordOrderCustomer = {
  name: string;
  phone: string;
  address?: string;
  neighborhood?: string;
  reference?: string;
  notes?: string;
  payment?: "cash" | "transfer" | "other" | null;
};

export type RecordOrderLine = {
  productId: string;
  qty: number;
  options: readonly SelectedOption[];
};

export type RecordOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; code: string };

/** Corta textos longos antes de sair do servidor (a função valida de novo). */
function clip(value: string | undefined, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

export async function recordOrderAction(input: {
  storeId: string;
  customer: RecordOrderCustomer;
  lines: readonly RecordOrderLine[];
}): Promise<RecordOrderResult> {
  // Guarda de forma antes de qualquer I/O — a autoridade (loja ativa,
  // produtos da loja, preços) continua sendo a função `record_order`.
  if (
    typeof input?.storeId !== "string" ||
    input.storeId.length === 0 ||
    !Array.isArray(input.lines) ||
    input.lines.length < 1 ||
    input.lines.length > 30
  ) {
    return { ok: false, code: "invalid_payload" };
  }

  try {
    const supabase = await createClient();

    const customer = input.customer ?? ({} as RecordOrderCustomer);
    const payment =
      customer.payment === "cash" ||
      customer.payment === "transfer" ||
      customer.payment === "other"
        ? customer.payment
        : null;

    const { data, error } = await supabase.rpc("record_order", {
      p_store_id: input.storeId,
      p_customer: {
        name: clip(customer.name, 120) ?? "",
        phone: clip(customer.phone, 32) ?? "",
        address: clip(customer.address, 300) ?? null,
        neighborhood: clip(customer.neighborhood, 120) ?? null,
        reference: clip(customer.reference, 200) ?? null,
        notes: clip(customer.notes, 1000) ?? null,
      },
      p_lines: input.lines.map((line) => ({
        productId: typeof line.productId === "string" ? line.productId : "",
        qty: Number(line.qty),
        options: (Array.isArray(line.options) ? line.options : []).map(
          (option: SelectedOption) => ({
            groupLabel: String(option.groupLabel ?? "").slice(0, 80),
            choiceLabel: String(option.choiceLabel ?? "").slice(0, 80),
            priceDelta: Number(option.priceDelta),
          }),
        ),
      })),
      // `null` → omitido no PostgREST → default SQL `null` (idêntico).
      p_payment: payment ?? undefined,
    });

    if (error) return { ok: false, code: error.message };
    if (typeof data !== "string" || data.length === 0) {
      return { ok: false, code: "no_order_id" };
    }
    return { ok: true, orderId: data };
  } catch (error) {
    return {
      ok: false,
      code: error instanceof Error ? error.message : "unknown_error",
    };
  }
}

/**
 * Atualiza o ESTADO de uma encomenda (painel do dono).
 *
 * Assinatura `FormData` → `Promise<void>` — o contrato de `action` de
 * formulário (funciona sem JavaScript). Autorização sempre no servidor:
 * a loja vem da sessão (`requireStore`), nunca do input; o update é
 * duplamente restrito (`id` + `store_id`) e o RLS de UPDATE da tabela
 * ainda verifica a posse da linha. Fora dos quatro estados → erro.
 *
 * Falha → `redirect` para a própria página com `?error=1` (banner com
 * "tentar de novo"); o redirect fica FORA do try para não ser engolido.
 * Sucesso → `revalidatePath` (a página re-renderiza com o novo estado).
 */
const ORDER_STATUS_SET = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

export async function updateOrderStatusAction(
  formData: FormData,
): Promise<void> {
  const orderId = formData.get("orderId");
  const status = formData.get("status");
  const targetId = typeof orderId === "string" ? orderId : "";
  const targetStatus = typeof status === "string" ? status : "";
  const valid =
    targetId.length > 0 && ORDER_STATUS_SET.includes(targetStatus);

  let ok = false;
  if (valid) {
    // Auth FORA do try: redirect() é erro de controle do Next.
    const user = await requireUser();
    const store = await requireStore(user.id);

    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("orders")
        .update({ status: targetStatus })
        .eq("id", targetId)
        .eq("store_id", store.id)
        .select("id");

      ok = !error && !!data && data.length > 0;
      if (ok) {
        revalidatePath(`/app/orders/${targetId}`);
        revalidatePath("/app/orders");
      }
    } catch {
      ok = false;
    }
  }

  if (!ok) {
    redirect(
      valid ? `/app/orders/${targetId}?error=1` : "/app/orders?error=1",
    );
  }
}
