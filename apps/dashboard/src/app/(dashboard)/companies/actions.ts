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
import { PurchaseCompanyType } from "@/lib/enums";
import { describeError, generateUuid } from "@/lib/helpers";
import { currentUser } from "@clerk/nextjs/server";
import { asc, desc, eq, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { DEFAULT_ADDRESS } from "./validation";
import type { AddressFormValues, CompanyFormValues } from "./validation";

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

    return { success: true, companyUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create company",
    };
  }
};

// ── Edit support ─────────────────────────────────────────────────────────────

// Everything the CompanyForm needs to pre-populate itself in edit mode: the
// company's own fields mapped into the form's value shape, plus each child
// collection mapped back into the same Input shapes the create flow uses.
export type CompanyEditData = {
  formValues: CompanyFormValues;
  salesData: CustomerSalesInput;
  additionalAddresses: AddressFormValues[];
  communicationSettings: CommSettingInput[];
  contracts: CompanyContractInput[];
  contacts: CompanyContactInput[];
  texts: CompanyTextInput[];
  projects: CustomerProjectInput[];
  counterOrders: CompanyCounterOrderInput[];
  products: CompanyProductInput[];
  customerProducts: CompanyProductInput[];
  visitReports: VisitReportInput[];
  purchaseOrders: CompanyPurchaseOrderInput[];
  quotes: CompanyQuoteInput[];
  followUps: CompanyFollowUpInput[];
  transporterCosts: CompanyTransporterCostInput[];
  transporterCountries: CompanyTransporterCountryInput[];
  returnOrders: CompanyReturnOrderInput[];
  processings: CompanyProcessingInput[];
  customerStock: CompanyCustomerStockInput[];
};

// Formats a stored date (Date from a date/timestamp column, or an ISO string)
// into the "YYYY-MM-DD" the date inputs expect, using local calendar parts so
// the value round-trips without a timezone shift.
const toDateInput = (value: Date | string | null | undefined): string => {
  if (!value) {
    return "";
  }
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Drops the DB-managed columns from a child row so what's left matches the
// corresponding Input shape. `extraKeys` covers the per-table owner column
// (companyUuid, or supplierUuid for purchase orders).
const stripChildRow = <T extends object>(
  row: T,
  extraKeys: string[],
): Record<string, unknown> => {
  const skip = new Set<string>([
    "id",
    "uuid",
    "createdAt",
    "updatedAt",
    "createdByUserId",
    "modifiedByUserId",
    ...extraKeys,
  ]);
  const source = row as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(source)) {
    if (skip.has(key)) {
      continue;
    }
    result[key] = source[key];
  }
  return result;
};

const mapAddressRowToForm = (
  address: SelectCompanyAddresses,
): AddressFormValues => ({
  altName: address.altName ?? "",
  poBox: address.poBox ?? false,
  streetAndNo: address.streetAndNo ?? "",
  postalCode: address.postalCode ?? "",
  country: address.country ?? "",
  city: address.city ?? "",
  region: address.region ?? "",
  house: address.house ?? "",
  telephone: address.telephone ?? "",
  fax: address.fax ?? "",
  email: address.email ?? "",
  website: address.website ?? "",
  billingAttention: address.billingAttention ?? "",
  billingAttentionAdditional: address.billingAttentionAdditional ?? "",
  gln: address.gln ?? "",
  peppolId: address.peppolId ?? "",
  sequenceNumber:
    address.sequenceNumber != null ? String(address.sequenceNumber) : "",
  category: address.category ?? [],
  needCrane: address.needCrane ?? false,
  canopyRequired: address.canopyRequired ?? false,
  bundleSeparately: address.bundleSeparately ?? false,
  addressComplete: address.addressComplete ?? false,
  specialTransport: address.specialTransport ?? false,
  availableAt: address.availableAt ?? "",
  unloadingStartTime: address.unloadingStartTime ?? "",
  unloadingEndTime: address.unloadingEndTime ?? "",
  maxLength: address.maxLength ?? "",
  maxBundleWeight: address.maxBundleWeight ?? "",
  loadingInstructions: address.loadingInstructions ?? "",
});

// The company's own columns that live on the Companies row but are edited
// through the Sales section rather than the main form.
const extractSalesData = (company: SelectCompanies): CustomerSalesInput => ({
  customerGroup: company.customerGroup,
  representative: company.representative,
  accountManager: company.accountManager,
  region: company.region,
  memberOf: company.memberOf,
  miscellaneousSettings: company.miscellaneousSettings,
  deliveryCondition: company.deliveryCondition,
  devTheorWt: company.devTheorWt,
  defTransport: company.defTransport,
  quoteOrderSettings: company.quoteOrderSettings,
  groupLinesByLongProductGroupDescription:
    company.groupLinesByLongProductGroupDescription,
  printProductCodesOnOutgoingDocuments:
    company.printProductCodesOnOutgoingDocuments,
  quoteOrderInvoiceSettings: company.quoteOrderInvoiceSettings,
  orderSettings: company.orderSettings,
  quoteSettings: company.quoteSettings,
  websiteQuoteMustBeApproved: company.websiteQuoteMustBeApproved,
  websiteQuoteApprovalAmount: company.websiteQuoteApprovalAmount,
  releaseActionPrint: company.releaseActionPrint,
  releaseActionEmailEnabled: company.releaseActionEmailEnabled,
  releaseActionEmailTo: company.releaseActionEmailTo,
  releaseActionFaxEnabled: company.releaseActionFaxEnabled,
  releaseActionFaxTo: company.releaseActionFaxTo,
  actionPrint: company.actionPrint,
  actionEmailEnabled: company.actionEmailEnabled,
  actionEmailTo: company.actionEmailTo,
  actionFaxEnabled: company.actionFaxEnabled,
  actionFaxTo: company.actionFaxTo,
  ediSettings: company.ediSettings,
});

const mapCompanyToFormValues = (
  company: SelectCompanies,
  firstAddress: SelectCompanyAddresses | undefined,
): CompanyFormValues => ({
  companyName: company.companyName,
  correspName: company.correspName ?? "",
  remarks: company.remarks ?? "",
  lang: company.lang ?? "",
  roles: company.roles ?? [],
  searchCode1: company.searchCode1 ?? "",
  searchCode2: company.searchCode2 ?? "",
  searchCode3: company.searchCode3 ?? "",
  documents: company.documents ?? [],
  debtorCompanyUuid: company.debtorCompanyUuid ?? "",
  iban: company.iban ?? "",
  bic: company.bic ?? "",
  bankAccount: company.bankAccount ?? "",
  postbankAccount: company.postbankAccount ?? "",
  purchaseOrgCompanyUuid: company.purchaseOrgCompanyUuid ?? "",
  memberNumberPurchaseOrg: company.memberNumberPurchaseOrg ?? "",
  calculateVat: company.calculateVat ?? true,
  reminder: company.reminder ?? true,
  collectInvoicesInMandate: company.collectInvoicesInMandate ?? false,
  insuranceValidUntil: toDateInput(company.insuranceValidUntil),
  creditLimitInsurance: company.creditLimitInsurance ?? "",
  creditLimit: company.creditLimit ?? "",
  creditLimitUninsured: company.creditLimitUninsured ?? "",
  creditLimitUninsuredDate: toDateInput(company.creditLimitUninsuredDate),
  paymentTerms: company.paymentTerms ?? "",
  differentPaymentTermsExWorks: company.differentPaymentTermsExWorks ?? "",
  journalCode: company.journalCode ?? undefined,
  vatNumber: company.vatNumber ?? "",
  cocNumber: company.cocNumber ?? "",
  currency: company.currency ?? "",
  isBlocked: company.blockedByUserId != null,
  blockedByNote: company.blockedByNote ?? "",
  invoicingMethod: company.invoicingMethod ?? "",
  collectiveInvoicing: company.collectiveInvoicing ?? false,
  invoicePackagingAtZeroPrice: company.invoicePackagingAtZeroPrice ?? false,
  printCommodityCode: company.printCommodityCode ?? false,
  invoiceFrequency: company.invoiceFrequency ?? "daily",
  invoicePrintEnabled: company.invoicePrintEnabled ?? false,
  invoicePrintCount: company.invoicePrintCount ?? 1,
  invoiceEmailEnabled: company.invoiceEmailEnabled ?? false,
  invoiceEmailTo: company.invoiceEmailTo ?? "",
  printEmailZeroValueInvoices: company.printEmailZeroValueInvoices ?? false,
  sendXmlWithInvoice: company.sendXmlWithInvoice ?? false,
  industry: company.industry ?? "",
  classification: company.classification ?? "",
  visitFrequency: String(company.visitFrequency ?? 0),
  callFrequencyPerYear: String(company.callFrequencyPerYear ?? 0),
  targetDateNextVisit: toDateInput(company.targetDateNextVisit),
  visitReason: company.visitReason ?? "",
  potentialAnnualRevenue: company.potentialAnnualRevenue ?? "0.00",
  targetAnnualRevenue: company.targetAnnualRevenue ?? "0.00",
  potentialAnnualSales: company.potentialAnnualSales ?? "0.000",
  targetAnnualSales: company.targetAnnualSales ?? "0.000",
  numberOfEmployees: String(company.numberOfEmployees ?? 0),
  visitPlanning:
    company.visitPlanning && company.visitPlanning.length > 0
      ? company.visitPlanning
      : Array.from({ length: 12 }, () => ({ call: false, visit: false })),
  address: firstAddress ? mapAddressRowToForm(firstAddress) : DEFAULT_ADDRESS,
});

export const getCompanyForEdit = async (
  uuid: string,
): Promise<CompanyEditData | null> => {
  const [company] = await db
    .select()
    .from(Companies)
    .where(eq(Companies.uuid, uuid))
    .limit(1);
  if (!company) {
    return null;
  }

  // Load every child collection in parallel — they're independent reads, and
  // doing them sequentially against a remote database made opening the edit
  // page slow.
  const [
    addressRows,
    commRows,
    contractRows,
    contactRows,
    textRows,
    projectRows,
    counterOrderRows,
    productRows,
    visitReportRows,
    purchaseOrderRows,
    quoteRows,
    followUpRows,
    transporterCostRows,
    transporterCountryRows,
    returnOrderRows,
    processingRows,
    customerStockRows,
  ] = await Promise.all([
    db
      .select()
      .from(CompanyAddresses)
      .where(eq(CompanyAddresses.companyUuid, uuid))
      .orderBy(asc(CompanyAddresses.id)),
    db
      .select()
      .from(CommunicationSettings)
      .where(eq(CommunicationSettings.companyUuid, uuid))
      .orderBy(asc(CommunicationSettings.id)),
    db
      .select()
      .from(Contracts)
      .where(eq(Contracts.companyUuid, uuid))
      .orderBy(asc(Contracts.id)),
    db
      .select()
      .from(Contacts)
      .where(eq(Contacts.companyUuid, uuid))
      .orderBy(asc(Contacts.id)),
    db
      .select()
      .from(Texts)
      .where(eq(Texts.companyUuid, uuid))
      .orderBy(asc(Texts.id)),
    db
      .select()
      .from(CustomerProjects)
      .where(eq(CustomerProjects.companyUuid, uuid))
      .orderBy(asc(CustomerProjects.id)),
    db
      .select()
      .from(CounterOrders)
      .where(eq(CounterOrders.companyUuid, uuid))
      .orderBy(asc(CounterOrders.id)),
    db
      .select()
      .from(Products)
      .where(eq(Products.companyUuid, uuid))
      .orderBy(asc(Products.id)),
    db
      .select()
      .from(VisitReports)
      .where(eq(VisitReports.companyUuid, uuid))
      .orderBy(asc(VisitReports.id)),
    db
      .select()
      .from(PurchaseOrders)
      .where(eq(PurchaseOrders.supplierUuid, uuid))
      .orderBy(asc(PurchaseOrders.id)),
    db
      .select()
      .from(Quotes)
      .where(eq(Quotes.companyUuid, uuid))
      .orderBy(asc(Quotes.id)),
    db
      .select()
      .from(FollowUps)
      .where(eq(FollowUps.companyUuid, uuid))
      .orderBy(asc(FollowUps.id)),
    db
      .select()
      .from(TransporterCosts)
      .where(eq(TransporterCosts.companyUuid, uuid))
      .orderBy(asc(TransporterCosts.id)),
    db
      .select()
      .from(TransporterCountries)
      .where(eq(TransporterCountries.companyUuid, uuid))
      .orderBy(asc(TransporterCountries.id)),
    db
      .select()
      .from(ReturnOrders)
      .where(eq(ReturnOrders.companyUuid, uuid))
      .orderBy(asc(ReturnOrders.id)),
    db
      .select()
      .from(Processings)
      .where(eq(Processings.companyUuid, uuid))
      .orderBy(asc(Processings.id)),
    db
      .select()
      .from(CustomerStock)
      .where(eq(CustomerStock.companyUuid, uuid))
      .orderBy(asc(CustomerStock.id)),
  ]);

  const [firstAddress, ...restAddresses] = addressRows;

  // Visit reports store the linked contact by uuid; the form references it by
  // its index in the contacts array, so translate uuid back to position.
  const contactIndexByUuid = new Map<string, number>();
  contactRows.forEach((contact, index) => {
    contactIndexByUuid.set(contact.uuid, index);
  });

  const visitReports: VisitReportInput[] = visitReportRows.map((row) => {
    const stripped = stripChildRow(row, [
      "companyUuid",
      "contactUuid",
    ]) as unknown as Omit<VisitReportInput, "contactIndex">;
    return {
      ...stripped,
      contactIndex:
        row.contactUuid != null
          ? contactIndexByUuid.get(row.contactUuid)
          : undefined,
    };
  });

  return {
    formValues: mapCompanyToFormValues(company, firstAddress),
    salesData: extractSalesData(company),
    additionalAddresses: restAddresses.map(mapAddressRowToForm),
    communicationSettings: commRows.map(
      (row) =>
        stripChildRow(row, ["companyUuid"]) as unknown as CommSettingInput,
    ),
    contracts: contractRows.map(
      (row) =>
        stripChildRow(row, ["companyUuid"]) as unknown as CompanyContractInput,
    ),
    contacts: contactRows.map(
      (row) =>
        stripChildRow(row, ["companyUuid"]) as unknown as CompanyContactInput,
    ),
    texts: textRows.map(
      (row) =>
        stripChildRow(row, ["companyUuid"]) as unknown as CompanyTextInput,
    ),
    projects: projectRows.map(
      (row) =>
        stripChildRow(row, ["companyUuid"]) as unknown as CustomerProjectInput,
    ),
    counterOrders: counterOrderRows.map(
      (row) =>
        stripChildRow(row, [
          "companyUuid",
        ]) as unknown as CompanyCounterOrderInput,
    ),
    // All of the company's own product records load into the general Products
    // collection; the customer-products split isn't stored separately, so it
    // starts empty (nothing is lost — everything is re-saved on update).
    products: productRows.map(
      (row) =>
        stripChildRow(row, ["companyUuid"]) as unknown as CompanyProductInput,
    ),
    customerProducts: [],
    visitReports,
    purchaseOrders: purchaseOrderRows.map(
      (row) =>
        stripChildRow(row, [
          "supplierUuid",
        ]) as unknown as CompanyPurchaseOrderInput,
    ),
    quotes: quoteRows.map(
      (row) =>
        stripChildRow(row, ["companyUuid"]) as unknown as CompanyQuoteInput,
    ),
    followUps: followUpRows.map(
      (row) =>
        stripChildRow(row, ["companyUuid"]) as unknown as CompanyFollowUpInput,
    ),
    transporterCosts: transporterCostRows.map(
      (row) =>
        stripChildRow(row, [
          "companyUuid",
        ]) as unknown as CompanyTransporterCostInput,
    ),
    transporterCountries: transporterCountryRows.map(
      (row) =>
        stripChildRow(row, [
          "companyUuid",
        ]) as unknown as CompanyTransporterCountryInput,
    ),
    returnOrders: returnOrderRows.map(
      (row) =>
        stripChildRow(row, [
          "companyUuid",
        ]) as unknown as CompanyReturnOrderInput,
    ),
    processings: processingRows.map(
      (row) =>
        stripChildRow(row, [
          "companyUuid",
        ]) as unknown as CompanyProcessingInput,
    ),
    customerStock: customerStockRows.map(
      (row) =>
        stripChildRow(row, [
          "companyUuid",
        ]) as unknown as CompanyCustomerStockInput,
    ),
  };
};

// Reconciles a company's child rows with the submitted list by position:
// existing rows (ordered by id) are updated in place — keeping their uuid so
// foreign keys from other records (orders referencing a contact/address, etc.)
// stay valid — extra submitted rows are inserted, and rows the user removed are
// deleted. Returns the final uuid of each submitted row, in order (used to link
// visit reports back to their contact).
const syncCompanyChildren = async <T>(
  existingUuids: string[],
  incoming: T[],
  onUpdate: (uuid: string, values: T) => Promise<void>,
  onInsert: (uuid: string, values: T) => Promise<void>,
  onDelete: (uuid: string) => Promise<void>,
): Promise<string[]> => {
  const finalUuids: string[] = [];
  for (let index = 0; index < incoming.length; index++) {
    const existingUuid = existingUuids[index];
    if (existingUuid) {
      await onUpdate(existingUuid, incoming[index]);
      finalUuids.push(existingUuid);
    } else {
      const uuid = generateUuid();
      await onInsert(uuid, incoming[index]);
      finalUuids.push(uuid);
    }
  }
  for (let index = incoming.length; index < existingUuids.length; index++) {
    await onDelete(existingUuids[index]);
  }
  return finalUuids;
};

// Updates the company row and reconciles its child collections in place. Rows
// are matched to the submitted list by position and updated (not deleted and
// re-inserted), so their uuids — and any foreign keys pointing at them — survive
// the edit.
export const updateCompany = async (
  companyUuid: string,
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
  try {
    const user = await currentUser();
    const userId = user?.id;

    if (!userId) {
      return { error: "User not authenticated" };
    }

    // Read every child collection's existing ids up-front and in parallel.
    // These are independent reads, so running them before (and outside) the
    // write transaction avoids ~16 sequential round trips that made saving slow.
    const loadUuids = (query: PromiseLike<{ uuid: string }[]>) =>
      query.then((rows) => rows.map((row) => row.uuid));

    const [
      addressUuids,
      contractUuids,
      existingContactUuids,
      textUuids,
      projectUuids,
      counterOrderUuids,
      productUuids,
      visitReportUuids,
      purchaseOrderUuids,
      quoteUuids,
      followUpUuids,
      transporterCostUuids,
      transporterCountryUuids,
      returnOrderUuids,
      processingUuids,
      customerStockUuids,
    ] = await Promise.all([
      loadUuids(
        db
          .select({ uuid: CompanyAddresses.uuid })
          .from(CompanyAddresses)
          .where(eq(CompanyAddresses.companyUuid, companyUuid))
          .orderBy(asc(CompanyAddresses.id)),
      ),
      loadUuids(
        db
          .select({ uuid: Contracts.uuid })
          .from(Contracts)
          .where(eq(Contracts.companyUuid, companyUuid))
          .orderBy(asc(Contracts.id)),
      ),
      loadUuids(
        db
          .select({ uuid: Contacts.uuid })
          .from(Contacts)
          .where(eq(Contacts.companyUuid, companyUuid))
          .orderBy(asc(Contacts.id)),
      ),
      loadUuids(
        db
          .select({ uuid: Texts.uuid })
          .from(Texts)
          .where(eq(Texts.companyUuid, companyUuid))
          .orderBy(asc(Texts.id)),
      ),
      loadUuids(
        db
          .select({ uuid: CustomerProjects.uuid })
          .from(CustomerProjects)
          .where(eq(CustomerProjects.companyUuid, companyUuid))
          .orderBy(asc(CustomerProjects.id)),
      ),
      loadUuids(
        db
          .select({ uuid: CounterOrders.uuid })
          .from(CounterOrders)
          .where(eq(CounterOrders.companyUuid, companyUuid))
          .orderBy(asc(CounterOrders.id)),
      ),
      loadUuids(
        db
          .select({ uuid: Products.uuid })
          .from(Products)
          .where(eq(Products.companyUuid, companyUuid))
          .orderBy(asc(Products.id)),
      ),
      loadUuids(
        db
          .select({ uuid: VisitReports.uuid })
          .from(VisitReports)
          .where(eq(VisitReports.companyUuid, companyUuid))
          .orderBy(asc(VisitReports.id)),
      ),
      loadUuids(
        db
          .select({ uuid: PurchaseOrders.uuid })
          .from(PurchaseOrders)
          .where(eq(PurchaseOrders.supplierUuid, companyUuid))
          .orderBy(asc(PurchaseOrders.id)),
      ),
      loadUuids(
        db
          .select({ uuid: Quotes.uuid })
          .from(Quotes)
          .where(eq(Quotes.companyUuid, companyUuid))
          .orderBy(asc(Quotes.id)),
      ),
      loadUuids(
        db
          .select({ uuid: FollowUps.uuid })
          .from(FollowUps)
          .where(eq(FollowUps.companyUuid, companyUuid))
          .orderBy(asc(FollowUps.id)),
      ),
      loadUuids(
        db
          .select({ uuid: TransporterCosts.uuid })
          .from(TransporterCosts)
          .where(eq(TransporterCosts.companyUuid, companyUuid))
          .orderBy(asc(TransporterCosts.id)),
      ),
      loadUuids(
        db
          .select({ uuid: TransporterCountries.uuid })
          .from(TransporterCountries)
          .where(eq(TransporterCountries.companyUuid, companyUuid))
          .orderBy(asc(TransporterCountries.id)),
      ),
      loadUuids(
        db
          .select({ uuid: ReturnOrders.uuid })
          .from(ReturnOrders)
          .where(eq(ReturnOrders.companyUuid, companyUuid))
          .orderBy(asc(ReturnOrders.id)),
      ),
      loadUuids(
        db
          .select({ uuid: Processings.uuid })
          .from(Processings)
          .where(eq(Processings.companyUuid, companyUuid))
          .orderBy(asc(Processings.id)),
      ),
      loadUuids(
        db
          .select({ uuid: CustomerStock.uuid })
          .from(CustomerStock)
          .where(eq(CustomerStock.companyUuid, companyUuid))
          .orderBy(asc(CustomerStock.id)),
      ),
    ]);

    await db.transaction(async (tx) => {
      await tx
        .update(Companies)
        .set({
          ...companyFields,
          blockedByUserId: isBlocked ? userId : null,
        })
        .where(eq(Companies.uuid, companyUuid));

      await syncCompanyChildren(
        addressUuids,
        addresses,
        async (uuid, values) => {
          await tx
            .update(CompanyAddresses)
            .set(values)
            .where(eq(CompanyAddresses.uuid, uuid));
        },
        async (uuid, values) => {
          await tx
            .insert(CompanyAddresses)
            .values({ ...values, uuid, companyUuid });
        },
        async (uuid) => {
          await tx
            .delete(CompanyAddresses)
            .where(eq(CompanyAddresses.uuid, uuid));
        },
      );

      // Communication settings have no uuid column of their own and nothing
      // references them, so replacing them wholesale is safe.
      await tx
        .delete(CommunicationSettings)
        .where(eq(CommunicationSettings.companyUuid, companyUuid));
      for (const setting of communicationSettings) {
        await tx.insert(CommunicationSettings).values({
          ...setting,
          companyUuid,
          modifiedByUserId: userId,
        });
      }

      await syncCompanyChildren(
        contractUuids,
        contracts,
        async (uuid, values) => {
          await tx
            .update(Contracts)
            .set(values)
            .where(eq(Contracts.uuid, uuid));
        },
        async (uuid, values) => {
          await tx.insert(Contracts).values({ ...values, uuid, companyUuid });
        },
        async (uuid) => {
          await tx.delete(Contracts).where(eq(Contracts.uuid, uuid));
        },
      );

      const contactUuids = await syncCompanyChildren(
        existingContactUuids,
        contacts,
        async (uuid, values) => {
          await tx.update(Contacts).set(values).where(eq(Contacts.uuid, uuid));
        },
        async (uuid, values) => {
          await tx.insert(Contacts).values({ ...values, uuid, companyUuid });
        },
        async (uuid) => {
          await tx.delete(Contacts).where(eq(Contacts.uuid, uuid));
        },
      );

      await syncCompanyChildren(
        textUuids,
        texts,
        async (uuid, values) => {
          await tx.update(Texts).set(values).where(eq(Texts.uuid, uuid));
        },
        async (uuid, values) => {
          await tx.insert(Texts).values({
            ...values,
            uuid,
            companyUuid,
            createdByUserId: userId,
          });
        },
        async (uuid) => {
          await tx.delete(Texts).where(eq(Texts.uuid, uuid));
        },
      );

      await syncCompanyChildren(
        projectUuids,
        projects,
        async (uuid, values) => {
          await tx
            .update(CustomerProjects)
            .set(values)
            .where(eq(CustomerProjects.uuid, uuid));
        },
        async (uuid, values) => {
          await tx
            .insert(CustomerProjects)
            .values({ ...values, uuid, companyUuid });
        },
        async (uuid) => {
          await tx
            .delete(CustomerProjects)
            .where(eq(CustomerProjects.uuid, uuid));
        },
      );

      await syncCompanyChildren(
        counterOrderUuids,
        counterOrders,
        async (uuid, values) => {
          await tx
            .update(CounterOrders)
            .set(values)
            .where(eq(CounterOrders.uuid, uuid));
        },
        async (uuid, values) => {
          await tx
            .insert(CounterOrders)
            .values({ ...values, uuid, companyUuid });
        },
        async (uuid) => {
          await tx.delete(CounterOrders).where(eq(CounterOrders.uuid, uuid));
        },
      );

      await syncCompanyChildren(
        productUuids,
        products,
        async (uuid, values) => {
          await tx.update(Products).set(values).where(eq(Products.uuid, uuid));
        },
        async (uuid, values) => {
          await tx.insert(Products).values({ ...values, uuid, companyUuid });
        },
        async (uuid) => {
          await tx.delete(Products).where(eq(Products.uuid, uuid));
        },
      );

      await syncCompanyChildren(
        visitReportUuids,
        visitReports,
        async (uuid, { contactIndex, ...rest }) => {
          await tx
            .update(VisitReports)
            .set({
              ...rest,
              contactUuid:
                contactIndex != null ? contactUuids[contactIndex] : null,
            })
            .where(eq(VisitReports.uuid, uuid));
        },
        async (uuid, { contactIndex, ...rest }) => {
          await tx.insert(VisitReports).values({
            ...rest,
            uuid,
            companyUuid,
            contactUuid:
              contactIndex != null ? contactUuids[contactIndex] : undefined,
          });
        },
        async (uuid) => {
          await tx.delete(VisitReports).where(eq(VisitReports.uuid, uuid));
        },
      );

      await syncCompanyChildren(
        purchaseOrderUuids,
        purchaseOrders,
        async (uuid, values) => {
          await tx
            .update(PurchaseOrders)
            .set(values)
            .where(eq(PurchaseOrders.uuid, uuid));
        },
        async (uuid, values) => {
          await tx
            .insert(PurchaseOrders)
            .values({ ...values, uuid, supplierUuid: companyUuid });
        },
        async (uuid) => {
          await tx.delete(PurchaseOrders).where(eq(PurchaseOrders.uuid, uuid));
        },
      );

      await syncCompanyChildren(
        quoteUuids,
        quotes,
        async (uuid, values) => {
          await tx.update(Quotes).set(values).where(eq(Quotes.uuid, uuid));
        },
        async (uuid, values) => {
          await tx.insert(Quotes).values({ ...values, uuid, companyUuid });
        },
        async (uuid) => {
          await tx.delete(Quotes).where(eq(Quotes.uuid, uuid));
        },
      );

      await syncCompanyChildren(
        followUpUuids,
        followUps,
        async (uuid, values) => {
          await tx
            .update(FollowUps)
            .set(values)
            .where(eq(FollowUps.uuid, uuid));
        },
        async (uuid, values) => {
          await tx.insert(FollowUps).values({ ...values, uuid, companyUuid });
        },
        async (uuid) => {
          await tx.delete(FollowUps).where(eq(FollowUps.uuid, uuid));
        },
      );

      await syncCompanyChildren(
        transporterCostUuids,
        transporterCosts,
        async (uuid, values) => {
          await tx
            .update(TransporterCosts)
            .set(values)
            .where(eq(TransporterCosts.uuid, uuid));
        },
        async (uuid, values) => {
          await tx
            .insert(TransporterCosts)
            .values({ ...values, uuid, companyUuid });
        },
        async (uuid) => {
          await tx
            .delete(TransporterCosts)
            .where(eq(TransporterCosts.uuid, uuid));
        },
      );

      await syncCompanyChildren(
        transporterCountryUuids,
        transporterCountries,
        async (uuid, values) => {
          await tx
            .update(TransporterCountries)
            .set(values)
            .where(eq(TransporterCountries.uuid, uuid));
        },
        async (uuid, values) => {
          await tx
            .insert(TransporterCountries)
            .values({ ...values, uuid, companyUuid });
        },
        async (uuid) => {
          await tx
            .delete(TransporterCountries)
            .where(eq(TransporterCountries.uuid, uuid));
        },
      );

      await syncCompanyChildren(
        returnOrderUuids,
        returnOrders,
        async (uuid, values) => {
          await tx
            .update(ReturnOrders)
            .set(values)
            .where(eq(ReturnOrders.uuid, uuid));
        },
        async (uuid, values) => {
          await tx
            .insert(ReturnOrders)
            .values({ ...values, uuid, companyUuid });
        },
        async (uuid) => {
          await tx.delete(ReturnOrders).where(eq(ReturnOrders.uuid, uuid));
        },
      );

      await syncCompanyChildren(
        processingUuids,
        processings,
        async (uuid, values) => {
          await tx
            .update(Processings)
            .set(values)
            .where(eq(Processings.uuid, uuid));
        },
        async (uuid, values) => {
          await tx.insert(Processings).values({ ...values, uuid, companyUuid });
        },
        async (uuid) => {
          await tx.delete(Processings).where(eq(Processings.uuid, uuid));
        },
      );

      await syncCompanyChildren(
        customerStockUuids,
        customerStock,
        async (uuid, values) => {
          await tx
            .update(CustomerStock)
            .set(values)
            .where(eq(CustomerStock.uuid, uuid));
        },
        async (uuid, values) => {
          await tx
            .insert(CustomerStock)
            .values({ ...values, uuid, companyUuid });
        },
        async (uuid) => {
          await tx.delete(CustomerStock).where(eq(CustomerStock.uuid, uuid));
        },
      );
    });

    return { success: true, companyUuid };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update company",
    };
  }
};
