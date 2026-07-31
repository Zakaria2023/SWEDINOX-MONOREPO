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
import {
  ContractNetPrices,
  SelectContractNetPrices,
} from "@/db/schema/contract-net-prices";
import { Orders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import { Quotes } from "@/db/schema/quotes";
import { generateUuid } from "@/lib/helpers";
import { and, desc, eq, getTableColumns, inArray, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

export type ContractForProjectOption = Pick<
  SelectContracts,
  "uuid" | "code" | "description"
>;

export const getContractsForProjects = async (): Promise<
  ContractForProjectOption[]
> =>
  db
    .select({
      uuid: Contracts.uuid,
      code: Contracts.code,
      description: Contracts.description,
    })
    .from(Contracts)
    .where(inArray(Contracts.role, ["customer", "prospect"]))
    .orderBy(Contracts.code);

export const getContracts = async (): Promise<ContractListItem[]> =>
  db
    .select({
      ...getTableColumns(Contracts),
      contractGroupName: ContractGroups.name,
    })
    .from(Contracts)
    .leftJoin(
      ContractGroups,
      eq(ContractGroups.uuid, Contracts.contractGroupUuid),
    )
    .orderBy(desc(Contracts.createdAt));

export const getContractsPerCustomer = async (): Promise<ContractPerCustomerRow[]> =>
  db
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

export const getContractsPerSupplier = async (): Promise<ContractPerSupplierRow[]> =>
  db
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

// A contract as its own screen reads it: the header, who it is with, and the
// agreed net prices that make it worth having.
export type ContractDetail = SelectContracts & {
  contractGroupName: SelectContractGroups["name"] | null;
  companyName: SelectCompanies["companyName"] | null;
  netPrices: ContractNetPriceRow[];
  quotesUsing: ContractUsageRow[];
  // A contract can be attached to one specific order — the reference calls
  // these "order contracts", as opposed to company or project ones. The link
  // runs from the contract to the order, so this is one row and not a list.
  linkedOrder: ContractUsageRow | null;
};

export type ContractNetPriceRow = SelectContractNetPrices & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
};

// A document priced against this contract. Enough to open it, and enough to
// see whether removing the contract would strand anything.
export type ContractUsageRow = {
  uuid: string;
  documentNumber: number;
  companyName: SelectCompanies["companyName"] | null;
  createdAt: Date;
};

export const getContractDetail = async (
  uuid: string,
): Promise<ContractDetail | null> => {
  const [contract] = await db
    .select({
      ...getTableColumns(Contracts),
      contractGroupName: ContractGroups.name,
      companyName: Companies.companyName,
    })
    .from(Contracts)
    .leftJoin(
      ContractGroups,
      eq(ContractGroups.uuid, Contracts.contractGroupUuid),
    )
    .leftJoin(Companies, eq(Companies.uuid, Contracts.companyUuid))
    .where(eq(Contracts.uuid, uuid))
    .limit(1);

  if (!contract) {
    return null;
  }

  const [netPrices, quotesUsing, linkedOrders] = await Promise.all([
    db
      .select({
        ...getTableColumns(ContractNetPrices),
        productCode: Products.productCode,
        productName: Products.name,
      })
      .from(ContractNetPrices)
      .leftJoin(Products, eq(ContractNetPrices.productUuid, Products.uuid))
      .where(eq(ContractNetPrices.contractUuid, uuid))
      .orderBy(ContractNetPrices.fromQty),

    db
      .select({
        uuid: Quotes.uuid,
        documentNumber: Quotes.id,
        companyName: Companies.companyName,
        createdAt: Quotes.createdAt,
      })
      .from(Quotes)
      .leftJoin(Companies, eq(Quotes.companyUuid, Companies.uuid))
      .where(eq(Quotes.contractUuid, uuid))
      .orderBy(desc(Quotes.createdAt)),

    contract.orderUuid
      ? db
          .select({
            uuid: Orders.uuid,
            documentNumber: Orders.id,
            companyName: Companies.companyName,
            createdAt: Orders.createdAt,
          })
          .from(Orders)
          .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
          .where(eq(Orders.uuid, contract.orderUuid))
          .limit(1)
      : Promise.resolve([]),
  ]);

  return {
    ...contract,
    netPrices,
    quotesUsing,
    linkedOrder: linkedOrders[0] ?? null,
  };
};

export const updateContract = async (
  uuid: string,
  input: ContractInput,
): Promise<ContractActionResult> => {
  try {
    const [existing] = await db
      .select({ uuid: Contracts.uuid })
      .from(Contracts)
      .where(eq(Contracts.uuid, uuid))
      .limit(1);

    if (!existing) {
      return { error: "Contract not found." };
    }

    await db.update(Contracts).set(input).where(eq(Contracts.uuid, uuid));
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update contract",
    };
  }

  revalidatePath("/contracts");
  revalidatePath(`/contracts/${uuid}`);
  redirect(`/contracts/${uuid}`);
};

export const deleteContract = async (
  uuid: string,
): Promise<ContractActionResult> => {
  try {
    // A quote priced against this contract would lose the terms it was priced
    // under, so the contract stays until those quotes are gone.
    const [quoted] = await db
      .select({ uuid: Quotes.uuid })
      .from(Quotes)
      .where(eq(Quotes.contractUuid, uuid))
      .limit(1);

    if (quoted) {
      return {
        error:
          "Cannot delete: quotes have been priced against this contract.",
      };
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(ContractNetPrices)
        .where(eq(ContractNetPrices.contractUuid, uuid));
      await tx.delete(Contracts).where(eq(Contracts.uuid, uuid));
    });
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to delete contract",
    };
  }

  revalidatePath("/contracts");
  redirect("/contracts");
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
