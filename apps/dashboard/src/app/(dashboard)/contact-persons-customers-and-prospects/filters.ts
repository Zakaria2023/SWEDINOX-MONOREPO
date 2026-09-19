import {
  companyClassifications,
  contactCategories,
  customerGroups,
  salesRepresentatives,
} from "@/lib/enums";
import {
  CONTACT_CATEGORY_LABELS,
  CUSTOMER_GROUP_LABELS,
  SALES_REPRESENTATIVE_LABELS,
} from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

/**
 * What the contact list can be narrowed by.
 *
 * Category first: it is the only filter that is about the *contact* rather than
 * the company they work for, and "who do I send this to" is usually a question
 * about their role.
 */
export const contactPersonFilters = (
  regions: string[],
): TableFilterControl[] => [
  {
    key: "category",
    kind: "select",
    label: "Category",
    placeholder: "All categories",
    options: contactCategories.map((category) => ({
      value: category,
      label: CONTACT_CATEGORY_LABELS[category],
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
    key: "region",
    kind: "select",
    label: "Region",
    placeholder: "All regions",
    options: regions.map((region) => ({ value: region, label: region })),
  },
];
