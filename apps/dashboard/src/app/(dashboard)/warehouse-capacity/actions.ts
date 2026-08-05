"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import {
  SelectWarehouseCapacity,
  WarehouseCapacity,
} from "@/db/schema/warehouse-capacity";
import { asc, desc, eq } from "drizzle-orm";

export type WarehouseCapacityListItem = SelectWarehouseCapacity;

export type WarehouseCapacityDetail = SelectWarehouseCapacity & {
  /** Occupied + ready + remaining — what the day's capacity adds up to. */
  totalCapacity: number;
  /** Occupied as a share of the total, or null when there is no capacity. */
  occupiedPercent: number | null;
};

export const getWarehouseCapacity = async (): Promise<
  WarehouseCapacityListItem[]
> => {
  try {
    return await db
      .select()
      .from(WarehouseCapacity)
      .orderBy(
        desc(WarehouseCapacity.capacityDate),
        asc(WarehouseCapacity.warehouseSection),
        asc(WarehouseCapacity.subsection),
      );
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch warehouse capacity"));
  }
};

/**
 * One capacity snapshot — a day, a section and a workorder type — with the
 * total and the occupied share derived rather than stored, so the three figures
 * can never disagree with the percentage shown beside them.
 */
export const getWarehouseCapacityDetail = async (
  uuid: string,
): Promise<WarehouseCapacityDetail | null> => {
  const [row] = await db
    .select()
    .from(WarehouseCapacity)
    .where(eq(WarehouseCapacity.uuid, uuid))
    .limit(1);

  if (!row) {
    return null;
  }

  const occupied = Number(row.occupied);
  const totalCapacity = occupied + Number(row.ready) + Number(row.remaining);

  return {
    ...row,
    totalCapacity,
    occupiedPercent:
      totalCapacity === 0 ? null : (occupied / totalCapacity) * 100,
  };
};
