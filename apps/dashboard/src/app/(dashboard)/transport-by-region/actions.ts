"use server";

import { db } from "@/db";
import {
  SelectTransportTrips,
  TransportTrips,
} from "@/db/schema/transport-trips";
import { describeError } from "@/lib/helpers";
import { desc } from "drizzle-orm";

export type TransportByRegionRow = {
  key: string;
  transportDate: SelectTransportTrips["tripDate"];
  vehicle: SelectTransportTrips["vehicle"];
  kgPlannedTotal: SelectTransportTrips["kg"];
};

// Transport trips shown for the "Transport by region" overview. Trips carry
// their date, vehicle and total load, but region, delivery address, trip/source
// status and the largest length aren't stored on a trip, so those columns have
// no source yet.
export const getTransportByRegion = async (): Promise<TransportByRegionRow[]> => {
  try {
    return await db
      .select({
        key: TransportTrips.uuid,
        transportDate: TransportTrips.tripDate,
        vehicle: TransportTrips.vehicle,
        kgPlannedTotal: TransportTrips.kg,
      })
      .from(TransportTrips)
      .orderBy(desc(TransportTrips.tripDate));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch transport by region"));
  }
};
