/**
 * Agregação PURA de CLIENTES a partir das encomendas.
 *
 * Decisão de arquitectura (auditoria): NÃO existe tabela de clientes e
 * não vamos criar uma — o cliente já vive em cada linha de `orders`
 * (nome + telefone). A entidade mínima é derivada aqui, em memória:
 *   • chave = telefone normalizado (só dígitos; o formato com que o
 *     cliente escreveu fica guardado na linha mais recente);
 *   • "encomendas" e "total gasto" contam APENAS vendas válidas
 *     (mesma regra dos relatórios: pending/confirmed/completed);
 *   • o histórico mostra TODAS as encomendas (inclui canceladas,
 *     com o respetivo estado);
 *   • ordenação: última encomenda primeiro (depois nome).
 *
 * Sem fake CRM: tudo sai de linhas reais de `orders`.
 */
import { isValidSale } from "../reports/aggregate.ts";

export type CustomerOrderRow = {
  id: string;
  reference: string;
  status: string;
  total: number;
  createdAt: string;
  customerName: string;
  customerPhone: string;
};

export type CustomerHistoryOrder = {
  id: string;
  reference: string;
  status: string;
  total: number;
  createdAt: string;
};

export type CustomerSummary = {
  /** Chave de URL (telefone só com dígitos; nunca vazia). */
  key: string;
  /** Nome da encomenda mais recente (o próprio cliente escreveu). */
  displayName: string;
  /** Telefone formatado como o cliente escreveu por último. */
  displayPhone: string;
  /** Nº de encomendas VÁLIDAS (canceladas ficam de fora). */
  orderCount: number;
  /** Soma dos totais das encomendas válidas. */
  totalSpent: number;
  /** Data da última encomenda de qualquer estado. */
  lastOrderAt: string | null;
  /** Todas as encomendas, mais recente primeiro. */
  history: CustomerHistoryOrder[];
};

/** Telefone → chave estável: só dígitos (formatação não divide clientes). */
export function customerKey(phone: string): string {
  const digits = String(phone).replace(/\D+/g, "");
  if (digits.length > 0) return digits;
  // Fallback raro (telefone sem dígitos): trecho URL-seguro, nunca vazio.
  const fallback = String(phone)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return fallback.length > 0 ? fallback : "sem-telefone";
}

/** Linhas leves → resumos ordenados (última encomenda primeiro). */
export function summarizeCustomers(
  rows: readonly CustomerOrderRow[],
): CustomerSummary[] {
  const byKey = new Map<string, CustomerSummary>();

  for (const row of rows) {
    const key = customerKey(row.customerPhone);
    const valid = isValidSale(row.status);

    let summary = byKey.get(key);
    if (!summary) {
      summary = {
        key,
        displayName: row.customerName,
        displayPhone: row.customerPhone,
        orderCount: 0,
        totalSpent: 0,
        lastOrderAt: null,
        history: [],
      };
      byKey.set(key, summary);
    }

    if (valid) {
      summary.orderCount += 1;
      summary.totalSpent += Number(row.total) || 0;
    }

    // "Mais recente" = maior timestamp; decide também o nome exibido.
    if (
      summary.lastOrderAt === null ||
      row.createdAt > summary.lastOrderAt
    ) {
      summary.lastOrderAt = row.createdAt;
      summary.displayName = row.customerName;
      summary.displayPhone = row.customerPhone;
    }

    summary.history.push({
      id: row.id,
      reference: row.reference,
      status: row.status,
      total: row.total,
      createdAt: row.createdAt,
    });
  }

  for (const summary of byKey.values()) {
    summary.history.sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
    );
  }

  return [...byKey.values()].sort((a, b) => {
    const aLast = a.lastOrderAt ?? "";
    const bLast = b.lastOrderAt ?? "";
    if (aLast !== bLast) return aLast < bLast ? 1 : -1;
    return a.displayName.localeCompare(b.displayName);
  });
}
