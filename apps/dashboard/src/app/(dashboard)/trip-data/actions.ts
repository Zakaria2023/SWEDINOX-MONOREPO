"use server";

import { TRIP_DATA_COLUMNS } from "@/app/(dashboard)/trip-data/columns";
import { db } from "@/db";
import {
  SelectTransportWorkOrders,
  TransportWorkOrderLines,
  TransportWorkOrders,
} from "@/db/schema/transport-work-orders";
import { describeError } from "@/lib/helpers";
import { exportRows } from "@/lib/server/excel";
import {
  Paged,
  parseRangeValue,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { desc, eq, sql } from "drizzle-orm";

// The two shipping methods that name no haulier: the customer collected, or
// the trip lapsed. On those the reference's second `Vehicle` is blank.
const NO_CARRIER_METHODS = new Set(["AFHAAL", "VERVALLEN ORDERS"]);

export type TripDataRow = {
  uuid: SelectTransportWorkOrders["uuid"];
  tripNumber: SelectTransportWorkOrders["tripNumber"];
  tripDate: SelectTransportWorkOrders["date"];
  year: number | null;
  month: number | null;
  /** The shipping method — a haulier lane, a pick-up, or a lapsed trip. */
  vehicle: SelectTransportWorkOrders["vehicle"];
  /** The haulier that actually ran it; blank when nobody hauled anything. */
  carrier: SelectTransportWorkOrders["vehicle"];
  status: SelectTransportWorkOrders["status"];
  stops: number;
  orders: number;
  kg: number;
  colli: number;
  kgPerStop: number | null;
  ordersPerStop: number | null;
  colliPerStop: number | null;
};

/**
 * One row per trip, read from the transport work orders — the `6xxxxx` series
 * the stock ledger names as the cause of a customer delivery.
 *
 * It used to read a `TransportTrips` table that nothing in the app writes, so
 * the screen could only ever show what had been imported into it.
 *
 * A stop is a destination (customer and postcode); `Orders` counts the
 * distinct orders riding on the trip. The per-stop figures round the way the
 * reference rounds them: kilos to the nearest whole kilo, orders and colli
 * truncated — exact on 437, 438 and 438 of its 438 trips.
 */
const tripRows = async (query: TableQuery): Promise<TripDataRow[]> => {
  const rows = await db
    .select({
      uuid: TransportWorkOrders.uuid,
      tripNumber: TransportWorkOrders.tripNumber,
      tripDate: TransportWorkOrders.date,
      vehicle: TransportWorkOrders.vehicle,
      status: TransportWorkOrders.status,
      stops: sql<number>`COUNT(DISTINCT CONCAT_WS('|',
        ${TransportWorkOrderLines.destinationCompanyUuid},
        ${TransportWorkOrderLines.postalCode}))`.mapWith(Number),
      orders: sql<number>`COUNT(DISTINCT ${TransportWorkOrderLines.orderNumber})`.mapWith(
        Number,
      ),
      kg: sql<number>`COALESCE(SUM(COALESCE(NULLIF(${TransportWorkOrderLines.kgActual}, 0), ${TransportWorkOrderLines.kgPlanned})), 0)`.mapWith(
        Number,
      ),
      colli: sql<number>`COALESCE(SUM(${TransportWorkOrderLines.colli}), 0)`.mapWith(
        Number,
      ),
    })
    .from(TransportWorkOrders)
    .leftJoin(
      TransportWorkOrderLines,
      eq(TransportWorkOrderLines.workOrderUuid, TransportWorkOrders.uuid),
    )
    .groupBy(
      TransportWorkOrders.uuid,
      TransportWorkOrders.tripNumber,
      TransportWorkOrders.date,
      TransportWorkOrders.vehicle,
      TransportWorkOrders.status,
    )
    .orderBy(desc(TransportWorkOrders.date), desc(TransportWorkOrders.id));

  const all = rows.map((row): TripDataRow => {
    const [year, month] = (row.tripDate ?? "").split("-").map(Number);
    const method = (row.vehicle ?? "").trim().toUpperCase();
    return {
      ...row,
      year: Number.isFinite(year) ? year : null,
      month: Number.isFinite(month) ? month : null,
      carrier: NO_CARRIER_METHODS.has(method) ? null : row.vehicle,
      kgPerStop: row.stops > 0 ? Math.round(row.kg / row.stops) : null,
      ordersPerStop: row.stops > 0 ? Math.floor(row.orders / row.stops) : null,
      colliPerStop: row.stops > 0 ? Math.floor(row.colli / row.stops) : null,
    };
  });

  const term = query.q?.toLowerCase() ?? null;
  const { from, to } = parseRangeValue(query.filters.tripDate?.[0]);

  return all.filter((row) => {
    if (
      term &&
      !`${row.tripNumber ?? ""} ${row.vehicle ?? ""}`
        .toLowerCase()
        .includes(term)
    ) {
      return false;
    }
    // ISO days compare as strings, so the range needs no date parsing.
    if (from && (!row.tripDate || row.tripDate < from)) {
      return false;
    }
    if (to && (!row.tripDate || row.tripDate > to)) {
      return false;
    }
    return true;
  });
};

export const getTripData = async (
  query: TableQuery,
): Promise<Paged<TripDataRow>> => {
  try {
    const rows = await tripRows(query);
    const start = (query.page - 1) * query.pageSize;

    return {
      rows: rows.slice(start, start + query.pageSize),
      total: rows.length,
      page: query.page,
      pageSize: query.pageSize,
    };
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch trip data"));
  }
};

export const exportTripData = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> => {
  const rows = await tripRows(parseTableQuery(params));

  return exportRows({
    name: "Trip data",
    columns: TRIP_DATA_COLUMNS,
    columnKeys,
    rows: (limit, offset) =>
      Promise.resolve(rows.slice(offset, offset + limit)),
  });
};
