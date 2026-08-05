import { ChevronRight } from "lucide-react";
import Link from "next/link";

type EditSectionCardProps = {
  title: string;
  summary: string;
  href: string;
  count?: number;
};

export const EditSectionCard = ({
  title,
  summary,
  href,
  count,
}: EditSectionCardProps) => (
  <Link
    href={href}
    className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
  >
    <div className="min-w-0">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="line-clamp-1 text-sm text-muted-foreground">{summary}</p>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      {count !== undefined && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {count}
        </span>
      )}
      <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </div>
  </Link>
);
