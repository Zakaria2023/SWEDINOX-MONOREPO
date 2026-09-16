import { TransportByRegionRow } from "@/app/(dashboard)/transport-by-region/actions";
import { dateCell, ExportColumn, numberCell, textCell } from "@/lib/excel";
import { TRIP_STATUS_LABELS } from "@/lib/labels";

/**
 * Transport by region as a sheet — the reference's thirteen columns in its
 * order, every one on its screen.
 */

export type TransportByRegionColumnKey =
  | "transportDate"
  | "city"
  | "region"
  | "postalCode"
  | "vehicle"
  | "deliveryName"
  | "kgPlannedTotal"
  | "kgActualTotal"
  | "lengthLargest"
  | "tripStatus"
  | "sourceStatusLowest"
  | "lines"
  | "action";

export const TRANSPORT_BY_REGION_COLUMNS: Array<
  ExportColumn<TransportByRegionRow, TransportByRegionColumnKey>
> = [
  {
    key: "transportDate",
    label: "Transport date",
    defaultVisible: true,
    value: (row) => dateCell(row.transportDate),
  },
  {
    key: "city",
    label: "Delivery address (City)",
    defaultVisible: true,
    value: (row) => textCell(row.city),
  },
  {
    key: "region",
    label: "Region",
    defaultVisible: true,
    value: (row) => textCell(row.region),
  },
  {
    key: "postalCode",
    label: "Delivery address (Postal code)",
    defaultVisible: true,
    value: (row) => textCell(row.postalCode),
  },
  {
    key: "vehicle",
    label: "Vehicle",
    defaultVisible: true,
    value: (row) => textCell(row.vehicle),
  },
  {
    key: "deliveryName",
    label: "Delivery address (Name)",
    defaultVisible: true,
    value: (row) => textCell(row.deliveryName),
  },
  {
    key: "kgPlannedTotal",
    label: "Kg(p) total",
    defaultVisible: true,
    value: (row) => numberCell(row.kgPlannedTotal),
  },
  {
    key: "kgActualTotal",
    label: "Kg(a) total",
    defaultVisible: true,
    value: (row) => numberCell(row.kgActualTotal),
  },
  {
    key: "lengthLargest",
    label: "Length (largest)",
    defaultVisible: true,
    value: (row) => numberCell(row.lengthLargest),
  },
  {
    key: "tripStatus",
    label: "Trip status",
    defaultVisible: true,
    value: (row) =>
      textCell(row.tripStatus ? TRIP_STATUS_LABELS[row.tripStatus] : null),
  },
  {
    key: "sourceStatusLowest",
    label: "Source status (lowest)",
    defaultVisible: true,
    value: (row) => textCell(row.sourceStatusLowest),
  },
  {
    key: "lines",
    label: "Lines",
    defaultVisible: true,
    value: (row) => numberCell(row.lines),
  },
  {
    key: "action",
    label: "Action",
    defaultVisible: true,
    value: (row) => textCell(row.action),
  },
];
