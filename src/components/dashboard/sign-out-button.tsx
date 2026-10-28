import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/auth/actions";

/**
 * Terminar sessão — Server Component: o `action` recebe diretamente a
 * server action, sem estado de cliente.
 */
export function SignOutButton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <form action={signOutAction}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className={className}
        aria-label={label}
      >
        <LogOut aria-hidden="true" data-icon="inline-start" />
        {label}
      </Button>
    </form>
  );
}
