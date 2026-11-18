import Image from "next/image";
import type { StorefrontStrings } from "@/lib/storefront/strings";

/**
 * Três selos profissionais do rodapé — o "acabamento" da hierarquia
 * (identidade da loja → selos → links → moeda → Powered by Elicani).
 *
 * As artes são PNGs originais fornecidos (transparência preservada) em
 * `public/brand/`, servidos otimizados pelo `next/image`. São ativos de
 * PLATAFORMA: o mesmo trio vale para qualquer tipo de loja — a arte é
 * fixa, sem variação por tipo de loja nem sistema de categoria novo.
 * Textos do desenho: catálogo online, pedidos via WhatsApp, contacto
 * direto (capacidades reais da plataforma). Informativos e não
 * clicáveis; o `alt` vem do i18n (o que cada selo comunica).
 */
export function FooterSeals({ strings }: { strings: StorefrontStrings }) {
  const seals = [
    {
      src: "/brand/elicani-seal-catalogo-online.png",
      alt: strings.sealCatalog,
      width: 452,
      height: 400,
    },
    {
      src: "/brand/elicani-seal-pedidos-whatsapp.png",
      alt: strings.sealOrders,
      width: 444,
      height: 400,
    },
    {
      src: "/brand/elicani-seal-contacto-direto.png",
      alt: strings.sealSupport,
      width: 473,
      height: 400,
    },
  ];

  return (
    <ul className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
      {seals.map((seal) => (
        <li key={seal.src}>
          {/* altura fixa, largura automática (proporção intacta, sem
              distorção/corte); 3 cabem em 360px, em 320px quebra 2+1 */}
          <Image
            src={seal.src}
            alt={seal.alt}
            width={seal.width}
            height={seal.height}
            sizes="(max-width: 639px) 96px, 112px"
            className="h-[5.25rem] w-auto object-contain sm:h-24"
          />
        </li>
      ))}
    </ul>
  );
}
