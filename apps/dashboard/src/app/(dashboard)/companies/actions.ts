"use server";

import { db, type InsertCompanies, type SelectCompanies } from "@/db";
import { CompanyAddresses } from "@/db/schema/company-addresses";
import { Companies } from "@/db/schema/companies";
import { generateUuid } from "@/lib/helpers";
import { desc, eq } from "drizzle-orm";

export interface CompanyActionResult {
  companyUuid?: string;
  error?: string;
  success?: boolean;
}

export type CompanyListItem = SelectCompanies;
export type CompanyDetail = CompanyListItem;

export interface CompanyOption {
  companyName: string;
  uuid: string;
}

export interface CompanyOptionsResult {
  data: CompanyOption[];
  error?: string;
}

export type CreateCompanyInput = Pick<InsertCompanies, "companyName">;

export interface UpdateCompanyInput extends CreateCompanyInput {
  id: number;
}
export const getCompanies = async (): Promise<CompanyListItem[]> => {
  const results = await db.select().from(Companies).orderBy(desc(Companies.createdAt));

  return results as CompanyListItem[];
};

export const getCompanyOptions = async (): Promise<CompanyOptionsResult> => {
  try {
    const results = await db
      .select({
        companyName: Companies.companyName,
        uuid: Companies.uuid,
      })
      .from(Companies)
      .orderBy(Companies.companyName);

    return { data: results };
  } catch (error) {
    console.error("Failed to load company options", error);

    return {
      data: [],
      error: "Unable to load companies right now.",
    };
  }
};

export const getCompanyById = async (
  id: number,
): Promise<CompanyDetail | null> => {
  const [company] = await db.select().from(Companies).where(eq(Companies.id, id)).limit(1);

  return (company as CompanyDetail | undefined) ?? null;
};

export const createCompany = async (
  _prevState: CompanyActionResult,
  data: CreateCompanyInput,
): Promise<CompanyActionResult> => {
  const companyName = data.companyName.trim();

  if (!companyName) {
    return { error: "Company name is required" };
  }

  const companyUuid = generateUuid();

  await db.insert(Companies).values({
    uuid: companyUuid,
    companyName,
  });

  return { companyUuid, success: true };
};

export const updateCompany = async (
  _prevState: CompanyActionResult,
  data: UpdateCompanyInput,
): Promise<CompanyActionResult> => {
  const companyName = data.companyName.trim();

  if (!companyName) {
    return { error: "Company name is required" };
  }

  const [existing] = await db
    .select({
      id: Companies.id,
      uuid: Companies.uuid,
    })
    .from(Companies)
    .where(eq(Companies.id, data.id))
    .limit(1);

  if (!existing) {
    return { error: "Company not found" };
  }

  await db
    .update(Companies)
    .set({ companyName })
    .where(eq(Companies.id, data.id));

  return {
    companyUuid: existing.uuid,
    success: true,
  };
};

export const deleteCompany = async (
  id: number,
): Promise<CompanyActionResult> => {
  const [company] = await db
    .select({
      id: Companies.id,
      uuid: Companies.uuid,
    })
    .from(Companies)
    .where(eq(Companies.id, id))
    .limit(1);

  if (!company) {
    return { error: "Company not found" };
  }

  const [linkedAddress] = await db
    .select({ id: CompanyAddresses.id })
    .from(CompanyAddresses)
    .where(eq(CompanyAddresses.companyUuid, company.uuid))
    .limit(1);

  if (linkedAddress) {
    return {
      error: "Delete the company addresses before deleting this company.",
    };
  }

  await db.delete(Companies).where(eq(Companies.id, id));

  return { success: true };
};
