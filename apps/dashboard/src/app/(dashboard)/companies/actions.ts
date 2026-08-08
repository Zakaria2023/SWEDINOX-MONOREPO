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
import { Industries, SelectIndustries } from "@/db/schema/industries";
import { InsertProducts, Products } from "@/db/schema/products";
import { InsertTexts, Texts } from "@/db/schema/texts";
import {
  CounterOrders,
  InsertCounterOrders,
  SelectCounterOrders,
} from "@/db/schema/counter-orders";
import {
  InsertVisitReports,
  SelectVisitReports,
  VisitReports,
} from "@/db/schema/visit-reports";
import {
  InsertPurchaseOrders,
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { InsertQuotes, Quotes } from "@/db/schema/quotes";
import {
  FollowUps,
  InsertFollowUps,
  SelectFollowUps,
} from "@/db/schema/follow-ups";
import {
  InsertTransporterCosts,
  TransporterCosts,
} from "@/db/schema/transporter-costs";
import {
  InsertTransporterCountries,
  TransporterCountries,
} from "@/db/schema/transporter-countries";
import {
  InsertReturnOrders,
  ReturnOrders,
  SelectReturnOrders,
} from "@/db/schema/return-orders";
import { Processings, InsertProcessings } from "@/db/schema/processings";
import { Complaints, SelectComplaints } from "@/db/schema/complaints";
import {
  CustomerStock,
  InsertCustomerStock,
  SelectCustomerStock,
} from "@/db/schema/customer-stock";
import { sendCompanyWelcomeEmails } from "@/emails/actions";
import { PurchaseCompanyType } from "@/lib/enums";
import { describeError, generateUuid } from "@/lib/helpers";
import { currentUser } from "@clerk/nextjs/server";
import { asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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

export type CompanyCounterOrderInput = Omit<
  InsertCounterOrders,
  "id" | "uuid" | "companyUuid" | "createdAt" | "updatedAt"
>;

export type CompanyProductInput = Omit<
  InsertProducts,
  "id" | "uuid" | "companyUuid" | "createdAt" | "updatedAt"
>;

export type CompanyQuoteInput = Omit<
  InsertQuotes,
  "id" | "uuid" | "companyUuid" | "createdAt" | "updatedAt"
>;

// contactIndex references a position in the `contacts` array passed to
// createCompany — contacts don't have a real uuid yet at this point, since
// that's only generated once they're actually inserted.
export type VisitReportInput = Omit<
  InsertVisitReports,
  "id" | "uuid" | "companyUuid" | "createdAt" | "updatedAt" | "contactUuid"
> & {
  contactIndex?: number;
};

export type CompanyPurchaseOrderInput = Omit<
  InsertPurchaseOrders,
  "id" | "uuid" | "supplierUuid" | "createdAt" | "updatedAt"
>;

export type CompanyFollowUpInput = Omit<
  InsertFollowUps,
  "id" | "uuid" | "companyUuid" | "createdAt" | "updatedAt"
>;

export type CompanyTransporterCostInput = Omit<
  InsertTransporterCosts,
  "id" | "uuid" | "companyUuid" | "createdAt" | "updatedAt"
>;

export type CompanyTransporterCountryInput = Omit<
  InsertTransporterCountries,
  "id" | "uuid" | "companyUuid" | "createdAt" | "updatedAt"
>;

export type CompanyReturnOrderInput = Omit<
  InsertReturnOrders,
  "id" | "uuid" | "companyUuid" | "createdAt" | "updatedAt"
>;

export type CompanyProcessingInput = Omit<
  InsertProcessings,
  "id" | "uuid" | "companyUuid" | "createdAt" | "updatedAt"
>;

export type CompanyCustomerStockInput = Omit<
  InsertCustomerStock,
  "id" | "uuid" | "companyUuid" | "createdAt" | "updatedAt"
>;

export type DebtorCompanyOption = Pick<SelectCompanies, "uuid" | "companyName">;

export type CompanyActionResult = {
  companyUuid?: string;
  error?: string;
  success?: boolean;
};

export type CompanyDetail = SelectCompanies & {
  addresses: SelectCompanyAddresses[];
  counterOrders: SelectCounterOrders[];
  visitReports: SelectVisitReports[];
  purchaseOrders: SelectPurchaseOrders[];
  followUps: SelectFollowUps[];
  returnOrders: SelectReturnOrders[];
  complaints: SelectComplaints[];
  customerStock: SelectCustomerStock[];
  // The debtor, purchase organisation and industry are stored as references —
  // the detail page shows the name behind each, not the raw uuid/SBI code.
  debtorCompanyName: SelectCompanies["companyName"] | null;
  purchaseOrgCompanyName: SelectCompanies["companyName"] | null;
  industryName: SelectIndustries["name"] | null;
};

export type ContactOption = Pick<
  SelectContacts,
  "uuid" | "id" | "companyUuid" | "firstName" | "lastName"
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

// Flags a company as inactive (or reactivates it). An inactive company shows on
// the Inactive Companies overview regardless of its order history.
export const setCompanyInactive = async (
  companyUuid: string,
  isInactive: boolean,
): Promise<CompanyActionResult> => {
  try {
    await db
      .update(Companies)
      .set({ isInactive })
      .where(eq(Companies.uuid, companyUuid));
    revalidatePath("/companies");
    revalidatePath("/inactive-companies");
    return { success: true, companyUuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to update the company's active state",
    };
  }
};

export const getCompanyDetail = async (
  uuid: string,
): Promise<CompanyDetail | null> => {
  const [company] = await db
    .select()
    .from(Companies)
    .where(eq(Companies.uuid, uuid))
    .limit(1);
  if (!company) {
    return null;
  }

  const addresses = await db
    .select()
    .from(CompanyAddresses)
    .where(eq(CompanyAddresses.companyUuid, uuid));

  const counterOrders = await db
    .select()
    .from(CounterOrders)
    .where(eq(CounterOrders.companyUuid, uuid))
    .orderBy(desc(CounterOrders.createdAt));

  const visitReports = await db
    .select()
    .from(VisitReports)
    .where(eq(VisitReports.companyUuid, uuid))
    .orderBy(desc(VisitReports.createdAt));

  const purchaseOrders = await db
    .select()
    .from(PurchaseOrders)
    .where(eq(PurchaseOrders.supplierUuid, uuid))
    .orderBy(desc(PurchaseOrders.createdAt));

  const followUps = await db
    .select()
    .from(FollowUps)
    .where(eq(FollowUps.companyUuid, uuid))
    .orderBy(desc(FollowUps.createdAt));

  const returnOrders = await db
    .select()
    .from(ReturnOrders)
    .where(eq(ReturnOrders.companyUuid, uuid))
    .orderBy(desc(ReturnOrders.createdAt));

  const complaints = await db
    .select()
    .from(Complaints)
    .where(eq(Complaints.companyUuid, uuid))
    .orderBy(desc(Complaints.createdAt));

  const customerStock = await db
    .select()
    .from(CustomerStock)
    .where(eq(CustomerStock.companyUuid, uuid))
    .orderBy(desc(CustomerStock.createdAt));

  // Both references point back at Companies, so one lookup answers for the two
  // of them.
  const referencedCompanyUuids = [
    company.debtorCompanyUuid,
    company.purchaseOrgCompanyUuid,
  ].filter((value): value is string => value !== null);

  const referencedCompanies =
    referencedCompanyUuids.length > 0
      ? await db
          .select({ uuid: Companies.uuid, companyName: Companies.companyName })
          .from(Companies)
          .where(inArray(Companies.uuid, referencedCompanyUuids))
      : [];

  const [industry] = company.industry
    ? await db
        .select({ name: Industries.name })
        .from(Industries)
        .where(eq(Industries.id, company.industry))
        .limit(1)
    : [];

  return {
    ...company,
    addresses,
    counterOrders,
    visitReports,
    followUps,
    purchaseOrders,
    returnOrders,
    complaints,
    customerStock,
    debtorCompanyName:
      referencedCompanies.find(
        (referenced) => referenced.uuid === company.debtorCompanyUuid,
      )?.companyName ?? null,
    purchaseOrgCompanyName:
      referencedCompanies.find(
        (referenced) => referenced.uuid === company.purchaseOrgCompanyUuid,
      )?.companyName ?? null,
    industryName: industry?.name ?? null,
  };
};

// Derives whether a company acts as a supplier or an agent from its roles.
export const resolveCompanyType = async (
  companyUuid: string | null | undefined,
): Promise<PurchaseCompanyType | null> => {
  if (!companyUuid) {
    return null;
  }
  const [company] = await db
    .select({ roles: Companies.roles })
    .from(Companies)
    .where(eq(Companies.uuid, companyUuid))
    .limit(1);
  if (!company) {
    return null;
  }
  switch (true) {
    case company.roles?.includes("supplier"):
      return "supplier";
    case company.roles?.includes("agent"):
      return "agent";
    default:
      return null;
  }
};

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
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch companies"));
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
  counterOrders: CompanyCounterOrderInput[] = [],
  products: CompanyProductInput[] = [],
  visitReports: VisitReportInput[] = [],
  purchaseOrders: CompanyPurchaseOrderInput[] = [],
  quotes: CompanyQuoteInput[] = [],
  followUps: CompanyFollowUpInput[] = [],
  transporterCosts: CompanyTransporterCostInput[] = [],
  transporterCountries: CompanyTransporterCountryInput[] = [],
  returnOrders: CompanyReturnOrderInput[] = [],
  processings: CompanyProcessingInput[] = [],
  customerStock: CompanyCustomerStockInput[] = [],
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

      const contactUuids: string[] = [];
      for (const contact of contacts) {
        const contactUuid = generateUuid();
        contactUuids.push(contactUuid);
        await tx.insert(Contacts).values({
          ...contact,
          uuid: contactUuid,
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

      for (const counterOrder of counterOrders) {
        await tx.insert(CounterOrders).values({
          ...counterOrder,
          uuid: generateUuid(),
          companyUuid: uuid,
        });
      }

      for (const product of products) {
        await tx.insert(Products).values({
          ...product,
          uuid: generateUuid(),
          companyUuid: uuid,
        });
      }

      for (const visitReport of visitReports) {
        const { contactIndex, ...rest } = visitReport;
        await tx.insert(VisitReports).values({
          ...rest,
          uuid: generateUuid(),
          companyUuid: uuid,
          contactUuid:
            contactIndex != null ? contactUuids[contactIndex] : undefined,
        });
      }

      for (const purchaseOrder of purchaseOrders) {
        await tx.insert(PurchaseOrders).values({
          ...purchaseOrder,
          uuid: generateUuid(),
          supplierUuid: uuid,
        });
      }

      for (const quote of quotes) {
        await tx.insert(Quotes).values({
          ...quote,
          uuid: generateUuid(),
          companyUuid: uuid,
        });
      }

      for (const followUp of followUps) {
        await tx.insert(FollowUps).values({
          ...followUp,
          uuid: generateUuid(),
          companyUuid: uuid,
        });
      }

      for (const transporterCost of transporterCosts) {
        await tx.insert(TransporterCosts).values({
          ...transporterCost,
          uuid: generateUuid(),
          companyUuid: uuid,
        });
      }

      for (const transporterCountry of transporterCountries) {
        await tx.insert(TransporterCountries).values({
          ...transporterCountry,
          uuid: generateUuid(),
          companyUuid: uuid,
        });
      }

      for (const returnOrder of returnOrders) {
        await tx.insert(ReturnOrders).values({
          ...returnOrder,
          uuid: generateUuid(),
          companyUuid: uuid,
        });
      }

      for (const processing of processings) {
        await tx.insert(Processings).values({
          ...processing,
          uuid: generateUuid(),
          companyUuid: uuid,
        });
      }

      for (const stock of customerStock) {
        await tx.insert(CustomerStock).values({
          ...stock,
          uuid: generateUuid(),
          companyUuid: uuid,
        });
      }
    });

    // Only sent once the transaction has committed — a rolled back company must
    // never leave welcome emails behind, and an unsent email must never roll a
    // committed company back (mail can't be undone anyway).
    const contactEmails = contacts
      .flatMap((contact) => [contact.email, contact.addressEmail])
      .filter((email): email is string => !!email);

    if (contactEmails.length > 0) {
      await sendCompanyWelcomeEmails(companyFields.companyName, contactEmails);
    }

    return { success: true, companyUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create company",
    };
  }
};
