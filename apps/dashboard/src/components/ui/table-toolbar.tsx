"use client";

import { Button } from "@/components/shadcn/button";
import { TableFilter } from "@/components/ui/table-filters";
import { TableSearch } from "@/components/ui/table-search";
import { useTableQuery } from "@/hooks/use-table-query";
import { TableFilterControl } from "@/lib/table-query";
import { FilterX } from "lucide-react";
import { ReactNode } from "react";

type Props = {
  /** Left off, the overview offers no free-text search. */
  searchPlaceholder?: string;
  filters?: readonly TableFilterControl[];
  /** The column selector, an export button — whatever the overview adds. */
  children?: ReactNode;
};

export const TableToolbar = ({
  searchPlaceholder,
  filters = [],
  children,
}: Props) => {
  const { searchParams, setParams, isPending } = useTableQuery();

  const activeKeys = [
    ...filters.map((filter) => filter.key),
    ...(searchPlaceholder ? ["q"] : []),
  ].filter((key) => searchParams.get(key));

  const clearAll = () =>
    setParams(Object.fromEntries(activeKeys.map((key) => [key, null])));

  if (!searchPlaceholder && filters.length === 0 && !children) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-wrap items-end gap-3">
        {searchPlaceholder && (
          <TableSearch placeholder={searchPlaceholder} className="w-64" />
        )}
        {filters.map((filter) => (
          <TableFilter key={filter.key} control={filter} />
        ))}
        {activeKeys.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            disabled={isPending}
          >
            <FilterX className="me-2 size-4" />
            Clear
          </Button>
        )}
      </div>
      {children && <div className="flex items-end gap-2">{children}</div>}
    </div>
  );
};
