"use server";

import {
  CommunicationSettings,
  Companies,
  db,
  SelectCommunicationSettings,
} from "@/db";
import { SelectCompanies } from "@/db/schema/companies";
import { desc, eq, getTableColumns } from "drizzle-orm";

// Handle pagination and filtering in the future if needed

export type CommunicationSettingListItem = SelectCommunicationSettings & {
  companyName: Pick<SelectCompanies, "companyName">["companyName"] | null;
};

export const getCommunicationSettings = async (): Promise<CommunicationSettingListItem[]> =>
  db
    .select({
      ...getTableColumns(CommunicationSettings),
      companyName: Companies.companyName,
    })
    .from(CommunicationSettings)
    .leftJoin(Companies, eq(Companies.uuid, CommunicationSettings.companyUuid))
    .orderBy(desc(CommunicationSettings.createdAt));
