"use server";

import { db, SelectCompanies, SelectCompanyAddresses } from "@/db";
import {
  CommunicationSettings,
  InsertCommunicationSettings,
} from "@/db/schema/communication-settings";
import { Companies, InsertCompanies } from "@/db/schema/companies";
import {
  CompanyAddresses,
  InsertCompanyAddresses,
} from "@/db/schema/company-addresses";
import { Contacts, InsertContacts, SelectContacts } from "@/db/schema/contacts";
import { Contracts, InsertContracts } from "@/db/schema/contracts";
import {
  CustomerProjects,
  InsertCustomerProjects,
  SelectCustomerProjects,
} from "@/db/schema/customer-projects";
import { InsertTexts, Texts } from "@/db/schema/texts";
import { generateUuid } from "@/lib/helpers";
import { currentUser } from "@clerk/nextjs/server";
import { asc, desc, eq, or, sql } from "drizzle-orm";

export type CompanyOption = Pick<
  SelectCompanies,
  "uuid" | "searchCode1" | "companyName" | "roles"
>;

export type AddressInput = Omit<
  InsertCompanyAddresses,
  "id" | "uuid" | "companyUuid" | "createdAt" | "updatedAt"
>;

export type CommSettingInput = Omit<
  InsertCommunicationSettings,
  "id" | "companyUuid" | "modifiedByUserId" | "createdAt" | "updatedAt"
>;

export type CompanyFields = Omit<
  InsertCompanies,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type CompanyContractInput = Omit<
  InsertContracts,
  "id" | "uuid" | "companyUuid" | "createdAt" | "updatedAt"
>;

export type CustomerSalesInput = Pick<
  InsertCompanies,
  | "customerGroup"
  | "representative"
  | "accountManager"
  | "region"
  | "memberOf"
  | "miscellaneousSettings"
  | "deliveryCondition"
  | "devTheorWt"
  | "defTransport"
  | "quoteOrderSettings"
  | "groupLinesByLongProductGroupDescription"
  | "printProductCodesOnOutgoingDocuments"
  | "quoteOrderInvoiceSettings"
  | "orderSettings"
  | "quoteSettings"
  | "websiteQuoteMustBeApproved"
  | "websiteQuoteApprovalAmount"
  | "releaseActionPrint"
  | "releaseActionEmailEnabled"
  | "releaseActionEmailTo"
  | "releaseActionFaxEnabled"
  | "releaseActionFaxTo"
  | "actionPrint"
  | "actionEmailEnabled"
  | "actionEmailTo"
  | "actionFaxEnabled"
  | "actionFaxTo"
  | "ediSettings"
>;

export type CustomerProjectInput = Omit<
  InsertCustomerProjects,
  "id" | "uuid" | "companyUuid" | "createdAt" | "updatedAt"
>;

export type ProjectOption = Pick<
  SelectCustomerProjects,
  "uuid" | "projectName"
>;

export type CompanyContactInput = Omit<
  InsertContacts,
  "id" | "uuid" | "companyUuid" | "createdAt" | "updatedAt"
>;

export type CompanyTextInput = Omit<
  InsertTexts,
  "id" | "uuid" | "companyUuid" | "createdByUserId" | "createdAt" | "updatedAt"
>;

export type DebtorCompanyOption = Pick<SelectCompanies, "uuid" | "companyName">;

export type CompanyActionResult = {
  companyUuid?: string;
  error?: string;
  success?: boolean;
};

export type AddressOption = Pick<
  SelectCompanyAddresses,
  "uuid" | "streetAndNo" | "city" | "postalCode" | "altName"
>;

export type CompanyDetail = SelectCompanies & {
  addresses: SelectCompanyAddresses[];
};

export type ContactOption = Pick<
  SelectContacts,
  "uuid" | "id" | "companyUuid" | "firstName" | "lastName"
>;

export type CustomerOrProspectCompany = Pick<
  SelectCompanies,
  | "uuid"
  | "id"
  | "companyName"
  | "searchCode1"
  | "searchCode2"
  | "searchCode3"
  | "representative"
  | "accountManager"
  | "region"
  | "customerGroup"
  | "creditLimit"
  | "cocNumber"
  | "createdAt"
  | "roles"
  | "quoteOrderSettings"
>;

export const updateCompanyDocuments = async (
  companyUuid: string,
  documents: Array<{ id: string; fileName: string }>,
): Promise<void> => {
  await db
    .update(Companies)
    .set({ documents })
    .where(eq(Companies.uuid, companyUuid));
};

export const getCompanyDetail = async (
  uuid: string,
): Promise<CompanyDetail | null> => {
  const [company] = await db
    .select()
    .from(Companies)
    .where(eq(Companies.uuid, uuid))
    .limit(1);
  if (!company) return null;
  const addresses = await db
    .select()
    .from(CompanyAddresses)
    .where(eq(CompanyAddresses.companyUuid, uuid));
  return { ...company, addresses };
};

export const getAddressesForCompany = async (
  companyUuid: string,
): Promise<AddressOption[]> =>
  db
    .select({
      uuid: CompanyAddresses.uuid,
      streetAndNo: CompanyAddresses.streetAndNo,
      city: CompanyAddresses.city,
      postalCode: CompanyAddresses.postalCode,
      altName: CompanyAddresses.altName,
    })
    .from(CompanyAddresses)
    .where(eq(CompanyAddresses.companyUuid, companyUuid))
    .orderBy(asc(CompanyAddresses.sequenceNumber));

export const getCompaniesForSelect = async (): Promise<CompanyOption[]> =>
  db
    .select({
      uuid: Companies.uuid,
      searchCode1: Companies.searchCode1,
      companyName: Companies.companyName,
      roles: Companies.roles,
    })
    .from(Companies)
    .orderBy(asc(Companies.companyName));

export const getSuppliersForSelect = async (): Promise<CompanyOption[]> =>
  db
    .select({
      uuid: Companies.uuid,
      searchCode1: Companies.searchCode1,
      companyName: Companies.companyName,
      roles: Companies.roles,
    })
    .from(Companies)
    .where(sql`JSON_CONTAINS(${Companies.roles}, '"supplier"')`)
    .orderBy(asc(Companies.companyName));

export const getCustomerAndProspectCompaniesForSelect = async (): Promise<
  CompanyOption[]
> =>
  db
    .select({
      uuid: Companies.uuid,
      searchCode1: Companies.searchCode1,
      companyName: Companies.companyName,
      roles: Companies.roles,
    })
    .from(Companies)
    .where(
      or(
        sql`JSON_CONTAINS(${Companies.roles}, '"customer"')`,
        sql`JSON_CONTAINS(${Companies.roles}, '"prospect"')`,
      ),
    )
    .orderBy(asc(Companies.companyName));

export const getCustomerAndProspectCompaniesWithDetails = async (): Promise<
  CustomerOrProspectCompany[]
> =>
  db
    .select({
      uuid: Companies.uuid,
      id: Companies.id,
      companyName: Companies.companyName,
      searchCode1: Companies.searchCode1,
      searchCode2: Companies.searchCode2,
      searchCode3: Companies.searchCode3,
      representative: Companies.representative,
      accountManager: Companies.accountManager,
      region: Companies.region,
      customerGroup: Companies.customerGroup,
      creditLimit: Companies.creditLimit,
      cocNumber: Companies.cocNumber,
      createdAt: Companies.createdAt,
      roles: Companies.roles,
      quoteOrderSettings: Companies.quoteOrderSettings,
    })
    .from(Companies)
    .where(
      or(
        sql`JSON_CONTAINS(${Companies.roles}, '"customer"')`,
        sql`JSON_CONTAINS(${Companies.roles}, '"prospect"')`,
      ),
    )
    .orderBy(asc(Companies.companyName));

export const getContactsForSuppliers = async (): Promise<ContactOption[]> =>
  db
    .select({
      uuid: Contacts.uuid,
      id: Contacts.id,
      companyUuid: Contacts.companyUuid,
      firstName: Contacts.firstName,
      lastName: Contacts.lastName,
    })
    .from(Contacts)
    .orderBy(asc(Contacts.firstName));

/** Companies with role customer or prospect — for the Debtor number dropdown */
export const getDebtorCompaniesForSelect = async (): Promise<
  DebtorCompanyOption[]
> =>
  db
    .select({ uuid: Companies.uuid, companyName: Companies.companyName })
    .from(Companies)
    .where(
      sql`JSON_CONTAINS(${Companies.roles}, '"customer"') OR JSON_CONTAINS(${Companies.roles}, '"prospect"')`,
    )
    .orderBy(asc(Companies.companyName));

/** Companies with role purchasing_org — for the Purchase Org dropdown */
export const getPurchaseOrgCompaniesForSelect = async (): Promise<
  DebtorCompanyOption[]
> =>
  db
    .select({ uuid: Companies.uuid, companyName: Companies.companyName })
    .from(Companies)
    .where(sql`JSON_CONTAINS(${Companies.roles}, '"purchasing_org"')`)
    .orderBy(asc(Companies.companyName));

export const getProjectsForCompany = async (
  companyUuid: string,
): Promise<ProjectOption[]> =>
  db
    .select({
      uuid: CustomerProjects.uuid,
      projectName: CustomerProjects.projectName,
    })
    .from(CustomerProjects)
    .where(eq(CustomerProjects.companyUuid, companyUuid))
    .orderBy(asc(CustomerProjects.projectName));

export const getCompanies = async (): Promise<SelectCompanies[]> => {
  try {
    return await db.select().from(Companies).orderBy(desc(Companies.createdAt));
  } catch {
    throw new Error("Failed to fetch companies");
  }
};

export const createCompany = async (
  companyFields: CompanyFields,
  isBlocked: boolean,
  addresses: AddressInput[] = [],
  communicationSettings: CommSettingInput[] = [],
  contracts: CompanyContractInput[] = [],
  contacts: CompanyContactInput[] = [],
  texts: CompanyTextInput[] = [],
  projects: CustomerProjectInput[] = [],
): Promise<CompanyActionResult> => {
  const uuid = generateUuid();

  try {
    const user = await currentUser();
    const userId = user?.id;

    if (!userId) {
      return { error: "User not authenticated" };
    }

    await db.transaction(async (tx) => {
      await tx.insert(Companies).values({
        ...companyFields,
        uuid,
        blockedByUserId: isBlocked ? userId : null,
      });

      for (const address of addresses) {
        await tx.insert(CompanyAddresses).values({
          ...address,
          uuid: generateUuid(),
          companyUuid: uuid,
        });
      }

      for (const setting of communicationSettings) {
        await tx.insert(CommunicationSettings).values({
          ...setting,
          companyUuid: uuid,
          modifiedByUserId: userId,
        });
      }

      for (const contract of contracts) {
        await tx.insert(Contracts).values({
          ...contract,
          uuid: generateUuid(),
          companyUuid: uuid,
        });
      }

      for (const contact of contacts) {
        await tx.insert(Contacts).values({
          ...contact,
          uuid: generateUuid(),
          companyUuid: uuid,
        });
      }

      for (const text of texts) {
        await tx.insert(Texts).values({
          ...text,
          uuid: generateUuid(),
          companyUuid: uuid,
          createdByUserId: userId,
        });
      }

      for (const project of projects) {
        await tx.insert(CustomerProjects).values({
          ...project,
          uuid: generateUuid(),
          companyUuid: uuid,
        });
      }
    });

    return { success: true, companyUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create company",
    };
  }
};
