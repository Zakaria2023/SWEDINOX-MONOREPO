"use server";

import { capacityRemaining, describeError } from "@/lib/helpers";
import { db } from "@/db";
import {
  SelectWarehouseCapacity,
  WarehouseCapacity,
} from "@/db/schema/warehouse-capacity";
import { asc, desc, eq } from "drizzle-orm";

export type WarehouseCapacityListItem = SelectWarehouseCapacity;

export type WarehouseCapacityDetail = SelectWarehouseCapacity & {
  /**
   * Work orders still to be worked, derived rather than read from the stored
   * column so the three figures can never disagree on screen.
   */
  derivedRemaining: number;
  /** Ready as a share of what was booked, or null when nothing was booked. */
  readyPercent: number | null;
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
 * One capacity snapshot — a day, a section and a workorder type.
 *
 * The reference counts work orders here, not hours, and its three columns are
 * not three independent totals: a section reading 4 occupied, 1 ready and 3
 * remaining has four work orders booked, of which one is finished. So the
 * capacity booked for the day is `occupied` on its own — adding the three
 * together counts the same work orders twice over.
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
  const ready = Number(row.ready);

  return {
    ...row,
    derivedRemaining: capacityRemaining(occupied, ready),
    readyPercent: occupied === 0 ? null : (ready / occupied) * 100,
  };
};
