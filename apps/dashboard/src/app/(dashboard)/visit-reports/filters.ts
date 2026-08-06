import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { visitReportReasons } from "@/lib/enums";
import { companyOptionLabel } from "@/lib/helpers";
import { VISIT_REPORT_REASON_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

export const visitReportFilters = (
  companies: CompanyOption[],
): TableFilterControl[] => [
  {
    key: "company",
    kind: "select",
    label: "Company",
    placeholder: "All companies",
    options: companies.map((company) => ({
      value: company.uuid,
      label: companyOptionLabel(company),
    })),
  },
  {
    key: "visitReason",
    kind: "select",
    label: "Reason",
    options: visitReportReasons.map((reason) => ({
      value: reason,
      label: VISIT_REPORT_REASON_LABELS[reason],
    })),
  },
  { key: "visitDate", kind: "dateRange", label: "Visit date" },
];
