"use server";

import { db } from "@/db";
import { Charges, SelectCharges } from "@/db/schema/charges";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { RevenueGroups, SelectRevenueGroups } from "@/db/schema/revenue-groups";
import { desc, eq, getTableColumns } from "drizzle-orm";

export type ChargeListItem = SelectCharges & {
  customerName: SelectCompanies["companyName"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
};

export const getCharges = async (): Promise<ChargeListItem[]> => {
  try {
    return await db
      .select({
        ...getTableColumns(Charges),
        customerName: Companies.companyName,
        revenueGroupName: RevenueGroups.name,
      })
      .from(Charges)
      .leftJoin(Companies, eq(Charges.companyUuid, Companies.uuid))
      .leftJoin(RevenueGroups, eq(Charges.revenueGroupUuid, RevenueGroups.uuid))
      .orderBy(desc(Charges.creationDate));
  } catch {
    throw new Error("Failed to fetch charges");
  }
};
