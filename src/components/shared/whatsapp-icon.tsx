import { cn } from "@/lib/utils";

/**
 * Ícone OFICIAL do WhatsApp — logotipo circular completo guardado em
 * `public/brand/whatsapp.svg` (asset oficial da marca, sem modificações:
 * sem recolores, gradientes próprios, distorções ou fusões com a marca
 * Elicani).
 *
 * Decorativo por omissão: o texto adjacente (ex.: "Order via WhatsApp")
 * descreve a ação. O nome "WhatsApp" nunca é traduzido — apenas o texto
 * envolvente usa as chaves i18n.
 *
 * `viewBox` é quadrado, portanto qualquer `size-*` uniforme mantém as
 * proporções (sem distorção possível).
 */
export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/whatsapp.svg"
      alt=""
      aria-hidden="true"
      decoding="async"
      className={cn("size-4 shrink-0", className)}
    />
  );
}
