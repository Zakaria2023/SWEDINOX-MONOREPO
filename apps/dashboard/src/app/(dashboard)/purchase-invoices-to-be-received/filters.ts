import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { companyOptionLabel } from "@/lib/helpers";
import { TableFilterControl } from "@/lib/table-query";

export const purchaseInvoiceToReceiveFilters = (
  suppliers: CompanyOption[],
): TableFilterControl[] => [
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
  { key: "orderDate", kind: "dateRange", label: "Order date" },
  {
    key: "scheduledDeliveryDate",
    kind: "dateRange",
    label: "Scheduled delivery",
  },
];
