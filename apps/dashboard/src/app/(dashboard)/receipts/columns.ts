import type { ReceiptRow } from "@/app/(dashboard)/receipts/actions";
import {
  dateCell,
  ExportCellValue,
  ExportColumn,
  numberCell,
  textCell,
} from "@/lib/excel";
import { materialStillToInvoice } from "@/lib/helpers";
import { ORDER_LINE_STATUS_LABELS, RECEIPT_STATUS_LABELS } from "@/lib/labels";
import type { OrderLineStatus, ReceiptStatus } from "@/lib/enums";

/**
 * `Receipts` — all 22 columns of the reference's export (3 088 receptions,
 * docs/reference-system/receipts.md), in its own order.
 *
 * `Material still to be invoiced` is what has arrived and not been billed,
 * struck at the purchase line's price — the accrual behind Finance's
 * `Purchase invoices to be received`. A return receipt carries none.
 */

export type ReceiptColumnKey =
  | "section"
  | "mainGroup"
  | "subGroup"
  | "product"
  | "companyCode"
  | "company"
  | "companyLocation"
  | "orderType"
  | "year"
  | "month"
  | "completedOn"
  | "qty"
  | "unit"
  | "deliverTime"
  | "kg"
  | "orderNumber"
  | "orderLine"
  | "receiptStatus"
  | "lineStatus"
  | "revenueGroupNumber"
  | "revenueGroup"
  | "materialStillToInvoice";

type Column = ExportColumn<ReceiptRow, ReceiptColumnKey>;

const column = (
  key: ReceiptColumnKey,
  label: string,
  defaultVisible: boolean,
  value: (row: ReceiptRow) => ExportCellValue,
): Column => ({ key, label, defaultVisible, value });

const stillToInvoice = (row: ReceiptRow) =>
  row.orderType === "Return"
    ? 0
    : materialStillToInvoice({
        status: row.receiptStatus as ReceiptStatus | null,
        kgReceived: row.kg,
        pricePerUnit: row.netPrice ?? 0,
        priceUnit: row.priceUnit,
      });

export const RECEIPT_COLUMNS: Column[] = [
  column("section", "Warehouse section", false, (row) => textCell(row.sectionName)),
  column("mainGroup", "Main group", false, (row) => textCell(row.mainGroup)),
  column("subGroup", "Subgroup", false, (row) => textCell(row.subGroup)),
  column("product", "Product", true, (row) =>
    textCell([row.productCode, row.productName].filter(Boolean).join(" — ")),
  ),
  column("companyCode", "Company code", true, (row) => row.companyCode),
  column("company", "Company", true, (row) => textCell(row.companyName)),
  column("companyLocation", "Company location", false, (row) =>
    textCell(row.companyCity?.toUpperCase()),
  ),
  column("orderType", "Order type", true, (row) => row.orderType),
  column("year", "Year (Date completed)", false, (row) =>
    row.completedOn ? Number(row.completedOn.slice(0, 4)) : null,
  ),
  column("month", "Month (Date completed)", false, (row) =>
    row.completedOn ? Number(row.completedOn.slice(5, 7)) : null,
  ),
  column("completedOn", "Date reported as completed", true, (row) =>
    dateCell(row.completedOn),
  ),
  column("qty", "Qty", true, (row) => row.qty),
  column("unit", "QtyU", true, (row) => textCell(row.unit)),
  column("deliverTime", "Deliver time", false, (row) => row.deliverDays),
  column("kg", "Kg", true, (row) => row.kg),
  column("orderNumber", "Order no", true, (row) => textCell(row.orderNumber)),
  column("orderLine", "Order line", true, (row) => numberCell(row.orderLine)),
  column("receiptStatus", "Receipt status", true, (row) =>
    row.receiptStatus
      ? (RECEIPT_STATUS_LABELS[row.receiptStatus as ReceiptStatus] ??
        row.receiptStatus)
      : null,
  ),
  column("lineStatus", "Line status", true, (row) =>
    row.lineStatus
      ? (ORDER_LINE_STATUS_LABELS[row.lineStatus as OrderLineStatus] ??
        row.lineStatus)
      : null,
  ),
  column("revenueGroupNumber", "Revenue group number", false, (row) =>
    row.revenueGroupNumber,
  ),
  column("revenueGroup", "Revenue group", false, (row) =>
    textCell(row.revenueGroupName),
  ),
  column("materialStillToInvoice", "Material still to be invoiced", true, (row) => {
    const value = stillToInvoice(row);
    return value === 0 ? null : value;
  }),
];
