"use server";

import { CommunicationSettings, Companies, db, type SelectCommunicationSettings } from "@/db";
import type { SelectCompanies } from "@/db/schema/companies";
import { desc, eq } from "drizzle-orm";

// Handle pagination and filtering in the future if needed

export type CommunicationSettingListItem = SelectCommunicationSettings & {
  companyName: Pick<SelectCompanies, "companyName">["companyName"] | null;
};

export const getCommunicationSettings = async (): Promise<
  CommunicationSettingListItem[]
> => {
  const rows = await db
    .select()
    .from(CommunicationSettings)
    .leftJoin(Companies, eq(Companies.uuid, CommunicationSettings.companyUuid))
    .orderBy(desc(CommunicationSettings.createdAt));

  return rows.map(({ communication_settings, Companies: company }) => ({
    ...communication_settings,
    companyName: company?.companyName ?? null,
  }));
};
