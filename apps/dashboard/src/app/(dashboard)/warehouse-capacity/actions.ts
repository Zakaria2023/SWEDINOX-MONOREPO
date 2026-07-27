"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import {
  SelectWarehouseCapacity,
  WarehouseCapacity,
} from "@/db/schema/warehouse-capacity";
import { asc, desc } from "drizzle-orm";

export type WarehouseCapacityListItem = SelectWarehouseCapacity;

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
