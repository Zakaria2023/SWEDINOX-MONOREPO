import { VisitMadeRow } from "@/app/(dashboard)/visits-made/actions";
import { dateCell, ExportColumn, textCell, yesNoCell } from "@/lib/excel";
import { visitReasonsLabel } from "@/lib/helpers";
import {
  CUSTOMER_GROUP_LABELS,
  VISIT_REPORT_CATEGORY_LABELS,
  VISIT_REPORT_CONTACT_METHOD_LABELS,
} from "@/lib/labels";

/**
 * Visits made as a sheet — the reference's columns, in its order.
 *
 * Two of its sixteen are left out on purpose: `Region number` and
 * `Customer group code` are `0` on all 166 of its rows, sentinels rather than
 * data, and the named `Region` and `Customer group` beside them carry the
 * value.
 */

export type VisitMadeColumnKey =
  | "representative"
  | "customerCode"
  | "companyName"
  | "postalCode"
  | "city"
  | "visitDate"
  | "visitTime"
  | "visitedBy"
  | "contactPerson"
  | "categories"
  | "contactMethod"
  | "hasTakenPlace"
  | "visitReasons"
  | "region"
  | "customerGroup";

export const VISIT_MADE_COLUMNS: Array<
  ExportColumn<VisitMadeRow, VisitMadeColumnKey>
> = [
  {
    key: "representative",
    label: "Representative",
    defaultVisible: true,
    value: (row) => textCell(row.representative),
  },
  {
    key: "customerCode",
    label: "Customer code",
    defaultVisible: true,
    value: (row) => textCell(row.customerCode),
  },
  {
    key: "companyName",
    label: "Company",
    defaultVisible: true,
    value: (row) => textCell(row.companyName),
  },
  {
    key: "postalCode",
    label: "Postal code",
    defaultVisible: true,
    value: (row) => textCell(row.postalCode),
  },
  {
    key: "city",
    label: "City",
    defaultVisible: true,
    value: (row) => textCell(row.city),
  },
  {
    key: "visitDate",
    label: "Visiting date",
    defaultVisible: true,
    value: (row) => dateCell(row.visitDate),
  },
  {
    key: "visitTime",
    label: "Time",
    defaultVisible: true,
    value: (row) => textCell(row.visitTime),
  },
  {
    key: "visitedBy",
    label: "Visited by",
    defaultVisible: true,
    value: (row) => textCell(row.visitedBy),
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
    key: "categories",
    label: "Categories",
    defaultVisible: true,
    value: (row) =>
      textCell(
        row.categories && row.categories.length > 0
          ? row.categories
              .map((category) => VISIT_REPORT_CATEGORY_LABELS[category])
              .join(", ")
          : null,
      ),
  },
  {
    key: "contactMethod",
    label: "Contact",
    defaultVisible: true,
    value: (row) =>
      row.contactMethod
        ? VISIT_REPORT_CONTACT_METHOD_LABELS[row.contactMethod]
        : null,
  },
  {
    key: "hasTakenPlace",
    label: "Took place",
    defaultVisible: true,
    value: (row) => yesNoCell(row.hasTakenPlace),
  },
  {
    key: "visitReasons",
    label: "Visit reasons",
    defaultVisible: true,
    value: (row) => textCell(visitReasonsLabel(row.visitReasons)),
  },
  {
    key: "region",
    label: "Region",
    defaultVisible: true,
    value: (row) => textCell(row.region),
  },
  {
    key: "customerGroup",
    label: "Customer group",
    defaultVisible: true,
    value: (row) =>
      row.customerGroup ? CUSTOMER_GROUP_LABELS[row.customerGroup] : null,
  },
];
