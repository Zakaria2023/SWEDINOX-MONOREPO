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
import {
  Contracts,
  InsertContracts,
  SelectContracts,
} from "@/db/schema/contracts";
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
import { InsertQuotes, Quotes, SelectQuotes } from "@/db/schema/quotes";
import { Orders, SelectOrders } from "@/db/schema/orders";
import {
  PurchaseQuotes,
  SelectPurchaseQuotes,
} from "@/db/schema/purchase-quotes";
import {
  PurchaseInvoices,
  SelectPurchaseInvoices,
} from "@/db/schema/purchase-invoices";
import {
  PurchaseReturnOrders,
  SelectPurchaseReturnOrders,
} from "@/db/schema/purchase-return-orders";
import {
  Communications,
  SelectCommunications,
} from "@/db/schema/communications";
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
import {
  describeError,
  effectiveCreditLimit,
  generateUuid,
  todayDateString,
} from "@/lib/helpers";
import {
  getCommittedOrderValue,
  getOldestOpenDueDate,
  getOldestOpenInvoiceDate,
  getOpenReceivables,
} from "@/lib/server/credit-control";
import { requireAuth } from "@/lib/auth";
import { currentUser } from "@clerk/nextjs/server";
import { and, asc, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
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
  | "completeDelivery"
  | "printConsignment"
  | "requiresCertificate"
  | "customerSince"
  | "competitors"
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

// The reference's Debtor panel summary: the total limit, the credit space, and
// what they are measured from — all excl. VAT, through the same helpers the
// blocking rule uses so the page can never disagree with a hold.
export type CompanyCreditStanding = {
  totalCreditLimit: number;
  openReceivables: number;
  committedOrders: number;
  creditSpace: number;
  oldestOpenInvoiceDate: string | null;
  oldestOpenDueDate: string | null;
};

export type CompanyDetail = SelectCompanies & {
  creditStanding: CompanyCreditStanding;
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

/**
 * The document panels the reference stacks under a company — `Contacts`,
 * `Quotes`, `Orders`, `Contracts`, `Purchase quotes`, `Purchase invoices`,
 * `Purchase returns`, `Communication` — newest first.
 */
export type CompanyRelatedRecords = {
  contacts: Pick<
    SelectContacts,
    | "uuid"
    | "firstName"
    | "lastName"
    | "email"
    | "telephone"
    | "mobile"
    | "categories"
  >[];
  orders: Pick<
    SelectOrders,
    | "uuid"
    | "id"
    | "orderType"
    | "status"
    | "createdAt"
    | "deliveryDate"
    | "totalExclVat"
    | "totalWeightKg"
    | "customerRef"
    | "handlingBlocked"
    | "isConsignment"
  >[];
  quotes: Pick<
    SelectQuotes,
    | "uuid"
    | "id"
    | "status"
    | "quoteDate"
    | "validUntil"
    | "totalExclVat"
    | "totalWeightKg"
    | "customerRef"
  >[];
  contracts: Pick<
    SelectContracts,
    | "uuid"
    | "code"
    | "description"
    | "contractType"
    | "role"
    | "startingDate"
    | "endDate"
  >[];
  purchaseQuotes: Pick<
    SelectPurchaseQuotes,
    | "uuid"
    | "id"
    | "status"
    | "quoteDate"
    | "validUntil"
    | "totalExclVat"
    | "totalWeightKg"
    | "reference"
  >[];
  purchaseInvoices: Pick<
    SelectPurchaseInvoices,
    | "uuid"
    | "id"
    | "documentType"
    | "invoiceDate"
    | "invoiceNumberSupplier"
    | "invoiceTotal"
    | "outstanding"
    | "status"
  >[];
  purchaseReturns: Pick<
    SelectPurchaseReturnOrders,
    | "uuid"
    | "id"
    | "status"
    | "returnDate"
    | "returnReason"
    | "totalExclVat"
    | "totalWeightKg"
  >[];
  communications: Pick<
    SelectCommunications,
    | "uuid"
    | "sentAt"
    | "documentLabel"
    | "channel"
    | "recipient"
    | "subject"
    | "deliveredCount"
    | "failedCount"
  >[];
};

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
  const userId = await requireAuth();
  try {
    await db
      .update(Companies)
      .set({ isInactive, modifiedByUserId: userId })
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

  const openReceivables = await getOpenReceivables(db, uuid);
  const committedOrders = await getCommittedOrderValue(db, uuid);
  const totalCreditLimit = effectiveCreditLimit(
    Number(company.creditLimit ?? 0),
    Number(company.creditLimitUninsured ?? 0),
    company.creditLimitUninsuredDate ?? null,
  );

  return {
    ...company,
    creditStanding: {
      totalCreditLimit,
      openReceivables,
      committedOrders,
      creditSpace: totalCreditLimit - openReceivables - committedOrders,
      oldestOpenInvoiceDate: await getOldestOpenInvoiceDate(db, uuid),
      oldestOpenDueDate: await getOldestOpenDueDate(db, uuid),
    },
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
        modifiedByUserId: userId,
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

      // `Link to new customer` copies a contract onto every customer or
      // prospect created after it. In the reference the two charge contracts
      // sit on 82 new companies, each pair with the company's creation day as
      // its starting date. The template is the contract that belongs to no
      // company; one the form already attached is not copied twice.
      const roles = companyFields.roles ?? [];
      if (roles.includes("customer") || roles.includes("prospect")) {
        const attachedCodes = new Set(contracts.map((contract) => contract.code));
        const templates = await tx
          .select()
          .from(Contracts)
          .where(
            and(
              eq(Contracts.linkToNewCustomer, true),
              isNull(Contracts.companyUuid),
            ),
          );
        const role = roles.includes("customer") ? "customer" : "prospect";
        for (const template of templates) {
          if (attachedCodes.has(template.code)) {
            continue;
          }
          const { id, uuid: templateUuid, createdAt, updatedAt, ...fields } =
            template;
          void id;
          void templateUuid;
          void createdAt;
          void updatedAt;
          await tx.insert(Contracts).values({
            ...fields,
            uuid: generateUuid(),
            companyUuid: uuid,
            role,
            linkToNewCustomer: false,
            startingDate: todayDateString(),
            endDate: fields.endDate ?? "9999-12-31",
          });
        }
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

// Enough to read a relationship from the company screen; the overviews hold
// the rest.
const RELATED_RECORD_LIMIT = 100;

/**
 * Every document panel under a company, read one after another — this
 * database caps connections.
 */
export const getCompanyRelatedRecords = async (
  companyUuid: string,
): Promise<CompanyRelatedRecords> => {
  try {
    const contacts = await db
      .select({
        uuid: Contacts.uuid,
        firstName: Contacts.firstName,
        lastName: Contacts.lastName,
        email: Contacts.email,
        telephone: Contacts.telephone,
        mobile: Contacts.mobile,
        categories: Contacts.categories,
      })
      .from(Contacts)
      .where(eq(Contacts.companyUuid, companyUuid))
      .orderBy(asc(Contacts.sequenceNumber), asc(Contacts.id));

    const orders = await db
      .select({
        uuid: Orders.uuid,
        id: Orders.id,
        orderType: Orders.orderType,
        status: Orders.status,
        createdAt: Orders.createdAt,
        deliveryDate: Orders.deliveryDate,
        totalExclVat: Orders.totalExclVat,
        totalWeightKg: Orders.totalWeightKg,
        customerRef: Orders.customerRef,
        handlingBlocked: Orders.handlingBlocked,
        isConsignment: Orders.isConsignment,
      })
      .from(Orders)
      .where(eq(Orders.companyUuid, companyUuid))
      .orderBy(desc(Orders.id))
      .limit(RELATED_RECORD_LIMIT);

    const quotes = await db
      .select({
        uuid: Quotes.uuid,
        id: Quotes.id,
        status: Quotes.status,
        quoteDate: Quotes.quoteDate,
        validUntil: Quotes.validUntil,
        totalExclVat: Quotes.totalExclVat,
        totalWeightKg: Quotes.totalWeightKg,
        customerRef: Quotes.customerRef,
      })
      .from(Quotes)
      .where(eq(Quotes.companyUuid, companyUuid))
      .orderBy(desc(Quotes.id))
      .limit(RELATED_RECORD_LIMIT);

    const contracts = await db
      .select({
        uuid: Contracts.uuid,
        code: Contracts.code,
        description: Contracts.description,
        contractType: Contracts.contractType,
        role: Contracts.role,
        startingDate: Contracts.startingDate,
        endDate: Contracts.endDate,
      })
      .from(Contracts)
      .where(eq(Contracts.companyUuid, companyUuid))
      .orderBy(asc(Contracts.code));

    const purchaseQuotes = await db
      .select({
        uuid: PurchaseQuotes.uuid,
        id: PurchaseQuotes.id,
        status: PurchaseQuotes.status,
        quoteDate: PurchaseQuotes.quoteDate,
        validUntil: PurchaseQuotes.validUntil,
        totalExclVat: PurchaseQuotes.totalExclVat,
        totalWeightKg: PurchaseQuotes.totalWeightKg,
        reference: PurchaseQuotes.reference,
      })
      .from(PurchaseQuotes)
      .where(eq(PurchaseQuotes.companyUuid, companyUuid))
      .orderBy(desc(PurchaseQuotes.id))
      .limit(RELATED_RECORD_LIMIT);

    const purchaseInvoices = await db
      .select({
        uuid: PurchaseInvoices.uuid,
        id: PurchaseInvoices.id,
        documentType: PurchaseInvoices.documentType,
        invoiceDate: PurchaseInvoices.invoiceDate,
        invoiceNumberSupplier: PurchaseInvoices.invoiceNumberSupplier,
        invoiceTotal: PurchaseInvoices.invoiceTotal,
        outstanding: PurchaseInvoices.outstanding,
        status: PurchaseInvoices.status,
      })
      .from(PurchaseInvoices)
      .where(eq(PurchaseInvoices.companyUuid, companyUuid))
      .orderBy(desc(PurchaseInvoices.id))
      .limit(RELATED_RECORD_LIMIT);

    const purchaseReturns = await db
      .select({
        uuid: PurchaseReturnOrders.uuid,
        id: PurchaseReturnOrders.id,
        status: PurchaseReturnOrders.status,
        returnDate: PurchaseReturnOrders.returnDate,
        returnReason: PurchaseReturnOrders.returnReason,
        totalExclVat: PurchaseReturnOrders.totalExclVat,
        totalWeightKg: PurchaseReturnOrders.totalWeightKg,
      })
      .from(PurchaseReturnOrders)
      .where(eq(PurchaseReturnOrders.supplierUuid, companyUuid))
      .orderBy(desc(PurchaseReturnOrders.id))
      .limit(RELATED_RECORD_LIMIT);

    const communications = await db
      .select({
        uuid: Communications.uuid,
        sentAt: Communications.sentAt,
        documentLabel: Communications.documentLabel,
        channel: Communications.channel,
        recipient: Communications.recipient,
        subject: Communications.subject,
        deliveredCount: Communications.deliveredCount,
        failedCount: Communications.failedCount,
      })
      .from(Communications)
      .where(eq(Communications.companyUuid, companyUuid))
      .orderBy(desc(Communications.id))
      .limit(RELATED_RECORD_LIMIT);

    return {
      contacts,
      orders,
      quotes,
      contracts,
      purchaseQuotes,
      purchaseInvoices,
      purchaseReturns,
      communications,
    };
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch the company's documents"),
    );
  }
};
