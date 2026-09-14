"use server";

import { describeError } from "@/lib/helpers";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { db } from "@/db";
import { companyAddressFor } from "@/lib/server/company-addresses";
import { and, asc, eq, isNotNull, ne, sql } from "drizzle-orm";

export type RemarkPerCompanyRow = {
  companyUuid: SelectCompanies["uuid"];
  companyCode: SelectCompanies["id"];
  customer: SelectCompanies["companyName"];
  representative: SelectCompanies["representative"];
  city: SelectCompanyAddresses["city"] | null;
  remarks: NonNullable<SelectCompanies["remarks"]>;
};

// Companies that carry a free-text remark, with their representative and city —
// the "Customer remarks" report. Only companies with a remark are listed
// (decided 14-9-2026; the reference prints all).
export const getRemarksPerCompany = async (): Promise<
  RemarkPerCompanyRow[]
> => {
  try {
    // The city is the company's visiting address.
    const visiting = companyAddressFor("visit", "visiting_address");

    const rows = await db
      .select({
        companyUuid: Companies.uuid,
        companyCode: Companies.id,
        customer: Companies.companyName,
        representative: Companies.representative,
        city: visiting.city,
        remarks: Companies.remarks,
      })
      .from(Companies)
      .leftJoin(visiting, eq(Companies.uuid, visiting.companyUuid))
      .where(and(isNotNull(Companies.remarks), ne(Companies.remarks, sql`''`)))
      .orderBy(asc(Companies.companyName));

    return rows.map((row) => ({
      companyUuid: row.companyUuid,
      companyCode: row.companyCode,
      customer: row.customer,
      representative: row.representative,
      city: row.city ?? null,
      remarks: row.remarks ?? "",
    }));
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch remarks per company"),
    );
  }
};
