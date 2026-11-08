import type { ReactNode } from "react";
import { Film, ImageIcon } from "lucide-react";
import {
  extractYouTubeId,
  isYouTubeUrl,
  youtubeEmbedUrl,
} from "@/lib/catalog/media";
import {
  parseRichText,
  type RichBlock,
  type RichInline,
} from "@/lib/catalog/rich-text";
import type { PublicPageBlock } from "@/lib/catalog/types";
import { ContentVideo } from "./content-video";

/**
 * Blocos de conteúdo da página do produto — PURO no servidor (sem cliente
 * próprio além do ContentVideo). Renderizado:
 *   • na vitrine ABAIXO das informações do produto, na sequência salva;
 *   • na pré-visualização do editor (dashboard) — por isso as cores usam
 *     `var(--sf-…, fallback)`: na vitrine as variáveis existem (StoreShell);
 *     no painel elas não existem e os fallbacks mantêm tudo legível.
 *
 * Segurança: o texto passa por parseRichText (subconjunto seguro) e vira
 * NÓS REACT — o React escapa o texto; nenhum `dangerouslySetInnerHTML`,
 * nenhum HTML/JS/CSS do comerciante.
 */

const FG = "text-[var(--sf-fg,#18181b)]";
const MUTED = "text-[var(--sf-muted,#71717a)]";
const SURFACE = "bg-[var(--sf-surface,#f4f4f5)]";
const RADIUS = "rounded-[var(--sf-radius,12px)]";

function renderInline(nodes: RichInline[], keyBase: string): ReactNode {
  return nodes.map((node, index) => {
    const key = `${keyBase}-${index}`;
    switch (node.kind) {
      case "bold":
        return (
          <strong key={key} className="font-semibold">
            {renderInline(node.children, key)}
          </strong>
        );
      case "italic":
        return <em key={key}>{renderInline(node.children, key)}</em>;
      case "link":
        return (
          <a
            key={key}
            href={node.href}
            className="underline underline-offset-4"
            {...(node.href.startsWith("http")
              ? { rel: "noopener noreferrer" }
              : {})}
          >
            {node.text}
          </a>
        );
      default:
        return node.text;
    }
  });
}

function renderRich(
  blocks: RichBlock[],
  headingClass: string,
  keyBase: string,
): ReactNode {
  return blocks.map((block, index) => {
    const key = `${keyBase}-${index}`;

    if (block.kind === "heading") {
      return block.level === 3 ? (
        <h3 key={key} className={`text-lg ${headingClass} ${FG}`}>
          {renderInline(block.children, key)}
        </h3>
      ) : (
        <h4 key={key} className={`text-base ${headingClass} ${FG}`}>
          {renderInline(block.children, key)}
        </h4>
      );
    }

    if (block.kind === "list") {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List
          key={key}
          className={`${
            block.ordered ? "list-decimal" : "list-disc"
          } space-y-1 pl-5 text-sm leading-relaxed sm:text-base ${MUTED}`}
        >
          {block.items.map((item, itemIndex) => (
            <li key={`${key}-${itemIndex}`}>
              {renderInline(item, `${key}-${itemIndex}`)}
            </li>
          ))}
        </List>
      );
    }

    return (
      <p key={key} className={`text-sm leading-relaxed sm:text-base ${MUTED}`}>
        {renderInline(block.children, key)}
      </p>
    );
  });
}

function MediaPlaceholder({ video }: { video?: boolean }) {
  const Icon = video ? Film : ImageIcon;
  return (
    <div
      aria-hidden="true"
      className={`flex aspect-video items-center justify-center ${SURFACE} ${RADIUS} ${MUTED}`}
    >
      <Icon aria-hidden="true" className="size-8" />
    </div>
  );
}

function Block({
  block,
  headingClass,
  index,
}: {
  block: PublicPageBlock;
  headingClass: string;
  index: number;
}) {
  // ── imagem ──────────────────────────────────────────────────────────────
  if (block.type === "image") {
    return (
      <figure className="m-0">
        {block.media_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={block.media_url}
            alt={block.alt_text ?? ""}
            loading="lazy"
            decoding="async"
            className={`w-full ${RADIUS} bg-[var(--sf-surface,#fff)]`}
          />
        ) : (
          <MediaPlaceholder />
        )}
        {block.caption && (
          <figcaption className={`mt-2 text-sm ${MUTED}`}>
            {block.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  // ── vídeo ───────────────────────────────────────────────────────────────
  if (block.type === "video") {
    const youtubeId =
      block.media_url && isYouTubeUrl(block.media_url)
        ? extractYouTubeId(block.media_url)
        : null;

    return (
      <figure className="m-0">
        {youtubeId ? (
          <div className={`relative aspect-video w-full overflow-hidden bg-black ${RADIUS}`}>
            <iframe
              src={youtubeEmbedUrl(youtubeId, false)}
              title={block.caption ?? "YouTube"}
              loading="lazy"
              allow="encrypted-media; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
        ) : block.media_url ? (
          <ContentVideo src={block.media_url} />
        ) : (
          <MediaPlaceholder video />
        )}
        {block.caption && (
          <figcaption className={`mt-2 text-sm ${MUTED}`}>
            {block.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  // ── texto ───────────────────────────────────────────────────────────────
  const rich = parseRichText(block.content ?? "");
  if (rich.length === 0) return null;

  return (
    <div className="space-y-3">
      {renderRich(rich, headingClass, `text-${index}`)}
    </div>
  );
}

/**
 * Sequência de blocos de conteúdo — exibida logo após as informações do
 * produto (e na pré-visualização do editor). Sem blocos → nada (a página
 * continua exatamente como antes).
 */
export function PageContent({
  blocks,
  headingClass = "font-semibold",
  className = "",
}: {
  blocks: PublicPageBlock[];
  /** Mesma classe de fonte dos títulos da página (template da loja). */
  headingClass?: string;
  className?: string;
}) {
  if (blocks.length === 0) return null;

  return (
    <div className={`space-y-8 sm:space-y-10 ${className}`}>
      {blocks.map((block, index) => (
        <Block key={index} block={block} headingClass={headingClass} index={index} />
      ))}
    </div>
  );
}
