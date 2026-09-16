import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { ProductOption } from "@/app/(dashboard)/products/actions";
import { companyOptionLabel } from "@/lib/helpers";
import { TableFilterControl } from "@/lib/table-query";

export const batchFilters = (
  suppliers: CompanyOption[],
  products: ProductOption[],
): TableFilterControl[] => [
  { key: "receiptDate", kind: "dateRange", label: "Receipt date" },
  {
    key: "supplier",
    kind: "select",
    label: "Supplier",
    placeholder: "All suppliers",
    options: suppliers.map((supplier) => ({
      value: supplier.uuid,
      label: companyOptionLabel(supplier),
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
  {
    // Excused from the certificate: in the reference, exactly the stock that
    // was taken over at go-live.
    key: "mandatoryIgnoreDocument",
    kind: "select",
    label: "Mand. ign. doc.",
    placeholder: "Excused or not",
    options: [
      { value: "true", label: "Excused from certificate" },
      { value: "false", label: "Certificate required" },
    ],
  },
];
