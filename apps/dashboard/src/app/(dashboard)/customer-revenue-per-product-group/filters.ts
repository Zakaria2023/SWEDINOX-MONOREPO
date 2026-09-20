import {
  customerGroups,
  orderSourceTypes,
  salesRepresentatives,
} from "@/lib/enums";
import {
  CUSTOMER_GROUP_LABELS,
  ORDER_SOURCE_TYPE_LABELS,
  SALES_REPRESENTATIVE_LABELS,
} from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

/**
 * Three region axes exist and they are not alternatives: `Region` is the
 * customer's sales zone, `Transport region` is the country group a load ships
 * to, and the address's own region is a third. Both of the first two are
 * offered here because the reference prints both.
 */
export const customerRevenuePerProductGroupFilters = (
  regions: string[],
  transportRegions: string[],
): TableFilterControl[] => [
  { key: "invoiceDate", kind: "dateRange", label: "Invoice date" },
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
    key: "orderType",
    kind: "select",
    label: "Order type",
    placeholder: "All types",
    options: orderSourceTypes.map((type) => ({
      value: type,
      label: ORDER_SOURCE_TYPE_LABELS[type],
    })),
  },
  {
    key: "region",
    kind: "select",
    label: "Region",
    placeholder: "All regions",
    options: regions.map((region) => ({ value: region, label: region })),
  },
  {
    key: "transportRegion",
    kind: "select",
    label: "Transport region",
    placeholder: "All transport regions",
    options: transportRegions.map((region) => ({
      value: region,
      label: region,
    })),
  },
];
