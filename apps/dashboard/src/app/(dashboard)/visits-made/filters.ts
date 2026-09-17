import {
  customerGroups,
  visitReportCategories,
  visitReportContactMethods,
  visitReportReasons,
} from "@/lib/enums";
import {
  CUSTOMER_GROUP_LABELS,
  VISIT_REPORT_CATEGORY_LABELS,
  VISIT_REPORT_CONTACT_METHOD_LABELS,
  VISIT_REPORT_REASON_LABELS,
} from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

export const visitMadeFilters = (regions: string[]): TableFilterControl[] => [
  { key: "visitDate", kind: "dateRange", label: "Visiting date" },
  {
    key: "contactMethod",
    kind: "select",
    label: "Contact",
    placeholder: "Visit or call",
    options: visitReportContactMethods.map((method) => ({
      value: method,
      label: VISIT_REPORT_CONTACT_METHOD_LABELS[method],
    })),
  },
  {
    key: "hasTakenPlace",
    kind: "select",
    label: "Took place",
    placeholder: "Happened or not",
    options: [
      { value: "true", label: "Took place" },
      { value: "false", label: "Did not take place" },
    ],
  },
  {
    key: "visitReason",
    kind: "select",
    label: "Reason",
    placeholder: "All reasons",
    options: visitReportReasons.map((reason) => ({
      value: reason,
      label: VISIT_REPORT_REASON_LABELS[reason],
    })),
  },
  {
    key: "category",
    kind: "select",
    label: "Category",
    placeholder: "All categories",
    options: visitReportCategories.map((category) => ({
      value: category,
      label: VISIT_REPORT_CATEGORY_LABELS[category],
    })),
  },
  {
    key: "region",
    kind: "select",
    label: "Region",
    placeholder: "All regions",
    options: regions.map((region) => ({ value: region, label: region })),
  },
  {
    key: "customerGroup",
    kind: "select",
    label: "Customer group",
    placeholder: "All groups",
    options: customerGroups.map((group) => ({
      value: group,
      label: CUSTOMER_GROUP_LABELS[group],
    })),
  },
];
