"use client";

import { useEffect } from "react";

/**
 * Publica as variáveis `--sf-*` do tema da loja no `document.documentElement`.
 *
 * O nó raiz da vitrine já as traz em `style` inline (pintura SSR imediata),
 * mas o DIÁLOGO DO CARRINHO renderiza num PORTAL do Radix colado ao
 * `<body>` — fora daquele nó. Custom properties são herdadas pela ÁRVORE
 * DOM, não pela árvore React: sem esta publicação, todo `var(--sf-*)`
 * dentro do portal resolvia como inválido no momento do cálculo →
 * `background-color` caía para TRANSPARENT (a loja aparecia por trás do
 * carrinho, com texto fantasma por cima) e botões/inputs perdiam cor,
 * raio e borda de tema.
 *
 * O efeito roda no cliente antes de qualquer interação (o diálogo só
 * abre após a hidratação) e a limpeza ao desmontar evita vazar o tema
 * de uma loja para o dashboard. Cobre este portal e qualquer futuro.
 */
export function ThemeVars({ vars }: { vars: Record<string, string> }) {
  useEffect(() => {
    const root = document.documentElement;
    for (const [name, value] of Object.entries(vars)) {
      root.style.setProperty(name, value);
    }
    return () => {
      for (const name of Object.keys(vars)) {
        root.style.removeProperty(name);
      }
    };
  }, [vars]);

  return null;
}
