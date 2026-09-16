"use client";

import Link from "next/link";
import {
  exportStockOnAdvice,
  StockOnAdvicePage,
  StockOnAdviceRow,
} from "@/app/(dashboard)/stockon-advice/actions";
import {
  STOCKON_ADVICE_COLUMNS,
  StockOnAdviceColumnKey,
} from "@/app/(dashboard)/stockon-advice/columns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { Button } from "@/components/shadcn/button";
import { BooleanFlag } from "@/components/ui/boolean-flag";
import { ColumnSelector } from "@/components/ui/column-selector";
import { StockOnAdviceOrderButton } from "@/components/stockon-advice/stockon-advice-order-button";
import { PagedTableExportButton } from "@/components/ui/table-export-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { TableSortHeader } from "@/components/ui/table-sort-header";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { selectorColumns } from "@/lib/excel";
import {
  buildColumnVisibility,
  cn,
  formatDateColumn,
  formatNumber,
} from "@/lib/helpers";
import { LEAD_TIME_METHOD_LABELS } from "@/lib/labels";
import { PackageSearch } from "lucide-react";
import { useState } from "react";

type ColumnKey = StockOnAdviceColumnKey;

type Props = {
  page: StockOnAdvicePage;
};

// The column selector and the export read the same declaration, so a column
// cannot be on screen and missing from the file.
const ALL_COLUMNS = selectorColumns(STOCKON_ADVICE_COLUMNS);

const SORTABLE: Partial<Record<ColumnKey, string>> = {
  productCode: "productCode",
  productName: "productName",
  mainGroup: "mainGroup",
  supplierName: "supplierName",
  technicalStock: "technicalStock",
  availableStock: "availableStock",
  orderLevel: "orderLevel",
  toOrder: "toOrder",
  pctDifference: "pctDifference",
  daysOfStock: "daysOfStock",
  leadTimeDays: "leadTimeDays",
  workingDaysUntilFirstReceipt: "workingDaysUntilFirstReceipt",
};

const number = (value: number | null) =>
  value === null ? "—" : formatNumber(value);

export const StockOnAdviceTable = ({ page }: Props) => {
  const [columnVisibility, setColumnVisibility] = useState<
    Record<ColumnKey, boolean>
  >(buildColumnVisibility(ALL_COLUMNS));

  const toggleColumn = (key: string) =>
    setColumnVisibility((prev) => ({
      ...prev,
      [key]: !prev[key as ColumnKey],
    }));

  const visibleColumns = ALL_COLUMNS.filter((col) => columnVisibility[col.key]);

  const renderCell = (row: StockOnAdviceRow, key: ColumnKey) => {
    switch (key) {
      case "mainGroup":
        return <TableCell key={key}>{row.mainGroup ?? "—"}</TableCell>;
      case "productGroup":
        return <TableCell key={key}>{row.productGroup ?? "—"}</TableCell>;
      case "productCode":
        return (
          <TableCell key={key} className="font-medium whitespace-nowrap">
            <Link
              href={`/products/${row.productUuid}`}
              className="text-primary hover:underline"
            >
              {row.productCode}
            </Link>
          </TableCell>
        );
      case "productName":
        return <TableCell key={key}>{row.productName}</TableCell>;
      case "technicalStock":
        return (
          <TableCell key={key} className="text-right">
            {number(row.technicalStock)}
          </TableCell>
        );
      case "reserved":
        return (
          <TableCell key={key} className="text-right">
            {number(row.reserved)}
          </TableCell>
        );
      case "stockUnit":
        return <TableCell key={key}>{row.stockUnit ?? "—"}</TableCell>;
      case "orderLevelStockUnit":
        return (
          <TableCell key={key} className="text-right">
            {number(row.orderLevelStockUnit)}
          </TableCell>
        );
      case "toOrderStockUnit":
        return (
          <TableCell key={key} className="text-right">
            {number(row.toOrderStockUnit)}
          </TableCell>
        );
      case "toOrder":
        return (
          <TableCell
            key={key}
            className={cn(
              "text-right whitespace-nowrap",
              row.toOrder !== null &&
                row.toOrder > 0 &&
                "font-semibold text-amber-700",
            )}
          >
            {number(row.toOrder)}
          </TableCell>
        );
      case "orderLevel":
        return (
          <TableCell key={key} className="text-right">
            {number(row.orderLevel)}
          </TableCell>
        );
      case "availableStock":
        return (
          <TableCell key={key} className="text-right">
            {number(row.availableStock)}
          </TableCell>
        );
      case "technicalPlusToReceive":
        return (
          <TableCell key={key} className="text-right">
            {number(row.technicalPlusToReceive)}
          </TableCell>
        );
      case "stockMinusOrderLevel":
        return (
          <TableCell
            key={key}
            className={cn(
              "text-right",
              row.stockMinusOrderLevel !== null &&
                row.stockMinusOrderLevel < 0 &&
                "text-amber-700",
            )}
          >
            {number(row.stockMinusOrderLevel)}
          </TableCell>
        );
      case "purchaseUnit":
        return <TableCell key={key}>{row.purchaseUnit ?? "—"}</TableCell>;
      case "pctDifference":
        return (
          <TableCell key={key} className="text-right whitespace-nowrap">
            {row.pctDifference === null
              ? "—"
              : `${formatNumber(row.pctDifference)}%`}
          </TableCell>
        );
      case "orderNow":
        return (
          <TableCell key={key}>
            <BooleanFlag on={row.orderNow} label="Order now" />
          </TableCell>
        );
      case "determinedByStockOp":
        return (
          <TableCell key={key}>
            <BooleanFlag
              on={row.determinedByStockOp}
              label="Set on the product"
            />
          </TableCell>
        );
      case "supplierName":
        return <TableCell key={key}>{row.supplierName ?? "—"}</TableCell>;
      case "toBeReceivedLongTerm":
        return (
          <TableCell key={key} className="text-right">
            {number(row.toBeReceivedLongTerm)}
          </TableCell>
        );
      case "toBeReceivedShortTerm":
        return (
          <TableCell key={key} className="text-right">
            {number(row.toBeReceivedShortTerm)}
          </TableCell>
        );
      case "reviewPeriodDays":
        return (
          <TableCell key={key} className="text-right">
            {number(row.reviewPeriodDays)}
          </TableCell>
        );
      case "leadTimeDays":
        return (
          <TableCell key={key} className="text-right">
            {number(row.leadTimeDays)}
          </TableCell>
        );
      case "leadTimeMethod":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {LEAD_TIME_METHOD_LABELS[row.leadTimeMethod]}
          </TableCell>
        );
      case "evaluateToday":
        return (
          <TableCell key={key}>
            <BooleanFlag on={row.evaluateToday} label="Reviewed today" />
          </TableCell>
        );
      case "avgConsumptionPerDay":
        return (
          <TableCell key={key} className="text-right">
            {number(row.avgConsumptionPerDay)}
          </TableCell>
        );
      case "avgConsumptionDuringLR":
        return (
          <TableCell key={key} className="text-right">
            {number(row.avgConsumptionDuringLR)}
          </TableCell>
        );
      case "daysOfStock":
        return (
          <TableCell key={key} className="text-right">
            {number(row.daysOfStock)}
          </TableCell>
        );
      case "firstPurchaseOrderId":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {row.firstPurchaseOrderUuid && row.firstPurchaseOrderId ? (
              <Link
                href={`/purchase-orders/${row.firstPurchaseOrderUuid}`}
                className="text-primary hover:underline"
              >
                #{row.firstPurchaseOrderId}
              </Link>
            ) : (
              "—"
            )}
          </TableCell>
        );
      case "firstReceiptDate":
        return (
          <TableCell key={key} className="whitespace-nowrap">
            {formatDateColumn(row.firstReceiptDate)}
          </TableCell>
        );
      case "workingDaysUntilFirstReceipt":
        return (
          <TableCell key={key} className="text-right">
            {number(row.workingDaysUntilFirstReceipt)}
          </TableCell>
        );
      case "pacClassification":
        return <TableCell key={key}>{row.pacClassification ?? "—"}</TableCell>;
      case "orderAdviceCode":
        return <TableCell key={key}>{row.orderAdviceCode ?? "—"}</TableCell>;
    }
  };

  // Nothing on screen has two entirely different causes, and telling them apart
  // is the difference between a screen that looks broken and one that explains
  // itself: either no product has been put on the reorder plan at all, or the
  // plan simply has nothing to say about the rows this view asked for.
  //
  // Shown instead of the grid rather than inside it. Thirty-odd columns make a
  // row wider than the window, and a sentence stretched across that width is
  // one the reader has to scroll sideways to finish — so with nothing to show,
  // the grid goes away and the message keeps a readable measure.
  const emptyState =
    page.enrolled === 0 ? (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center">
        <PackageSearch className="size-8 text-muted-foreground" />
        <div className="max-w-md space-y-1">
          <p className="font-medium">No products are on the reorder plan yet</p>
          <p className="text-sm text-muted-foreground">
            This screen works out when to buy a product back from how fast it
            sells, how long its supplier takes to deliver, and how often you
            review the decision. A product joins the plan from its own Stock
            policy tab — tick “Use StockOp for this product”, then fill in its
            lead time and review period.
          </p>
        </div>
        <Button variant="outline" size="sm" render={<Link href="/products" />}>
          Open products
        </Button>
      </div>
    ) : (
      <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center">
        <p className="font-medium">Nothing matches this view</p>
        <p className="max-w-md text-sm text-muted-foreground">
          {page.enrolled === 1
            ? "One product is on the reorder plan, but it falls outside the current search and filters."
            : `${formatNumber(page.enrolled)} products are on the reorder plan, but none of them falls inside the current search and filters.`}
        </p>
      </div>
    );

  return (
    <div className="space-y-4">
      <TableToolbar
        searchPlaceholder="Search product, group or supplier…"
        filters={page.filters}
      >
        <ColumnSelector
          columns={ALL_COLUMNS.map((col) => ({
            key: col.key,
            label: col.label,
          }))}
          visibility={columnVisibility}
          onToggle={toggleColumn}
        />
        <PagedTableExportButton
          fileName="stockon-advice"
          columnKeys={visibleColumns.map((column) => column.key)}
          action={exportStockOnAdvice}
        />
      </TableToolbar>

      {page.rows.length === 0 ? (
        emptyState
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.map((col) => {
                  const sortKey = SORTABLE[col.key];
                  return sortKey ? (
                    <TableSortHeader key={col.key} sortKey={sortKey}>
                      {col.label}
                    </TableSortHeader>
                  ) : (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  );
                })}
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {page.rows.map((row) => (
                <TableRow
                  key={row.productUuid}
                  className={cn(row.orderNow && "bg-amber-50")}
                >
                  {visibleColumns.map((col) => renderCell(row, col.key))}
                  <TableCell className="text-right">
                    <StockOnAdviceOrderButton
                      productUuid={row.productUuid}
                      toOrder={row.toOrder}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            page={page}
            singular="advised product"
            plural="advised products"
          />
        </>
      )}
    </div>
  );
};
