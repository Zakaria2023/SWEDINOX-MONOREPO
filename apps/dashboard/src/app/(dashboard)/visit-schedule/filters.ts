import {
  companyClassifications,
  customerGroups,
  salesRepresentatives,
} from "@/lib/enums";
import {
  CUSTOMER_GROUP_LABELS,
  SALES_REPRESENTATIVE_LABELS,
} from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

/**
 * What the three schedule screens can be narrowed by.
 *
 * `withPlan` adds the one filter that only means something where a month is
 * being shown: what has been ticked for it. The plain list has no month, so it
 * is not offered there.
 */
export const visitScheduleFilterControls = (
  regions: string[],
  withPlan: boolean,
): TableFilterControl[] => [
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
  {
    key: "classification",
    kind: "select",
    label: "Classification",
    placeholder: "A, B or C",
    options: companyClassifications.map((classification) => ({
      value: classification,
      label: classification,
    })),
  },
  {
    key: "accountManager",
    kind: "select",
    label: "Account manager",
    placeholder: "All account managers",
    options: salesRepresentatives.map((representative) => ({
      value: representative,
      label: SALES_REPRESENTATIVE_LABELS[representative],
    })),
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
  ...(withPlan
    ? [
        {
          key: "planned",
          kind: "select" as const,
          label: "Planned",
          placeholder: "Anything",
          options: [
            { value: "either", label: "Call or visit planned" },
            { value: "call", label: "Call planned" },
            { value: "visit", label: "Visit planned" },
            { value: "none", label: "Nothing planned" },
          ],
        },
      ]
    : []),
];
