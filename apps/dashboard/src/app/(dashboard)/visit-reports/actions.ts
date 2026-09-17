"use server";

import {
  Companies,
  Contacts,
  db,
  InsertVisitReports,
  SelectCompanies,
  SelectContacts,
  SelectVisitReports,
  VisitReports,
} from "@/db";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import {
  formatDateColumn,
  generateUuid,
  nextVisitDateForReasons,
  todayDateString,
} from "@/lib/helpers";
import { companyAddressFor } from "@/lib/server/company-addresses";
import { asc, count, desc, eq, getTableColumns } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { visitReportReasons } from "@/lib/enums";
import {
  dateRangeFilter,
  jsonArrayFilter,
  relationFilter,
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
import { exportRows } from "@/lib/server/excel";
import { VISIT_REPORT_COLUMNS } from "@/app/(dashboard)/visit-reports/columns";

export type VisitReportInput = Omit<
  InsertVisitReports,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type VisitReportActionResult = {
  error?: string;
};

export type VisitReportListItem = SelectVisitReports & {
  companyName: Pick<SelectCompanies, "companyName">["companyName"];
};

export type ContactOption = Pick<
  SelectContacts,
  "uuid" | "firstName" | "lastName"
>;

// The report, plus what it shows about the company visited — read from the
// company, never stored on the report.
export type VisitReportDetail = VisitReportListItem & {
  companyId: SelectCompanies["id"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
  visitStreetAndNo: SelectCompanyAddresses["streetAndNo"] | null;
  visitPostalCode: SelectCompanyAddresses["postalCode"] | null;
  visitCity: SelectCompanyAddresses["city"] | null;
  visitTelephone: SelectCompanyAddresses["telephone"] | null;
  visitFax: SelectCompanyAddresses["fax"] | null;
  companyIndustry: SelectCompanies["industry"];
  companyClassification: SelectCompanies["classification"];
  companyVisitFrequency: SelectCompanies["visitFrequency"];
  companyCallFrequencyPerYear: SelectCompanies["callFrequencyPerYear"];
  companyTargetDateNextVisit: SelectCompanies["targetDateNextVisit"];
  companyNextVisitReason: SelectCompanies["visitReason"];
  companyPotentialAnnualRevenue: SelectCompanies["potentialAnnualRevenue"];
  companyTargetAnnualRevenue: SelectCompanies["targetAnnualRevenue"];
  companyPotentialAnnualSales: SelectCompanies["potentialAnnualSales"];
  companyTargetAnnualSales: SelectCompanies["targetAnnualSales"];
  companyNumberOfEmployees: SelectCompanies["numberOfEmployees"];
  companyVisitPlanning: SelectCompanies["visitPlanning"];
};

const VISIT_REPORT_SEARCH = [
  VisitReports.remarks,
  Companies.companyName,
] as const;

const VISIT_REPORT_SORTABLE = {
  createdAt: VisitReports.createdAt,
  visitDate: VisitReports.visitDate,
  customer: Companies.companyName,
};

// Whose visit it was, why, and when. `resolved` separates what actually took
// place from what is merely planned — see /visits-made, which is that filter.
const VISIT_REPORT_FILTERS = {
  company: relationFilter(VisitReports.companyUuid),
  visitReason: jsonArrayFilter(VisitReports.visitReasons, visitReportReasons),
  visitDate: dateRangeFilter(VisitReports.visitDate),
};

/**
 * The rows one view of the visit reports overview selects, as a window onto
 * them. Shared by the page and the export.
 */
const visitReportRows =
  (query: TableQuery) =>
  (limit: number, offset: number): Promise<VisitReportListItem[]> =>
    db
      .select({
        ...getTableColumns(VisitReports),
        companyName: Companies.companyName,
      })
      .from(VisitReports)
      .innerJoin(Companies, eq(Companies.uuid, VisitReports.companyUuid))
      .where(
        tableWhere({
          query,
          search: VISIT_REPORT_SEARCH,
          filters: VISIT_REPORT_FILTERS,
        }),
      )
      .orderBy(
        ...tableOrderBy(
          VISIT_REPORT_SORTABLE,
          query,
          [desc(VisitReports.createdAt)],
          VisitReports.id,
        ),
      )
      .limit(limit)
      .offset(offset);

/** Every visit report the current view matches, as a workbook. */
export const exportVisitReports = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Visit Reports",
    columns: VISIT_REPORT_COLUMNS,
    columnKeys,
    rows: visitReportRows(parseTableQuery(params)),
  });

export const getVisitReports = async (
  query: TableQuery,
): Promise<Paged<VisitReportListItem>> => {
  const where = tableWhere({
    query,
    search: VISIT_REPORT_SEARCH,
    filters: VISIT_REPORT_FILTERS,
  });

  return runPaged(query, {
    rows: visitReportRows(query),

    count: async () => {
      const [row] = await db
        .select({ value: count() })
        .from(VisitReports)
        .innerJoin(Companies, eq(Companies.uuid, VisitReports.companyUuid))
        .where(where);
      return Number(row?.value ?? 0);
    },
  });
};

/**
 * One visit report with the company visited, its visiting address and
 * marketing, and the contact seen.
 */
export const getVisitReportDetail = async (
  uuid: string,
): Promise<VisitReportDetail | null> => {
  const visitAddress = companyAddressFor("visit", "visit_address");

  const [row] = await db
    .select({
      ...getTableColumns(VisitReports),
      companyName: Companies.companyName,
      companyId: Companies.id,
      contactFirstName: Contacts.firstName,
      contactLastName: Contacts.lastName,
      visitStreetAndNo: visitAddress.streetAndNo,
      visitPostalCode: visitAddress.postalCode,
      visitCity: visitAddress.city,
      visitTelephone: visitAddress.telephone,
      visitFax: visitAddress.fax,
      companyIndustry: Companies.industry,
      companyClassification: Companies.classification,
      companyVisitFrequency: Companies.visitFrequency,
      companyCallFrequencyPerYear: Companies.callFrequencyPerYear,
      companyTargetDateNextVisit: Companies.targetDateNextVisit,
      companyNextVisitReason: Companies.visitReason,
      companyPotentialAnnualRevenue: Companies.potentialAnnualRevenue,
      companyTargetAnnualRevenue: Companies.targetAnnualRevenue,
      companyPotentialAnnualSales: Companies.potentialAnnualSales,
      companyTargetAnnualSales: Companies.targetAnnualSales,
      companyNumberOfEmployees: Companies.numberOfEmployees,
      companyVisitPlanning: Companies.visitPlanning,
    })
    .from(VisitReports)
    .innerJoin(Companies, eq(Companies.uuid, VisitReports.companyUuid))
    .leftJoin(visitAddress, eq(visitAddress.companyUuid, VisitReports.companyUuid))
    .leftJoin(Contacts, eq(Contacts.uuid, VisitReports.contactUuid))
    .where(eq(VisitReports.uuid, uuid))
    .limit(1);

  return row ?? null;
};

export const getContactsByCompanyUuid = async (
  companyUuid: string,
): Promise<ContactOption[]> =>
  db
    .select({
      uuid: Contacts.uuid,
      firstName: Contacts.firstName,
      lastName: Contacts.lastName,
    })
    .from(Contacts)
    .where(eq(Contacts.companyUuid, companyUuid))
    .orderBy(asc(Contacts.lastName));

export const createVisitReport = async (
  input: VisitReportInput,
): Promise<VisitReportActionResult> => {
  const uuid = generateUuid();

  try {
    await db.insert(VisitReports).values({ ...input, uuid });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create visit report",
    };
  }

  redirect("/visit-reports");
};

// Resolves a planned visit/call: marks it as having taken place and stamps the
// visit date with today when it has none. A completed report is what the visit
// schedule, to-visit/call and customer-overview reports read for the "last
// visit / last call" dates and the visit count, so this is what turns a planned
// contact into a recorded one.
export const resolveVisitReport = async (
  uuid: string,
): Promise<VisitReportActionResult> => {
  try {
    const [report] = await db
      .select({
        uuid: VisitReports.uuid,
        companyUuid: VisitReports.companyUuid,
        hasTakenPlace: VisitReports.hasTakenPlace,
        visitDate: VisitReports.visitDate,
        visitReasons: VisitReports.visitReasons,
        // The next visit is the company's (the reference's
        // `COMPANY_MARKETING.NEXTVISIT` / `VISITREASON`), not the report's.
        nextVisitReason: Companies.visitReason,
        targetDateNextVisit: Companies.targetDateNextVisit,
      })
      .from(VisitReports)
      .innerJoin(Companies, eq(Companies.uuid, VisitReports.companyUuid))
      .where(eq(VisitReports.uuid, uuid))
      .limit(1);

    if (!report) {
      return { error: "Visit report not found." };
    }
    if (report.hasTakenPlace) {
      return { error: "This visit report is already resolved." };
    }

    const visitDate = report.visitDate ?? todayDateString();

    // Why the visit happened says when to come back: a complaint in four weeks,
    // a quote chase in two, a customer whose turnover is slipping in eight. A
    // reason that fixes no interval — an introduction, or a visit the customer
    // asked for — leaves the date to be decided. A next visit somebody already
    // planned for after this one is never overwritten; one this visit has now
    // passed is.
    const plannedNextVisit = formatDateColumn(report.targetDateNextVisit);
    const stillAhead = plannedNextVisit !== "—" && plannedNextVisit > visitDate;
    const derivedNextVisit = stillAhead
      ? null
      : nextVisitDateForReasons(
          report.nextVisitReason ? [report.nextVisitReason] : report.visitReasons,
          visitDate,
        );

    await db.transaction(async (tx) => {
      await tx
        .update(VisitReports)
        .set({ hasTakenPlace: true, visitDate })
        .where(eq(VisitReports.uuid, uuid));

      if (derivedNextVisit) {
        await tx
          .update(Companies)
          .set({
            targetDateNextVisit: new Date(`${derivedNextVisit}T00:00:00`),
          })
          .where(eq(Companies.uuid, report.companyUuid));
      }
    });

    revalidatePath(`/companies/${report.companyUuid}`);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to resolve visit report",
    };
  }

  revalidatePath("/visit-reports");
  revalidatePath("/visit-schedule");
  revalidatePath("/change-visit-schedule");
  revalidatePath("/to-visit-call");
  revalidatePath("/customer-overview");
  return {};
};
