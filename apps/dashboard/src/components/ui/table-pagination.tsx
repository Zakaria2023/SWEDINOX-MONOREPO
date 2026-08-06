"use client";

import { Button } from "@/components/shadcn/button";
import { Select } from "@/components/shadcn/select";
import { useTableQuery } from "@/hooks/use-table-query";
import {
  Paged,
  pageRangeLabel,
  TABLE_PAGE_SIZES,
  totalPages,
} from "@/lib/table-query";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props<T> = {
  page: Paged<T>;
  /** What the rows are, for the count: "invoice"/"invoices". */
  singular?: string;
  plural?: string;
};

export const TablePagination = <T,>({
  page,
  singular = "row",
  plural = `${singular}s`,
}: Props<T>) => {
  const { setParams, isPending } = useTableQuery();
  const last = totalPages(page.total, page.pageSize);

  const goTo = (next: number) =>
    setParams({ page: next <= 1 ? null : String(next) });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>{pageRangeLabel(page, singular, plural)}</span>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs">Per page</span>
          <Select
            className="h-8 w-20"
            aria-label="Rows per page"
            disabled={isPending}
            value={String(page.pageSize)}
            // Changing the size changes which rows page 2 holds, so the reader
            // goes back to the first page rather than to an offset that no
            // longer means what it did.
            onValueChange={(size) => setParams({ size, page: null })}
            options={TABLE_PAGE_SIZES.map((size) => ({
              value: String(size),
              label: String(size),
            }))}
          />
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => goTo(page.page - 1)}
            disabled={isPending || page.page <= 1}
          >
            <ChevronLeft className="size-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          <span className="px-1 text-xs">
            Page {page.page} of {last}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => goTo(page.page + 1)}
            disabled={isPending || page.page >= last}
          >
            <ChevronRight className="size-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
