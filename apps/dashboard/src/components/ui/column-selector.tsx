"use client";

import { ChevronDown } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/shadcn/button";
import { useClickOutside } from "@/hooks/use-click-outside";

type Column = {
  key: string;
  label: string;
};

type ColumnSelectorProps = {
  columns: readonly Column[];
  visibility: Record<string, boolean>;
  onToggle: (key: string) => void;
};

export const ColumnSelector = ({
  columns,
  visibility,
  onToggle,
}: ColumnSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);
  const ref = useClickOutside<HTMLDivElement>(close);

  return (
    <div ref={ref} className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen((open) => !open)}
      >
        Columns
        <ChevronDown className="ms-2 h-4 w-4" />
      </Button>

      {/* ⚠️ `z-50`, not `z-10`. A table's sticky header is itself `z-10`, and
          it comes later in the document, so at equal depth the header wins and
          paints straight through this menu. Every other floating layer in the
          app — the select, the date picker, the dialog, the tooltip — sits at
          `z-50`, and this is the one that did not. */}
      {isOpen && (
        <div className="absolute end-0 z-50 mt-1 max-h-80 min-w-44 overflow-y-auto rounded-md border bg-background p-2 shadow-md">
          {columns.map((column) => (
            <label
              key={column.key}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
            >
              <input
                type="checkbox"
                checked={visibility[column.key] ?? true}
                onChange={() => onToggle(column.key)}
                className="h-4 w-4 rounded border-border"
              />
              {column.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};
