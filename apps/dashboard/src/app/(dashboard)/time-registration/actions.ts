"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import {
  SelectTimeRegistrations,
  TimeRegistrations,
} from "@/db/schema/time-registrations";
import { desc, eq } from "drizzle-orm";

export type TimeRegistrationListItem = SelectTimeRegistrations;

export const getTimeRegistrations = async (): Promise<
  TimeRegistrationListItem[]
> => {
  try {
    return await db
      .select()
      .from(TimeRegistrations)
      .orderBy(desc(TimeRegistrations.dateTime));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch time registrations"));
  }
};

/**
 * One shop-floor scan event. `user` holds a scan-login code rather than a Clerk
 * user, so there is nothing to join it to — it is shown as recorded.
 */
export const getTimeRegistrationDetail = async (
  uuid: string,
): Promise<TimeRegistrationListItem | null> => {
  const [row] = await db
    .select()
    .from(TimeRegistrations)
    .where(eq(TimeRegistrations.uuid, uuid))
    .limit(1);

  return row ?? null;
};
