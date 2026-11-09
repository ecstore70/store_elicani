"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { requireStore } from "@/lib/stores/queries";
import { createClient } from "@/lib/supabase/server";
import { isDeliveryStatus } from "./status";

/**
 * Atualiza o ESTADO DE ENTREGA de uma encomenda (módulo Entrega).
 * Assinatura `FormData` → `Promise<void>` (contrato de `action` de
 * formulário, sem JS), loja vinda da SESSÃO, update `id` + `store_id`,
 * RLS de UPDATE como autoridade. Só os quatro estados de entrega são
 * aceites; falha → `?error=1` (redirect fora do try).
 */
export async function updateDeliveryStatusAction(
  formData: FormData,
): Promise<void> {
  const orderId = formData.get("orderId");
  const deliveryStatus = formData.get("deliveryStatus");
  const targetId = typeof orderId === "string" ? orderId : "";
  const targetStatus =
    typeof deliveryStatus === "string" ? deliveryStatus : "";
  const valid =
    targetId.length > 0 && isDeliveryStatus(targetStatus);

  let ok = false;
  if (valid) {
    const user = await requireUser();
    const store = await requireStore(user.id);

    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("orders")
        .update({ delivery_status: targetStatus })
        .eq("id", targetId)
        .eq("store_id", store.id)
        .select("id");

      ok = !error && !!data && data.length > 0;
      if (ok) revalidatePath("/app/delivery");
    } catch {
      ok = false;
    }
  }

  if (!ok) {
    redirect("/app/delivery?error=1");
  }
}
