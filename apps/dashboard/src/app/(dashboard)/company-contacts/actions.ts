"use server";

import {
  Companies,
  CompanyContacts,
  db,
  type SelectCompanyContacts,
} from "@/db";
import { desc, eq } from "drizzle-orm";

export type CompanyContactWithCompany = SelectCompanyContacts & {
  companyName: string;
};

export const getCompanyContacts = async (): Promise<
  CompanyContactWithCompany[]
> => {
  const rows = await db
    .select({
      contact: CompanyContacts,
      companyName: Companies.companyName,
    })
    .from(CompanyContacts)
    .leftJoin(Companies, eq(Companies.uuid, CompanyContacts.companyUuid))
    .orderBy(desc(CompanyContacts.createdAt));

  return rows.map((r) => ({
    ...r.contact,
    companyName: r.companyName ?? "",
  }));
};
