import { companyRoles } from "@/lib/enums";
import { COMPANY_ROLE_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

export const INACTIVE_COMPANY_FILTER_CONTROLS: TableFilterControl[] = [
  {
    key: "role",
    kind: "select",
    label: "Role",
    placeholder: "All roles",
    options: companyRoles.map((role) => ({
      value: role,
      label: COMPANY_ROLE_LABELS[role],
    })),
  },
  { key: "lastModified", kind: "dateRange", label: "Date last modified" },
];
