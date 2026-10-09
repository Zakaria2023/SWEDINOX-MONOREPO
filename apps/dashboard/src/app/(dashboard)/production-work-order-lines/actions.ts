"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import {
  CompanyAddresses,
  SelectCompanyAddresses,
} from "@/db/schema/company-addresses";
import { Machines, SelectMachines } from "@/db/schema/machines";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import {
  ProductionWorkOrderLines,
  ProductionWorkOrders,
  SelectProductionWorkOrderLines,
  SelectProductionWorkOrders,
} from "@/db/schema/production-work-orders";
import {
  SelectTransportWorkOrders,
  TransportWorkOrders,
} from "@/db/schema/transport-work-orders";
import {
  SelectWarehouseWorkOrders,
  WarehouseWorkOrders,
} from "@/db/schema/warehouse-work-orders";
import { SelectWarehouses, Warehouses } from "@/db/schema/warehouses";
import { PRODUCTION_WORK_ORDER_LINE_COLUMNS } from "@/app/(dashboard)/production-work-order-lines/columns";
import { workOrderStatuses } from "@/lib/enums";
import { describeError } from "@/lib/helpers";
import { WORK_ORDER_STATUS_LABELS } from "@/lib/labels";
import { exportRows } from "@/lib/server/excel";
import {
  dateRangeFilter,
  enumFilter,
  FilterBinding,
  relationFilter,
  runPaged,
  tableOrderBy,
  tableWhere,
} from "@/lib/server/table-query";
import {
  Paged,
  parseRangeValue,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  gte,
  lte,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

// A line names three places — the machine it is taken from, where the work
// goes, and the rack the leftover goes back to — and the delivery address sits
// under a company of its own.
const FromLocation = alias(Warehouses, "from_location");
const ToLocation = alias(Warehouses, "to_location");
const PreviousLocation = alias(Warehouses, "previous_location");
const DeliveryCompany = alias(Companies, "delivery_company");

// The reference groups the grid by status, its bands in the order their names
// sort: `Approved` above `Released`.
const STATUS_GROUP_ORDER = [...workOrderStatuses].sort((a, b) =>
  WORK_ORDER_STATUS_LABELS[a].localeCompare(WORK_ORDER_STATUS_LABELS[b]),
);

/**
 * One row of `Overviews → Logistics → Production workorders`: a production
 * work-order **line**, with its run's identity on it. The reference prints
 * about fifty columns (433–437, 8-10-2026); the ones this schema can answer
 * are carried here, and columns.ts names the rest.
 *
 * The shop floor's own screen (`/production-workorders`) is the tree the runs
 * are reported from; this is the flat list to be read and exported.
 */
export type ProductionWorkOrderLineRow = SelectProductionWorkOrderLines & {
  workOrderNumber: SelectProductionWorkOrders["number"];
  workOrderDate: SelectProductionWorkOrders["plannedDate"];
  workOrderExtraOption: SelectProductionWorkOrders["extraOption"];
  machineName: SelectMachines["name"] | null;
  productName: SelectProducts["name"] | null;
  companyName: SelectCompanies["companyName"] | null;
  salesOrderUuid: SelectOrders["uuid"] | null;
  salesOrderId: SelectOrders["id"] | null;
  salesOrderCreatedAt: SelectOrders["createdAt"] | null;
  maxBundleWeightKg: SelectOrders["maxBundleWeightKg"] | null;
  salesLineNumber: SelectOrderItems["lineNumber"] | null;
  previousWarehouseWorkOrderNumber: SelectWarehouseWorkOrders["number"] | null;
  previousLocationName: SelectWarehouses["name"] | null;
  fromLocationName: SelectWarehouses["name"] | null;
  toLocationName: SelectWarehouses["name"] | null;
  deliveryCompanyName: SelectCompanies["companyName"] | null;
  deliveryName: SelectCompanyAddresses["altName"] | null;
  deliveryStreet: SelectCompanyAddresses["streetAndNo"] | null;
  deliveryPostalCode: SelectCompanyAddresses["postalCode"] | null;
  deliveryCity: SelectCompanyAddresses["city"] | null;
  loadingInstructions: SelectCompanyAddresses["loadingInstructions"] | null;
  tripNumber: SelectTransportWorkOrders["tripNumber"] | null;
  transportDate: SelectTransportWorkOrders["date"] | null;
  vehicle: SelectTransportWorkOrders["vehicle"] | null;
  tripStatus: SelectTransportWorkOrders["status"] | null;
};

/** How many lines of the current view sit in one status band. */
export type ProductionWorkOrderLineStatusCount = {
  status: SelectProductionWorkOrderLines["status"];
  lines: number;
};

const LINE_SEARCH = [
  ProductionWorkOrderLines.productCode,
  Products.name,
  ProductionWorkOrderLines.orderNumber,
] as const;

const LINE_SORTABLE = {
  workOrderDate: ProductionWorkOrders.plannedDate,
  workOrderNumber: ProductionWorkOrders.number,
  status: ProductionWorkOrderLines.status,
  productCode: ProductionWorkOrderLines.productCode,
  kgPlanned: ProductionWorkOrderLines.kgPlanned,
};

// The reference's `Product code` from/to: a plain alphabetical range, either
// end optional.
const productCodeRange: FilterBinding = (values) => {
  const { from, to } = parseRangeValue(values[0]);
  return and(
    from ? gte(ProductionWorkOrderLines.productCode, from) : undefined,
    to ? lte(ProductionWorkOrderLines.productCode, to) : undefined,
  );
};

const LINE_FILTERS = {
  status: enumFilter(ProductionWorkOrderLines.status, workOrderStatuses),
  machine: relationFilter(ProductionWorkOrders.machineUuid),
  workOrderDate: dateRangeFilter(ProductionWorkOrders.plannedDate),
  productCode: productCodeRange,
  // Set by the company screen's `Production workorders` button.
  company: relationFilter(ProductionWorkOrderLines.companyUuid),
};

// The trip carrying the line's order line — the latest one, should it have
// been planned onto more than one.
const lineTrip = sql`(
  SELECT ${sql.raw("`twol`.`work_order_uuid`")}
  FROM ${sql.raw("`TransportWorkOrderLines` AS `twol`")}
  WHERE ${sql.raw("`twol`.`order_item_uuid`")} = ${ProductionWorkOrderLines.orderItemUuid}
  ORDER BY ${sql.raw("`twol`.`id`")} DESC
  LIMIT 1
)`;

const statusBand = sql`FIELD(${ProductionWorkOrderLines.status}, ${sql.join(
  STATUS_GROUP_ORDER.map((status) => sql`${status}`),
  sql`, `,
)})`;

const lineWhere = (query: TableQuery) =>
  tableWhere({ query, search: LINE_SEARCH, filters: LINE_FILTERS });

const lineRows =
  (query: TableQuery) =>
  (limit: number, offset: number): Promise<ProductionWorkOrderLineRow[]> =>
    db
      .select({
        ...getTableColumns(ProductionWorkOrderLines),
        workOrderNumber: ProductionWorkOrders.number,
        workOrderDate: ProductionWorkOrders.plannedDate,
        workOrderExtraOption: ProductionWorkOrders.extraOption,
        machineName: Machines.name,
        productName: Products.name,
        companyName: Companies.companyName,
        salesOrderUuid: Orders.uuid,
        salesOrderId: Orders.id,
        salesOrderCreatedAt: Orders.createdAt,
        maxBundleWeightKg: Orders.maxBundleWeightKg,
        salesLineNumber: OrderItems.lineNumber,
        previousWarehouseWorkOrderNumber: WarehouseWorkOrders.number,
        previousLocationName: PreviousLocation.name,
        fromLocationName: FromLocation.name,
        toLocationName: ToLocation.name,
        deliveryCompanyName: DeliveryCompany.companyName,
        deliveryName: CompanyAddresses.altName,
        deliveryStreet: CompanyAddresses.streetAndNo,
        deliveryPostalCode: CompanyAddresses.postalCode,
        deliveryCity: CompanyAddresses.city,
        loadingInstructions: CompanyAddresses.loadingInstructions,
        tripNumber: TransportWorkOrders.tripNumber,
        transportDate: TransportWorkOrders.date,
        vehicle: TransportWorkOrders.vehicle,
        tripStatus: TransportWorkOrders.status,
      })
      .from(ProductionWorkOrderLines)
      .innerJoin(
        ProductionWorkOrders,
        eq(ProductionWorkOrderLines.workOrderUuid, ProductionWorkOrders.uuid),
      )
      .leftJoin(Machines, eq(ProductionWorkOrders.machineUuid, Machines.uuid))
      .leftJoin(
        WarehouseWorkOrders,
        eq(
          ProductionWorkOrders.previousWarehouseWorkOrderUuid,
          WarehouseWorkOrders.uuid,
        ),
      )
      .leftJoin(Products, eq(ProductionWorkOrderLines.productUuid, Products.uuid))
      .leftJoin(
        Companies,
        eq(ProductionWorkOrderLines.companyUuid, Companies.uuid),
      )
      .leftJoin(
        OrderItems,
        eq(ProductionWorkOrderLines.orderItemUuid, OrderItems.uuid),
      )
      .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .leftJoin(
        PreviousLocation,
        eq(ProductionWorkOrderLines.backLocationUuid, PreviousLocation.uuid),
      )
      .leftJoin(
        FromLocation,
        eq(ProductionWorkOrderLines.fromLocationUuid, FromLocation.uuid),
      )
      .leftJoin(
        ToLocation,
        eq(ProductionWorkOrderLines.toLocationUuid, ToLocation.uuid),
      )
      .leftJoin(
        CompanyAddresses,
        eq(Orders.deliveryAddressUuid, CompanyAddresses.uuid),
      )
      .leftJoin(
        DeliveryCompany,
        eq(CompanyAddresses.companyUuid, DeliveryCompany.uuid),
      )
      .leftJoin(TransportWorkOrders, eq(TransportWorkOrders.uuid, lineTrip))
      .where(lineWhere(query))
      .orderBy(
        // The status band first, whatever the sort, so each band stays one
        // unbroken run of rows across pages.
        statusBand,
        ...tableOrderBy(
          LINE_SORTABLE,
          query,
          [
            desc(ProductionWorkOrders.plannedDate),
            desc(ProductionWorkOrders.number),
          ],
          ProductionWorkOrderLines.id,
        ),
      )
      .limit(limit)
      .offset(offset);

/** Every line the current view matches, as a workbook. */
export const exportProductionWorkOrderLines = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Production workorders",
    columns: PRODUCTION_WORK_ORDER_LINE_COLUMNS,
    columnKeys,
    rows: lineRows(parseTableQuery(params)),
  });

export const getProductionWorkOrderLineOverview = async (
  query: TableQuery,
): Promise<Paged<ProductionWorkOrderLineRow>> => {
  try {
    const where = lineWhere(query);
    return await runPaged(query, {
      rows: lineRows(query),
      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(ProductionWorkOrderLines)
          .innerJoin(
            ProductionWorkOrders,
            eq(
              ProductionWorkOrderLines.workOrderUuid,
              ProductionWorkOrders.uuid,
            ),
          )
          .leftJoin(
            Products,
            eq(ProductionWorkOrderLines.productUuid, Products.uuid),
          )
          .where(where);
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch production work order lines"),
    );
  }
};

/** The size of each status band over the whole view, for the group headers. */
export const getProductionWorkOrderLineStatusCounts = async (
  query: TableQuery,
): Promise<ProductionWorkOrderLineStatusCount[]> => {
  try {
    const rows = await db
      .select({
        status: ProductionWorkOrderLines.status,
        lines: count(),
      })
      .from(ProductionWorkOrderLines)
      .innerJoin(
        ProductionWorkOrders,
        eq(ProductionWorkOrderLines.workOrderUuid, ProductionWorkOrders.uuid),
      )
      .leftJoin(Products, eq(ProductionWorkOrderLines.productUuid, Products.uuid))
      .where(lineWhere(query))
      .groupBy(ProductionWorkOrderLines.status);
    return rows.map((row) => ({ status: row.status, lines: Number(row.lines) }));
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to count production work order lines"),
    );
  }
};
