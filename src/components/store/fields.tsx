import type { ComponentProps, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Campos de formulário acessíveis e reutilizáveis.
 *
 * Cada campo liga `<label>` ao controlo por `id` (igual ao `name`), expõe
 * `aria-invalid` e liga a mensagem de erro/hint via `aria-describedby`.
 */

type FieldShellProps = {
  htmlFor: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
};

export function FieldShell({
  htmlFor,
  label,
  hint,
  error,
  children,
  className,
}: FieldShellProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(
  id: string,
  error?: string,
  hint?: string,
): string | undefined {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

/** Classes base — espelham o componente Input do shadcn. */
const CONTROL_CLASSES =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm";

type TextFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  /** Classes do bloco do campo (ex.: `sm:col-span-2`). */
  className?: string;
} & Omit<ComponentProps<typeof Input>, "className">;

export function TextField({
  label,
  hint,
  error,
  className,
  ...inputProps
}: TextFieldProps) {
  const id = inputProps.name ?? "";

  return (
    <FieldShell
      htmlFor={id}
      label={label}
      hint={hint}
      error={error}
      className={className}
    >
      <Input
        {...inputProps}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
      />
    </FieldShell>
  );
}

type TextAreaFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
} & Omit<ComponentProps<"textarea">, "className">;

export function TextAreaField({
  label,
  hint,
  error,
  className,
  ...textareaProps
}: TextAreaFieldProps) {
  const id = textareaProps.name ?? "";

  return (
    <FieldShell
      htmlFor={id}
      label={label}
      hint={hint}
      error={error}
      className={className}
    >
      <textarea
        {...textareaProps}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(CONTROL_CLASSES, "min-h-20 resize-y leading-relaxed")}
      />
    </FieldShell>
  );
}

type SelectOption = { value: string; label: string };

type SelectFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  options: readonly SelectOption[];
  placeholder?: string;
  className?: string;
} & ComponentProps<"select">;

/**
 * `<select>` nativo de propósito: 200+ países e 400+ fusos ficam mais
 * usáveis com o seletor nativo do sistema (e sem dependência extra).
 */
export function SelectField({
  label,
  hint,
  error,
  options,
  placeholder,
  className,
  ...selectProps
}: SelectFieldProps) {
  const id = selectProps.name ?? "";

  return (
    <FieldShell
      htmlFor={id}
      label={label}
      hint={hint}
      error={error}
      className={className}
    >
      <select
        {...selectProps}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={CONTROL_CLASSES}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/** Secção de formulário com título e grelha de 2 colunas no desktop. */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
