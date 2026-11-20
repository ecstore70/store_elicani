/**
 * Compartilhar PRODUTO — lógica pura e testável do "Share product",
 * plataforma em todas as lojas (nenhum valor de loja/mercador fixo;
 * os dados chegam por chamada, das props server-rendered da rota de
 * produto atual — nunca de estado global/localStorage/cookies).
 *
 * Comportamento:
 *  1. preferir o Web Share API nativo (`navigator.share`) quando
 *     existir — título, texto de divulgação e a URL CANÓNICA do
 *     produto em exibição;
 *  2. sem share (ou erro que não seja o utilizador cancelar) → copiar
 *     a MESMA URL canónica para a clipboard;
 *  3. clipboard indisponível/falhar → `failed`, sem nunca lançar:
 *     a página não pode quebrar por causa do botão.
 *
 * NÃO é o CTA de WhatsApp: este módulo não gera a mensagem de
 * pedido/inquiry (`buildProductInquiryMessage` continua a ser a única
 * responsável por isso, e não é tocado aqui).
 */

/** Payload enviado ao Web Share API. */
export type SharePayload = {
  title: string;
  text: string;
  url: string;
};

/** Dependências de browser injetadas (testáveis sem browser). */
export type ShareEnvironment = {
  /** `navigator.share` quando o navegador o suporta. */
  share?: (data: SharePayload) => Promise<void>;
  /** `navigator.clipboard.writeText` — recurso sem Web Share API. */
  writeText?: (text: string) => Promise<void>;
};

export type ShareOutcome =
  /** O share nativo concluiu. */
  | "shared"
  /** URL copiada para a clipboard (fallback confirmado). */
  | "copied"
  /** O utilizador fechou a folha de share nativa — nada mais acontece. */
  | "cancelled"
  /** Sem capacidade ou falhou tudo — degradação silenciosa e segura. */
  | "failed";

/** Texto de divulgação conciso (definido pela plataforma, sem WhatsApp). */
export function buildShareText(productName: string): string {
  return `Check out this product: ${productName}`;
}

/** Dados completos para `navigator.share` do produto em exibição. */
export function buildShareData(
  productName: string,
  productUrl: string,
): SharePayload {
  return {
    title: productName,
    text: buildShareText(productName),
    url: productUrl,
  };
}

/**
 * Executa o partilhar do produto com os dados QUE ESTA PÁGINA recebeu.
 * Não guarda nada entre chamadas: partilhar o produto A e depois o
 * produto B usa exatamente os argumentos de cada chamada.
 */
export async function shareProduct(
  productName: string,
  productUrl: string,
  env: ShareEnvironment,
): Promise<ShareOutcome> {
  if (env.share) {
    try {
      await env.share(buildShareData(productName, productUrl));
      return "shared";
    } catch (error) {
      // Cancelar a folha nativa é uma decisão do utilizador: não
      // copiar nada nem mostrar confirmação enganosa.
      if (isAbortError(error)) return "cancelled";
      // Qualquer outro erro → tenta o recurso da clipboard.
    }
  }

  if (env.writeText) {
    try {
      await env.writeText(productUrl);
      return "copied";
    } catch {
      // Clipboard bloqueada/indisponível: degradação graciososa.
      return "failed";
    }
  }

  return "failed";
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name === "AbortError"
  );
}
