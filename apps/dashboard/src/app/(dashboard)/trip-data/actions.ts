"use server";

import { describeError } from "@/lib/helpers";
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
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch trip data"));
  }
};
