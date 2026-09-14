"use server";

import { describeError } from "@/lib/helpers";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { db } from "@/db";
import { companyAddressFor } from "@/lib/server/company-addresses";
import { asc, eq, min, sql } from "drizzle-orm";

export type SupplierRow = Pick<
  SelectCompanies,
  | "companyName"
  | "searchCode1"
  | "searchCode2"
  | "searchCode3"
  | "representative"
  | "paymentTerms"
  | "region"
  | "createdAt"
> & {
  companyUuid: SelectCompanies["uuid"];
  companyCode: SelectCompanies["id"];
  visitCity: SelectCompanyAddresses["city"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
  contactEmail: SelectContacts["email"] | null;
  contactMobile: SelectContacts["mobile"] | null;
  correspondenceStreetAndNo: SelectCompanyAddresses["streetAndNo"] | null;
  correspondencePostalCode: SelectCompanyAddresses["postalCode"] | null;
  correspondenceCity: SelectCompanyAddresses["city"] | null;
  correspondenceCountry: SelectCompanyAddresses["country"] | null;
  correspondenceTelephone: SelectCompanyAddresses["telephone"] | null;
  correspondenceFax: SelectCompanyAddresses["fax"] | null;
  isSupplier: boolean;
  isProcessor: boolean;
  isTransporter: boolean;
  isAgent: boolean;
  isOther: boolean;
  isCustomer: boolean;
  isProspect: boolean;
};

// Every company holding the "supplier" role, with its primary contact's
// correspondence details — the supplier equivalent of the customer list.
export const getSuppliers = async (): Promise<SupplierRow[]> => {
  try {
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
      })
      .from(Contacts)
      .innerJoin(primaryContactId, eq(Contacts.id, primaryContactId.minId))
      .as("primary_contact");

    // The addresses are the company's, not a copy on its first contact.
    const visiting = companyAddressFor("visit", "visiting_address");
    const correspondence = companyAddressFor(
      "correspondence",
      "correspondence_address",
    );

    const rows = await db
      .select({
        companyUuid: Companies.uuid,
        companyCode: Companies.id,
        companyName: Companies.companyName,
        searchCode1: Companies.searchCode1,
        searchCode2: Companies.searchCode2,
        searchCode3: Companies.searchCode3,
        representative: Companies.representative,
        paymentTerms: Companies.paymentTerms,
        region: Companies.region,
        createdAt: Companies.createdAt,
        roles: Companies.roles,
        visitCity: visiting.city,
        contactFirstName: primaryContact.firstName,
        contactLastName: primaryContact.lastName,
        contactEmail: primaryContact.email,
        contactMobile: primaryContact.mobile,
        correspondenceStreetAndNo: correspondence.streetAndNo,
        correspondencePostalCode: correspondence.postalCode,
        correspondenceCity: correspondence.city,
        correspondenceCountry: correspondence.country,
        correspondenceTelephone: correspondence.telephone,
        correspondenceFax: correspondence.fax,
      })
      .from(Companies)
      .leftJoin(primaryContact, eq(Companies.uuid, primaryContact.companyUuid))
      .leftJoin(visiting, eq(Companies.uuid, visiting.companyUuid))
      .leftJoin(correspondence, eq(Companies.uuid, correspondence.companyUuid))
      .where(sql`JSON_CONTAINS(${Companies.roles}, '"supplier"')`)
      .orderBy(asc(Companies.companyName));

    return rows.map((row): SupplierRow => {
      const roles = row.roles ?? [];
      return {
        companyUuid: row.companyUuid,
        companyCode: row.companyCode,
        companyName: row.companyName,
        searchCode1: row.searchCode1,
        searchCode2: row.searchCode2,
        searchCode3: row.searchCode3,
        representative: row.representative,
        paymentTerms: row.paymentTerms,
        region: row.region,
        createdAt: row.createdAt,
        visitCity: row.visitCity ?? null,
        contactFirstName: row.contactFirstName ?? null,
        contactLastName: row.contactLastName ?? null,
        contactEmail: row.contactEmail ?? null,
        contactMobile: row.contactMobile ?? null,
        correspondenceStreetAndNo: row.correspondenceStreetAndNo ?? null,
        correspondencePostalCode: row.correspondencePostalCode ?? null,
        correspondenceCity: row.correspondenceCity ?? null,
        correspondenceCountry: row.correspondenceCountry ?? null,
        correspondenceTelephone: row.correspondenceTelephone ?? null,
        correspondenceFax: row.correspondenceFax ?? null,
        isSupplier: roles.includes("supplier"),
        isProcessor: roles.includes("processor"),
        isTransporter: roles.includes("transporter"),
        isAgent: roles.includes("agent"),
        isOther: roles.includes("other"),
        isCustomer: roles.includes("customer"),
        isProspect: roles.includes("prospect"),
      };
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch suppliers"));
  }
};
