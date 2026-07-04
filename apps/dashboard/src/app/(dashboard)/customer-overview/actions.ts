"use server";

import {
  db,
  SelectCompanies,
  SelectCompanyAddresses,
  SelectContacts,
} from "@/db";
import { CompanyAddresses } from "@/db/schema/company-addresses";
import { Companies } from "@/db/schema/companies";
import { Complaints } from "@/db/schema/complaints";
import { Contacts } from "@/db/schema/contacts";
import { Invoices } from "@/db/schema/invoices";
import { Orders } from "@/db/schema/orders";
import { Quotes } from "@/db/schema/quotes";
import { ReturnOrders } from "@/db/schema/return-orders";
import { VisitReports } from "@/db/schema/visit-reports";
import { and, count, eq, max, min, sql, sum } from "drizzle-orm";

export type CustomerOverviewRow = Pick<
  SelectCompanies,
  | "searchCode1"
  | "searchCode2"
  | "searchCode3"
  | "companyName"
  | "representative"
  | "accountManager"
  | "region"
  | "customerGroup"
  | "vatNumber"
  | "actionEmailTo"
  | "releaseActionEmailTo"
> & {
  companyUuid: SelectCompanies["uuid"];
  customerCode: SelectCompanies["id"];
  streetAndNo: SelectCompanyAddresses["streetAndNo"] | null;
  city: SelectCompanyAddresses["city"] | null;
  postalCode: SelectCompanyAddresses["postalCode"] | null;
  addressEmail: SelectCompanyAddresses["email"] | null;
  initials: SelectContacts["initials"] | null;
  contactEmail: SelectContacts["email"] | null;
  regionCode: SelectContacts["customerRegionCode"] | null;
  quotes: number;
  orders: number;
  invoices: number;
  visits: number;
  returnOrders: number;
  complaints: number;
  lastOrderDate: string | null;
  invoicedOrdersRevenue: number;
  avgOrderSize: number;
};

export const getCustomerOverview = async (): Promise<CustomerOverviewRow[]> => {
  try {
    // Address with the lowest id per company (id is a global PK, so matching
    // on it alone is enough to pick the right row).
    const primaryAddressId = db
      .select({
        companyUuid: CompanyAddresses.companyUuid,
        minId: min(CompanyAddresses.id).as("min_id"),
      })
      .from(CompanyAddresses)
      .groupBy(CompanyAddresses.companyUuid)
      .as("primary_address_id");

    const primaryAddress = db
      .select({
        companyUuid: CompanyAddresses.companyUuid,
        streetAndNo: CompanyAddresses.streetAndNo,
        city: CompanyAddresses.city,
        postalCode: CompanyAddresses.postalCode,
        email: CompanyAddresses.email,
      })
      .from(CompanyAddresses)
      .innerJoin(
        primaryAddressId,
        eq(CompanyAddresses.id, primaryAddressId.minId),
      )
      .as("primary_address");

    // Contact with the lowest sequence number per company (sequence numbers
    // are only unique within a company, so the join needs both columns).
    const primaryContactSeq = db
      .select({
        companyUuid: Contacts.companyUuid,
        minSequenceNumber: min(Contacts.sequenceNumber).as(
          "min_sequence_number",
        ),
      })
      .from(Contacts)
      .groupBy(Contacts.companyUuid)
      .as("primary_contact_seq");

    const primaryContact = db
      .select({
        companyUuid: Contacts.companyUuid,
        initials: Contacts.initials,
        email: Contacts.email,
        customerRegionCode: Contacts.customerRegionCode,
      })
      .from(Contacts)
      .innerJoin(
        primaryContactSeq,
        and(
          eq(Contacts.companyUuid, primaryContactSeq.companyUuid),
          eq(Contacts.sequenceNumber, primaryContactSeq.minSequenceNumber),
        ),
      )
      .as("primary_contact");

    const quoteCounts = db
      .select({
        companyUuid: Quotes.companyUuid,
        value: count().as("value"),
      })
      .from(Quotes)
      .groupBy(Quotes.companyUuid)
      .as("quote_counts");

    const orderStats = db
      .select({
        companyUuid: Orders.companyUuid,
        value: count().as("value"),
        lastOrderDate: max(Orders.createdAt).as("last_order_date"),
      })
      .from(Orders)
      .groupBy(Orders.companyUuid)
      .as("order_stats");

    const invoiceStats = db
      .select({
        companyUuid: Invoices.companyUuid,
        value: count().as("value"),
        revenue: sum(Invoices.invoiceAmountInclVat).as("revenue"),
      })
      .from(Invoices)
      .groupBy(Invoices.companyUuid)
      .as("invoice_stats");

    const visitCounts = db
      .select({
        companyUuid: VisitReports.companyUuid,
        value: count().as("value"),
      })
      .from(VisitReports)
      .groupBy(VisitReports.companyUuid)
      .as("visit_counts");

    const returnOrderCounts = db
      .select({
        companyUuid: ReturnOrders.companyUuid,
        value: count().as("value"),
      })
      .from(ReturnOrders)
      .groupBy(ReturnOrders.companyUuid)
      .as("return_order_counts");

    const complaintCounts = db
      .select({
        companyUuid: Complaints.companyUuid,
        value: count().as("value"),
      })
      .from(Complaints)
      .groupBy(Complaints.companyUuid)
      .as("complaint_counts");

    const rows = await db
      .select({
        companyUuid: Companies.uuid,
        customerCode: Companies.id,
        companyName: Companies.companyName,
        searchCode1: Companies.searchCode1,
        searchCode2: Companies.searchCode2,
        searchCode3: Companies.searchCode3,
        representative: Companies.representative,
        accountManager: Companies.accountManager,
        region: Companies.region,
        customerGroup: Companies.customerGroup,
        vatNumber: Companies.vatNumber,
        actionEmailTo: Companies.actionEmailTo,
        releaseActionEmailTo: Companies.releaseActionEmailTo,
        streetAndNo: primaryAddress.streetAndNo,
        city: primaryAddress.city,
        postalCode: primaryAddress.postalCode,
        addressEmail: primaryAddress.email,
        initials: primaryContact.initials,
        contactEmail: primaryContact.email,
        regionCode: primaryContact.customerRegionCode,
        quotes: quoteCounts.value,
        orders: orderStats.value,
        lastOrderDate: orderStats.lastOrderDate,
        invoices: invoiceStats.value,
        invoicedOrdersRevenue: invoiceStats.revenue,
        visits: visitCounts.value,
        returnOrders: returnOrderCounts.value,
        complaints: complaintCounts.value,
      })
      .from(Companies)
      .leftJoin(primaryAddress, eq(Companies.uuid, primaryAddress.companyUuid))
      .leftJoin(primaryContact, eq(Companies.uuid, primaryContact.companyUuid))
      .leftJoin(quoteCounts, eq(Companies.uuid, quoteCounts.companyUuid))
      .leftJoin(orderStats, eq(Companies.uuid, orderStats.companyUuid))
      .leftJoin(invoiceStats, eq(Companies.uuid, invoiceStats.companyUuid))
      .leftJoin(visitCounts, eq(Companies.uuid, visitCounts.companyUuid))
      .leftJoin(
        returnOrderCounts,
        eq(Companies.uuid, returnOrderCounts.companyUuid),
      )
      .leftJoin(
        complaintCounts,
        eq(Companies.uuid, complaintCounts.companyUuid),
      )
      .where(sql`JSON_CONTAINS(${Companies.roles}, '"customer"')`)
      .orderBy(sql`${Companies.id} desc`);

    return rows.map((row): CustomerOverviewRow => {
      const invoiceCount = row.invoices ?? 0;
      const invoiceRevenue = row.invoicedOrdersRevenue
        ? parseFloat(row.invoicedOrdersRevenue)
        : 0;

      return {
        companyUuid: row.companyUuid,
        customerCode: row.customerCode,
        companyName: row.companyName,
        searchCode1: row.searchCode1,
        searchCode2: row.searchCode2,
        searchCode3: row.searchCode3,
        representative: row.representative,
        accountManager: row.accountManager,
        region: row.region,
        customerGroup: row.customerGroup,
        vatNumber: row.vatNumber,
        actionEmailTo: row.actionEmailTo,
        releaseActionEmailTo: row.releaseActionEmailTo,
        streetAndNo: row.streetAndNo ?? null,
        city: row.city ?? null,
        postalCode: row.postalCode ?? null,
        addressEmail: row.addressEmail ?? null,
        initials: row.initials ?? null,
        contactEmail: row.contactEmail ?? null,
        regionCode: row.regionCode ?? null,
        quotes: row.quotes ?? 0,
        orders: row.orders ?? 0,
        invoices: invoiceCount,
        visits: row.visits ?? 0,
        returnOrders: row.returnOrders ?? 0,
        complaints: row.complaints ?? 0,
        lastOrderDate: row.lastOrderDate?.toISOString().split("T")[0] ?? null,
        invoicedOrdersRevenue: invoiceRevenue,
        avgOrderSize:
          invoiceCount > 0
            ? Number((invoiceRevenue / invoiceCount).toFixed(2))
            : 0,
      };
    });
  } catch {
    throw new Error("Failed to fetch customer overview");
  }
};
