import type { TripDataRow } from "@/app/(dashboard)/trip-data/actions";
import {
  dateCell,
  ExportCellValue,
  ExportColumn,
  numberCell,
  textCell,
} from "@/lib/excel";

/**
 * Trip data — all 20 columns of the reference's full view (438 trips,
 * docs/reference-system/trip-data.md), in its order.
 *
 * The reference heads two columns `Vehicle`: the shipping method and the
 * haulier that actually ran the trip. They are named apart here.
 *
 * The seven costing columns — `Km`, `Hours`, `Cost price`, `Cost price per
 * stop`, `Driver`, `Cost price per Km`, `Cost price per Kg` — are empty on all
 * 438 reference trips: the reference can cost a trip and nobody does. They are
 * carried blank and hidden; transport costing is deliberately not built.
 */

export type TripDataColumnKey =
  | "year"
  | "month"
  | "trip"
  | "tripDate"
  | "vehicle"
  | "stops"
  | "orders"
  | "kg"
  | "carrier"
  | "colli"
  | "kgPerStop"
  | "ordersPerStop"
  | "colliPerStop"
  | "km"
  | "hours"
  | "costPrice"
  | "costPricePerStop"
  | "driver"
  | "costPricePerKm"
  | "costPricePerKg";

type Column = ExportColumn<TripDataRow, TripDataColumnKey>;

const column = (
  key: TripDataColumnKey,
  label: string,
  defaultVisible: boolean,
  value: (row: TripDataRow) => ExportCellValue,
): Column => ({ key, label, defaultVisible, value });

const notCosted = (key: TripDataColumnKey, label: string): Column =>
  column(key, label, false, () => null);

export const TRIP_DATA_COLUMNS: Column[] = [
  column("year", "Year (Trip date)", true, (row) => numberCell(row.year)),
  column("month", "Month (Trip date)", true, (row) => numberCell(row.month)),
  column("trip", "Trip", true, (row) => numberCell(row.tripNumber)),
  column("tripDate", "Trip date", true, (row) => dateCell(row.tripDate)),
  column("vehicle", "Vehicle", true, (row) => textCell(row.vehicle)),
  column("stops", "Stops", true, (row) => numberCell(row.stops)),
  column("orders", "Orders", true, (row) => numberCell(row.orders)),
  column("kg", "Kg.", true, (row) => numberCell(row.kg)),
  column("carrier", "Vehicle (carrier)", true, (row) => textCell(row.carrier)),
  column("colli", "Colli", true, (row) => numberCell(row.colli)),
  column("kgPerStop", "Kg. per stop", true, (row) => numberCell(row.kgPerStop)),
  column("ordersPerStop", "Orders per stop", true, (row) =>
    numberCell(row.ordersPerStop),
  ),
  column("colliPerStop", "Colli per stop", true, (row) =>
    numberCell(row.colliPerStop),
  ),
  notCosted("km", "Km"),
  notCosted("hours", "Hours"),
  notCosted("costPrice", "Cost price"),
  notCosted("costPricePerStop", "Cost price per stop"),
  notCosted("driver", "Driver"),
  notCosted("costPricePerKm", "Cost price per Km"),
  notCosted("costPricePerKg", "Cost price per Kg"),
];
