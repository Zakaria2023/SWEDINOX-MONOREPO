import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { ProductOption } from "@/app/(dashboard)/products/actions";
import { companyOptionLabel } from "@/lib/helpers";
import { TableFilterControl } from "@/lib/table-query";

export const invoiceLineFilters = (
  companies: CompanyOption[],
  products: ProductOption[],
): TableFilterControl[] => [
  {
    key: "company",
    kind: "select",
    label: "Customer",
    placeholder: "All customers",
    options: companies.map((company) => ({
      value: company.uuid,
      label: companyOptionLabel(company),
    })),
  },
  {
    key: "product",
    kind: "select",
    label: "Product",
    placeholder: "All products",
    options: products.map((product) => ({
      value: product.uuid,
      label: `${product.productCode} — ${product.name}`,
    })),
  },
  { key: "invoiceDate", kind: "dateRange", label: "Invoice date" },
  { key: "amount", kind: "numberRange", label: "Amount" },
];
