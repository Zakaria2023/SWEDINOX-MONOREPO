"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import {
  SelectWarehouseWorkOrderLines,
  SelectWarehouseWorkOrders,
  WarehouseWorkOrderLines,
  WarehouseWorkOrders,
} from "@/db/schema/warehouse-work-orders";
import { Products } from "@/db/schema/products";
import { SelectWarehouses, Warehouses } from "@/db/schema/warehouses";
import {
  customerLabelCount,
  customerLabelMedium,
  PrintMedium,
  stockLabelCount,
} from "@/lib/helpers";
import { desc, eq, getTableColumns } from "drizzle-orm";

export type WorkOrderListItem = SelectWarehouseWorkOrders & {
  warehouseName: SelectWarehouses["name"] | null;
};

export type WorkOrderLineListItem = SelectWarehouseWorkOrderLines & {
  companyName: SelectCompanies["companyName"] | null;
  // How many labels this line prints, which the two options on the product
  // already decide: per line, per collo or per piece for the customer's label,
  // and per bundle or a fixed count for the stock label. Derived rather than
  // stored — it follows the line's colli and quantity.
  customerLabels: number;
  stockLabels: number;
  labelMedium: PrintMedium | null;
};

export type WorkOrderDetail = WorkOrderListItem & {
  lines: WorkOrderLineListItem[];
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

/**
 * One warehouse work order with the warehouse it belongs to and every line on
 * it — the whole of the work the order asks for.
 */
export const getWarehouseWorkOrderDetail = async (
  uuid: string,
): Promise<WorkOrderDetail | null> => {
  const [workOrder] = await db
    .select({
      ...getTableColumns(WarehouseWorkOrders),
      warehouseName: Warehouses.name,
    })
    .from(WarehouseWorkOrders)
    .leftJoin(
      Warehouses,
      eq(WarehouseWorkOrders.warehouseUuid, Warehouses.uuid),
    )
    .where(eq(WarehouseWorkOrders.uuid, uuid))
    .limit(1);

  if (!workOrder) {
    return null;
  }

  const lines = await getWarehouseWorkOrderLines(uuid);

  return {
    ...workOrder,
    warehouseName: workOrder.warehouseName ?? null,
    lines,
  };
};

export const getWarehouseWorkOrderLines = async (
  workOrderUuid: string,
): Promise<WorkOrderLineListItem[]> => {
  const rows = await db
    .select({
      ...getTableColumns(WarehouseWorkOrderLines),
      companyName: Companies.companyName,
      // The line records the product by code, so the label settings are joined
      // on the code rather than on a reference it does not hold.
      customerLabelForPickingSlip: Products.customerLabelForPickingSlip,
      stockLabelBreakdown: Products.stockLabelBreakdown,
      stockLabelPieces: Products.stockLabelPieces,
    })
    .from(WarehouseWorkOrderLines)
    .leftJoin(
      Companies,
      eq(WarehouseWorkOrderLines.companyUuid, Companies.uuid),
    )
    .leftJoin(
      Products,
      eq(WarehouseWorkOrderLines.productCode, Products.productCode),
    )
    .where(eq(WarehouseWorkOrderLines.workOrderUuid, workOrderUuid))
    .orderBy(desc(WarehouseWorkOrderLines.date));

  return rows.map(
    ({
      customerLabelForPickingSlip,
      stockLabelBreakdown,
      stockLabelPieces,
      ...line
    }) => ({
      ...line,
      companyName: line.companyName ?? null,
      customerLabels: customerLabelCount(customerLabelForPickingSlip, {
        colli: line.colliCount ?? 0,
        pieces: Number(line.qtyPlanned ?? 0),
      }),
      stockLabels: stockLabelCount(stockLabelBreakdown, {
        bundles: line.colliCount ?? 0,
        amountPerLine: stockLabelPieces ?? 0,
      }),
      labelMedium: customerLabelMedium(customerLabelForPickingSlip),
    }),
  );
};
