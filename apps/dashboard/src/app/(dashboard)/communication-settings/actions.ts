"use server";

import { CommunicationSettings, Companies, db } from "@/db";
import { desc, eq } from "drizzle-orm";

export type CommunicationSettingListItem = {
  id: number;
  companyUuid: string;
  companyName: string | null;
  documentType: string;
  communicationType: string;
  shape: string | null;
  contactUuid: string | null;
  email: string | null;
  fax: string | null;
  modifiedByUserId: string;
  createdAt: Date;
  updatedAt: Date;
};

export const getCommunicationSettings = async (): Promise<CommunicationSettingListItem[]> => {
  const rows = await db
    .select({
      id: CommunicationSettings.id,
      companyUuid: CommunicationSettings.companyUuid,
      companyName: Companies.companyName,
      documentType: CommunicationSettings.documentType,
      communicationType: CommunicationSettings.communicationType,
      shape: CommunicationSettings.shape,
      contactUuid: CommunicationSettings.contactUuid,
      email: CommunicationSettings.email,
      fax: CommunicationSettings.fax,
      modifiedByUserId: CommunicationSettings.modifiedByUserId,
      createdAt: CommunicationSettings.createdAt,
      updatedAt: CommunicationSettings.updatedAt,
    })
    .from(CommunicationSettings)
    .leftJoin(Companies, eq(Companies.uuid, CommunicationSettings.companyUuid))
    .orderBy(desc(CommunicationSettings.createdAt));
  return rows;
};
