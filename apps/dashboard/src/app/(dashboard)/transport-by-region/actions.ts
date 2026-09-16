"use server";

import { TRANSPORT_BY_REGION_COLUMNS } from "@/app/(dashboard)/transport-by-region/columns";
import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import {
  CompanyAddresses,
  SelectCompanyAddresses,
} from "@/db/schema/company-addresses";
import {
  SelectTransportWorkOrderLines,
  SelectTransportWorkOrders,
  TransportWorkOrderLines,
  TransportWorkOrders,
} from "@/db/schema/transport-work-orders";
import { tripStatuses } from "@/lib/enums";
import { describeError } from "@/lib/helpers";
import { exportRows } from "@/lib/server/excel";
import {
  dateRangeFilter,
  enumFilter,
  FilterBindings,
  runPaged,
  SortableColumns,
  tableOrderBy,
  tableWhere,
} from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { asc, count, desc, eq, isNotNull, or, sql } from "drizzle-orm";

// The reference's grain, proved on 1 439 rows: one row per **transport** — the
// lines a trip carries to (or fetches from) one address — not one per trip. Its
// kilos are the lines' sum, its length the longest line, its source status the
// lowest among the documents it carries; the trip lends it the vehicle, the
// date and the trip status.
const LINE = TransportWorkOrderLines;
const TRIP = TransportWorkOrders;

// The address the goods go to: the destination company's address at the
// line's postal code, or — when no address carries that code — its first one.
const addressField = (column: string) =>
  sql`(SELECT a.${sql.raw(column)} FROM ${CompanyAddresses} a
        WHERE a.company_uuid = ${LINE.destinationCompanyUuid}
        ORDER BY (a.postal_code = ${LINE.postalCode}) DESC, a.id
        LIMIT 1)`;

// The document behind a line moves New → Released → Workorders created →
// In progress → Ready. An expired document ranks below all of them: a stop
// carrying one lapsed order is not ready, however ready the rest are.
const SOURCE_STATUS_RANK = sql`CASE LOWER(${LINE.sourceStatus})
  WHEN 'expired' THEN 0
  WHEN 'new' THEN 1
  WHEN 'released' THEN 2
  WHEN 'workorders created' THEN 3
  WHEN 'in progress' THEN 4
  WHEN 'ready' THEN 5
  ELSE 9 END`;

const TRANSPORT_BY_REGION_SEARCH = [
  TRIP.vehicle,
  Companies.companyName,
  LINE.postalCode,
] as const;

const TRANSPORT_BY_REGION_FILTERS: FilterBindings = {
  transportDate: dateRangeFilter(TRIP.date),
  tripStatus: enumFilter(TRIP.status, tripStatuses),
  action: (values) => {
    const wanted = values.filter((value) => value.trim() !== "");
    return wanted.length === 0
      ? undefined
      : or(...wanted.map((value) => sql`LOWER(${LINE.action}) = ${value}`));
  },
  region: (values) => {
    const wanted = values.filter((value) => value.trim() !== "");
    return wanted.length === 0
      ? undefined
      : sql`${addressField("region")} IN (${sql.join(
          wanted.map((value) => sql`${value}`),
          sql`, `,
        )})`;
  },
};

const TRANSPORT_BY_REGION_SORTABLE: SortableColumns = {
  transportDate: sql`ANY_VALUE(${TRIP.date})`,
  city: sql`ANY_VALUE(${addressField("city")})`,
  region: sql`ANY_VALUE(${addressField("region")})`,
  vehicle: sql`ANY_VALUE(${TRIP.vehicle})`,
  kgPlanned: sql`SUM(${LINE.kgPlanned})`,
  kgActual: sql`SUM(${LINE.kgActual})`,
};

export type TransportByRegionRow = {
  key: string;
  transportDate: SelectTransportWorkOrders["date"];
  city: SelectCompanyAddresses["city"] | null;
  region: SelectCompanyAddresses["region"] | null;
  postalCode: SelectTransportWorkOrderLines["postalCode"];
  vehicle: SelectTransportWorkOrders["vehicle"];
  deliveryName: SelectCompanies["companyName"] | null;
  destinationCompanyUuid: SelectTransportWorkOrderLines["destinationCompanyUuid"];
  kgPlannedTotal: number;
  kgActualTotal: number;
  lengthLargest: number | null;
  tripStatus: SelectTransportWorkOrders["status"];
  sourceStatusLowest: SelectTransportWorkOrderLines["sourceStatus"];
  lines: number;
  action: SelectTransportWorkOrderLines["action"];
};

export type TransportRegionOption = {
  value: string;
  label: string;
};

const groupColumns = [
  LINE.workOrderUuid,
  LINE.destinationCompanyUuid,
  LINE.postalCode,
  LINE.action,
];

const transportWhere = (query: TableQuery) =>
  tableWhere({
    query,
    search: TRANSPORT_BY_REGION_SEARCH,
    filters: TRANSPORT_BY_REGION_FILTERS,
  });

const transportByRegionRows =
  (query: TableQuery) =>
  async (limit: number, offset: number): Promise<TransportByRegionRow[]> => {
    const rows = await db
      .select({
        workOrderUuid: LINE.workOrderUuid,
        destinationCompanyUuid: LINE.destinationCompanyUuid,
        postalCode: LINE.postalCode,
        action: LINE.action,
        transportDate: sql<string | null>`ANY_VALUE(${TRIP.date})`,
        vehicle: sql<string | null>`ANY_VALUE(${TRIP.vehicle})`,
        tripStatus: sql<
          SelectTransportWorkOrders["status"]
        >`ANY_VALUE(${TRIP.status})`,
        deliveryName: sql<
          string | null
        >`COALESCE(ANY_VALUE(${addressField("alt_name")}), ANY_VALUE(${Companies.companyName}))`,
        city: sql<string | null>`ANY_VALUE(${addressField("city")})`,
        region: sql<string | null>`ANY_VALUE(${addressField("region")})`,
        kgPlannedTotal: sql<string>`COALESCE(SUM(${LINE.kgPlanned}), 0)`,
        kgActualTotal: sql<string>`COALESCE(SUM(${LINE.kgActual}), 0)`,
        lengthLargest: sql<number | null>`MAX(${LINE.lengthMm})`,
        sourceStatusLowest: sql<
          string | null
        >`SUBSTRING_INDEX(MIN(CONCAT(${SOURCE_STATUS_RANK}, '|', ${LINE.sourceStatus})), '|', -1)`,
        lines: sql<number>`COUNT(*)`,
      })
      .from(LINE)
      .innerJoin(TRIP, eq(LINE.workOrderUuid, TRIP.uuid))
      .leftJoin(Companies, eq(LINE.destinationCompanyUuid, Companies.uuid))
      .where(transportWhere(query))
      .groupBy(...groupColumns)
      .orderBy(
        ...tableOrderBy(
          TRANSPORT_BY_REGION_SORTABLE,
          query,
          [desc(sql`ANY_VALUE(${TRIP.date})`)],
          sql`MIN(${LINE.id})`,
        ),
      )
      .limit(limit)
      .offset(offset);

    return rows.map((row) => ({
      key: [
        row.workOrderUuid,
        row.destinationCompanyUuid ?? "",
        row.postalCode ?? "",
        row.action ?? "",
      ].join("|"),
      transportDate: row.transportDate,
      city: row.city,
      region: row.region,
      postalCode: row.postalCode,
      vehicle: row.vehicle,
      deliveryName: row.deliveryName,
      destinationCompanyUuid: row.destinationCompanyUuid,
      kgPlannedTotal: Number(row.kgPlannedTotal),
      kgActualTotal: Number(row.kgActualTotal),
      lengthLargest:
        row.lengthLargest === null ? null : Number(row.lengthLargest),
      tripStatus: row.tripStatus,
      sourceStatusLowest: row.sourceStatusLowest,
      lines: Number(row.lines),
      action: row.action,
    }));
  };

export const getTransportByRegion = async (
  query: TableQuery,
): Promise<Paged<TransportByRegionRow>> => {
  try {
    return await runPaged(query, {
      rows: transportByRegionRows(query),
      count: async () => {
        const transports = db
          .select({ one: sql`1`.as("one") })
          .from(LINE)
          .innerJoin(TRIP, eq(LINE.workOrderUuid, TRIP.uuid))
          .leftJoin(Companies, eq(LINE.destinationCompanyUuid, Companies.uuid))
          .where(transportWhere(query))
          .groupBy(...groupColumns)
          .as("transports");
        const [row] = await db.select({ value: count() }).from(transports);
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch transport by region"));
  }
};

export const exportTransportByRegion = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Transport by region",
    columns: TRANSPORT_BY_REGION_COLUMNS,
    columnKeys,
    rows: transportByRegionRows(parseTableQuery(params)),
  });

// The regions addresses actually carry, for the filter. Region is a field on
// the address, not something derived from its postal code.
export const getTransportRegions = async (): Promise<
  TransportRegionOption[]
> => {
  try {
    const rows = await db
      .selectDistinct({ region: CompanyAddresses.region })
      .from(CompanyAddresses)
      .where(isNotNull(CompanyAddresses.region))
      .orderBy(asc(CompanyAddresses.region));
    return rows
      .map((row) => row.region?.trim() ?? "")
      .filter((region) => region !== "")
      .map((region) => ({ value: region, label: region }));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch regions"));
  }
};
