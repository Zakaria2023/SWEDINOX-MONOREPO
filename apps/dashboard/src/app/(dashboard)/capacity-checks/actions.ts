"use server";
import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import {
  CapacityChecks,
  SelectCapacityChecks,
} from "@/db/schema/capacity-checks";
import { asc, desc, eq } from "drizzle-orm";

export type CapacityCheckListItem = SelectCapacityChecks;

export type CapacityCheckDetail = SelectCapacityChecks & {
  /** Occupied as a share of the maximum, or null when no maximum is set. */
  occupiedPercentOfMaximum: number | null;
  /** How much of the maximum is still free; negative once it is exceeded. */
  headroom: number | null;
  /** Whether occupancy has passed the warning threshold. */
  pastWarning: boolean;
};

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

/**
 * One capacity check with its occupancy read against the ceiling and the warning
 * threshold.
 *
 * Both are derived rather than stored: a check with no maximum recorded has no
 * share to report (dividing by it would read as 0% or crash), and "past warning"
 * is simply occupancy above the threshold — storing either would let it drift
 * from the figures printed beside it.
 */
export const getCapacityCheckDetail = async (
  uuid: string,
): Promise<CapacityCheckDetail | null> => {
  const [row] = await db
    .select()
    .from(CapacityChecks)
    .where(eq(CapacityChecks.uuid, uuid))
    .limit(1);

  if (!row) {
    return null;
  }

  const occupied = row.occupiedCapacity === null ? null : Number(row.occupiedCapacity);
  const maximum = row.maximumCapacity === null ? null : Number(row.maximumCapacity);
  const warning = row.warningCapacity === null ? null : Number(row.warningCapacity);

  return {
    ...row,
    occupiedPercentOfMaximum:
      occupied === null || maximum === null || maximum === 0
        ? null
        : (occupied / maximum) * 100,
    headroom: occupied === null || maximum === null ? null : maximum - occupied,
    pastWarning: occupied !== null && warning !== null && occupied >= warning,
  };
};
