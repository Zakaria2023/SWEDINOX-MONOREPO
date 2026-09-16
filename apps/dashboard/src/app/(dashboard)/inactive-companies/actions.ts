"use server";

import { INACTIVE_COMPANY_COLUMNS } from "@/app/(dashboard)/inactive-companies/columns";
import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { companyRoles } from "@/lib/enums";
import { describeError } from "@/lib/helpers";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { companyAddressFor } from "@/lib/server/company-addresses";
import { exportRows } from "@/lib/server/excel";
import {
  dateRangeFilter,
  FilterBindings,
  jsonArrayFilter,
  runPaged,
  SortableColumns,
  tableOrderBy,
  tableWhere,
} from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { asc, count, eq } from "drizzle-orm";

// Inactive is a tick a person sets on the company — the reference's 93 rows
// carry every role (suppliers, transporters, processors as well as customers),
// named things like "NIET GEBRUIKEN" and "FAILLIET", and none of it follows
// from how long ago someone last ordered. So the overview is the flag and
// nothing else.
const INACTIVE_COMPANY_SEARCH = [
  Companies.companyName,
  Companies.searchCode1,
] as const;

const INACTIVE_COMPANY_FILTERS: FilterBindings = {
  role: jsonArrayFilter(Companies.roles, companyRoles),
  lastModified: dateRangeFilter(Companies.updatedAt),
};

const INACTIVE_COMPANY_SORTABLE: SortableColumns = {
  code: Companies.id,
  company: Companies.companyName,
  lastModified: Companies.updatedAt,
};

export type InactiveCompanyRow = {
  companyUuid: SelectCompanies["uuid"];
  code: SelectCompanies["id"];
  companyName: SelectCompanies["companyName"];
  visitingAddress: SelectCompanyAddresses["streetAndNo"] | null;
  postalCode: SelectCompanyAddresses["postalCode"] | null;
  city: SelectCompanyAddresses["city"] | null;
  country: SelectCompanyAddresses["country"] | null;
  isCustomer: boolean;
  isProspect: boolean;
  isSupplier: boolean;
  isProcessor: boolean;
  isTransporter: boolean;
  isAgent: boolean;
  isOther: boolean;
  lastModifiedBy: string | null;
  lastModifiedAt: SelectCompanies["updatedAt"];
  representative: SelectCompanies["representative"];
};

const visitingAddress = () => companyAddressFor("visit", "visiting_address");

const inactiveCompanyRows =
  (query: TableQuery) =>
  async (limit: number, offset: number): Promise<InactiveCompanyRow[]> => {
    const visiting = visitingAddress();
    const rows = await db
      .select({
        companyUuid: Companies.uuid,
        code: Companies.id,
        companyName: Companies.companyName,
        roles: Companies.roles,
        modifiedByUserId: Companies.modifiedByUserId,
        lastModifiedAt: Companies.updatedAt,
        representative: Companies.representative,
        visitingAddress: visiting.streetAndNo,
        postalCode: visiting.postalCode,
        city: visiting.city,
        country: visiting.country,
      })
      .from(Companies)
      .leftJoin(visiting, eq(Companies.uuid, visiting.companyUuid))
      .where(
        tableWhere({
          query,
          search: INACTIVE_COMPANY_SEARCH,
          filters: INACTIVE_COMPANY_FILTERS,
          scope: [eq(Companies.isInactive, true)],
        }),
      )
      .orderBy(
        ...tableOrderBy(
          INACTIVE_COMPANY_SORTABLE,
          query,
          [asc(Companies.id)],
          Companies.id,
        ),
      )
      .limit(limit)
      .offset(offset);

    if (rows.length === 0) {
      return [];
    }

    // The column stores a Clerk id; Clerk owns the name.
    const users = await getClerkUsersForSelect();
    const nameById = new Map(users.map((user) => [user.value, user.label]));

    return rows.map(({ roles, modifiedByUserId, ...row }) => {
      const held = new Set(roles ?? []);
      return {
        ...row,
        isCustomer: held.has("customer"),
        isProspect: held.has("prospect"),
        isSupplier: held.has("supplier"),
        isProcessor: held.has("processor"),
        isTransporter: held.has("transporter"),
        isAgent: held.has("agent"),
        isOther: held.has("other"),
        lastModifiedBy: modifiedByUserId
          ? (nameById.get(modifiedByUserId) ?? modifiedByUserId)
          : null,
      };
    });
  };

export const getInactiveCompanies = async (
  query: TableQuery,
): Promise<Paged<InactiveCompanyRow>> => {
  try {
    return await runPaged(query, {
      rows: inactiveCompanyRows(query),
      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(Companies)
          .where(
            tableWhere({
              query,
              search: INACTIVE_COMPANY_SEARCH,
              filters: INACTIVE_COMPANY_FILTERS,
              scope: [eq(Companies.isInactive, true)],
            }),
          );
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch inactive companies"));
  }
};

export const exportInactiveCompanies = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Inactive companies",
    columns: INACTIVE_COMPANY_COLUMNS,
    columnKeys,
    rows: inactiveCompanyRows(parseTableQuery(params)),
  });
