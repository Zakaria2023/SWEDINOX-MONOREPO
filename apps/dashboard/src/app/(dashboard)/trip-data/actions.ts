"use server";

import { db } from "@/db";
import {
  SelectTransportTrips,
  TransportTrips,
} from "@/db/schema/transport-trips";
import { desc } from "drizzle-orm";

export type TripDataListItem = SelectTransportTrips;

export const getTripData = async (): Promise<TripDataListItem[]> => {
  try {
    return await db
      .select()
      .from(TransportTrips)
      .orderBy(desc(TransportTrips.tripDate));
  } catch {
    throw new Error("Failed to fetch trip data");
  }
};
