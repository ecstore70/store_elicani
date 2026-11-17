"use client";

import { useEffect } from "react";
import { trackStoreEvent, type StoreEvent } from "@/lib/storefront/events";

/**
 * Emissão de UM evento anónimo por montagem da página (vitrine pública).
 * Client-only, fire-and-forget, sem PII — montado pelas páginas da loja,
 * nunca pelo preview do painel nem pelo marketing (que são só leitura).
 */
export function StoreEvent({
  storeId,
  event,
  productId,
}: {
  storeId: string;
  event: StoreEvent;
  productId?: string;
}) {
  useEffect(() => {
    trackStoreEvent(storeId, event, productId);
  }, [storeId, event, productId]);
  return null;
}
