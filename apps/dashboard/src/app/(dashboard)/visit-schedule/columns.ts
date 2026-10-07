import { VisitScheduleRow } from "@/app/(dashboard)/visit-schedule/actions";
import {
  dateCell,
  ExportColumn,
  numberCell,
  textCell,
  yesNoCell,
} from "@/lib/excel";
import { monthOfDate } from "@/lib/helpers";
import { CUSTOMER_GROUP_LABELS } from "@/lib/labels";

/**
 * The visit schedule as a sheet — the reference's columns, in its order.
 *
 * All 25 are carried. `Region number` is `0` on all 2 531 of its rows, a
 * sentinel rather than data, and the named `Region` beside it carries the
 * value — so it prints blank and is hidden by default.
 *
 * `Month`, `Call` and `Visit` are the plan, and only the screens that show a
 * plan ask for them — `To visit/call` leaves all three off and gets the
 * reference's plainer list.
 *
 * `Call due` and `Visit due` are ours, not the reference's. They are what makes
 * the screen answer "who should I ring today" without anybody having ticked
 * anything, and they are named apart from `Call` and `Visit` because they mean
 * something different: one is a calculation, the other is a decision.
 */

export type VisitScheduleColumnKey =
  | "companyCode"
  | "companyName"
  | "visitStreetAndNo"
  | "visitPostalCode"
  | "visitCity"
  | "visitCountry"
  | "visitTelephone"
  | "accountManager"
  | "representative"
  | "targetYearRevenue"
  | "revenueLast12Months"
  | "revenueLastMonth"
  | "customerGroup"
  | "lastCallDate"
  | "callUpcomingMonth"
  | "lastVisitDate"
  | "visitUpcomingMonth"
  | "contactPerson"
  | "contactEmail"
  | "contactMobile"
  | "region"
  | "planMonth"
  | "planCall"
  | "planVisit"
  | "callDue"
  | "visitDue"
  | "regionNumber";

/** What `To visit/call` shows: the reference's list, with no plan on it. */
export const VISIT_SCHEDULE_LIST_KEYS: VisitScheduleColumnKey[] = [
  "companyCode",
  "companyName",
  "visitStreetAndNo",
  "visitPostalCode",
  "visitCity",
  "visitCountry",
  "visitTelephone",
  "accountManager",
  "representative",
  "targetYearRevenue",
  "revenueLast12Months",
  "revenueLastMonth",
  "customerGroup",
  "lastCallDate",
  "callUpcomingMonth",
  "lastVisitDate",
  "visitUpcomingMonth",
  "contactPerson",
  "contactEmail",
  "contactMobile",
  "regionNumber",
  "region",
  "callDue",
  "visitDue",
];

/** `Visit schedule` — the list with the month's plan read back onto it. */
export const VISIT_SCHEDULE_PLAN_KEYS: VisitScheduleColumnKey[] = [
  ...VISIT_SCHEDULE_LIST_KEYS,
  "planMonth",
  "planCall",
  "planVisit",
];

/**
 * `Change visit schedule` — the same, without the `Month` column. The month is
 * the screen's own selection there, so printing it on every row says nothing.
 */
export const VISIT_SCHEDULE_EDIT_KEYS: VisitScheduleColumnKey[] = [
  ...VISIT_SCHEDULE_LIST_KEYS,
  "planCall",
  "planVisit",
];

export const VISIT_SCHEDULE_COLUMNS: Array<
  ExportColumn<VisitScheduleRow, VisitScheduleColumnKey>
> = [
  {
    key: "companyCode",
    label: "Company code",
    defaultVisible: true,
    value: (row) => numberCell(row.companyCode),
  },
  {
    key: "companyName",
    label: "Company",
    defaultVisible: true,
    value: (row) => textCell(row.companyName),
  },
  {
    key: "visitStreetAndNo",
    label: "Visiting address street",
    defaultVisible: true,
    value: (row) => textCell(row.visitStreetAndNo),
  },
  {
    key: "visitPostalCode",
    label: "Visiting address postal code",
    defaultVisible: true,
    value: (row) => textCell(row.visitPostalCode),
  },
  {
    key: "visitCity",
    label: "Visiting address city",
    defaultVisible: true,
    value: (row) => textCell(row.visitCity),
  },
  {
    key: "visitCountry",
    label: "Visiting address country",
    defaultVisible: true,
    value: (row) => textCell(row.visitCountry),
  },
  {
    key: "visitTelephone",
    label: "Telephone",
    defaultVisible: true,
    value: (row) => textCell(row.visitTelephone),
  },
  {
    key: "accountManager",
    label: "Account manager",
    defaultVisible: true,
    value: (row) => textCell(row.accountManager),
  },
  {
    key: "representative",
    label: "Representative",
    defaultVisible: true,
    value: (row) => textCell(row.representative),
  },
  {
    key: "targetYearRevenue",
    label: "Target year revenue",
    defaultVisible: true,
    value: (row) => numberCell(row.targetYearRevenue),
  },
  {
    key: "revenueLast12Months",
    label: "Revenue last 12 months",
    defaultVisible: true,
    value: (row) => numberCell(row.revenueLast12Months),
  },
  {
    key: "revenueLastMonth",
    label: "Revenue last month",
    defaultVisible: true,
    value: (row) => numberCell(row.revenueLastMonth),
  },
  {
    key: "customerGroup",
    label: "Customer group",
    defaultVisible: true,
    value: (row) =>
      row.customerGroup ? CUSTOMER_GROUP_LABELS[row.customerGroup] : null,
  },
  {
    key: "lastCallDate",
    label: "Last call date",
    defaultVisible: true,
    value: (row) => dateCell(row.lastCallDate),
  },
  {
    key: "callUpcomingMonth",
    label: "Call upcoming month",
    defaultVisible: true,
    value: (row) => textCell(monthOfDate(row.callUpcoming)),
  },
  {
    key: "lastVisitDate",
    label: "Last visit date",
    defaultVisible: true,
    value: (row) => dateCell(row.lastVisitDate),
  },
  {
    key: "visitUpcomingMonth",
    label: "Visit upcoming month",
    defaultVisible: true,
    value: (row) => textCell(monthOfDate(row.visitUpcoming)),
  },
  {
    key: "contactPerson",
    label: "Contact person",
    defaultVisible: true,
    value: (row) =>
      textCell(
        [row.contactFirstName, row.contactLastName].filter(Boolean).join(" ") ||
          null,
      ),
  },
  {
    key: "contactEmail",
    label: "Contact e-mail",
    defaultVisible: true,
    value: (row) => textCell(row.contactEmail),
  },
  {
    key: "contactMobile",
    label: "Contact mobile no.",
    defaultVisible: true,
    value: (row) => textCell(row.contactMobile),
  },
  {
    key: "regionNumber",
    label: "Region number",
    defaultVisible: false,
    // `0` on every reference row, and nothing here numbers a region.
    value: () => null,
  },
  {
    key: "region",
    label: "Region",
    defaultVisible: true,
    value: (row) => textCell(row.region),
  },
  {
    key: "planMonth",
    label: "Month",
    defaultVisible: true,
    value: (row) => textCell(row.planPeriodLabel),
  },
  {
    key: "planCall",
    label: "Call",
    defaultVisible: true,
    value: (row) => yesNoCell(row.planCall),
  },
  {
    key: "planVisit",
    label: "Visit",
    defaultVisible: true,
    value: (row) => yesNoCell(row.planVisit),
  },
  {
    key: "callDue",
    label: "Call due",
    defaultVisible: true,
    value: (row) => yesNoCell(row.callDue),
  },
  {
    key: "visitDue",
    label: "Visit due",
    defaultVisible: true,
    value: (row) => yesNoCell(row.visitDue),
  },
];
