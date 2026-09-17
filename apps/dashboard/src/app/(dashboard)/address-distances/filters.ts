import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { companyOptionLabel } from "@/lib/helpers";
import { TableFilterControl } from "@/lib/table-query";

export const addressDistanceFilters = (
  countries: string[],
  companies: CompanyOption[],
): TableFilterControl[] => [
  {
    key: "country",
    kind: "select",
    label: "Country",
    placeholder: "All countries",
    options: countries.map((country) => ({
      value: country,
      label: country,
    })),
  },
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
  { key: "km", kind: "numberRange", label: "Km" },
];
