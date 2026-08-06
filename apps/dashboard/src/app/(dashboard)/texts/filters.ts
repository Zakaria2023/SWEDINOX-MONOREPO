import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { TextCategoryOption } from "@/app/(dashboard)/text-categories/actions";
import { companyOptionLabel } from "@/lib/helpers";
import { TableFilterControl } from "@/lib/table-query";

export const textFilters = (
  companies: CompanyOption[],
  categories: TextCategoryOption[],
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
    key: "textCategory",
    kind: "select",
    label: "Category",
    placeholder: "All categories",
    options: categories.map((category) => ({
      value: category.uuid,
      label: category.name,
    })),
  },
];
