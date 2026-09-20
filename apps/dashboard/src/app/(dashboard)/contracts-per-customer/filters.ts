import { contractableRoles, salesRepresentatives } from "@/lib/enums";
import { COMPANY_ROLE_LABELS, SALES_REPRESENTATIVE_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

/**
 * Five contract codes cover all 173 of the reference's rows, and two of them
 * cover 164 — so the code is the filter that matters here.
 */
export const contractsPerCustomerFilters = (
  codes: string[],
): TableFilterControl[] => [
  {
    key: "code",
    kind: "select",
    label: "Contract code",
    placeholder: "All contracts",
    options: codes.map((code) => ({ value: code, label: code })),
  },
  {
    key: "role",
    kind: "select",
    label: "Company role",
    placeholder: "Customers and prospects",
    options: contractableRoles
      .filter((role) => role === "customer" || role === "prospect")
      .map((role) => ({ value: role, label: COMPANY_ROLE_LABELS[role] })),
  },
  {
    key: "representative",
    kind: "select",
    label: "Representative",
    placeholder: "All representatives",
    options: salesRepresentatives.map((representative) => ({
      value: representative,
      label: SALES_REPRESENTATIVE_LABELS[representative],
    })),
  },
];
