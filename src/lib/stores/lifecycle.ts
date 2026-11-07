/**
 * Regra de confirmação da exclusão do catálogo — módulo PURO (sem I/O).
 *
 * Partilhado por três camadas para haver UMA só verdade:
 *  • o diálogo da UI habilita o botão destrutivo só com a palavra exata;
 *  • a server action valida-a de novo (defesa em profundidade — o cliente
 *    pode ser contornado, o servidor não);
 *  • os testes cobrem o portão (espec: exclusão exige confirmação explícita).
 */

/** Palavra que o lojista deve digitar para confirmar a exclusão. */
export const CATALOG_DELETE_WORD = "DELETE";

/**
 * Resultado das ações de ciclo de vida do catálogo — forma serializável
 * devolvida ao cliente (sucesso ou erro JÁ traduzido no servidor).
 */
export type CatalogActionResult = {
  ok: boolean;
  /** Mensagem de erro traduzida; `null` em sucesso. */
  error: string | null;
};

/**
 * O texto digitado confirma a exclusão?
 *
 * Exato e case-sensitive: "delete", "DELETE " parcial ou qualquer variação
 * NÃO habilita a exclusão. Só espaços à volta são ignorados.
 */
export function isCatalogDeleteConfirmation(input: string): boolean {
  return input.trim() === CATALOG_DELETE_WORD;
}
