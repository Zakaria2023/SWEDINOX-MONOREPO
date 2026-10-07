"use client";

import Link from "next/link";
import { useState } from "react";
import {
  exportVisitSchedule,
  VisitScheduleRow,
} from "@/app/(dashboard)/visit-schedule/actions";
import {
  VISIT_SCHEDULE_COLUMNS,
  VisitScheduleColumnKey,
} from "@/app/(dashboard)/visit-schedule/columns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { ColumnSelector } from "@/components/ui/column-selector";
import { ExportValueCell } from "@/components/ui/export-value-cell";
import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { VisitPlanMonthPicker } from "@/components/visit-schedule/visit-plan-month-picker";
import { VisitPlanToggle } from "@/components/visit-schedule/visit-plan-toggle";
import { selectorColumns } from "@/lib/excel";
import {
  buildColumnVisibility,
  formatDateColumn,
  formatMoneyOrDash,
  monthOfDate,
  orDash,
  yesNo,
} from "@/lib/helpers";
import { CUSTOMER_GROUP_LABELS } from "@/lib/labels";
import { Paged, TableFilterControl } from "@/lib/table-query";

type ColumnKey = VisitScheduleColumnKey;

/**
 * Which of the three screens this is.
 *
 * `list` is the reference's `To visit/call`, `plan` its `Visit schedule` with
 * the month's ticks read back, and `edit` its `Change visit schedule` where
 * those ticks are set. One grid, because the reference's three are one table:
 * their shared columns are identical on 2 531 of 2 531 rows.
 */
type VisitScheduleVariant = "list" | "plan" | "edit";

type Props = {
  page: Paged<VisitScheduleRow>;
  filters: TableFilterControl[];
  columnKeys: ColumnKey[];
  variant: VisitScheduleVariant;
  period: { year: number; month: number };
  fileName: string;
};

const SORTABLE: Partial<Record<ColumnKey, string>> = {
  companyName: "company",
  companyCode: "companyCode",
  region: "region",
  customerGroup: "customerGroup",
  accountManager: "accountManager",
  representative: "representative",
};

const RIGHT_ALIGNED = new Set<ColumnKey>([
  "companyCode",
  "targetYearRevenue",
  "revenueLast12Months",
  "revenueLastMonth",
]);

export const VisitScheduleTable = ({
  page,
  filters,
  columnKeys,
  variant,
  period,
  fileName,
}: Props) => {
  const columns = VISIT_SCHEDULE_COLUMNS.filter((column) =>
    columnKeys.includes(column.key),
  );
  const allColumns = selectorColumns(columns);

  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(allColumns));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = allColumns.filter((col) => columnVisibility[col.key]);

  // A contact that has come round is the whole reason to open this screen, so
  // it is a word rather than a tick: an em dash column scans as empty and this
  // one is not.
  const dueCell = (due: boolean) =>
    due ? <span className="font-medium text-primary">Due</span> : "—";

  const planCell = (row: VisitScheduleRow, kind: "visit" | "call") => {
    const planned = kind === "visit" ? row.planVisit : row.planCall;

    if (variant !== "edit") {
      return yesNo(planned);
    }

    return (
      <VisitPlanToggle
        companyUuid={row.companyUuid}
        companyName={row.companyName}
        year={period.year}
        month={period.month}
        kind={kind === "visit" ? "visit" : "telephone_contact"}
        planned={planned}
      />
    );
  };

  const renderCell = (row: VisitScheduleRow, key: ColumnKey) => {
    switch (key) {
      case "companyCode":
        return (
          <TableCell key={key} className="text-right tabular-nums">
            {row.companyCode}
          </TableCell>
        );
      case "companyName":
        return (
          <TableCell key={key} className="font-medium">
            <Link
              href={`/companies/${row.companyUuid}`}
              className="text-primary hover:underline"
            >
              {orDash(row.companyName)}
            </Link>
          </TableCell>
        );
      case "visitStreetAndNo":
        return <TableCell key={key}>{orDash(row.visitStreetAndNo)}</TableCell>;
      case "visitPostalCode":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {orDash(row.visitPostalCode)}
          </TableCell>
        );
      case "visitCity":
        return <TableCell key={key}>{orDash(row.visitCity)}</TableCell>;
      case "visitCountry":
        return <TableCell key={key}>{orDash(row.visitCountry)}</TableCell>;
      case "visitTelephone":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {orDash(row.visitTelephone)}
          </TableCell>
        );
      case "accountManager":
        return <TableCell key={key}>{orDash(row.accountManager)}</TableCell>;
      case "representative":
        return <TableCell key={key}>{orDash(row.representative)}</TableCell>;
      case "targetYearRevenue":
        return (
          <TableCell key={key} className="text-right tabular-nums">
            {formatMoneyOrDash(row.targetYearRevenue)}
          </TableCell>
        );
      case "revenueLast12Months":
        return (
          <TableCell key={key} className="text-right tabular-nums">
            {formatMoneyOrDash(row.revenueLast12Months)}
          </TableCell>
        );
      case "revenueLastMonth":
        return (
          <TableCell key={key} className="text-right tabular-nums">
            {formatMoneyOrDash(row.revenueLastMonth)}
          </TableCell>
        );
      case "customerGroup":
        return (
          <TableCell key={key}>
            {orDash(
              row.customerGroup
                ? CUSTOMER_GROUP_LABELS[row.customerGroup]
                : null,
            )}
          </TableCell>
        );
      case "lastCallDate":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {formatDateColumn(row.lastCallDate)}
          </TableCell>
        );
      case "callUpcomingMonth":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {orDash(monthOfDate(row.callUpcoming))}
          </TableCell>
        );
      case "lastVisitDate":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {formatDateColumn(row.lastVisitDate)}
          </TableCell>
        );
      case "visitUpcomingMonth":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {orDash(monthOfDate(row.visitUpcoming))}
          </TableCell>
        );
      case "contactPerson":
        return (
          <TableCell key={key}>
            {orDash(
              [row.contactFirstName, row.contactLastName]
                .filter(Boolean)
                .join(" ") || null,
            )}
          </TableCell>
        );
      case "contactEmail":
        return <TableCell key={key}>{orDash(row.contactEmail)}</TableCell>;
      case "contactMobile":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {orDash(row.contactMobile)}
          </TableCell>
        );
      case "region":
        return <TableCell key={key}>{orDash(row.region)}</TableCell>;
      case "planMonth":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {orDash(row.planPeriodLabel)}
          </TableCell>
        );
      case "planCall":
        return (
          <TableCell key={key} className="text-center">
            {planCell(row, "call")}
          </TableCell>
        );
      case "planVisit":
        return (
          <TableCell key={key} className="text-center">
            {planCell(row, "visit")}
          </TableCell>
        );
      case "callDue":
        return (
          <TableCell key={key} className="text-center">
            {dueCell(row.callDue)}
          </TableCell>
        );
      case "visitDue":
        return (
          <TableCell key={key} className="text-center">
            {dueCell(row.visitDue)}
          </TableCell>
        );
      default: {
        const column = VISIT_SCHEDULE_COLUMNS.find((col) => col.key === key);
        return (
          <ExportValueCell key={key} value={column ? column.value(row) : null} />
        );
      }
    }
  };

  return (
    <div className="space-y-4">
      <TableToolbar searchPlaceholder="Search company…" filters={filters}>
        {variant !== "list" && (
          <VisitPlanMonthPicker year={period.year} month={period.month} />
        )}
        <ColumnSelector
          columns={allColumns.map((col) => ({
            key: col.key,
            label: col.label,
          }))}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
        <PagedTableExportButton
          fileName={fileName}
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportVisitSchedule}
        />
      </TableToolbar>

      {page.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-medium">No customers or prospects</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Companies appear here once they are marked as a customer or a
            prospect.
          </p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.map((col) => {
                  const sortKey = SORTABLE[col.key];
                  if (sortKey) {
                    return (
                      <TableSortHeader key={col.key} sortKey={sortKey}>
                        {col.label}
                      </TableSortHeader>
                    );
                  }
                  return (
                    <TableHead
                      key={col.key}
                      className={
                        RIGHT_ALIGNED.has(col.key) ? "text-right" : undefined
                      }
                    >
                      {col.label}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {page.rows.map((row) => (
                <TableRow key={row.companyUuid}>
                  {visibleColumns.map((col) => renderCell(row, col.key))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination page={page} singular="company" plural="companies" />
        </>
      )}
    </div>
  );
};
