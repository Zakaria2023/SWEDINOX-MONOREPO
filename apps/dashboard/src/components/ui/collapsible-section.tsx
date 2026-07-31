"use client";

import { ChevronDown } from "lucide-react";
import { ReactNode, useId, useState } from "react";
import { cn } from "@/lib/helpers";

type CollapsibleSectionProps = {
  title: string;
  /** One-line state shown on the closed bar, e.g. "No complaints". */
  summary?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
};

// The stacked, collapsible panels the reference ERP uses for the secondary
// blocks of a document screen. Each bar states what is inside it, so the whole
// document can be read without opening anything.
export const CollapsibleSection = ({
  title,
  summary,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <section className="overflow-hidden rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className="flex w-full cursor-pointer items-center gap-3 bg-muted/40 px-4 py-2.5 text-left transition-colors hover:bg-muted/70"
      >
        <span className="text-sm font-semibold">{title}</span>
        {summary && (
          <span className="line-clamp-1 flex-1 text-xs text-muted-foreground">
            {summary}
          </span>
        )}
        <ChevronDown
          className={cn(
            "ml-auto size-4 shrink-0 text-muted-foreground transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>
      {isOpen && (
        <div id={contentId} className="border-t border-border p-4">
          {children}
        </div>
      )}
    </section>
  );
};
