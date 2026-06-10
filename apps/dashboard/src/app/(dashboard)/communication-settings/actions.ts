"use server";

import {
  CommunicationSettings,
  Companies,
  Contacts,
  db,
  type InsertCommunicationSettings,
} from "@/db";
import { requireAuth } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

export type CommunicationSettingInput = Omit<
  InsertCommunicationSettings,
  "id" | "modifiedByUserId" | "createdAt" | "updatedAt"
>;

export type CommunicationSettingActionResult = {
  error?: string;
  success?: boolean;
};

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

export type CompanyOption = {
  uuid: string;
  companyName: string;
};

export type ContactOption = {
  uuid: string;
  code: string;
  description: string;
};

export const getCommunicationSettings = async (): Promise<
  CommunicationSettingListItem[]
> => {
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

export const getCompaniesForSelect = async (): Promise<CompanyOption[]> =>
  db
    .select({ uuid: Companies.uuid, companyName: Companies.companyName })
    .from(Companies)
    .orderBy(Companies.companyName);

export const getContactsForSelect = async (): Promise<ContactOption[]> =>
  db
    .select({
      uuid: Contacts.uuid,
      code: Contacts.code,
      description: Contacts.description,
    })
    .from(Contacts)
    .orderBy(Contacts.code);

export const createCommunicationSetting = async (
  input: CommunicationSettingInput,
): Promise<CommunicationSettingActionResult> => {
  try {
    const modifiedByUserId = await requireAuth();
    await db
      .insert(CommunicationSettings)
      .values({ ...input, modifiedByUserId });
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create communication setting",
    };
  }
};
