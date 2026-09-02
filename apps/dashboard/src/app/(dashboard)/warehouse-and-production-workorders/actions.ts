"use server";

import { db } from "@/db";
import {
  ProductionWorkOrderLines,
  ProductionWorkOrders,
} from "@/db/schema/production-work-orders";
import { Warehouses } from "@/db/schema/warehouses";
import {
  WarehouseWorkOrderLines,
  WarehouseWorkOrders,
} from "@/db/schema/warehouse-work-orders";
import { describeError } from "@/lib/helpers";
import { desc, eq } from "drizzle-orm";

// A line from either workorder stream, in the shape the combined overview
// prints. Warehouse and production workorders are separate tables because they
// are planned and reported against differently — this view exists so the floor
// can see one list of everything outstanding regardless of which it is.
export type CombinedWorkOrderLine = {
  uuid: string;
  workOrderNumber: number;
  lineNumber: number;
  warehouseName: string | null;
  qtyPlanned: number;
  qtyActual: number;
  qtyUnit: string | null;
  kgPlanned: number;
  kgActual: number;
  weightDeviation: number;
  workOrderType: "Warehouse" | "Production";
  workOrderDate: string | null;
  workOrderStatus: string | null;
};

// The two line tables declare their date column differently — one returns a
// Date, the other a string — so both are normalised before being merged.
const asDateString = (value: Date | string | null): string | null => {
  if (!value) {
    return null;
  }
  return typeof value === "string"
    ? value.slice(0, 10)
    : value.toISOString().slice(0, 10);
};

export const getWarehouseAndProductionWorkOrders = async (): Promise<
  CombinedWorkOrderLine[]
> => {
  try {
    const [warehouseLines, productionLines] = await Promise.all([
      db
        .select({
          uuid: WarehouseWorkOrderLines.uuid,
          workOrderNumber: WarehouseWorkOrders.number,
          warehouseName: Warehouses.name,
          // The day the job is planned for lives on the order, not the line:
          // every line of one work order is worked on the same day.
          date: WarehouseWorkOrders.plannedDate,
          status: WarehouseWorkOrderLines.status,
          qtyPlanned: WarehouseWorkOrderLines.qtyPlanned,
          qtyActual: WarehouseWorkOrderLines.qtyActual,
          kgPlanned: WarehouseWorkOrderLines.kgPlanned,
          kgActual: WarehouseWorkOrderLines.kgActual,
        })
        .from(WarehouseWorkOrderLines)
        .innerJoin(
          WarehouseWorkOrders,
          eq(WarehouseWorkOrderLines.workOrderUuid, WarehouseWorkOrders.uuid),
        )
        .leftJoin(
          Warehouses,
          eq(WarehouseWorkOrders.warehouseUuid, Warehouses.uuid),
        )
        .orderBy(desc(WarehouseWorkOrders.plannedDate)),

      db
        .select({
          uuid: ProductionWorkOrderLines.uuid,
          workOrderNumber: ProductionWorkOrders.id,
          date: ProductionWorkOrderLines.date,
          status: ProductionWorkOrderLines.status,
          qtyPlanned: ProductionWorkOrderLines.qtyPlanned,
          qtyActual: ProductionWorkOrderLines.qtyActual,
          unitPlanned: ProductionWorkOrderLines.unitPlanned,
          kgPlanned: ProductionWorkOrderLines.kgPlanned,
          kgActual: ProductionWorkOrderLines.kgActual,
        })
        .from(ProductionWorkOrderLines)
        .innerJoin(
          ProductionWorkOrders,
          eq(ProductionWorkOrderLines.workOrderUuid, ProductionWorkOrders.uuid),
        )
        .orderBy(desc(ProductionWorkOrderLines.date)),
    ]);

    // Line numbers are per workorder, so they are assigned while grouping
    // rather than stored — the underlying tables order by insertion.
    const numberWithin = new Map<number, number>();
    const nextLineNumber = (workOrderNumber: number) => {
      const next = (numberWithin.get(workOrderNumber) ?? 0) + 1;
      numberWithin.set(workOrderNumber, next);
      return next;
    };

    const rows: CombinedWorkOrderLine[] = [
      ...warehouseLines.map((line) => {
        const kgPlanned = Number(line.kgPlanned ?? 0);
        const kgActual = Number(line.kgActual ?? 0);
        return {
          uuid: line.uuid,
          workOrderNumber: line.workOrderNumber,
          lineNumber: nextLineNumber(line.workOrderNumber),
          warehouseName: line.warehouseName,
          qtyPlanned: Number(line.qtyPlanned ?? 0),
          qtyActual: Number(line.qtyActual ?? 0),
          qtyUnit: null,
          kgPlanned,
          kgActual,
          weightDeviation: kgActual - kgPlanned,
          workOrderType: "Warehouse" as const,
          workOrderDate: asDateString(line.date),
          workOrderStatus: line.status,
        };
      }),
      ...productionLines.map((line) => {
        const kgPlanned = Number(line.kgPlanned ?? 0);
        const kgActual = Number(line.kgActual ?? 0);
        return {
          uuid: line.uuid,
          workOrderNumber: line.workOrderNumber,
          lineNumber: nextLineNumber(line.workOrderNumber),
          warehouseName: null,
          qtyPlanned: Number(line.qtyPlanned ?? 0),
          qtyActual: Number(line.qtyActual ?? 0),
          qtyUnit: line.unitPlanned,
          kgPlanned,
          kgActual,
          weightDeviation: kgActual - kgPlanned,
          workOrderType: "Production" as const,
          workOrderDate: asDateString(line.date),
          workOrderStatus: line.status,
        };
      }),
    ];

    return rows.sort((a, b) =>
      (b.workOrderDate ?? "").localeCompare(a.workOrderDate ?? ""),
    );
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch warehouse and production workorders"),
    );
  }
};
