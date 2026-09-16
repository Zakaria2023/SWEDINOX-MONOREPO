import { ComplaintLineOverviewRow } from "@/app/(dashboard)/complaint-lines/actions";
import {
  ComplaintOverviewColumnKey,
  complaintOverviewColumns,
} from "@/app/(dashboard)/complaints/columns";
import { ExportColumn, numberCell, textCell } from "@/lib/excel";

/**
 * The Complaint lines overview as a sheet: the reference's 30 columns. The
 * first 28 are the Complaints overview's without `Total costs`, three of them
 * under the names this screen gives them; the line adds `Order line` and
 * `Warehouse section`.
 */

export type ComplaintLineColumnKey =
  | ComplaintOverviewColumnKey
  | "orderLine"
  | "warehouseSection";

export const COMPLAINT_LINE_COLUMNS: Array<
  ExportColumn<ComplaintLineOverviewRow, ComplaintLineColumnKey>
> = [
  ...complaintOverviewColumns<ComplaintLineOverviewRow>({
    correspondenceName: "Correspondence Name",
    document: "Order",
    capturedBy: "Created by",
  }).filter((column) => column.key !== "totalCosts"),
  {
    key: "orderLine",
    label: "Order line",
    defaultVisible: true,
    value: (row) => numberCell(row.orderLine),
  },
  {
    key: "warehouseSection",
    label: "Warehouse section",
    defaultVisible: true,
    value: (row) => textCell(row.warehouseSection),
  },
];
