import { salesRepresentatives } from "@/lib/enums";
import { SALES_REPRESENTATIVE_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

/**
 * The screen lists every company the way the reference's report does, so the
 * first filter is the one that brings back the old behaviour: only the
 * accounts somebody has actually written up. The second is the representative,
 * since a remark belongs to an account and it is that account's owner who
 * wants to read a run of them.
 */
export const REMARK_PER_COMPANY_FILTER_CONTROLS: TableFilterControl[] = [
  {
    key: "hasRemark",
    kind: "select",
    label: "Has a remark",
    placeholder: "All companies",
    options: [
      { value: "yes", label: "With a remark" },
      { value: "no", label: "Without one" },
    ],
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
