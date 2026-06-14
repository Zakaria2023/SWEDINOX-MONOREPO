"use server";

import {
  db,
  Companies,
  ContractGroups,
  Contracts,
  type InsertContracts,
  type SelectCompanies,
  type SelectContractGroups,
  type SelectContracts,
} from "@/db";
import { generateUuid } from "@/lib/helpers";
import { and, asc, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";

export type ContractInput = Omit<InsertContracts, "id" | "uuid" | "createdAt" | "updatedAt">;

export type ContractCompanyEntry = {
  companyUuid: string;
  role: SelectContracts["role"];
  startingDate?: string;
  endDate?: string;
};

export type ContractActionResult = {
  contractUuid?: string;
  error?: string;
  success?: boolean;
};

export type ContractListItem = SelectContracts & { contractGroupName: string | null };
export type ContractGroupOption = Pick<SelectContractGroups, "uuid" | "name">;
export type CompanyOption = Pick<SelectCompanies, "uuid" | "searchCode1" | "companyName" | "roles">;

export type ContractPerCustomerRow =
  Pick<SelectContracts, "description" | "priceDate"> & {
    role: "customer" | "prospect";
    customerCode: SelectCompanies["searchCode1"];
    customerName: SelectCompanies["companyName"];
    city: string | null;
    contractCode: SelectContracts["code"];
    contractGroupName: SelectContractGroups["name"] | null;
  };

export type ContractPerSupplierRow =
  Pick<SelectContracts, "description" | "startingDate" | "endDate"> & {
    supplierCode: SelectCompanies["searchCode1"];
    supplierName: SelectCompanies["companyName"];
    city: string | null;
    contractCode: SelectContracts["code"];
    contractGroupName: SelectContractGroups["name"] | null;
  };

export const getContracts = async (): Promise<ContractListItem[]> => {
  const rows = await db
    .select({
      contract: Contracts,
      contractGroupName: ContractGroups.name,
    })
    .from(Contracts)
    .leftJoin(ContractGroups, eq(ContractGroups.uuid, Contracts.contractGroupUuid))
    .orderBy(desc(Contracts.createdAt));

  return rows.map((r) => ({ ...r.contract, contractGroupName: r.contractGroupName ?? null }));
};

export const getContractGroups = async (): Promise<ContractGroupOption[]> => {
  const rows = await db
    .select({ uuid: ContractGroups.uuid, name: ContractGroups.name })
    .from(ContractGroups)
    .orderBy(ContractGroups.name);
  return rows;
};

export const getCompaniesForSelect = async (): Promise<CompanyOption[]> => {
  const rows = await db
    .select({ uuid: Companies.uuid, searchCode1: Companies.searchCode1, companyName: Companies.companyName, roles: Companies.roles })
    .from(Companies)
    .orderBy(asc(Companies.companyName));
  return rows;
};

export const getContractsPerCustomer = async (): Promise<ContractPerCustomerRow[]> => {
  const rows = await db
    .select({
      role: Contracts.role,
      customerCode: Companies.searchCode1,
      customerName: Companies.companyName,
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
    customerCode: r.customerCode,
    customerName: r.customerName,
    city: r.city,
    contractCode: r.contractCode,
    description: r.description,
    contractGroupName: r.contractGroupName ?? null,
    priceDate: r.priceDate,
  }));
};

export const getContractsPerSupplier = async (): Promise<ContractPerSupplierRow[]> => {
  const rows = await db
    .select({
      supplierCode: Companies.searchCode1,
      supplierName: Companies.companyName,
      city: sql<string | null>`(
        SELECT ca.city
        FROM CompanyAddresses ca
        WHERE ca.company_uuid = ${Companies.uuid}
        LIMIT 1
      )`,
      contractCode: Contracts.code,
      description: Contracts.description,
      contractGroupName: ContractGroups.name,
      startingDate: Contracts.startingDate,
      endDate: Contracts.endDate,
    })
    .from(Contracts)
    .innerJoin(Companies, eq(Companies.uuid, Contracts.companyUuid))
    .leftJoin(ContractGroups, eq(ContractGroups.uuid, Contracts.contractGroupUuid))
    .where(
      and(
        eq(Contracts.role, "supplier"),
        isNotNull(Contracts.companyUuid),
      ),
    );

  return rows.map((r) => ({
    supplierCode: r.supplierCode,
    supplierName: r.supplierName,
    city: r.city,
    contractCode: r.contractCode,
    description: r.description,
    contractGroupName: r.contractGroupName ?? null,
    startingDate: r.startingDate,
    endDate: r.endDate,
  }));
};

export const createContract = async (
  input: ContractInput,
  companies: ContractCompanyEntry[] = [],
): Promise<ContractActionResult> => {
  try {
    if (companies.length === 0) {
      const uuid = generateUuid();
      await db.insert(Contracts).values({ ...input, uuid });
      return { success: true, contractUuid: uuid };
    }

    await db.transaction(async (tx) => {
      await tx.insert(Contracts).values(
        companies.map((c) => ({
          ...input,
          uuid: generateUuid(),
          companyUuid: c.companyUuid,
          role: c.role,
          startingDate: c.startingDate ?? null,
          endDate: c.endDate ?? null,
          salesKg: 0,
          revenue: 0,
          maxWeightKg: 0,
        })),
      );
    });
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create contract",
    };
  }
};
