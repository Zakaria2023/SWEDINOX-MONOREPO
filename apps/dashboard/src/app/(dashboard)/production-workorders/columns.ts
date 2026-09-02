import { ProductionWorkOrderListItem } from "@/app/(dashboard)/production-workorders/actions";
import { dateCell, ExportColumn, numberCell, textCell } from "@/lib/excel";
import { MACHINE_OPTION_LABELS, WORK_ORDER_STATUS_LABELS } from "@/lib/labels";

/** The production work order overview as a sheet — see the warehouse one. */

export type ProductionWorkOrderColumnKey =
  | "number"
  | "plannedDate"
  | "option"
  | "machineName"
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
export const PRODUCTION_WORK_ORDER_COLUMNS: Array<
  ExportColumn<ProductionWorkOrderListItem, ProductionWorkOrderColumnKey>
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
    key: "option",
    label: "Option",
    defaultVisible: true,
    value: (row) =>
      textCell(row.option ? MACHINE_OPTION_LABELS[row.option] : null),
  },
  {
    key: "machineName",
    label: "Machine",
    defaultVisible: true,
    value: (row) => textCell(row.machineName),
  },
  {
    key: "status",
    label: "Status",
    defaultVisible: true,
    value: (row) => textCell(WORK_ORDER_STATUS_LABELS[row.status]),
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
