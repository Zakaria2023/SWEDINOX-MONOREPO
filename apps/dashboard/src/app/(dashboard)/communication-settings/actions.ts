"use server";

import { CommunicationSettings, Companies, db } from "@/db";
import { desc, eq } from "drizzle-orm";

// Handle pagination and filtering in the future if needed

export const getCommunicationSettings = async () => {
  return await db
    .select()
    .from(CommunicationSettings)
    .leftJoin(Companies, eq(Companies.uuid, CommunicationSettings.companyUuid))
    .orderBy(desc(CommunicationSettings.createdAt));
};
