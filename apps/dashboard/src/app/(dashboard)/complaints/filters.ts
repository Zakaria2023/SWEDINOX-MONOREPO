import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { ProductOption } from "@/app/(dashboard)/products/actions";
import {
  complaintCategories,
  complaintCauses,
  complaintSolutions,
  complaintStatuses,
} from "@/lib/enums";
import { companyOptionLabel } from "@/lib/helpers";
import {
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_CAUSE_LABELS,
  COMPLAINT_SOLUTION_LABELS,
  COMPLAINT_STATUS_LABELS,
} from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

export const complaintFilters = (
  companies: CompanyOption[],
  products: ProductOption[],
): TableFilterControl[] => [
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
    key: "category",
    kind: "select",
    label: "Category",
    options: complaintCategories.map((category) => ({
      value: category,
      label: COMPLAINT_CATEGORY_LABELS[category],
    })),
  },
  {
    key: "cause",
    kind: "select",
    label: "Cause",
    options: complaintCauses.map((cause) => ({
      value: cause,
      label: COMPLAINT_CAUSE_LABELS[cause],
    })),
  },
  {
    key: "solution",
    kind: "select",
    label: "Solution",
    options: complaintSolutions.map((solution) => ({
      value: solution,
      label: COMPLAINT_SOLUTION_LABELS[solution],
    })),
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
  { key: "reportDate", kind: "dateRange", label: "Report date" },
];
