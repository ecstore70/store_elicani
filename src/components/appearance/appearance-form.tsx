"use client";

import { useActionState, useMemo, useState } from "react";
import { FormAlert } from "@/components/shared/form-alert";
import { FieldShell } from "@/components/store/fields";
import { Button } from "@/components/ui/button";
import { StorefrontPreview } from "@/components/appearance/storefront-preview";
import type { Locale } from "@/lib/i18n/config";
import type { PublicCategory, PublicProduct, AppearanceFormState } from "@/lib/catalog/types";
import { updateAppearanceAction } from "@/lib/stores/actions";
import {
  BUTTON_STYLES,
  CARD_STYLES,
  IMAGE_RATIOS,
  PRODUCT_LAYOUTS,
  STORE_TEMPLATES,
  type ButtonStyle,
  type CardStyle,
  type ImageRatio,
  type ProductLayout,
  type StoreTemplate,
} from "@/lib/stores/appearance";
import { createTranslator } from "@/lib/i18n/translate";

const INITIAL_STATE: AppearanceFormState = { error: null, notice: null };

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

type StoreAppearanceData = {
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  whatsapp_number: string | null;
  currency: string;
  template: string;
  primary_color: string | null;
  button_color: string | null;
  accent_color: string | null;
  background_color: string | null;
  product_layout: string;
  image_ratio: string;
  button_style: string;
  card_style: string;
};

/** Opção de escolha fechada (radio em cards acessíveis). */
type ChoiceOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

function ChoiceCards<T extends string>({
  name,
  legend,
  value,
  options,
  onChange,
  columns = "sm:grid-cols-2",
}: {
  name: string;
  legend: string;
  value: T;
  options: readonly ChoiceOption<T>[];
  onChange: (value: T) => void;
  columns?: string;
}) {
  return (
    <fieldset className="space-y-1.5">
      <Legend>{legend}</Legend>
      <div className={`grid gap-2 ${columns}`}>
        {options.map((option) => (
          <label
            key={option.value}
            className="relative flex cursor-pointer flex-col gap-0.5 rounded-lg border border-input p-3 transition-colors has-checked:border-ring has-checked:ring-3 has-checked:ring-ring/40 has-focus-visible:ring-3 has-focus-visible:ring-ring/40 hover:bg-muted/40"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span className="text-sm font-medium">{option.label}</span>
            {option.description && (
              <span className="text-xs text-muted-foreground">
                {option.description}
              </span>
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Legend({ children }: { children: React.ReactNode }) {
  return (
    <legend className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
      {children}
    </legend>
  );
}

function ColorField({
  name,
  label,
  value,
  onChange,
  error,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const valid = HEX_COLOR_PATTERN.test(value.trim());

  return (
    <FieldShell htmlFor={name} label={label} error={error}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={valid ? value.trim() : "#000000"}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          className="h-8 w-10 shrink-0 cursor-pointer rounded-lg border border-input bg-transparent p-1"
        />
        <input
          type="text"
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#2563eb"
          spellCheck={false}
          autoCapitalize="none"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${name}-error` : undefined}
          className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 font-mono text-sm uppercase transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
        />
      </div>
    </FieldShell>
  );
}

/**
 * Loja → Aparência — customização CONTROLADA (listas fechadas + cores),
 * sem construtor de páginas. O preview usa os mesmos componentes da
 * vitrine pública com dados reais do comerciante.
 */
export function AppearanceForm({
  locale,
  store,
  preview,
}: {
  locale: Locale;
  store: StoreAppearanceData;
  preview: { products: PublicProduct[]; categories: PublicCategory[] };
}) {
  const t = createTranslator(locale);
  const [state, formAction, pending] = useActionState(
    updateAppearanceAction,
    INITIAL_STATE,
  );

  const [template, setTemplate] = useState<StoreTemplate>(
    STORE_TEMPLATES.includes(store.template as StoreTemplate)
      ? (store.template as StoreTemplate)
      : "minimal",
  );
  const [primaryColor, setPrimaryColor] = useState(store.primary_color ?? "");
  const [buttonColor, setButtonColor] = useState(store.button_color ?? "");
  const [accentColor, setAccentColor] = useState(store.accent_color ?? "");
  const [backgroundColor, setBackgroundColor] = useState(
    store.background_color ?? "",
  );
  const [productLayout, setProductLayout] = useState<ProductLayout>(
    PRODUCT_LAYOUTS.includes(store.product_layout as ProductLayout)
      ? (store.product_layout as ProductLayout)
      : "grid",
  );
  const [imageRatio, setImageRatio] = useState<ImageRatio>(
    IMAGE_RATIOS.includes(store.image_ratio as ImageRatio)
      ? (store.image_ratio as ImageRatio)
      : "square",
  );
  const [buttonStyle, setButtonStyle] = useState<ButtonStyle>(
    BUTTON_STYLES.includes(store.button_style as ButtonStyle)
      ? (store.button_style as ButtonStyle)
      : "rounded",
  );
  const [cardStyle, setCardStyle] = useState<CardStyle>(
    CARD_STYLES.includes(store.card_style as CardStyle)
      ? (store.card_style as CardStyle)
      : "subtle",
  );
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");

  const hex = (value: string) =>
    HEX_COLOR_PATTERN.test(value.trim()) ? value.trim().toLowerCase() : null;

  const templateOptions = useMemo(
    () => [
      {
        value: "minimal" as const,
        label: t("appearance.templateMinimal"),
        description: t("appearance.templateMinimalDesc"),
      },
      {
        value: "market" as const,
        label: t("appearance.templateMarket"),
        description: t("appearance.templateMarketDesc"),
      },
      {
        value: "fashion" as const,
        label: t("appearance.templateFashion"),
        description: t("appearance.templateFashionDesc"),
      },
      {
        value: "restaurant" as const,
        label: t("appearance.templateRestaurant"),
        description: t("appearance.templateRestaurantDesc"),
      },
    ],
    [t],
  );

  return (
    <form action={formAction} className="space-y-8" noValidate>
      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
      {state.notice && <FormAlert tone="success">{state.notice}</FormAlert>}

      {/* preview ao vivo — o comerciante vê as mudanças imediatamente */}
      <StorefrontPreview
        device={device}
        onDeviceChange={setDevice}
        store={{
          name: store.name,
          description: store.description,
          logo_url: store.logo_url,
          currency: store.currency,
        }}
        appearance={{
          template,
          product_layout: productLayout,
          image_ratio: imageRatio,
          button_style: buttonStyle,
          card_style: cardStyle,
          primary_color: hex(primaryColor),
          button_color: hex(buttonColor),
          accent_color: hex(accentColor),
          background_color: hex(backgroundColor),
        }}
        products={preview.products}
        categories={preview.categories}
        locale={locale}
      />
      <input type="hidden" name="template" value={template} />
      <input type="hidden" name="product_layout" value={productLayout} />
      <input type="hidden" name="image_ratio" value={imageRatio} />
      <input type="hidden" name="button_style" value={buttonStyle} />
      <input type="hidden" name="card_style" value={cardStyle} />

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold tracking-tight">
            {t("appearance.template")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("appearance.templateHelp")}
          </p>
        </div>
        <ChoiceCards
          name="template-choice"
          legend={t("appearance.template")}
          value={template}
          options={templateOptions}
          onChange={setTemplate}
          columns="sm:grid-cols-2"
        />
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold tracking-tight">
            {t("appearance.colors")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("appearance.colorsHelp")}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField
            name="primary_color"
            label={t("appearance.primaryColor")}
            value={primaryColor}
            onChange={setPrimaryColor}
          />
          <ColorField
            name="button_color"
            label={t("appearance.buttonColor")}
            value={buttonColor}
            onChange={setButtonColor}
          />
          <ColorField
            name="accent_color"
            label={t("appearance.accentColor")}
            value={accentColor}
            onChange={setAccentColor}
          />
          <ColorField
            name="background_color"
            label={t("appearance.backgroundColor")}
            value={backgroundColor}
            onChange={setBackgroundColor}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold tracking-tight">
            {t("appearance.catalog")}
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <ChoiceCards
            name="layout-choice"
            legend={t("appearance.productLayout")}
            value={productLayout}
            onChange={setProductLayout}
            options={[
              {
                value: "grid" as const,
                label: t("appearance.layoutGrid"),
                description: t("appearance.layoutGridDesc"),
              },
              {
                value: "list" as const,
                label: t("appearance.layoutList"),
                description: t("appearance.layoutListDesc"),
              },
            ]}
          />
          <ChoiceCards
            name="ratio-choice"
            legend={t("appearance.imageRatio")}
            value={imageRatio}
            onChange={setImageRatio}
            options={[
              { value: "square" as const, label: t("appearance.imageSquare") },
              { value: "portrait" as const, label: t("appearance.imagePortrait") },
              { value: "landscape" as const, label: t("appearance.imageLandscape") },
            ]}
          />
          <ChoiceCards
            name="button-style-choice"
            legend={t("appearance.buttonStyle")}
            value={buttonStyle}
            onChange={setButtonStyle}
            options={[
              { value: "rounded" as const, label: t("appearance.buttonRounded") },
              { value: "soft" as const, label: t("appearance.buttonSoft") },
              { value: "compact" as const, label: t("appearance.buttonCompact") },
            ]}
          />
          <ChoiceCards
            name="card-style-choice"
            legend={t("appearance.cardStyle")}
            value={cardStyle}
            onChange={setCardStyle}
            options={[
              { value: "subtle" as const, label: t("appearance.cardSubtle") },
              { value: "rounded" as const, label: t("appearance.cardRounded") },
              { value: "minimal" as const, label: t("appearance.cardMinimal") },
            ]}
          />
        </div>
      </section>

      <div className="flex items-center justify-end gap-3 border-t border-border/70 pt-6">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? t("appearance.saving") : t("appearance.save")}
        </Button>
      </div>
    </form>
  );
}
