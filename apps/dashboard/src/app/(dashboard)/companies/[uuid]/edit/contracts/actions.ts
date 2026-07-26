"use server";

import type { CompanyActionResult } from "@/app/(dashboard)/companies/actions";
import {
  contractSelectionSchema,
  ContractSelectionValues,
} from "@/app/(dashboard)/companies/validation";
import { db } from "@/db";
import { Companies } from "@/db/schema/companies";
import { Contracts, SelectContracts } from "@/db/schema/contracts";
import { CustomerProjects } from "@/db/schema/customer-projects";
import type { CompanyRole, ContractableRole } from "@/lib/enums";
import { contractableRoles } from "@/lib/enums";
import { describeError, generateUuid, pluralize } from "@/lib/helpers";
import { and, asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type SaveContractPayload = {
  companyUuid: string;
  values: ContractSelectionValues;
};

export type DeleteContractPayload = {
  companyUuid: string;
  contractUuid: string;
};

const isContractableRole = (role: CompanyRole): role is ContractableRole =>
  (contractableRoles as readonly string[]).includes(role);

const revalidateContractPaths = (companyUuid: string) => {
  revalidatePath(`/companies/${companyUuid}/edit/contracts`);
  revalidatePath(`/companies/${companyUuid}/edit`);
};

export const getContractsForCompany = async (
  companyUuid: string,
): Promise<SelectContracts[]> =>
  await db
    .select()
    .from(Contracts)
    .where(eq(Contracts.companyUuid, companyUuid))
    .orderBy(asc(Contracts.id));

// The contract dialog only offers roles the company actually has, so the
// page resolves them from the stored company roles (the legacy form derived
// them from the in-progress roles checkboxes instead).
export const getCompanyContractableRoles = async (
  companyUuid: string,
): Promise<ContractableRole[]> => {
  const [company] = await db
    .select({ roles: Companies.roles })
    .from(Companies)
    .where(eq(Companies.uuid, companyUuid))
    .limit(1);

  return (company?.roles ?? []).filter(isContractableRole);
};

// The dialog picks an existing contract as a template; saving copies the same
// subset of its fields the legacy handleSaveContract copied (code, type,
// description, group, quickly-change/price-date/link flags, search codes, and
// website settings) into a new company-owned contract row. Pricing details
// (tiers, discounts, surcharges, dates, volumes) are intentionally not copied,
// matching the legacy flow. There is no edit — only add and remove.
export const saveCompanyContract = async (
  _prevState: CompanyActionResult,
  payload: SaveContractPayload,
): Promise<CompanyActionResult> => {
  const parsed = contractSelectionSchema.safeParse(payload.values);
  if (!parsed.success) {
    return { error: "Invalid contract data — check the fields and try again" };
  }

  try {
    const [selected] = await db
      .select()
      .from(Contracts)
      .where(eq(Contracts.uuid, parsed.data.contractUuid))
      .limit(1);

    if (!selected) {
      return { error: "Contract not found" };
    }

    await db.insert(Contracts).values({
      uuid: generateUuid(),
      companyUuid: payload.companyUuid,
      role: parsed.data.role,
      code: selected.code,
      contractType: selected.contractType,
      description: selected.description,
      contractGroupUuid: selected.contractGroupUuid ?? undefined,
      quicklyChangeOrder: selected.quicklyChangeOrder ?? undefined,
      hasPriceDate: selected.hasPriceDate ?? false,
      priceDate: selected.priceDate ?? undefined,
      linkToNewCustomer: selected.linkToNewCustomer ?? false,
      searchCode1: selected.searchCode1 ?? undefined,
      searchCode2: selected.searchCode2 ?? undefined,
      searchCode3: selected.searchCode3 ?? undefined,
      websiteSorting: selected.websiteSorting ?? 10,
      hideOnWebsite: selected.hideOnWebsite ?? false,
    });

    revalidateContractPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to save contract") };
  }
};

export const deleteCompanyContract = async (
  _prevState: CompanyActionResult,
  payload: DeleteContractPayload,
): Promise<CompanyActionResult> => {
  try {
    const [linked] = await db
      .select({ value: sql<number>`COUNT(*)` })
      .from(CustomerProjects)
      .where(eq(CustomerProjects.contractUuid, payload.contractUuid));
    const linkedCount = Number(linked?.value ?? 0);

    if (linkedCount > 0) {
      return {
        error: `This contract is linked to ${linkedCount} ${pluralize(
          linkedCount,
          "project",
        )} and can't be deleted`,
      };
    }

    await db
      .delete(Contracts)
      .where(
        and(
          eq(Contracts.uuid, payload.contractUuid),
          eq(Contracts.companyUuid, payload.companyUuid),
        ),
      );

    revalidateContractPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to delete contract") };
  }
};
