import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { REQUEST_STATUS_FILTER_PREFIX } from "@/app/(dashboard)/purchase-orders-and-quotes/documents";
import {
  purchaseOrderStatuses,
  purchaseOrderTypes,
  purchaseQuoteStatuses,
  purchaseRequestStatuses,
} from "@/lib/enums";
import { companyOptionLabel } from "@/lib/helpers";
import {
  PURCHASE_ORDER_STATUS_LABELS,
  PURCHASE_ORDER_TYPE_LABELS,
  PURCHASE_QUOTE_STATUS_LABELS,
  PURCHASE_REQUEST_STATUS_LABELS,
} from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

export const purchaseOrderQuoteFilters = (
  suppliers: CompanyOption[],
): TableFilterControl[] => [
  // The reference's own filter on this screen.
  { key: "creationDate", kind: "dateRange", label: "Creation date" },
  {
    key: "kind",
    kind: "select",
    label: "Document",
    placeholder: "Orders and quotes",
    options: [
      { value: "Order", label: "Orders only" },
      { value: "Quote", label: "Quotes only" },
      { value: "Return", label: "Returns only" },
      { value: "Request", label: "Requests only" },
    ],
  },
  {
    // Three ladders in one control, each labelled by the document it belongs
    // to: a quote is never "pre-notified" and an order is never "lost", so
    // those values cannot collide. A request's can — it shares `awarded` with
    // a quote and `cancelled` with an order — so its values carry a prefix.
    key: "status",
    kind: "select",
    label: "Status",
    placeholder: "Any status",
    options: [
      ...purchaseOrderStatuses.map((status) => ({
        value: status,
        label: `Order — ${PURCHASE_ORDER_STATUS_LABELS[status]}`,
      })),
      ...purchaseQuoteStatuses.map((status) => ({
        value: status,
        label: `Quote — ${PURCHASE_QUOTE_STATUS_LABELS[status]}`,
      })),
      ...purchaseRequestStatuses.map((status) => ({
        value: `${REQUEST_STATUS_FILTER_PREFIX}${status}`,
        label: `Request — ${PURCHASE_REQUEST_STATUS_LABELS[status]}`,
      })),
    ],
  },
  {
    key: "orderType",
    kind: "select",
    label: "Order type",
    placeholder: "All types",
    options: purchaseOrderTypes.map((type) => ({
      value: type,
      label: PURCHASE_ORDER_TYPE_LABELS[type],
    })),
  },
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
];
