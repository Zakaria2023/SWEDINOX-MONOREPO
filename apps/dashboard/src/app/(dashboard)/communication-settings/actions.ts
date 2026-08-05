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

export type CommunicationSettingDetail = CommunicationSettingListItem & {
  companyId: SelectCompanies["id"] | null;
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

/**
 * One communication setting with the company it belongs to.
 *
 * `CommunicationSettings` carries no uuid of its own, so it is keyed by its
 * autoincrement id — which is what the detail route param is.
 */
export const getCommunicationSettingDetail = async (
  id: number,
): Promise<CommunicationSettingDetail | null> => {
  const [row] = await db
    .select({
      ...getTableColumns(CommunicationSettings),
      companyName: Companies.companyName,
      companyId: Companies.id,
    })
    .from(CommunicationSettings)
    .leftJoin(Companies, eq(Companies.uuid, CommunicationSettings.companyUuid))
    .where(eq(CommunicationSettings.id, id))
    .limit(1);

  return row ?? null;
};
