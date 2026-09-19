import { salesRepresentatives } from "@/lib/enums";
import { SALES_REPRESENTATIVE_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

/**
 * The one filter this report supports.
 *
 * A remark belongs to an account, and the person who wants to read a run of
 * them is the representative who owns those accounts.
 */
export const REMARK_PER_COMPANY_FILTER_CONTROLS: TableFilterControl[] = [
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
