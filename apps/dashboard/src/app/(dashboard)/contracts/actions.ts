"use server";

import {
  db,
  Companies,
  CompanyAddresses,
  ContractGroups,
  Contracts,
  SelectContracts,
  SelectContractGroups,
  SelectCompanies,
  InsertContracts,
  SelectCompanyAddresses,
} from "@/db";
import { generateUuid } from "@/lib/helpers";
import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";

export type ContractInput = Omit<
  InsertContracts,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type ContractCompanyEntry = Pick<
  SelectContracts,
  "role" | "startingDate" | "endDate"
> & {
  companyUuid: SelectCompanies["uuid"];
};

export type ContractActionResult = {
  contractUuid?: string;
  error?: string;
  success?: boolean;
};

export type ContractListItem = SelectContracts & {
  contractGroupName: SelectContractGroups["name"] | null;
};

export type ContractPerCustomerRow = Pick<
  SelectContracts,
  "role" | "code" | "description" | "priceDate"
> &
  Pick<SelectCompanies, "id" | "companyName"> & {
    city: SelectCompanyAddresses["city"] | null;
    contractGroupName: SelectContractGroups["name"] | null;
  };

export type ContractPerSupplierRow = Pick<
  SelectContracts,
  "code" | "description" | "startingDate" | "endDate"
> &
  Pick<SelectCompanies, "id" | "companyName"> & {
    city: SelectCompanyAddresses["city"] | null;
    contractGroupName: SelectContractGroups["name"] | null;
  };

export const getContracts = async (): Promise<ContractListItem[]> => {
  const rows = await db
    .select({
      contract: Contracts,
      contractGroupName: ContractGroups.name,
    })
    .from(Contracts)
    .leftJoin(
      ContractGroups,
      eq(ContractGroups.uuid, Contracts.contractGroupUuid),
    )
    .orderBy(desc(Contracts.createdAt));

  return rows.map((r) => ({
    ...r.contract,
    contractGroupName: r.contractGroupName ?? null,
  }));
};

export const getContractsPerCustomer = async (): Promise<
  ContractPerCustomerRow[]
> => {
  const rows = await db
    .select({
      role: Contracts.role,
      id: Companies.id,
      companyName: Companies.companyName,
      city: CompanyAddresses.city,
      code: Contracts.code,
      description: Contracts.description,
      contractGroupName: ContractGroups.name,
      priceDate: Contracts.priceDate,
    })
    .from(Contracts)
    .innerJoin(Companies, eq(Companies.uuid, Contracts.companyUuid))
    .leftJoin(
      CompanyAddresses,
      eq(CompanyAddresses.companyUuid, Companies.uuid),
    )
    .leftJoin(
      ContractGroups,
      eq(ContractGroups.uuid, Contracts.contractGroupUuid),
    )
    .where(
      and(
        inArray(Contracts.role, ["customer", "prospect"]),
        isNotNull(Contracts.companyUuid),
      ),
    );

  return rows.map((r) => ({
    role: r.role,
    id: r.id,
    companyName: r.companyName,
    city: r.city,
    code: r.code,
    description: r.description,
    contractGroupName: r.contractGroupName ?? null,
    priceDate: r.priceDate,
  }));
};

export const getContractsPerSupplier = async (): Promise<
  ContractPerSupplierRow[]
> => {
  const rows = await db
    .select({
      id: Companies.id,
      companyName: Companies.companyName,
      city: CompanyAddresses.city,
      code: Contracts.code,
      description: Contracts.description,
      contractGroupName: ContractGroups.name,
      startingDate: Contracts.startingDate,
      endDate: Contracts.endDate,
    })
    .from(Contracts)
    .innerJoin(Companies, eq(Companies.uuid, Contracts.companyUuid))
    .leftJoin(
      CompanyAddresses,
      eq(CompanyAddresses.companyUuid, Companies.uuid),
    )
    .leftJoin(
      ContractGroups,
      eq(ContractGroups.uuid, Contracts.contractGroupUuid),
    )
    .where(
      and(eq(Contracts.role, "supplier"), isNotNull(Contracts.companyUuid)),
    );

  return rows.map((r) => ({
    id: r.id,
    companyName: r.companyName,
    city: r.city,
    code: r.code,
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
    // If no companies are provided, create a standalone contract without a company association
    if (companies.length === 0) {
      const uuid = generateUuid();
      await db.insert(Contracts).values({ ...input, uuid });
      return { success: true, contractUuid: uuid };
    }
    // If companies are provided, create a contract for each company association
    await db.transaction(async (tx) => {
      await tx.insert(Contracts).values(
        companies.map((c) => ({
          ...input,
          uuid: generateUuid(),
          companyUuid: c.companyUuid,
          role: c.role,
          // TODO: Revisit the below logic for the date fields.
          // This is just a placeholder to ensure the code runs without errors. We might want to handle this differently based on the use case.
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
      error:
        error instanceof Error ? error.message : "Failed to create contract",
    };
  }
};
