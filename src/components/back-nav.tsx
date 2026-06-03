import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type BackNavProps = {
  href?: string;
  label?: string;
};

export function BackNav({
  href = "/",
  label = "Back to Dashboard",
}: BackNavProps) {
  return (
    <nav aria-label="Page navigation">
      <Link
        href={href}
        className="inline-flex min-h-11 items-center gap-2.5 rounded-lg border border-border/70 bg-card/80 px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-foreground shadow-sm transition-colors hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-background active:bg-[var(--accent)]/15"
      >
        <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </Link>
    </nav>
  );
}
