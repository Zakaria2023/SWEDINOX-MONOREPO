"use server";

import { CompanyAddresses } from "@/db/schema/company-addresses";
import { Companies } from "@/db/schema/companies";
import { Contacts } from "@/db/schema/contacts";
import { db, SelectCompanies, SelectCompanyAddresses, SelectContacts } from "@/db";
import { companyAddressFor } from "@/lib/server/company-addresses";
import { companyRevenueByYear } from "@/lib/server/customer-revenue";
import { eq, min, or, asc, sql } from "drizzle-orm";

export type CustomerProspectRow = Pick<
  SelectCompanies,
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
  | "competitors"
  | "createdAt"
> &
  {
    companyUuid: SelectCompanies["uuid"];
    /** Invoiced revenue excl. VAT, from the company's invoices. */
    revenueLastYear: number;
    revenueThisYear: number;
    companyCode: SelectCompanies["id"];
    contactFirstName: SelectContacts["firstName"] | null;
    contactLastName: SelectContacts["lastName"] | null;
    contactEmail: SelectContacts["email"] | null;
    contactMobile: SelectContacts["mobile"] | null;
    contactCreatedAt: SelectContacts["createdAt"] | null;
    visitStreetAndNo: SelectCompanyAddresses["streetAndNo"] | null;
    visitPostalCode: SelectCompanyAddresses["postalCode"] | null;
    visitCity: SelectCompanyAddresses["city"] | null;
    visitCountry: SelectCompanyAddresses["country"] | null;
    visitTelephone: SelectCompanyAddresses["telephone"] | null;
    visitFax: SelectCompanyAddresses["fax"] | null;
    correspondenceStreetAndNo: SelectCompanyAddresses["streetAndNo"] | null;
    correspondencePostalCode: SelectCompanyAddresses["postalCode"] | null;
    correspondenceCity: SelectCompanyAddresses["city"] | null;
    correspondenceCountry: SelectCompanyAddresses["country"] | null;
    correspondenceTelephone: SelectCompanyAddresses["telephone"] | null;
    correspondenceFax: SelectCompanyAddresses["fax"] | null;
    deliveryStreetAndNo: SelectCompanyAddresses["streetAndNo"] | null;
    deliveryPostalCode: SelectCompanyAddresses["postalCode"] | null;
    deliveryCity: SelectCompanyAddresses["city"] | null;
    deliveryCountry: SelectCompanyAddresses["country"] | null;
    isCustomer: boolean;
    isProspect: boolean;
    isSupplier: boolean;
    isProcessor: boolean;
    isTransporter: boolean;
    isAgent: boolean;
    isOther: boolean;
    completeDelivery: boolean;
    targetVisitsPerYear: number;
  };

// The reference's Customers and Prospects is contact × company × address: the
// contact columns are the contact's own, and everything else is the company's
// (17 columns identical across every contact of a company, 2 188 of 2 188).
// So the visiting and correspondence addresses and the competitors come from
// the company, not from a copy on its first contact.
export const getCustomersAndProspects = async (): Promise<
  CustomerProspectRow[]
> => {
  // Contact with the lowest id per company (id is a global PK, so matching
  // on it alone is enough to pick the right row).
  const primaryContactId = db
    .select({
      companyUuid: Contacts.companyUuid,
      minId: min(Contacts.id).as("min_id"),
    })
    .from(Contacts)
    .groupBy(Contacts.companyUuid)
    .as("primary_contact_id");

  const primaryContact = db
    .select({
      companyUuid: Contacts.companyUuid,
      firstName: Contacts.firstName,
      lastName: Contacts.lastName,
      email: Contacts.email,
      mobile: Contacts.mobile,
      createdAt: Contacts.createdAt,
    })
    .from(Contacts)
    .innerJoin(primaryContactId, eq(Contacts.id, primaryContactId.minId))
    .as("primary_contact");

  const revenue = companyRevenueByYear("company_revenue");
  const visiting = companyAddressFor("visit", "visiting_address");
  const correspondence = companyAddressFor(
    "correspondence",
    "correspondence_address",
  );

  // Delivery address with the lowest id per company, restricted to
  // addresses categorized as "delivery".
  const deliveryAddressId = db
    .select({
      companyUuid: CompanyAddresses.companyUuid,
      minId: min(CompanyAddresses.id).as("min_id"),
    })
    .from(CompanyAddresses)
    .where(sql`JSON_CONTAINS(${CompanyAddresses.category}, '"delivery"')`)
    .groupBy(CompanyAddresses.companyUuid)
    .as("delivery_address_id");

  const deliveryAddress = db
    .select({
      companyUuid: CompanyAddresses.companyUuid,
      streetAndNo: CompanyAddresses.streetAndNo,
      postalCode: CompanyAddresses.postalCode,
      city: CompanyAddresses.city,
      country: CompanyAddresses.country,
    })
    .from(CompanyAddresses)
    .innerJoin(
      deliveryAddressId,
      eq(CompanyAddresses.id, deliveryAddressId.minId),
    )
    .as("delivery_address");

  const rows = await db
    .select({
      companyUuid: Companies.uuid,
      companyCode: Companies.id,
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
      competitors: Companies.competitors,
      createdAt: Companies.createdAt,
      roles: Companies.roles,
      quoteOrderSettings: Companies.quoteOrderSettings,
      contactFirstName: primaryContact.firstName,
      contactLastName: primaryContact.lastName,
      contactEmail: primaryContact.email,
      contactMobile: primaryContact.mobile,
      contactCreatedAt: primaryContact.createdAt,
      revenueLastYear: revenue.revenueLastYear,
      revenueThisYear: revenue.revenueThisYear,
      visitStreetAndNo: visiting.streetAndNo,
      visitPostalCode: visiting.postalCode,
      visitCity: visiting.city,
      visitCountry: visiting.country,
      visitTelephone: visiting.telephone,
      visitFax: visiting.fax,
      correspondenceStreetAndNo: correspondence.streetAndNo,
      correspondencePostalCode: correspondence.postalCode,
      correspondenceCity: correspondence.city,
      correspondenceCountry: correspondence.country,
      correspondenceTelephone: correspondence.telephone,
      correspondenceFax: correspondence.fax,
      deliveryStreetAndNo: deliveryAddress.streetAndNo,
      deliveryPostalCode: deliveryAddress.postalCode,
      deliveryCity: deliveryAddress.city,
      deliveryCountry: deliveryAddress.country,
    })
    .from(Companies)
    .leftJoin(primaryContact, eq(Companies.uuid, primaryContact.companyUuid))
    .leftJoin(revenue, eq(Companies.uuid, revenue.companyUuid))
    .leftJoin(visiting, eq(Companies.uuid, visiting.companyUuid))
    .leftJoin(correspondence, eq(Companies.uuid, correspondence.companyUuid))
    .leftJoin(deliveryAddress, eq(Companies.uuid, deliveryAddress.companyUuid))
    .where(
      or(
        sql`JSON_CONTAINS(${Companies.roles}, '"customer"')`,
        sql`JSON_CONTAINS(${Companies.roles}, '"prospect"')`,
      ),
    )
    .orderBy(asc(Companies.companyName));

  return rows.map(
    (row): CustomerProspectRow => ({
      companyUuid: row.companyUuid,
      companyCode: row.companyCode,
      companyName: row.companyName,
      searchCode1: row.searchCode1,
      searchCode2: row.searchCode2,
      searchCode3: row.searchCode3,
      representative: row.representative,
      accountManager: row.accountManager,
      region: row.region,
      customerGroup: row.customerGroup,
      creditLimit: row.creditLimit,
      cocNumber: row.cocNumber,
      competitors: row.competitors,
      createdAt: row.createdAt,

      contactFirstName: row.contactFirstName ?? null,
      contactLastName: row.contactLastName ?? null,
      contactEmail: row.contactEmail ?? null,
      contactMobile: row.contactMobile ?? null,
      contactCreatedAt: row.contactCreatedAt ?? null,
      revenueLastYear: Number(row.revenueLastYear ?? 0),
      revenueThisYear: Number(row.revenueThisYear ?? 0),
      visitStreetAndNo: row.visitStreetAndNo ?? null,
      visitPostalCode: row.visitPostalCode ?? null,
      visitCity: row.visitCity ?? null,
      visitCountry: row.visitCountry ?? null,
      visitTelephone: row.visitTelephone ?? null,
      visitFax: row.visitFax ?? null,
      correspondenceStreetAndNo: row.correspondenceStreetAndNo ?? null,
      correspondencePostalCode: row.correspondencePostalCode ?? null,
      correspondenceCity: row.correspondenceCity ?? null,
      correspondenceCountry: row.correspondenceCountry ?? null,
      correspondenceTelephone: row.correspondenceTelephone ?? null,
      correspondenceFax: row.correspondenceFax ?? null,

      deliveryStreetAndNo: row.deliveryStreetAndNo ?? null,
      deliveryPostalCode: row.deliveryPostalCode ?? null,
      deliveryCity: row.deliveryCity ?? null,
      deliveryCountry: row.deliveryCountry ?? null,

      isCustomer: (row.roles ?? []).includes("customer"),
      isProspect: (row.roles ?? []).includes("prospect"),
      isSupplier: (row.roles ?? []).includes("supplier"),
      isProcessor: (row.roles ?? []).includes("processor"),
      isTransporter: (row.roles ?? []).includes("transporter"),
      isAgent: (row.roles ?? []).includes("agent"),
      isOther: (row.roles ?? []).includes("other"),
      completeDelivery: (row.quoteOrderSettings ?? []).includes(
        "complete_delivery",
      ),
      targetVisitsPerYear: 0,
    }),
  );
};
