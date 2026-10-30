"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FieldShell } from "@/components/store/fields";
import { Input } from "@/components/ui/input";

/**
 * Campo de senha com botão mostrar/ocultar independente.
 *
 * Cada instância tem o SEU estado de visibilidade — mostrar a senha do
 * registo nunca afeta a confirmação (são componentes separados).
 *
 * O botão é um `<button type="button">`: acessível por teclado, com
 * `aria-label`/`title` traduzidos e `aria-pressed` a refletir o estado.
 */
export function PasswordField({
  label,
  name,
  autoComplete,
  showLabel,
  hideLabel,
  hint,
  error,
  className,
  ...inputProps
}: {
  label: string;
  name: string;
  autoComplete: string;
  showLabel: string;
  hideLabel: string;
  hint?: string;
  error?: string;
  className?: string;
} & Omit<
  ComponentProps<typeof Input>,
  "label" | "name" | "autoComplete" | "className" | "type"
>) {
  const [visible, setVisible] = useState(false);
  const describedBy = error
    ? `${name}-error`
    : hint
      ? `${name}-hint`
      : undefined;

  return (
    <FieldShell
      htmlFor={name}
      label={label}
      hint={hint}
      error={error}
      className={className}
    >
      <div className="relative">
        <Input
          {...inputProps}
          id={name}
          name={name}
          autoComplete={autoComplete}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="pe-9"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          title={visible ? hideLabel : showLabel}
          className="absolute inset-y-0 end-0 flex w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
        >
          {visible ? (
            <EyeOff aria-hidden="true" className="size-4" />
          ) : (
            <Eye aria-hidden="true" className="size-4" />
          )}
        </button>
      </div>
    </FieldShell>
  );
}
