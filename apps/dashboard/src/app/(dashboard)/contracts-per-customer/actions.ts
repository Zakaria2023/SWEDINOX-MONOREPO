"use server";

import { db } from "@/db";
import { type SelectCompanies, Companies } from "@/db/schema/companies";
import { type SelectContractGroups, type SelectContracts, ContractGroups, Contracts } from "@/db/schema/contracts";
import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";

export type ContractPerCustomerRow =
  Pick<SelectContracts, "description" | "priceDate"> &
  Pick<SelectCompanies, "companyName"> & {
    role: "customer" | "prospect";
    companyCode: SelectCompanies["searchCode1"];
    city: string | null;
    contractCode: SelectContracts["code"];
    contractGroupName: SelectContractGroups["name"] | null;
  };

export const getContractsPerCustomer = async (): Promise<ContractPerCustomerRow[]> => {
  const rows = await db
    .select({
      role: Contracts.role,
      companyCode: Companies.searchCode1,
      companyName: Companies.companyName,
      city: sql<string | null>`(
        SELECT ca.city
        FROM CompanyAddresses ca
        WHERE ca.company_uuid = ${Companies.uuid}
        LIMIT 1
      )`,
      contractCode: Contracts.code,
      description: Contracts.description,
      contractGroupName: ContractGroups.name,
      priceDate: Contracts.priceDate,
    })
    .from(Contracts)
    .innerJoin(Companies, eq(Companies.uuid, Contracts.companyUuid))
    .leftJoin(ContractGroups, eq(ContractGroups.uuid, Contracts.contractGroupUuid))
    .where(
      and(
        inArray(Contracts.role, ["customer", "prospect"]),
        isNotNull(Contracts.companyUuid),
      ),
    );

  return rows.map((r) => ({
    role: r.role as "customer" | "prospect",
    companyCode: r.companyCode,
    companyName: r.companyName,
    city: r.city,
    contractCode: r.contractCode,
    description: r.description,
    contractGroupName: r.contractGroupName ?? null,
    priceDate: r.priceDate,
  }));
};
