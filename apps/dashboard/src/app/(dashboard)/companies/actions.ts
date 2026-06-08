"use server";

import { db } from "@/db";
import { CompanyAddresses } from "@/db/schema/company-addresses";
import { Companies } from "@/db/schema/companies";
import { generateUuid } from "@/lib/helpers";
import { count, desc, eq, like } from "drizzle-orm";

export interface CompanyActionResult {
  companyUuid?: string;
  error?: string;
  success?: boolean;
}

export interface CompanyListItem {
  id: number;
  companyName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyDetail extends CompanyListItem {
  uuid: string;
}

export interface PaginatedCompanies {
  data: CompanyListItem[];
  total: number;
  page: number;
  pageSize: number;
  error?: string;
}

export interface CompanyOption {
  companyName: string;
  uuid: string;
}

export interface CompanyOptionsResult {
  data: CompanyOption[];
  error?: string;
}

export interface CreateCompanyInput {
  companyName: string;
}

export interface UpdateCompanyInput extends CreateCompanyInput {
  id: number;
}

const getCompanyQueryErrorMessage = (error: unknown) => {
  const cause =
    typeof error === "object" &&
    error !== null &&
    "cause" in error &&
    typeof error.cause === "object" &&
    error.cause !== null
      ? error.cause
      : null;

  if (cause && "code" in cause && cause.code === "ENOTFOUND") {
    return "Unable to load companies because the database host could not be resolved. Check DB_HOST in apps/dashboard/.env.local.";
  }

  return "Unable to load companies right now.";
};

export const getCompanies = async (
  page = 1,
  pageSize = 10,
  search = "",
): Promise<PaginatedCompanies> => {
  try {
    const offset = (page - 1) * pageSize;
    const searchTerm = search.trim();
    const whereClause = searchTerm
      ? like(Companies.companyName, `%${searchTerm}%`)
      : undefined;

    const [results, countResult] = await Promise.all([
      db
        .select({
          id: Companies.id,
          companyName: Companies.companyName,
          createdAt: Companies.createdAt,
          updatedAt: Companies.updatedAt,
        })
        .from(Companies)
        .where(whereClause)
        .orderBy(desc(Companies.createdAt))
        .limit(pageSize)
        .offset(offset),
      db.select({ total: count() }).from(Companies).where(whereClause),
    ]);

    return {
      data: results,
      total: countResult[0]?.total ?? 0,
      page,
      pageSize,
    };
  } catch (error) {
    console.error("Failed to load companies", error);

    return {
      data: [],
      total: 0,
      page,
      pageSize,
      error: getCompanyQueryErrorMessage(error),
    };
  }
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
      error: getCompanyQueryErrorMessage(error),
    };
  }
};

export const getCompanyById = async (
  id: number,
): Promise<CompanyDetail | null> => {
  const [company] = await db
    .select({
      id: Companies.id,
      uuid: Companies.uuid,
      companyName: Companies.companyName,
      createdAt: Companies.createdAt,
      updatedAt: Companies.updatedAt,
    })
    .from(Companies)
    .where(eq(Companies.id, id))
    .limit(1);

  return company ?? null;
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
