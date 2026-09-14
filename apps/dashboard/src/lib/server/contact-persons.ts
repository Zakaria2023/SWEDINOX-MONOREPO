import "server-only";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { companyAddressFor } from "@/lib/server/company-addresses";
import { companyRevenueByYear } from "@/lib/server/customer-revenue";
import { eq, getTableColumns, SQL } from "drizzle-orm";

/**
 * A contact person as the reference's contact screens print it: the contact's
 * own columns, and the company's beside them. The company half is read from the
 * company — its roles, visiting address, representatives, customer group,
 * industry, classification, credit limit, competitors, region, target and
 * search codes — and its revenue from the invoices. Nothing company-level is
 * stored on the contact any more.
 */
export type ContactPersonRow = SelectContacts & {
  companyName: SelectCompanies["companyName"] | null;
  companyId: SelectCompanies["id"] | null;
  companyRoles: SelectCompanies["roles"] | null;
  isCustomer: boolean;
  isProspect: boolean;
  isSupplier: boolean;
  isProcessor: boolean;
  isTransporter: boolean;
  isAgent: boolean;
  isOther: boolean;
  visitStreetAndNo: SelectCompanyAddresses["streetAndNo"] | null;
  visitPostalCode: SelectCompanyAddresses["postalCode"] | null;
  visitCity: SelectCompanyAddresses["city"] | null;
  visitCountry: SelectCompanyAddresses["country"] | null;
  visitTelephone: SelectCompanyAddresses["telephone"] | null;
  visitFax: SelectCompanyAddresses["fax"] | null;
  /** Invoiced revenue excl. VAT, from the company's invoices. */
  revenueLastYear: number;
  revenueThisYear: number;
  accountManager: SelectCompanies["accountManager"] | null;
  representative: SelectCompanies["representative"] | null;
  customerGroup: SelectCompanies["customerGroup"] | null;
  industry: SelectCompanies["industry"] | null;
  classification: SelectCompanies["classification"] | null;
  creditLimit: SelectCompanies["creditLimit"] | null;
  competitors: SelectCompanies["competitors"] | null;
  customerRegion: SelectCompanies["region"] | null;
  targetAnnualSales: SelectCompanies["targetAnnualSales"] | null;
  searchCode1: SelectCompanies["searchCode1"] | null;
  searchCode2: SelectCompanies["searchCode2"] | null;
  searchCode3: SelectCompanies["searchCode3"] | null;
};

export const getContactPersonRows = async (
  where: SQL | undefined,
): Promise<ContactPersonRow[]> => {
  const visiting = companyAddressFor("visit", "visiting_address");
  const revenue = companyRevenueByYear("company_revenue");

  const rows = await db
    .select({
      ...getTableColumns(Contacts),
      companyName: Companies.companyName,
      companyId: Companies.id,
      companyRoles: Companies.roles,
      visitStreetAndNo: visiting.streetAndNo,
      visitPostalCode: visiting.postalCode,
      visitCity: visiting.city,
      visitCountry: visiting.country,
      visitTelephone: visiting.telephone,
      visitFax: visiting.fax,
      revenueLastYear: revenue.revenueLastYear,
      revenueThisYear: revenue.revenueThisYear,
      accountManager: Companies.accountManager,
      representative: Companies.representative,
      customerGroup: Companies.customerGroup,
      industry: Companies.industry,
      classification: Companies.classification,
      creditLimit: Companies.creditLimit,
      competitors: Companies.competitors,
      customerRegion: Companies.region,
      targetAnnualSales: Companies.targetAnnualSales,
      searchCode1: Companies.searchCode1,
      searchCode2: Companies.searchCode2,
      searchCode3: Companies.searchCode3,
    })
    .from(Contacts)
    .leftJoin(Companies, eq(Companies.uuid, Contacts.companyUuid))
    .leftJoin(visiting, eq(visiting.companyUuid, Contacts.companyUuid))
    .leftJoin(revenue, eq(revenue.companyUuid, Contacts.companyUuid))
    .where(where);

  return rows.map((row) => {
    const roles = row.companyRoles ?? [];
    return {
      ...row,
      isCustomer: roles.includes("customer"),
      isProspect: roles.includes("prospect"),
      isSupplier: roles.includes("supplier"),
      isProcessor: roles.includes("processor"),
      isTransporter: roles.includes("transporter"),
      isAgent: roles.includes("agent"),
      isOther: roles.includes("other"),
      visitStreetAndNo: row.visitStreetAndNo ?? null,
      visitPostalCode: row.visitPostalCode ?? null,
      visitCity: row.visitCity ?? null,
      visitCountry: row.visitCountry ?? null,
      visitTelephone: row.visitTelephone ?? null,
      visitFax: row.visitFax ?? null,
      revenueLastYear: Number(row.revenueLastYear ?? 0),
      revenueThisYear: Number(row.revenueThisYear ?? 0),
    };
  });
};
