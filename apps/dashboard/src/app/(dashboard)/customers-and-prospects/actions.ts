"use server";

import { CompanyAddresses } from "@/db/schema/company-addresses";
import { Companies } from "@/db/schema/companies";
import { Contacts } from "@/db/schema/contacts";
import { db, SelectCompanies, SelectContacts } from "@/db";
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
  | "createdAt"
> &
  Pick<
    SelectContacts,
    | "revenueLastYear"
    | "revenueThisYear"
    | "competitors"
    | "customerRegionCode"
    | "visitStreetAndNo"
    | "visitPostalCode"
    | "visitCity"
    | "visitCountry"
    | "visitTelephone"
    | "visitFax"
  > & {
    companyUuid: SelectCompanies["uuid"];
    companyCode: SelectCompanies["id"];
    contactFirstName: SelectContacts["firstName"] | null;
    contactLastName: SelectContacts["lastName"] | null;
    contactEmail: SelectContacts["email"] | null;
    contactMobile: SelectContacts["mobile"] | null;
    contactCreatedAt: SelectContacts["createdAt"] | null;
    correspondenceStreetAndNo: SelectContacts["streetAndNo"] | null;
    correspondencePostalCode: SelectContacts["postalCode"] | null;
    correspondenceCity: SelectContacts["city"] | null;
    correspondenceCountry: SelectContacts["addressCountry"] | null;
    correspondenceTelephone: SelectContacts["addressTelephone"] | null;
    correspondenceFax: SelectContacts["addressFax"] | null;
    deliveryStreetAndNo: string | null;
    deliveryPostalCode: string | null;
    deliveryCity: string | null;
    deliveryCountry: string | null;
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
      revenueLastYear: Contacts.revenueLastYear,
      revenueThisYear: Contacts.revenueThisYear,
      competitors: Contacts.competitors,
      customerRegionCode: Contacts.customerRegionCode,
      visitStreetAndNo: Contacts.visitStreetAndNo,
      visitPostalCode: Contacts.visitPostalCode,
      visitCity: Contacts.visitCity,
      visitCountry: Contacts.visitCountry,
      visitTelephone: Contacts.visitTelephone,
      visitFax: Contacts.visitFax,
      streetAndNo: Contacts.streetAndNo,
      postalCode: Contacts.postalCode,
      city: Contacts.city,
      addressCountry: Contacts.addressCountry,
      addressTelephone: Contacts.addressTelephone,
      addressFax: Contacts.addressFax,
    })
    .from(Contacts)
    .innerJoin(primaryContactId, eq(Contacts.id, primaryContactId.minId))
    .as("primary_contact");

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
      createdAt: Companies.createdAt,
      roles: Companies.roles,
      quoteOrderSettings: Companies.quoteOrderSettings,
      contactFirstName: primaryContact.firstName,
      contactLastName: primaryContact.lastName,
      contactEmail: primaryContact.email,
      contactMobile: primaryContact.mobile,
      contactCreatedAt: primaryContact.createdAt,
      revenueLastYear: primaryContact.revenueLastYear,
      revenueThisYear: primaryContact.revenueThisYear,
      competitors: primaryContact.competitors,
      customerRegionCode: primaryContact.customerRegionCode,
      visitStreetAndNo: primaryContact.visitStreetAndNo,
      visitPostalCode: primaryContact.visitPostalCode,
      visitCity: primaryContact.visitCity,
      visitCountry: primaryContact.visitCountry,
      visitTelephone: primaryContact.visitTelephone,
      visitFax: primaryContact.visitFax,
      correspondenceStreetAndNo: primaryContact.streetAndNo,
      correspondencePostalCode: primaryContact.postalCode,
      correspondenceCity: primaryContact.city,
      correspondenceCountry: primaryContact.addressCountry,
      correspondenceTelephone: primaryContact.addressTelephone,
      correspondenceFax: primaryContact.addressFax,
      deliveryStreetAndNo: deliveryAddress.streetAndNo,
      deliveryPostalCode: deliveryAddress.postalCode,
      deliveryCity: deliveryAddress.city,
      deliveryCountry: deliveryAddress.country,
    })
    .from(Companies)
    .leftJoin(primaryContact, eq(Companies.uuid, primaryContact.companyUuid))
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
      createdAt: row.createdAt,

      contactFirstName: row.contactFirstName ?? null,
      contactLastName: row.contactLastName ?? null,
      contactEmail: row.contactEmail ?? null,
      contactMobile: row.contactMobile ?? null,
      contactCreatedAt: row.contactCreatedAt ?? null,
      revenueLastYear: row.revenueLastYear ?? null,
      revenueThisYear: row.revenueThisYear ?? null,
      competitors: row.competitors ?? null,
      customerRegionCode: row.customerRegionCode ?? null,
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
