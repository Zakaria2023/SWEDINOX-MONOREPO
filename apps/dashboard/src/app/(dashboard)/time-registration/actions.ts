"use server";
import { describeError } from "@/lib/helpers";

import { db } from "@/db";
import {
  SelectTimeRegistrations,
  TimeRegistrations,
} from "@/db/schema/time-registrations";
import { desc } from "drizzle-orm";

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
