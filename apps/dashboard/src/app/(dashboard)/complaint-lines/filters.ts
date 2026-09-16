import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { ProductOption } from "@/app/(dashboard)/products/actions";
import {
  complaintCategories,
  complaintStatuses,
  complaintTypes,
} from "@/lib/enums";
import { companyOptionLabel } from "@/lib/helpers";
import {
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_TYPE_LABELS,
} from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

export const complaintLineFilters = (
  companies: CompanyOption[],
  products: ProductOption[],
): TableFilterControl[] => [
  // The reference's one filter.
  { key: "reportDate", kind: "dateRange", label: "Report date" },
  {
    key: "status",
    kind: "select",
    label: "Status",
    options: complaintStatuses.map((status) => ({
      value: status,
      label: COMPLAINT_STATUS_LABELS[status],
    })),
  },
  {
    key: "complaintType",
    kind: "select",
    label: "Complaint type",
    options: complaintTypes.map((type) => ({
      value: type,
      label: COMPLAINT_TYPE_LABELS[type],
    })),
  },
  {
    key: "category",
    kind: "select",
    label: "Category",
    options: complaintCategories.map((category) => ({
      value: category,
      label: COMPLAINT_CATEGORY_LABELS[category],
    })),
  },
  {
    key: "completed",
    kind: "select",
    label: "Line completed",
    placeholder: "Completed or not",
    options: [
      { value: "false", label: "Open" },
      { value: "true", label: "Completed" },
    ],
  },
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
];
