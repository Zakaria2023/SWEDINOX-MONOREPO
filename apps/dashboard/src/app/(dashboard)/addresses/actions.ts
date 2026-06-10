"use server";

import { db, type SelectCompanyAddresses } from "@/db";
import { type SelectCompanies } from "@/db/schema/companies";
import { Companies } from "@/db/schema/companies";
import { CompanyAddresses } from "@/db/schema/company-addresses";
import { desc, eq } from "drizzle-orm";

export type AddressListItem = {
  CompanyAddresses: SelectCompanyAddresses;
  Companies: SelectCompanies | null;
};

export const getAddresses = async (): Promise<AddressListItem[]> => {
  return db
    .select()
    .from(CompanyAddresses)
    .leftJoin(Companies, eq(Companies.uuid, CompanyAddresses.companyUuid))
    .orderBy(desc(CompanyAddresses.createdAt));
};
