import { WorkOrderListItem } from "@/app/(dashboard)/warehouse-work-orders/actions";
import { dateCell, ExportColumn, numberCell, textCell } from "@/lib/excel";
import {
  WAREHOUSE_WORK_ORDER_STATUS_LABELS,
  WAREHOUSE_WORK_ORDER_TYPE_LABELS,
} from "@/lib/labels";

/** The warehouse work order overview as a sheet — see app/(dashboard)/stock/columns.ts. */

export type WarehouseWorkOrderColumnKey =
  | "number"
  | "plannedDate"
  | "type"
  | "warehouseName"
  | "status"
  | "lineCount"
  | "qtyPlanned"
  | "qtyActual"
  | "kgPlanned"
  | "kgActual"
  | "createdAt";

// The screen pairs planned against actual to save width. A sheet has no such
// pressure, and each figure is something somebody sums or sorts on, so every
// one gets a column of its own.
export const WAREHOUSE_WORK_ORDER_COLUMNS: Array<
  ExportColumn<WorkOrderListItem, WarehouseWorkOrderColumnKey>
> = [
  {
    key: "number",
    label: "Number",
    defaultVisible: true,
    value: (row) => numberCell(row.number),
  },
  {
    key: "plannedDate",
    label: "Planned",
    defaultVisible: true,
    value: (row) => dateCell(row.plannedDate),
  },
  {
    key: "type",
    label: "Type",
    defaultVisible: true,
    value: (row) => textCell(WAREHOUSE_WORK_ORDER_TYPE_LABELS[row.type]),
  },
  {
    key: "warehouseName",
    label: "Warehouse",
    defaultVisible: true,
    value: (row) => textCell(row.warehouseName),
  },
  {
    key: "status",
    label: "Status",
    defaultVisible: true,
    value: (row) => textCell(WAREHOUSE_WORK_ORDER_STATUS_LABELS[row.status]),
  },
  {
    key: "lineCount",
    label: "Lines",
    defaultVisible: true,
    value: (row) => numberCell(row.lineCount),
  },
  {
    key: "qtyPlanned",
    label: "Qty Planned",
    defaultVisible: true,
    value: (row) => numberCell(row.qtyPlanned),
  },
  {
    key: "qtyActual",
    label: "Qty Actual",
    defaultVisible: true,
    value: (row) => numberCell(row.qtyActual),
  },
  {
    key: "kgPlanned",
    label: "Kg Planned",
    defaultVisible: false,
    value: (row) => numberCell(row.kgPlanned),
  },
  {
    key: "kgActual",
    label: "Kg Actual",
    defaultVisible: false,
    value: (row) => numberCell(row.kgActual),
  },
  {
    key: "createdAt",
    label: "Created",
    defaultVisible: false,
    value: (row) => dateCell(row.createdAt),
  },
];
