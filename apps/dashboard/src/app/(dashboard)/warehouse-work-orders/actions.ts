"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import {
  SelectWarehouseWorkOrderLines,
  SelectWarehouseWorkOrders,
  WarehouseWorkOrderLines,
  WarehouseWorkOrders,
} from "@/db/schema/warehouse-work-orders";
import { SelectWarehouses, Warehouses } from "@/db/schema/warehouses";
import { desc, eq, getTableColumns } from "drizzle-orm";

export type WorkOrderListItem = SelectWarehouseWorkOrders & {
  warehouseName: SelectWarehouses["name"] | null;
};

export type WorkOrderLineListItem = SelectWarehouseWorkOrderLines & {
  companyName: SelectCompanies["companyName"] | null;
};

export const getWarehouseWorkOrders = async (): Promise<
  WorkOrderListItem[]
> => {
  const rows = await db
    .select({
      ...getTableColumns(WarehouseWorkOrders),
      warehouseName: Warehouses.name,
    })
    .from(WarehouseWorkOrders)
    .leftJoin(
      Warehouses,
      eq(WarehouseWorkOrders.warehouseUuid, Warehouses.uuid),
    )
    .orderBy(desc(WarehouseWorkOrders.createdAt));
  return rows.map((r) => ({ ...r, warehouseName: r.warehouseName ?? null }));
};

export const getWarehouseWorkOrderLines = async (
  workOrderUuid: string,
): Promise<WorkOrderLineListItem[]> => {
  const rows = await db
    .select({
      ...getTableColumns(WarehouseWorkOrderLines),
      companyName: Companies.companyName,
    })
    .from(WarehouseWorkOrderLines)
    .leftJoin(
      Companies,
      eq(WarehouseWorkOrderLines.companyUuid, Companies.uuid),
    )
    .where(eq(WarehouseWorkOrderLines.workOrderUuid, workOrderUuid))
    .orderBy(desc(WarehouseWorkOrderLines.date));
  return rows.map((r) => ({ ...r, companyName: r.companyName ?? null }));
};
