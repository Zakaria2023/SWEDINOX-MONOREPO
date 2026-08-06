import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { addressCategories } from "@/lib/enums";
import { ADDRESS_CATEGORY_LABELS } from "@/lib/labels";
import { companyOptionLabel } from "@/lib/helpers";
import { TableFilterControl } from "@/lib/table-query";

/**
 * The controls the addresses toolbar offers, keyed to the bindings in
 * actions.ts. Client-safe on purpose: a binding closes over a Drizzle column
 * and cannot be handed to a client component, so the two halves of a filter are
 * declared apart and joined by their key.
 *
 * The company list is loaded on the server and passed in rather than fetched
 * here, so the toolbar stays a rendering concern.
 */
export const addressFilters = (
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
    key: "category",
    kind: "select",
    label: "Category",
    options: addressCategories.map((category) => ({
      value: category,
      label: ADDRESS_CATEGORY_LABELS[category],
    })),
  },
];
