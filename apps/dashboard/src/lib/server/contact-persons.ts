import "server-only";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { companyAddressFor } from "@/lib/server/company-addresses";
import { companyRevenueByYear } from "@/lib/server/customer-revenue";
import {
  enumFilter,
  FilterBindings,
  jsonArrayFilter,
  SortableColumns,
  tableOrderBy,
  tableWhere,
  valueFilter,
} from "@/lib/server/table-query";
import { TableQuery } from "@/lib/table-query";
import {
  companyClassifications,
  contactCategories,
  customerGroups,
  salesRepresentatives,
} from "@/lib/enums";
import {
  and,
  asc,
  count,
  eq,
  getTableColumns,
  isNotNull,
  SQL,
} from "drizzle-orm";

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

/**
 * Every contact within `where`, unpaged. Still used by the contact screens that
 * have not been converted yet; prefer `contactPersonRows`.
 */
type ContactPersonPage = {
  limit: number;
  offset: number;
  orderBy: ReturnType<typeof tableOrderBy>;
};

const selectContactPersonRows = async (
  where: SQL | undefined,
  page?: ContactPersonPage,
): Promise<ContactPersonRow[]> => {
  const visiting = companyAddressFor("visit", "visiting_address");
  const revenue = companyRevenueByYear("company_revenue");

  const base = db
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
    .where(where)
    .$dynamic();

  // Ordered and limited only when a page was asked for. A LIMIT standing in for
  // "no limit" would still make the database sort and count its way there.
  const rows = await (page
    ? base
        .orderBy(...page.orderBy)
        .limit(page.limit)
        .offset(page.offset)
    : base);

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

// ---------------------------------------------------------------------------
// The paged form
//
// The contact screens carry one row per contact — 6 796 of them on the
// reference's customers-and-prospects list alone — and used to fetch every one,
// with the company's address and both revenue figures joined per row, before
// handing the lot to the browser. What a reader wants from a list that size is
// to find one person, so it is searched and filtered on the server and paged
// like every other overview.
//
// Search and filters live here rather than on either screen, because both
// screens show the same row and a contact should be findable the same way
// whichever of them you opened.
// ---------------------------------------------------------------------------

const CONTACT_PERSON_SEARCH = [
  Contacts.firstName,
  Contacts.lastName,
  Contacts.email,
  Companies.companyName,
  Companies.searchCode1,
] as const;

const CONTACT_PERSON_FILTERS: FilterBindings = {
  category: jsonArrayFilter(Contacts.categories, contactCategories),
  accountManager: enumFilter(Companies.accountManager, salesRepresentatives),
  representative: enumFilter(Companies.representative, salesRepresentatives),
  customerGroup: enumFilter(Companies.customerGroup, customerGroups),
  classification: enumFilter(Companies.classification, companyClassifications),
  region: valueFilter(Companies.region),
};

const CONTACT_PERSON_SORTABLE: SortableColumns = {
  company: Companies.companyName,
  companyCode: Companies.id,
  lastName: Contacts.lastName,
  firstName: Contacts.firstName,
};

/** Every contact within `where`, unpaged. */
export const getContactPersonRows = async (
  where: SQL | undefined,
): Promise<ContactPersonRow[]> => selectContactPersonRows(where);

/** One page of contacts within `scope`, narrowed by the reader's own query. */
export const contactPersonRows =
  (scope: SQL | undefined, query: TableQuery) =>
  async (limit: number, offset: number): Promise<ContactPersonRow[]> =>
    selectContactPersonRows(
      tableWhere({
        query,
        search: CONTACT_PERSON_SEARCH,
        filters: CONTACT_PERSON_FILTERS,
        scope: [scope],
      }),
      {
        limit,
        offset,
        orderBy: tableOrderBy(
          CONTACT_PERSON_SORTABLE,
          query,
          [asc(Companies.companyName), asc(Contacts.lastName)],
          Contacts.id,
        ),
      },
    );

/** How many contacts that same query matches. */
export const countContactPersons = async (
  scope: SQL | undefined,
  query: TableQuery,
): Promise<number> => {
  const [row] = await db
    .select({ value: count() })
    .from(Contacts)
    .leftJoin(Companies, eq(Companies.uuid, Contacts.companyUuid))
    .where(
      tableWhere({
        query,
        search: CONTACT_PERSON_SEARCH,
        filters: CONTACT_PERSON_FILTERS,
        scope: [scope],
      }),
    );

  return Number(row?.value ?? 0);
};

/** The regions the contacts' companies carry, for the overviews' filter. */
export const getContactPersonRegions = async (
  scope: SQL | undefined,
): Promise<string[]> => {
  const rows = await db
    .selectDistinct({ region: Companies.region })
    .from(Contacts)
    .innerJoin(Companies, eq(Companies.uuid, Contacts.companyUuid))
    .where(and(scope, isNotNull(Companies.region)))
    .orderBy(asc(Companies.region));

  return rows
    .map((row) => row.region)
    .filter((region): region is string => region !== null && region !== "");
};
