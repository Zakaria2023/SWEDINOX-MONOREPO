"use server";
import { describeError } from "@/lib/helpers";

import { db } from "@/db";
import {
  CapacityChecks,
  SelectCapacityChecks,
} from "@/db/schema/capacity-checks";
import { asc, desc } from "drizzle-orm";

export type CapacityCheckListItem = SelectCapacityChecks;

export const getCapacityChecks = async (): Promise<CapacityCheckListItem[]> => {
  try {
    return await db
      .select()
      .from(CapacityChecks)
      .orderBy(desc(CapacityChecks.checkDate), asc(CapacityChecks.checkName));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch capacity checks"));
  }
};
