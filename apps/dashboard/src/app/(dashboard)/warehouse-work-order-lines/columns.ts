import { WarehouseWorkOrderLineRow } from "@/app/(dashboard)/warehouse-work-order-lines/actions";
import {
  dateCell,
  ExportCellValue,
  ExportColumn,
  numberCell,
  textCell,
} from "@/lib/excel";
import {
  TRIP_STATUS_LABELS,
  WAREHOUSE_WORK_ORDER_TYPE_LABELS,
  WORK_ORDER_STATUS_LABELS,
} from "@/lib/labels";

/**
 * `Overviews → Logistics → Warehouse workorders` — all 44 columns of the
 * reference's export (11 625 rows, docs/reference-system/warehouse-workorders.md),
 * in its own order.
 *
 * ⚪ `Resource` is `-leeg-` on every one of the 11 625 rows — the feature is
 * switched off there, and the column stays blank here for the same reason.
 */

export type WarehouseWorkOrderLineColumnKey =
  | "type"
  | "workOrderNumber"
  | "lineNumber"
  | "productCode"
  | "productName"
  | "workOrderDate"
  | "fromLocation"
  | "toLocation"
  | "qtyPlanned"
  | "unit"
  | "lengthMm"
  | "widthMm"
  | "kgPlanned"
  | "order"
  | "orderLine"
  | "company"
  | "status"
  | "section"
  | "batchInformation"
  | "vehicle"
  | "transportDate"
  | "tripNumber"
  | "tripStatus"
  | "maxBundleWeight"
  | "billOfLading"
  | "qtyActual"
  | "kgActual"
  | "reportedAt"
  | "receptionCompany"
  | "qtyDifference"
  | "kgDifference"
  | "createdBy"
  | "createdAt"
  | "orderCreatedAt"
  | "modifiedBy"
  | "loadingInstructions"
  | "resource"
  | "transportRegion"
  | "loadingLocation"
  | "thickness"
  | "stockCategory"
  | "qualityCode"
  | "internalBundle"
  | "bundleQuantity";

/** `O`-less in the reference: a sales order `100545`, a purchase `400766`. */
const orderOf = (row: WarehouseWorkOrderLineRow): ExportCellValue =>
  row.salesOrderId ?? row.purchaseOrderId ?? textCell(row.orderNumber);

/** Sales lines number in tens already; purchase lines are stored 1, 2, 3. */
const orderLineOf = (row: WarehouseWorkOrderLineRow): number | null => {
  if (row.salesLineNumber !== null) {
    return row.salesLineNumber;
  }
  return row.purchaseLineNumber === null ? null : row.purchaseLineNumber * 10;
};

/** Only a reported line has a difference; a nil one reads blank. */
const difference = (
  actual: string | null,
  planned: string | null,
  reported: boolean,
): number | null => {
  if (!reported || actual === null) {
    return null;
  }
  const value = Number(actual) - Number(planned ?? 0);
  return value === 0 ? null : value;
};

const isReported = (row: WarehouseWorkOrderLineRow) =>
  row.status === "approved" || row.status === "ready";

export const WAREHOUSE_WORK_ORDER_LINE_COLUMNS: Array<
  ExportColumn<WarehouseWorkOrderLineRow, WarehouseWorkOrderLineColumnKey>
> = [
  {
    key: "type",
    label: "Type",
    defaultVisible: true,
    value: (row) => WAREHOUSE_WORK_ORDER_TYPE_LABELS[row.workOrderType],
  },
  {
    key: "workOrderNumber",
    label: "Workorder#",
    defaultVisible: true,
    value: (row) => row.workOrderNumber,
  },
  {
    key: "lineNumber",
    label: "Line#",
    defaultVisible: true,
    value: (row) => numberCell(row.lineNumber),
  },
  {
    key: "productCode",
    label: "Product no.",
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
    value: (row) => textCell(row.stockUnit),
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
    value: (row) => orderOf(row),
  },
  {
    key: "orderLine",
    label: "Order line",
    defaultVisible: true,
    value: (row) => orderLineOf(row),
  },
  {
    // `Holland Stainless Int, ROTTERDAM` — the company and the city it is
    // delivered to.
    key: "company",
    label: "Company",
    defaultVisible: true,
    value: (row) =>
      textCell(
        [row.companyName, row.deliveryCity?.toUpperCase()]
          .filter(Boolean)
          .join(", "),
      ),
  },
  {
    key: "status",
    label: "Status",
    defaultVisible: true,
    value: (row) => WORK_ORDER_STATUS_LABELS[row.status],
  },
  {
    // `00 Hego Almere` on 7 089 rows: the warehouse the job belongs to.
    key: "section",
    label: "Section",
    defaultVisible: false,
    value: (row) => textCell(row.sectionName),
  },
  {
    // Typed on two rows of 11 625; the line's charge is the nearest we hold.
    key: "batchInformation",
    label: "Batch information",
    defaultVisible: false,
    value: (row) => textCell(row.charge),
  },
  {
    key: "vehicle",
    label: "Vehicle",
    defaultVisible: false,
    value: (row) => textCell(row.vehicle),
  },
  {
    key: "transportDate",
    label: "Transport date",
    defaultVisible: false,
    value: (row) => dateCell(row.transportDate),
  },
  {
    key: "tripNumber",
    label: "Trip number",
    defaultVisible: false,
    value: (row) => numberCell(row.tripNumber),
  },
  {
    key: "tripStatus",
    label: "Trip status",
    defaultVisible: false,
    value: (row) => (row.tripStatus ? TRIP_STATUS_LABELS[row.tripStatus] : null),
  },
  {
    key: "maxBundleWeight",
    label: "Max. Bundle weight",
    defaultVisible: false,
    value: (row) => numberCell(row.maxBundleWeightKg),
  },
  {
    key: "billOfLading",
    label: "Bill of lading",
    defaultVisible: false,
    value: (row) => textCell(row.billOfLading),
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
    key: "reportedAt",
    label: "Reported as completed on",
    defaultVisible: false,
    value: (row) => dateCell(row.reportedAt),
  },
  {
    key: "receptionCompany",
    label: "Delivery/reception company name",
    defaultVisible: false,
    value: (row) => textCell(row.companyName),
  },
  {
    key: "qtyDifference",
    label: "Qty(dif)",
    defaultVisible: false,
    value: (row) => difference(row.qtyActual, row.qtyPlanned, isReported(row)),
  },
  {
    key: "kgDifference",
    label: "Kg(dif)",
    defaultVisible: false,
    value: (row) => difference(row.kgActual, row.kgPlanned, isReported(row)),
  },
  {
    key: "createdBy",
    label: "Created by",
    defaultVisible: false,
    value: (row) => textCell(row.createdByName),
  },
  {
    key: "createdAt",
    label: "Created on",
    defaultVisible: false,
    value: (row) => dateCell(row.workOrderCreatedAt),
  },
  {
    key: "orderCreatedAt",
    label: "Order created on",
    defaultVisible: false,
    value: (row) =>
      dateCell(row.salesOrderCreatedAt ?? row.purchaseOrderCreatedAt),
  },
  {
    key: "modifiedBy",
    label: "Modified by",
    defaultVisible: false,
    value: (row) => textCell(row.modifiedByName),
  },
  {
    key: "loadingInstructions",
    label: "Loading instructions",
    defaultVisible: false,
    value: (row) => textCell(row.loadingInstructions),
  },
  {
    key: "resource",
    label: "Resource",
    defaultVisible: false,
    value: () => null,
  },
  {
    key: "transportRegion",
    label: "Transport region",
    defaultVisible: false,
    value: (row) => textCell(row.transportRegion),
  },
  {
    key: "loadingLocation",
    label: "Loading location",
    defaultVisible: false,
    value: (row) => textCell(row.loadingLocation),
  },
  {
    key: "thickness",
    label: "Thickness",
    defaultVisible: false,
    value: (row) => numberCell(row.thickness),
  },
  {
    key: "stockCategory",
    label: "Stock Category",
    defaultVisible: false,
    value: (row) => textCell(row.stockCategory),
  },
  {
    key: "qualityCode",
    label: "Quality Code",
    defaultVisible: false,
    value: (row) => textCell(row.qualityCode),
  },
  {
    key: "internalBundle",
    label: "Internal Bundle",
    defaultVisible: false,
    value: (row) => textCell(row.internalBatch),
  },
  {
    key: "bundleQuantity",
    label: "Bundle quantity",
    defaultVisible: false,
    value: (row) => numberCell(row.colliCount),
  },
];
