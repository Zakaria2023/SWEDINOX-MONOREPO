"use server";

import { db } from "@/db";
import { Companies } from "@/db/schema/companies";
import { generateUuid } from "@/lib/helpers";
import { count, desc, like } from "drizzle-orm";

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
