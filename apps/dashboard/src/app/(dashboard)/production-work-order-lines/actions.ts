"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
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
  SelectWarehouseWorkOrders,
  WarehouseWorkOrders,
} from "@/db/schema/warehouse-work-orders";
import { PRODUCTION_WORK_ORDER_LINE_COLUMNS } from "@/app/(dashboard)/production-work-order-lines/columns";
import { workOrderStatuses } from "@/lib/enums";
import { describeError } from "@/lib/helpers";
import { exportRows } from "@/lib/server/excel";
import {
  dateRangeFilter,
  enumFilter,
  relationFilter,
  runPaged,
  tableOrderBy,
  tableWhere,
} from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { count, desc, eq, getTableColumns } from "drizzle-orm";

/**
 * One row of `Overviews → Logistics → Production workorders`: a production
 * work-order **line**, with its run's identity on it. Twenty columns, captured
 * on `PK304L200415` (2-10-2026, PLANNED-CODE-CHANGES-6 §32).
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
  salesOrderId: SelectOrders["id"] | null;
  salesLineNumber: SelectOrderItems["lineNumber"] | null;
  previousWarehouseWorkOrderNumber: SelectWarehouseWorkOrders["number"] | null;
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

const LINE_FILTERS = {
  status: enumFilter(ProductionWorkOrderLines.status, workOrderStatuses),
  machine: relationFilter(ProductionWorkOrders.machineUuid),
  workOrderDate: dateRangeFilter(ProductionWorkOrders.plannedDate),
};

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
        salesOrderId: Orders.id,
        salesLineNumber: OrderItems.lineNumber,
        previousWarehouseWorkOrderNumber: WarehouseWorkOrders.number,
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
      .where(tableWhere({ query, search: LINE_SEARCH, filters: LINE_FILTERS }))
      .orderBy(
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
    const where = tableWhere({
      query,
      search: LINE_SEARCH,
      filters: LINE_FILTERS,
    });
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
