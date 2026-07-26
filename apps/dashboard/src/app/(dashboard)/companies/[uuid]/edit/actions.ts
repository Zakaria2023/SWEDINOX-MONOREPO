"use server";

import { db, SelectCompanies } from "@/db";
import { CommunicationSettings } from "@/db/schema/communication-settings";
import { Companies } from "@/db/schema/companies";
import { CompanyAddresses } from "@/db/schema/company-addresses";
import { Contacts } from "@/db/schema/contacts";
import { Contracts } from "@/db/schema/contracts";
import { CounterOrders } from "@/db/schema/counter-orders";
import { CustomerProjects } from "@/db/schema/customer-projects";
import { CustomerStock } from "@/db/schema/customer-stock";
import { FollowUps } from "@/db/schema/follow-ups";
import { Processings } from "@/db/schema/processings";
import { Products } from "@/db/schema/products";
import { PurchaseOrders } from "@/db/schema/purchase-orders";
import { Quotes } from "@/db/schema/quotes";
import { ReturnOrders } from "@/db/schema/return-orders";
import { Texts } from "@/db/schema/texts";
import { TransporterCosts } from "@/db/schema/transporter-costs";
import { TransporterCountries } from "@/db/schema/transporter-countries";
import { VisitReports } from "@/db/schema/visit-reports";
import { eq, sql } from "drizzle-orm";

export type CompanyChildCounts = {
  addresses: number;
  communicationSettings: number;
  contracts: number;
  contacts: number;
  texts: number;
  projects: number;
  counterOrders: number;
  products: number;
  visitReports: number;
  purchaseOrders: number;
  quotes: number;
  followUps: number;
  transporterCosts: number;
  transporterCountries: number;
  returnOrders: number;
  processings: number;
  customerStock: number;
};

export type CompanyEditOverview = {
  company: SelectCompanies;
  counts: CompanyChildCounts;
};

const firstCount = (rows: Array<{ value: number }>): number =>
  Number(rows[0]?.value ?? 0);

// The edit hub only needs the company row itself plus how many rows each child
// collection holds — the section pages load their own full data when opened.
export const getCompanyEditOverview = async (
  companyUuid: string,
): Promise<CompanyEditOverview | null> => {
  const [company] = await db
    .select()
    .from(Companies)
    .where(eq(Companies.uuid, companyUuid))
    .limit(1);

  if (!company) {
    return null;
  }

  const countValue = { value: sql<number>`COUNT(*)` };

  const [
    addresses,
    communicationSettings,
    contracts,
    contacts,
    texts,
    projects,
    counterOrders,
    products,
    visitReports,
    purchaseOrders,
    quotes,
    followUps,
    transporterCosts,
    transporterCountries,
    returnOrders,
    processings,
    customerStock,
  ] = await Promise.all([
    db
      .select(countValue)
      .from(CompanyAddresses)
      .where(eq(CompanyAddresses.companyUuid, companyUuid)),
    db
      .select(countValue)
      .from(CommunicationSettings)
      .where(eq(CommunicationSettings.companyUuid, companyUuid)),
    db
      .select(countValue)
      .from(Contracts)
      .where(eq(Contracts.companyUuid, companyUuid)),
    db
      .select(countValue)
      .from(Contacts)
      .where(eq(Contacts.companyUuid, companyUuid)),
    db.select(countValue).from(Texts).where(eq(Texts.companyUuid, companyUuid)),
    db
      .select(countValue)
      .from(CustomerProjects)
      .where(eq(CustomerProjects.companyUuid, companyUuid)),
    db
      .select(countValue)
      .from(CounterOrders)
      .where(eq(CounterOrders.companyUuid, companyUuid)),
    db
      .select(countValue)
      .from(Products)
      .where(eq(Products.companyUuid, companyUuid)),
    db
      .select(countValue)
      .from(VisitReports)
      .where(eq(VisitReports.companyUuid, companyUuid)),
    db
      .select(countValue)
      .from(PurchaseOrders)
      .where(eq(PurchaseOrders.supplierUuid, companyUuid)),
    db
      .select(countValue)
      .from(Quotes)
      .where(eq(Quotes.companyUuid, companyUuid)),
    db
      .select(countValue)
      .from(FollowUps)
      .where(eq(FollowUps.companyUuid, companyUuid)),
    db
      .select(countValue)
      .from(TransporterCosts)
      .where(eq(TransporterCosts.companyUuid, companyUuid)),
    db
      .select(countValue)
      .from(TransporterCountries)
      .where(eq(TransporterCountries.companyUuid, companyUuid)),
    db
      .select(countValue)
      .from(ReturnOrders)
      .where(eq(ReturnOrders.companyUuid, companyUuid)),
    db
      .select(countValue)
      .from(Processings)
      .where(eq(Processings.companyUuid, companyUuid)),
    db
      .select(countValue)
      .from(CustomerStock)
      .where(eq(CustomerStock.companyUuid, companyUuid)),
  ]);

  return {
    company,
    counts: {
      addresses: firstCount(addresses),
      communicationSettings: firstCount(communicationSettings),
      contracts: firstCount(contracts),
      contacts: firstCount(contacts),
      texts: firstCount(texts),
      projects: firstCount(projects),
      counterOrders: firstCount(counterOrders),
      products: firstCount(products),
      visitReports: firstCount(visitReports),
      purchaseOrders: firstCount(purchaseOrders),
      quotes: firstCount(quotes),
      followUps: firstCount(followUps),
      transporterCosts: firstCount(transporterCosts),
      transporterCountries: firstCount(transporterCountries),
      returnOrders: firstCount(returnOrders),
      processings: firstCount(processings),
      customerStock: firstCount(customerStock),
    },
  };
};
