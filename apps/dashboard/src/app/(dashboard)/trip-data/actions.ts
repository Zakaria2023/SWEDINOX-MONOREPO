"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import {
  SelectTransportTrips,
  TransportTrips,
} from "@/db/schema/transport-trips";
import { desc, eq } from "drizzle-orm";

export type TripDataListItem = SelectTransportTrips;

export type TripDataDetail = SelectTransportTrips & {
  /** Average load per stop, or null when the trip records no stops. */
  kgPerStop: number | null;
  /** Average colli per stop, or null when the trip records no stops. */
  colliPerStop: number | null;
};

export const getTripData = async (): Promise<TripDataListItem[]> => {
  try {
    return await db
      .select()
      .from(TransportTrips)
      .orderBy(desc(TransportTrips.tripDate));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch trip data"));
  }
};

/**
 * One transport trip, with the per-stop averages derived rather than stored — a
 * trip with no stops recorded has no average to report rather than a division by
 * zero.
 */
export const getTripDataDetail = async (
  uuid: string,
): Promise<TripDataDetail | null> => {
  const [row] = await db
    .select()
    .from(TransportTrips)
    .where(eq(TransportTrips.uuid, uuid))
    .limit(1);

  if (!row) {
    return null;
  }

  const stops = row.stops ?? 0;

  return {
    ...row,
    kgPerStop: stops > 0 ? Number(row.kg ?? 0) / stops : null,
    colliPerStop: stops > 0 ? (row.colli ?? 0) / stops : null,
  };
};
