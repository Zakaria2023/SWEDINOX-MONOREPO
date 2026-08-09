"use client";

import { exportTableSheet } from "@/app/(dashboard)/actions";
import { Button } from "@/components/shadcn/button";
import { useExcelExport } from "@/hooks/use-excel-export";
import { sheetFromTable } from "@/lib/excel";
import { SearchParams } from "@/lib/table-query";
import { Download, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { ReactNode } from "react";

/**
 * The Export button every overview carries, in its two forms.
 *
 * Which one an overview uses follows from where its rows are. A table that
 * renders everything it has can be read straight off the screen, so
 * `TableExportButton` does that and the server only writes the file. A table
 * that pages on the server has ten rows in the browser and thousands behind it,
 * so `PagedTableExportButton` hands the current view — the search, the filters,
 * the sort, the columns on show — to the overview's own export action and lets
 * it re-run the query without the page window.
 *
 * Both produce the same thing from the reader's side: the rows they are looking
 * at, in the columns they have chosen, in the order they put them in.
 */

type ExportButtonProps = {
  isExporting: boolean;
  error: string | null;
  onExport: () => void;
  children?: ReactNode;
};

type TableExportButtonProps = {
  /** The id on the <Table> whose rows are exported. */
  tableId: string;
  /** The file downloads as this, plus the date — "orders-2026-08-09.xlsx". */
  fileName: string;
  /** The sheet's tab name. Defaults to the file name. */
  sheetName?: string;
};

type PagedTableExportButtonProps = {
  fileName: string;
  /**
   * The columns currently on show, in the order the table lists them. Left off
   * — an overview whose columns are fixed — every column is exported.
   */
  columnKeys?: readonly string[];
  /** The overview's own export action, which re-runs its query unpaged. */
  action: (params: SearchParams, columnKeys: string[]) => Promise<string>;
};

/**
 * The current URL as the shape a list action reads.
 *
 * Every value is collected rather than the first, because a multi-select filter
 * repeats its key and an export narrowed to one of three chosen statuses is the
 * wrong file.
 */
const toSearchParams = (params: URLSearchParams): SearchParams => {
  const result: SearchParams = {};
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    result[key] = values.length > 1 ? values : values[0];
  }
  return result;
};

const ExportButton = ({
  isExporting,
  error,
  onExport,
  children = "Export",
}: ExportButtonProps) => (
  <div className="flex flex-col items-end gap-1">
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onExport}
      disabled={isExporting}
    >
      {isExporting ? (
        <Loader2 className="me-2 size-4 animate-spin" />
      ) : (
        <Download className="me-2 size-4" />
      )}
      {children}
    </Button>
    {error && (
      <p role="alert" className="text-xs text-red-600">
        {error}
      </p>
    )}
  </div>
);

export const TableExportButton = ({
  tableId,
  fileName,
  sheetName,
}: TableExportButtonProps) => {
  const { runExport, isExporting, error } = useExcelExport();

  const onExport = () =>
    runExport(fileName, async () => {
      const table = document.getElementById(tableId);
      if (!(table instanceof HTMLTableElement)) {
        throw new Error("There is no table on this page to export");
      }
      return exportTableSheet(sheetFromTable(table, sheetName ?? fileName));
    });

  return (
    <ExportButton isExporting={isExporting} error={error} onExport={onExport} />
  );
};

export const PagedTableExportButton = ({
  fileName,
  columnKeys = [],
  action,
}: PagedTableExportButtonProps) => {
  const searchParams = useSearchParams();
  const { runExport, isExporting, error } = useExcelExport();

  const onExport = () =>
    runExport(fileName, () =>
      action(toSearchParams(new URLSearchParams(searchParams)), [
        ...columnKeys,
      ]),
    );

  return (
    <ExportButton isExporting={isExporting} error={error} onExport={onExport} />
  );
};
