"use client";

import { CompanyQuoteOrderLine } from "@/app/(dashboard)/companies/actions";
import { Select } from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { RelatedRecordsBar } from "@/components/ui/related-records-bar";
import {
  cn,
  formatDateColumn,
  formatLengthMm,
  formatMoney,
  formatNumber,
  orDash,
  pluralize,
} from "@/lib/helpers";
import { ReactNode, useState } from "react";

type Props = {
  lines: CompanyQuoteOrderLine[];
};

type View = "standard" | "released" | "open";

type Column = {
  key: string;
  label: string;
  align?: "right";
  cell: (line: CompanyQuoteOrderLine) => ReactNode;
};

const VIEW_OPTIONS: { value: View; label: string }[] = [
  { value: "standard", label: "Standard" },
  { value: "released", label: "Released" },
  { value: "open", label: "Open" },
];

const money = (value: string | null) =>
  value === null ? "—" : formatMoney(Number(value));

const COLUMNS: Record<string, Column> = {
  orderDate: {
    key: "orderDate",
    label: "Order date",
    cell: (line) => formatDateColumn(line.orderDate),
  },
  deliveryDate: {
    key: "deliveryDate",
    label: "Delivery date",
    cell: (line) => formatDateColumn(line.deliveryDate),
  },
  status: {
    key: "status",
    label: "Status",
    cell: (line) => orDash(line.status),
  },
  order: {
    key: "order",
    label: "Order",
    cell: (line) => `${line.kind === "quote" ? "Q" : "O"}${line.documentId}`,
  },
  line: {
    key: "line",
    label: "Line",
    align: "right",
    cell: (line) => orDash(line.lineNumber),
  },
  productCode: {
    key: "productCode",
    label: "Product code",
    cell: (line) => orDash(line.productCode),
  },
  product: {
    key: "product",
    label: "Product",
    cell: (line) => orDash(line.productName),
  },
  quality: {
    key: "quality",
    label: "Quality",
    cell: (line) => orDash(line.quality),
  },
  qty: {
    key: "qty",
    label: "Qty",
    align: "right",
    cell: (line) =>
      line.quantity === null ? "—" : formatNumber(Number(line.quantity)),
  },
  qtyUnit: {
    key: "qtyUnit",
    label: "QtyU",
    cell: (line) => orDash(line.unit ? line.unit.toUpperCase() : null),
  },
  length: {
    key: "length",
    label: "Length",
    align: "right",
    cell: (line) => formatLengthMm(line.lengthMm),
  },
  width: {
    key: "width",
    label: "Width",
    align: "right",
    cell: (line) => orDash(line.widthMm),
  },
  thickness: {
    key: "thickness",
    label: "Thickness",
    align: "right",
    cell: (line) => orDash(line.thicknessMm),
  },
  stockCategory: {
    key: "stockCategory",
    label: "Stock category",
    cell: (line) => orDash(line.stockCategory),
  },
  kg: {
    key: "kg",
    label: "Kg",
    align: "right",
    cell: (line) => (line.kg === null ? "—" : formatNumber(Number(line.kg))),
  },
  grossPrice: {
    key: "grossPrice",
    label: "Gross price",
    align: "right",
    cell: (line) => money(line.grossPrice),
  },
  netPrice: {
    key: "netPrice",
    label: "Net price",
    align: "right",
    cell: (line) => money(line.netPrice),
  },
  priceUnit: {
    key: "priceUnit",
    label: "PriceU",
    cell: (line) => orDash(line.priceUnit),
  },
  reference: {
    key: "reference",
    label: "Reference",
    cell: (line) => orDash(line.reference),
  },
  daysInSystem: {
    key: "daysInSystem",
    label: "Days in system",
    align: "right",
    cell: (line) => line.daysInSystem,
  },
  customer: {
    key: "customer",
    label: "Customer",
    cell: (line) => orDash(line.customer),
  },
  contractCode: {
    key: "contractCode",
    label: "Contract code",
    cell: (line) => orDash(line.contractCode),
  },
  invoiceNo: {
    key: "invoiceNo",
    label: "Invoice no.",
    cell: (line) => orDash(line.invoiceNo),
  },
};

// The three saved views, each column for column as captured on 8-10-2026.
const VIEW_COLUMNS: Record<View, string[]> = {
  standard: [
    "orderDate",
    "deliveryDate",
    "status",
    "order",
    "line",
    "productCode",
    "product",
    "quality",
    "qty",
    "qtyUnit",
    "length",
    "width",
    "thickness",
    "stockCategory",
    "kg",
    "grossPrice",
    "netPrice",
    "priceUnit",
    "reference",
    "daysInSystem",
  ],
  released: [
    "deliveryDate",
    "order",
    "line",
    "product",
    "length",
    "width",
    "qty",
    "qtyUnit",
    "quality",
    "kg",
    "grossPrice",
    "netPrice",
    "priceUnit",
    "orderDate",
    "thickness",
    "customer",
    "stockCategory",
    "status",
    "contractCode",
    "invoiceNo",
    "reference",
    "productCode",
    "daysInSystem",
  ],
  open: [
    "orderDate",
    "deliveryDate",
    "order",
    "line",
    "status",
    "productCode",
    "product",
    "qty",
    "qtyUnit",
    "quality",
    "length",
    "width",
    "kg",
    "grossPrice",
    "netPrice",
    "priceUnit",
    "thickness",
    "reference",
    "stockCategory",
    "daysInSystem",
  ],
};

/**
 * `Quote- and order lines` on the company (C14): every quote and order line
 * of this company, newest first, through the reference's three views —
 * `Standaard`, `Vrijgegeven` (released) and `Openstaand` (status not
 * invoiced and not expired). The four buttons act on the selected line.
 */
export const CompanyQuoteOrderLinesPanel = ({ lines }: Props) => {
  const [view, setView] = useState<View>("standard");
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);

  const shown = lines.filter((line) =>
    view === "released"
      ? line.isReleased
      : view === "open"
        ? line.isOpen
        : true,
  );
  const columns = VIEW_COLUMNS[view].flatMap((key) => {
    const column = COLUMNS[key];
    return column ? [column] : [];
  });
  const selected = shown.find((line) => line.uuid === selectedUuid) ?? null;

  return (
    <CollapsibleSection
      title="Quote- and order lines"
      summary={`${lines.filter((line) => line.isOpen).length} ${pluralize(lines.filter((line) => line.isOpen).length, "open line")}; ${formatNumber(
        lines
          .filter((line) => line.isOpen)
          .reduce((total, line) => total + Number(line.kg ?? 0), 0),
      )} kg`}
    >
      <div className="space-y-3 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <RelatedRecordsBar
            records={[
              {
                label: "Show",
                href: selected
                  ? `/${selected.kind === "quote" ? "quotes" : "orders"}/${selected.documentUuid}`
                  : null,
              },
              {
                label: "Show contract",
                href: selected?.contractUuid
                  ? `/contracts/${selected.contractUuid}`
                  : null,
              },
              {
                label: "Show product",
                href: selected?.productUuid
                  ? `/products/${selected.productUuid}`
                  : null,
              },
              {
                label: "Show invoice",
                href: selected?.invoiceUuid
                  ? `/invoices/${selected.invoiceUuid}`
                  : null,
              },
            ]}
          />
          <div className="w-40">
            <Select
              id="quote-order-lines-view"
              value={view}
              options={VIEW_OPTIONS}
              onValueChange={(next) => setView(next as View)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(column.align === "right" && "text-right")}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-16 text-center text-muted-foreground"
                >
                  No lines.
                </TableCell>
              </TableRow>
            ) : (
              shown.map((line) => (
                <TableRow
                  key={`${line.kind}-${line.uuid}`}
                  onClick={() => setSelectedUuid(line.uuid)}
                  className={cn(
                    "cursor-pointer",
                    line.uuid === selectedUuid && "bg-accent",
                  )}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(
                        "whitespace-nowrap",
                        column.align === "right" && "text-right tabular-nums",
                      )}
                    >
                      {column.cell(line)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </CollapsibleSection>
  );
};
