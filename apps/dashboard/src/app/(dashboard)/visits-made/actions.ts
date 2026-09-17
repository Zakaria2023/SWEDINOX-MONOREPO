"use server";

import { VISIT_MADE_COLUMNS } from "@/app/(dashboard)/visits-made/columns";
import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { SelectVisitReports, VisitReports } from "@/db/schema/visit-reports";
import {
  customerGroups,
  visitReportCategories,
  visitReportContactMethods,
  visitReportReasons,
} from "@/lib/enums";
import { describeError } from "@/lib/helpers";
import { companyAddressFor } from "@/lib/server/company-addresses";
import { exportRows } from "@/lib/server/excel";
import {
  booleanFilter,
  dateRangeFilter,
  enumFilter,
  FilterBindings,
  jsonArrayFilter,
  runPaged,
  SortableColumns,
  tableOrderBy,
  tableWhere,
  valueFilter,
} from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { asc, count, desc, eq, isNotNull } from "drizzle-orm";

// A visit that was recorded, with the customer context a representative needs
// to read it: where they went, who they saw and which group the account belongs
// to. Where they went is the company's visiting address.
//
// Not only the visits that happened. The reference lists 16 of its 166 rows as
// `Took place: no` — a contact that was written down and then did not come off,
// which is a fact about the account worth seeing — so the flag is a column and
// a filter here, never a hidden condition.
const VISIT_MADE_SEARCH = [
  Companies.companyName,
  Companies.searchCode1,
] as const;

const VISIT_MADE_FILTERS: FilterBindings = {
  visitDate: dateRangeFilter(VisitReports.visitDate),
  contactMethod: enumFilter(
    VisitReports.contactMethod,
    visitReportContactMethods,
  ),
  hasTakenPlace: booleanFilter(VisitReports.hasTakenPlace),
  visitReason: jsonArrayFilter(VisitReports.visitReasons, visitReportReasons),
  category: jsonArrayFilter(VisitReports.categories, visitReportCategories),
  region: valueFilter(Companies.region),
  customerGroup: enumFilter(Companies.customerGroup, customerGroups),
};

const VISIT_MADE_SORTABLE: SortableColumns = {
  visitDate: VisitReports.visitDate,
  company: Companies.companyName,
  customerCode: Companies.searchCode1,
};

export type VisitMadeRow = Pick<
  SelectVisitReports,
  | "uuid"
  | "representative"
  | "visitedBy"
  | "visitDate"
  | "visitTime"
  | "hasTakenPlace"
  | "visitReasons"
  | "contactMethod"
  | "categories"
> & {
  postalCode: SelectCompanyAddresses["postalCode"] | null;
  city: SelectCompanyAddresses["city"] | null;
  customerCode: SelectCompanies["searchCode1"] | null;
  companyUuid: SelectCompanies["uuid"] | null;
  companyName: SelectCompanies["companyName"] | null;
  region: SelectCompanies["region"] | null;
  customerGroup: SelectCompanies["customerGroup"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
};

const visitMadeRows =
  (query: TableQuery) =>
  (limit: number, offset: number): Promise<VisitMadeRow[]> => {
    const visitAddress = companyAddressFor("visit", "visit_address");

    return db
      .select({
        uuid: VisitReports.uuid,
        representative: VisitReports.representative,
        visitedBy: VisitReports.visitedBy,
        postalCode: visitAddress.postalCode,
        city: visitAddress.city,
        visitDate: VisitReports.visitDate,
        visitTime: VisitReports.visitTime,
        hasTakenPlace: VisitReports.hasTakenPlace,
        visitReasons: VisitReports.visitReasons,
        contactMethod: VisitReports.contactMethod,
        categories: VisitReports.categories,
        customerCode: Companies.searchCode1,
        companyUuid: Companies.uuid,
        companyName: Companies.companyName,
        region: Companies.region,
        customerGroup: Companies.customerGroup,
        contactFirstName: Contacts.firstName,
        contactLastName: Contacts.lastName,
      })
      .from(VisitReports)
      .leftJoin(Companies, eq(VisitReports.companyUuid, Companies.uuid))
      .leftJoin(
        visitAddress,
        eq(visitAddress.companyUuid, VisitReports.companyUuid),
      )
      .leftJoin(Contacts, eq(VisitReports.contactUuid, Contacts.uuid))
      .where(
        tableWhere({
          query,
          search: VISIT_MADE_SEARCH,
          filters: VISIT_MADE_FILTERS,
        }),
      )
      .orderBy(
        ...tableOrderBy(
          VISIT_MADE_SORTABLE,
          query,
          [desc(VisitReports.visitDate)],
          VisitReports.id,
        ),
      )
      .limit(limit)
      .offset(offset);
  };

export const getVisitsMade = async (
  query: TableQuery,
): Promise<Paged<VisitMadeRow>> => {
  try {
    return await runPaged(query, {
      rows: visitMadeRows(query),
      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(VisitReports)
          .leftJoin(Companies, eq(VisitReports.companyUuid, Companies.uuid))
          .where(
            tableWhere({
              query,
              search: VISIT_MADE_SEARCH,
              filters: VISIT_MADE_FILTERS,
            }),
          );
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch visits made"));
  }
};

export const exportVisitsMade = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Visits made",
    columns: VISIT_MADE_COLUMNS,
    columnKeys,
    rows: visitMadeRows(parseTableQuery(params)),
  });

/** The regions companies actually carry, for the overview's filter. */
export const getVisitRegions = async (): Promise<string[]> => {
  const rows = await db
    .selectDistinct({ region: Companies.region })
    .from(Companies)
    .where(isNotNull(Companies.region))
    .orderBy(asc(Companies.region));

  return rows
    .map((row) => row.region)
    .filter((region): region is string => region !== null && region !== "");
};
