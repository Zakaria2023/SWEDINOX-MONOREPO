import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { ProductGroupOption } from "@/app/(dashboard)/product-groups/actions";
import { articleGroups } from "@/lib/enums";
import { companyOptionLabel } from "@/lib/helpers";
import { ARTICLE_GROUP_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

export const productFilters = (
  productGroups: ProductGroupOption[],
  companies: CompanyOption[],
): TableFilterControl[] => [
  {
    key: "productGroup",
    kind: "select",
    label: "Product group",
    placeholder: "All groups",
    options: productGroups.map((group) => ({
      value: group.uuid,
      label: group.name,
    })),
  },
  {
    key: "articleGroup",
    kind: "select",
    label: "Article group",
    options: articleGroups.map((group) => ({
      value: group,
      label: ARTICLE_GROUP_LABELS[group],
    })),
  },
  {
    key: "company",
    kind: "select",
    label: "Company",
    placeholder: "Whole catalogue",
    options: companies.map((company) => ({
      value: company.uuid,
      label: companyOptionLabel(company),
    })),
  },
  {
    key: "stockProduct",
    kind: "select",
    label: "Stock product",
    placeholder: "Any",
    options: [
      { value: "true", label: "Stocked" },
      { value: "false", label: "Not stocked" },
    ],
  },
  {
    key: "blockedForPurchasing",
    kind: "select",
    label: "Purchasing",
    placeholder: "Any",
    options: [
      { value: "false", label: "Buyable" },
      { value: "true", label: "Blocked" },
    ],
  },
];
