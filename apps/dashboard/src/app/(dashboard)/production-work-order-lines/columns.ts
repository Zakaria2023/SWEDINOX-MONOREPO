import { ProductionWorkOrderLineRow } from "@/app/(dashboard)/production-work-order-lines/actions";
import { dateCell, ExportColumn, numberCell, textCell } from "@/lib/excel";
import {
  STOCK_UNIT_LABELS,
  TRIP_STATUS_LABELS,
  WORK_ORDER_STATUS_LABELS,
} from "@/lib/labels";

/**
 * `Overviews → Logistics → Production workorders`, in the reference's order
 * (433–437, 8-10-2026). The reference prints about fifty columns; these are
 * the ones this schema can answer.
 *
 * Not carried, because nothing in the schema holds them: `Previous production
 * workorder` and its status, `Sawing type`, `Left Angle`, `Right Angle`,
 * `Affiliate company details`, `Modified by`, `Resource`, `Stock Category`,
 * `Quality Code`, `External follow-up`, `Processor`, `Processor city`,
 * `Supply date` and `Processor return`.
 *
 * Reasoned rather than captured, and said so at the column:
 * - `Previous location` is the rack the leftover goes back to — the one the
 *   steel came off.
 * - `Vehicle`, `Transport date`, `Trip number` and `Trip status` are the trip
 *   carrying the line's order line.
 * - The delivery address is the sales order's.
 *
 * ⚪ `Created by` reads blank: a production work order records no creator.
 * ⚪ `Reported as completed` is a day; the reference's time is not stored.
 *
 * `Status` is not a column in the reference — the grid is grouped by it — so
 * it is carried hidden, for the export.
 */

export type ProductionWorkOrderLineColumnKey =
  | "workOrderNumber"
  | "lineNumber"
  | "productCode"
  | "productName"
  | "workOrderDate"
  | "machine"
  | "previousLocation"
  | "fromLocation"
  | "toLocation"
  | "qtyPlanned"
  | "unit"
  | "lengthMm"
  | "widthMm"
  | "kgPlanned"
  | "order"
  | "deliveryCompany"
  | "company"
  | "previousWarehouseWorkOrder"
  | "qtyActual"
  | "kgActual"
  | "extraOptions"
  | "orderLine"
  | "vehicle"
  | "transportDate"
  | "tripNumber"
  | "tripStatus"
  | "maxBundle"
  | "reportedAt"
  | "deliveryName"
  | "deliveryStreet"
  | "deliveryPostalCode"
  | "deliveryCity"
  | "createdBy"
  | "createdAt"
  | "orderCreatedAt"
  | "loadingInstructions"
  | "thickness"
  | "status";

export const PRODUCTION_WORK_ORDER_LINE_COLUMNS: Array<
  ExportColumn<ProductionWorkOrderLineRow, ProductionWorkOrderLineColumnKey>
> = [
  {
    key: "workOrderNumber",
    label: "Production workorder",
    defaultVisible: true,
    value: (row) => row.workOrderNumber,
  },
  {
    key: "lineNumber",
    label: "Production workorder line",
    defaultVisible: true,
    value: (row) => numberCell(row.lineNumber),
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
    key: "workOrderDate",
    label: "Workorder date",
    defaultVisible: true,
    value: (row) => dateCell(row.workOrderDate),
  },
  {
    key: "machine",
    label: "Machine",
    defaultVisible: true,
    value: (row) => textCell(row.machineName),
  },
  {
    key: "previousLocation",
    label: "Previous location",
    defaultVisible: true,
    value: (row) => textCell(row.previousLocationName),
  },
  {
    key: "fromLocation",
    label: "From-location",
    defaultVisible: true,
    value: (row) => textCell(row.fromLocationName),
  },
  {
    key: "toLocation",
    label: "To-location",
    defaultVisible: true,
    value: (row) => textCell(row.toLocationName),
  },
  {
    key: "qtyPlanned",
    label: "Qty(p)",
    defaultVisible: true,
    value: (row) => numberCell(row.qtyPlanned),
  },
  {
    key: "unit",
    label: "U.",
    defaultVisible: true,
    value: (row) =>
      row.unitPlanned ? STOCK_UNIT_LABELS[row.unitPlanned] : null,
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
    key: "kgPlanned",
    label: "Kg(p)",
    defaultVisible: true,
    value: (row) => numberCell(row.kgPlanned),
  },
  {
    key: "order",
    label: "Order",
    defaultVisible: true,
    value: (row) => row.salesOrderId ?? textCell(row.orderNumber),
  },
  {
    key: "deliveryCompany",
    label: "Delivery/reception company name",
    defaultVisible: true,
    value: (row) => textCell(row.deliveryCompanyName),
  },
  {
    key: "company",
    label: "Company",
    defaultVisible: true,
    value: (row) => textCell(row.companyName),
  },
  {
    // Nine for nine in the reference: the warehouse job that fetched the metal,
    // numbered one below the run.
    key: "previousWarehouseWorkOrder",
    label: "Previous warehouse workorder",
    defaultVisible: true,
    value: (row) => numberCell(row.previousWarehouseWorkOrderNumber),
  },
  {
    key: "qtyActual",
    label: "Qty(a)",
    defaultVisible: true,
    value: (row) => numberCell(row.qtyActual),
  },
  {
    key: "kgActual",
    label: "Kg(a)",
    defaultVisible: true,
    value: (row) => numberCell(row.kgActual),
  },
  {
    // `Laser Foil` beside `Slijpen/Foliën`: the run's second operation.
    key: "extraOptions",
    label: "Extra options",
    defaultVisible: true,
    value: (row) => textCell(row.extraOptions ?? row.workOrderExtraOption),
  },
  {
    key: "orderLine",
    label: "Order line",
    defaultVisible: true,
    value: (row) => numberCell(row.salesLineNumber),
  },
  {
    key: "vehicle",
    label: "Vehicle",
    defaultVisible: true,
    value: (row) => textCell(row.vehicle),
  },
  {
    key: "transportDate",
    label: "Transport date",
    defaultVisible: true,
    value: (row) => dateCell(row.transportDate),
  },
  {
    key: "tripNumber",
    label: "Trip number",
    defaultVisible: true,
    value: (row) => numberCell(row.tripNumber),
  },
  {
    key: "tripStatus",
    label: "Trip status",
    defaultVisible: true,
    value: (row) => (row.tripStatus ? TRIP_STATUS_LABELS[row.tripStatus] : null),
  },
  {
    key: "maxBundle",
    label: "Max. Bundle",
    defaultVisible: true,
    value: (row) => numberCell(row.maxBundleWeightKg),
  },
  {
    key: "reportedAt",
    label: "Reported as completed",
    defaultVisible: true,
    value: (row) => dateCell(row.dateFinished),
  },
  {
    key: "deliveryName",
    label: "Delivery address name",
    defaultVisible: true,
    value: (row) => textCell(row.deliveryName ?? row.deliveryCompanyName),
  },
  {
    key: "deliveryStreet",
    label: "Delivery address street",
    defaultVisible: true,
    value: (row) => textCell(row.deliveryStreet),
  },
  {
    key: "deliveryPostalCode",
    label: "Delivery address postcode",
    defaultVisible: true,
    value: (row) => textCell(row.deliveryPostalCode),
  },
  {
    key: "deliveryCity",
    label: "Delivery address city",
    defaultVisible: true,
    value: (row) => textCell(row.deliveryCity),
  },
  {
    key: "createdBy",
    label: "Created by",
    defaultVisible: false,
    value: () => null,
  },
  {
    key: "createdAt",
    label: "Created on",
    defaultVisible: true,
    value: (row) => dateCell(row.createdAt),
  },
  {
    key: "orderCreatedAt",
    label: "Order created on",
    defaultVisible: true,
    value: (row) => dateCell(row.salesOrderCreatedAt),
  },
  {
    key: "loadingInstructions",
    label: "Loading instructions",
    defaultVisible: true,
    value: (row) => textCell(row.loadingInstructions),
  },
  {
    key: "thickness",
    label: "Thickness",
    defaultVisible: true,
    value: (row) => numberCell(row.thickness),
  },
  {
    key: "status",
    label: "Status",
    defaultVisible: false,
    value: (row) => WORK_ORDER_STATUS_LABELS[row.status],
  },
];
