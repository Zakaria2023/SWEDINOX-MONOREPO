"use server";

import { db, type InsertCompanies, type SelectCompanies } from "@/db";
import { Companies } from "@/db/schema/companies";
import { generateUuid } from "@/lib/helpers";
import { desc, eq } from "drizzle-orm";

export type CompanyActionResult = {
  companyUuid?: string;
  error?: string;
  success?: boolean;
};

export type CompanyListItem = SelectCompanies;
export type CompanyDetail = CompanyListItem;

export type CompanyOption = {
  companyName: string;
  uuid: string;
};

export type CompanyOptionsResult = {
  data: CompanyOption[];
  error?: string;
};

export type CreateCompanyInput = Pick<
  InsertCompanies,
  "addressId" | "companyName"
>;

export type UpdateCompanyInput = CreateCompanyInput & {
  id: number;
};

export const getCompanies = async (): Promise<CompanyListItem[]> => {
  const results = await db
    .select()
    .from(Companies)
    .orderBy(desc(Companies.createdAt));

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
  const [company] = await db
    .select()
    .from(Companies)
    .where(eq(Companies.id, id))
    .limit(1);

  return (company as CompanyDetail | undefined) ?? null;
};

// input for the createCompany: {
//  companyName: "New Company",
//  address: {
//    street: "123 Main St",
//    city: "Anytown",
//    state: "CA",
//    zip: "12345"
//  }
// }

export const createCompany = {
  // 1. First we pull the company name from the input
  // 2. We pull the provided address fields from the input
  // 3. We generate the uuid
  // 4. We make a transaction
  // 5. First we insert the company with the genreated uuid
  // 6. Second we insert the address with generated uuid
  // 7. This way we can make sure that both of them have the same uuid
};
