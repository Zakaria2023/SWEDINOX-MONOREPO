"use server";

import { VISIT_SCHEDULE_COLUMNS } from "@/app/(dashboard)/visit-schedule/columns";
import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { VisitPlans } from "@/db/schema/visit-plans";
import { VisitReports } from "@/db/schema/visit-reports";
import {
  companyClassifications,
  customerGroups,
  salesRepresentatives,
} from "@/lib/enums";
import {
  contactIntervalWeeks,
  describeError,
  isContactDue,
  monthAndYearLabel,
  nextContactDate,
  todayDateString,
  visitPlanPeriod,
} from "@/lib/helpers";
import { companyAddressFor } from "@/lib/server/company-addresses";
import { companyRevenueRolling } from "@/lib/server/customer-revenue";
import { exportRows } from "@/lib/server/excel";
import {
  enumFilter,
  FilterBinding,
  FilterBindings,
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
import {
  and,
  asc,
  count,
  eq,
  exists,
  isNotNull,
  max,
  min,
  or,
  sql,
} from "drizzle-orm";

// Only the companies the sales side calls on. A supplier has no visit
// frequency and no account manager, and putting one on this list would be
// putting it on a list of people to sell to.
const VISIT_SCHEDULE_SCOPE = or(
  sql`JSON_CONTAINS(${Companies.roles}, '"customer"')`,
  sql`JSON_CONTAINS(${Companies.roles}, '"prospect"')`,
);

const VISIT_SCHEDULE_SEARCH = [
  Companies.companyName,
  Companies.searchCode1,
] as const;

// Sorting stays on the company's own columns. The revenue and last-contact
// figures are subqueries and the due flags are computed after the query, so
// offering them as sort keys would be offering a sort the pager cannot honour.
const VISIT_SCHEDULE_SORTABLE: SortableColumns = {
  company: Companies.companyName,
  companyCode: Companies.id,
  region: Companies.region,
  customerGroup: Companies.customerGroup,
  accountManager: Companies.accountManager,
  representative: Companies.representative,
};

type PlannedValue = "call" | "visit" | "either" | "none";

export type VisitPlanPeriod = {
  year: number;
  month: number;
};

export type VisitScheduleRow = Pick<
  SelectCompanies,
  | "companyName"
  | "accountManager"
  | "representative"
  | "customerGroup"
  | "region"
  | "classification"
> & {
  companyUuid: SelectCompanies["uuid"];
  companyCode: SelectCompanies["id"];
  visitStreetAndNo: SelectCompanyAddresses["streetAndNo"] | null;
  visitPostalCode: SelectCompanyAddresses["postalCode"] | null;
  visitCity: SelectCompanyAddresses["city"] | null;
  visitCountry: SelectCompanyAddresses["country"] | null;
  visitTelephone: SelectCompanyAddresses["telephone"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
  contactEmail: SelectContacts["email"] | null;
  contactMobile: SelectContacts["mobile"] | null;
  /** What somebody agreed to sell this account in a year. */
  targetYearRevenue: number;
  /**
   * Invoiced excl. VAT over the rolling twelve months and over the calendar
   * month before this one — the reference's two bases, not the calendar year.
   * See `companyRevenueRolling`.
   */
  revenueLast12Months: number;
  revenueLastMonth: number;
  lastCallDate: string | null;
  lastVisitDate: string | null;
  /**
   * When the next call and the next visit are due: the last one plus the
   * interval the customer's own frequency asks for, or the one its A/B/C
   * classification implies where no frequency was typed. A customer nobody has
   * ever called is due now rather than never; one with neither a frequency nor
   * a classification has no due date at all, which keeps it off the list
   * instead of on it every day.
   *
   * The reference prints only the month of these, and it prints nothing at all
   * because every frequency there is `0`. Which of the two its `upcoming month`
   * columns meant — the month a contact is due, or the month one was planned —
   * the export cannot settle: both readings produce an empty column on a file
   * where nothing is planned and no frequency is set. This is the due reading,
   * because a plan is chosen one month at a time and a column echoing the
   * month the screen is already showing would say nothing.
   */
  callUpcoming: string | null;
  visitUpcoming: string | null;
  callDue: boolean;
  visitDue: boolean;
  /** The month the plan columns belong to, as the `Month` column prints it. */
  planPeriodLabel: string | null;
  planCall: boolean;
  planVisit: boolean;
};

/**
 * The month's plan, as a subquery to left-join on the company.
 *
 * Filtered to the one month before the join rather than after it, so a company
 * with plans in several months still contributes exactly one row.
 */
const visitPlanFor = (period: VisitPlanPeriod, name: string) =>
  db
    .select({
      companyUuid: VisitPlans.companyUuid,
      call: VisitPlans.call,
      visit: VisitPlans.visit,
    })
    .from(VisitPlans)
    .where(
      and(
        eq(VisitPlans.planYear, period.year),
        eq(VisitPlans.planMonth, period.month),
      ),
    )
    .as(name);

/**
 * "Show me what is planned this month", as a condition on the company rather
 * than on the joined plan — the count query does not carry the join, and a
 * filter has to mean the same thing in both.
 */
const PLANNED_VALUES = ["call", "visit", "either", "none"] as const;

const plannedFilter =
  (period: VisitPlanPeriod): FilterBinding =>
  (values) => {
    const wanted = values.filter((value): value is PlannedValue =>
      PLANNED_VALUES.includes(value as PlannedValue),
    );
    if (wanted.length === 0) {
      return undefined;
    }

    const kindCondition = (kind: PlannedValue) => {
      if (kind === "call") {
        return eq(VisitPlans.call, true);
      }
      if (kind === "visit") {
        return eq(VisitPlans.visit, true);
      }
      return or(eq(VisitPlans.call, true), eq(VisitPlans.visit, true));
    };

    const planned = (kind: PlannedValue) =>
      exists(
        db
          .select({ one: sql`1` })
          .from(VisitPlans)
          .where(
            and(
              eq(VisitPlans.companyUuid, Companies.uuid),
              eq(VisitPlans.planYear, period.year),
              eq(VisitPlans.planMonth, period.month),
              kindCondition(kind),
            ),
          ),
      );

    return or(
      ...wanted.map((value) =>
        value === "none" ? sql`NOT ${planned("either")}` : planned(value),
      ),
    );
  };

const visitScheduleFilters = (period: VisitPlanPeriod): FilterBindings => ({
  region: valueFilter(Companies.region),
  customerGroup: enumFilter(Companies.customerGroup, customerGroups),
  classification: enumFilter(Companies.classification, companyClassifications),
  accountManager: enumFilter(Companies.accountManager, salesRepresentatives),
  representative: enumFilter(Companies.representative, salesRepresentatives),
  planned: plannedFilter(period),
});

const visitScheduleRows =
  (query: TableQuery, period: VisitPlanPeriod) =>
  (limit: number, offset: number): Promise<VisitScheduleRow[]> => {
    // Contact with the lowest id per company — the reference's visit screens
    // take the first contact too, since nothing anywhere flags a main one
    // (§41). Only the contact's own columns come from it.
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

    // The visiting address is the company's — 2 531 of 2 531 rows in the
    // reference's visit schedule equal the company's visiting-address row.
    const visiting = companyAddressFor("visit", "visiting_address");
    const revenue = companyRevenueRolling("company_revenue");
    const plan = visitPlanFor(period, "visit_plan");

    // Most recent completed phone contact per company.
    const lastCall = db
      .select({
        companyUuid: VisitReports.companyUuid,
        lastCallDate: max(VisitReports.visitDate).as("last_call_date"),
      })
      .from(VisitReports)
      .where(
        and(
          eq(VisitReports.contactMethod, "telephone_contact"),
          eq(VisitReports.hasTakenPlace, true),
        ),
      )
      .groupBy(VisitReports.companyUuid)
      .as("last_call");

    // Most recent completed in-person visit per company.
    const lastVisit = db
      .select({
        companyUuid: VisitReports.companyUuid,
        lastVisitDate: max(VisitReports.visitDate).as("last_visit_date"),
      })
      .from(VisitReports)
      .where(
        and(
          eq(VisitReports.contactMethod, "visit"),
          eq(VisitReports.hasTakenPlace, true),
        ),
      )
      .groupBy(VisitReports.companyUuid)
      .as("last_visit");

    const today = todayDateString();

    return db
      .select({
        companyUuid: Companies.uuid,
        companyCode: Companies.id,
        companyName: Companies.companyName,
        accountManager: Companies.accountManager,
        representative: Companies.representative,
        customerGroup: Companies.customerGroup,
        region: Companies.region,
        classification: Companies.classification,
        visitFrequency: Companies.visitFrequency,
        callFrequencyPerYear: Companies.callFrequencyPerYear,
        targetYearRevenue: Companies.targetAnnualSales,
        contactFirstName: primaryContact.firstName,
        contactLastName: primaryContact.lastName,
        contactEmail: primaryContact.email,
        contactMobile: primaryContact.mobile,
        revenueLast12Months: revenue.revenueLast12Months,
        revenueLastMonth: revenue.revenueLastMonth,
        visitStreetAndNo: visiting.streetAndNo,
        visitPostalCode: visiting.postalCode,
        visitCity: visiting.city,
        visitCountry: visiting.country,
        visitTelephone: visiting.telephone,
        lastCallDate: lastCall.lastCallDate,
        lastVisitDate: lastVisit.lastVisitDate,
        planCall: plan.call,
        planVisit: plan.visit,
      })
      .from(Companies)
      .leftJoin(primaryContact, eq(Companies.uuid, primaryContact.companyUuid))
      .leftJoin(visiting, eq(Companies.uuid, visiting.companyUuid))
      .leftJoin(revenue, eq(Companies.uuid, revenue.companyUuid))
      .leftJoin(lastCall, eq(Companies.uuid, lastCall.companyUuid))
      .leftJoin(lastVisit, eq(Companies.uuid, lastVisit.companyUuid))
      .leftJoin(plan, eq(Companies.uuid, plan.companyUuid))
      .where(
        tableWhere({
          query,
          search: VISIT_SCHEDULE_SEARCH,
          filters: visitScheduleFilters(period),
          scope: [VISIT_SCHEDULE_SCOPE],
        }),
      )
      .orderBy(
        ...tableOrderBy(
          VISIT_SCHEDULE_SORTABLE,
          query,
          [asc(Companies.companyName)],
          Companies.id,
        ),
      )
      .limit(limit)
      .offset(offset)
      .then((rows) =>
        rows.map((row): VisitScheduleRow => {
          const callInterval = contactIntervalWeeks("telephone_contact", {
            classification: row.classification,
            callsPerYear: row.callFrequencyPerYear,
          });
          const visitInterval = contactIntervalWeeks("visit", {
            classification: row.classification,
            visitsPerYear: row.visitFrequency,
          });
          const callUpcoming = nextContactDate(
            row.lastCallDate,
            callInterval,
            today,
          );
          const visitUpcoming = nextContactDate(
            row.lastVisitDate,
            visitInterval,
            today,
          );

          return {
            companyUuid: row.companyUuid,
            companyCode: row.companyCode,
            companyName: row.companyName,
            accountManager: row.accountManager,
            representative: row.representative,
            customerGroup: row.customerGroup,
            region: row.region,
            classification: row.classification,
            visitStreetAndNo: row.visitStreetAndNo ?? null,
            visitPostalCode: row.visitPostalCode ?? null,
            visitCity: row.visitCity ?? null,
            visitCountry: row.visitCountry ?? null,
            visitTelephone: row.visitTelephone ?? null,
            contactFirstName: row.contactFirstName ?? null,
            contactLastName: row.contactLastName ?? null,
            contactEmail: row.contactEmail ?? null,
            contactMobile: row.contactMobile ?? null,
            targetYearRevenue: Number(row.targetYearRevenue ?? 0),
            revenueLast12Months: Number(row.revenueLast12Months ?? 0),
            revenueLastMonth: Number(row.revenueLastMonth ?? 0),
            lastCallDate: row.lastCallDate ?? null,
            lastVisitDate: row.lastVisitDate ?? null,
            callUpcoming,
            visitUpcoming,
            callDue: isContactDue(callUpcoming, today),
            visitDue: isContactDue(visitUpcoming, today),
            planPeriodLabel: monthAndYearLabel(period.year, period.month),
            // No row for the month is a month nobody planned, which is a
            // decision not taken rather than a decision against.
            planCall: row.planCall ?? false,
            planVisit: row.planVisit ?? false,
          };
        }),
      );
  };

/**
 * The customers and prospects a representative is meant to stay in touch with,
 * with the month's plan alongside.
 *
 * One query behind three screens, the way the reference has it: `To visit/call`
 * is the list, `Visit schedule` is the list with the month's plan read back,
 * and `Change visit schedule` is where that plan is set. Their 22 shared
 * columns are identical on 2 531 of 2 531 rows there, so they are identical
 * here too.
 */
export const getVisitSchedule = async (
  query: TableQuery,
  period: VisitPlanPeriod,
): Promise<Paged<VisitScheduleRow>> => {
  try {
    return await runPaged(query, {
      rows: visitScheduleRows(query, period),
      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(Companies)
          .where(
            tableWhere({
              query,
              search: VISIT_SCHEDULE_SEARCH,
              filters: visitScheduleFilters(period),
              scope: [VISIT_SCHEDULE_SCOPE],
            }),
          );
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch the visit schedule"));
  }
};

export const exportVisitSchedule = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> => {
  const period = visitPlanPeriod(
    typeof params.year === "string" ? params.year : null,
    typeof params.month === "string" ? params.month : null,
  );

  return exportRows({
    name: "Visit schedule",
    columns: VISIT_SCHEDULE_COLUMNS,
    columnKeys,
    rows: visitScheduleRows(parseTableQuery(params), period),
  });
};

/** The regions customers actually carry, for the overview's filter. */
export const getVisitScheduleRegions = async (): Promise<string[]> => {
  const rows = await db
    .selectDistinct({ region: Companies.region })
    .from(Companies)
    .where(and(VISIT_SCHEDULE_SCOPE, isNotNull(Companies.region)))
    .orderBy(asc(Companies.region));

  return rows
    .map((row) => row.region)
    .filter((region): region is string => region !== null && region !== "");
};
