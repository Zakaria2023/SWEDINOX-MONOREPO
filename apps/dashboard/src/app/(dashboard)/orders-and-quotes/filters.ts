import { orderStatuses, salesDocumentKinds } from "@/lib/enums";
import { ORDER_STATUS_LABELS, SALES_DOCUMENT_KIND_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

/**
 * Four series share this grid, so the first filter is which of them to show.
 * The second is the one the screen is worked from: what is still to go out.
 */
export const ORDER_OR_QUOTE_FILTER_CONTROLS: TableFilterControl[] = [
  {
    key: "kind",
    kind: "select",
    label: "Document",
    placeholder: "All documents",
    options: salesDocumentKinds.map((kind) => ({
      value: kind,
      label: SALES_DOCUMENT_KIND_LABELS[kind],
    })),
  },
  {
    key: "stillToSend",
    kind: "select",
    label: "Send",
    placeholder: "Sent and unsent",
    options: [
      { value: "yes", label: "Still to send" },
      { value: "no", label: "Nothing to send" },
    ],
  },
  {
    key: "status",
    kind: "select",
    label: "Status",
    placeholder: "All statuses",
    options: orderStatuses.map((status) => ({
      value: status,
      label: ORDER_STATUS_LABELS[status],
    })),
  },
];
