import { ProductionWorkOrderLineRow } from "@/app/(dashboard)/production-work-order-lines/actions";
import { dateCell, ExportColumn, numberCell, textCell } from "@/lib/excel";
import { WORK_ORDER_STATUS_LABELS } from "@/lib/labels";

/**
 * `Overviews → Logistics → Production workorders` — the twenty columns read
 * off the reference on 2-10-2026 (PLANNED-CODE-CHANGES-6 §32), in its order.
 *
 * ⚪ `Created by` reads blank: nothing in this app raises a production work
 * order yet, so there is no one to name.
 */

export type ProductionWorkOrderLineColumnKey =
  | "workOrderDate"
  | "status"
  | "workOrderNumber"
  | "lineNumber"
  | "order"
  | "orderLine"
  | "machine"
  | "extraOptions"
  | "productCode"
  | "productName"
  | "lengthMm"
  | "widthMm"
  | "qtyPlanned"
  | "qtyActual"
  | "kgPlanned"
  | "kgActual"
  | "company"
  | "createdBy"
  | "reportedAt"
  | "previousWarehouseWorkOrder";

export const PRODUCTION_WORK_ORDER_LINE_COLUMNS: Array<
  ExportColumn<ProductionWorkOrderLineRow, ProductionWorkOrderLineColumnKey>
> = [
  {
    key: "workOrderDate",
    label: "Workorder date",
    defaultVisible: true,
    value: (row) => dateCell(row.workOrderDate),
  },
  {
    key: "status",
    label: "Status",
    defaultVisible: true,
    value: (row) => WORK_ORDER_STATUS_LABELS[row.status],
  },
  {
    key: "workOrderNumber",
    label: "Production workorder",
    defaultVisible: true,
    value: (row) => row.workOrderNumber,
  },
  {
    key: "lineNumber",
    label: "Line",
    defaultVisible: true,
    value: (row) => numberCell(row.lineNumber),
  },
  {
    key: "order",
    label: "Order",
    defaultVisible: true,
    value: (row) => row.salesOrderId ?? textCell(row.orderNumber),
  },
  {
    key: "orderLine",
    label: "Order line",
    defaultVisible: true,
    value: (row) => numberCell(row.salesLineNumber),
  },
  {
    key: "machine",
    label: "Machine",
    defaultVisible: true,
    value: (row) => textCell(row.machineName),
  },
  {
    // `Laser Foil` beside `Slijpen/Foliën`: the run's second operation.
    key: "extraOptions",
    label: "Extra options",
    defaultVisible: true,
    value: (row) => textCell(row.extraOptions ?? row.workOrderExtraOption),
  },
  {
    key: "productCode",
    label: "Product code",
    defaultVisible: true,
    value: (row) => textCell(row.productCode),
  },
  {
    key: "productName",
    label: "Product",
    defaultVisible: true,
    value: (row) => textCell(row.productName),
  },
  {
    key: "lengthMm",
    label: "Length (mm)",
    defaultVisible: true,
    value: (row) => numberCell(row.length),
  },
  {
    key: "widthMm",
    label: "Width (mm)",
    defaultVisible: true,
    value: (row) => numberCell(row.width),
  },
  {
    key: "qtyPlanned",
    label: "Qty(p)",
    defaultVisible: true,
    value: (row) => numberCell(row.qtyPlanned),
  },
  {
    key: "qtyActual",
    label: "Qty(a)",
    defaultVisible: true,
    value: (row) => numberCell(row.qtyActual),
  },
  {
    key: "kgPlanned",
    label: "Kg(p)",
    defaultVisible: true,
    value: (row) => numberCell(row.kgPlanned),
  },
  {
    key: "kgActual",
    label: "Kg(a)",
    defaultVisible: true,
    value: (row) => numberCell(row.kgActual),
  },
  {
    key: "company",
    label: "Company",
    defaultVisible: true,
    value: (row) => textCell(row.companyName),
  },
  {
    key: "createdBy",
    label: "Created by",
    defaultVisible: false,
    value: () => null,
  },
  {
    key: "reportedAt",
    label: "Reported as completed",
    defaultVisible: true,
    value: (row) => dateCell(row.dateFinished),
  },
  {
    // Nine for nine in the reference: the warehouse job that fetched the metal,
    // numbered one below the run.
    key: "previousWarehouseWorkOrder",
    label: "Previous warehouse workorder",
    defaultVisible: true,
    value: (row) => numberCell(row.previousWarehouseWorkOrderNumber),
  },
];
