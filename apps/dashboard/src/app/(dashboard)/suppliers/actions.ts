"use server";

import { describeError } from "@/lib/helpers";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { PurchaseOrders } from "@/db/schema/purchase-orders";
import { db } from "@/db";
import { SUPPLIER_COLUMNS } from "@/app/(dashboard)/suppliers/columns";
import { getClerkUserNames } from "@/lib/server/clerk";
import { companyAddressFor } from "@/lib/server/company-addresses";
import { exportRows } from "@/lib/server/excel";
import {
  runPaged,
  tableOrderBy,
  tableWhere,
} from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { asc, count, eq, min, sql } from "drizzle-orm";

/**
 * One row of `Suppliers` — all 29 columns of the reference's export (1 108
 * suppliers, exports/supplier.tsv).
 */
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
  | "creditorNumber"
  | "requiresCertificate"
  | "printConsignment"
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
  /** Who buys from them: the purchaser on their latest purchase order. */
  purchaserName: string | null;
  isSupplier: boolean;
  isProcessor: boolean;
  isTransporter: boolean;
  isAgent: boolean;
  isOther: boolean;
  isCustomer: boolean;
  isProspect: boolean;
};

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

const SUPPLIER_SEARCH = [
  Companies.companyName,
  Companies.searchCode1,
  Companies.searchCode2,
  Companies.searchCode3,
] as const;

const SUPPLIER_SORTABLE = {
  companyName: Companies.companyName,
  companyCode: Companies.id,
  searchCode3: Companies.searchCode3,
};

const IS_SUPPLIER = sql`JSON_CONTAINS(${Companies.roles}, '"supplier"')`;

const supplierRows =
  (query: TableQuery) =>
  async (limit: number, offset: number): Promise<SupplierRow[]> => {
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
        creditorNumber: Companies.creditorNumber,
        requiresCertificate: Companies.requiresCertificate,
        printConsignment: Companies.printConsignment,
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
        purchaser: sql<string | null>`(
          SELECT ${PurchaseOrders.purchaser} FROM ${PurchaseOrders}
          WHERE ${PurchaseOrders.supplierUuid} = ${Companies.uuid}
          ORDER BY ${PurchaseOrders.createdAt} DESC LIMIT 1
        )`,
      })
      .from(Companies)
      .leftJoin(primaryContact, eq(Companies.uuid, primaryContact.companyUuid))
      .leftJoin(visiting, eq(Companies.uuid, visiting.companyUuid))
      .leftJoin(correspondence, eq(Companies.uuid, correspondence.companyUuid))
      .where(tableWhere({ query, search: SUPPLIER_SEARCH, scope: [IS_SUPPLIER] }))
      .orderBy(
        ...tableOrderBy(
          SUPPLIER_SORTABLE,
          query,
          [asc(Companies.companyName)],
          Companies.id,
        ),
      )
      .limit(limit)
      .offset(offset);

    const names = rows.some((row) => row.purchaser)
      ? await getClerkUserNames()
      : {};

    return rows.map(({ roles, purchaser, ...row }): SupplierRow => {
      const held = roles ?? [];
      return {
        ...row,
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
        purchaserName: purchaser ? (names[purchaser] ?? purchaser) : null,
        isSupplier: held.includes("supplier"),
        isProcessor: held.includes("processor"),
        isTransporter: held.includes("transporter"),
        isAgent: held.includes("agent"),
        isOther: held.includes("other"),
        isCustomer: held.includes("customer"),
        isProspect: held.includes("prospect"),
      };
    });
  };

// Every company holding the "supplier" role, paged in SQL.
export const getSuppliers = async (
  query: TableQuery,
): Promise<Paged<SupplierRow>> => {
  try {
    return await runPaged(query, {
      rows: supplierRows(query),
      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(Companies)
          .where(
            tableWhere({ query, search: SUPPLIER_SEARCH, scope: [IS_SUPPLIER] }),
          );
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch suppliers"));
  }
};

export const exportSuppliers = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Suppliers",
    columns: SUPPLIER_COLUMNS,
    columnKeys,
    rows: supplierRows(parseTableQuery(params)),
  });
