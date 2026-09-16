import { TransportRegionOption } from "@/app/(dashboard)/transport-by-region/actions";
import { tripStatuses } from "@/lib/enums";
import { TRIP_STATUS_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

export const transportByRegionFilters = (
  regions: TransportRegionOption[],
): TableFilterControl[] => [
  { key: "transportDate", kind: "dateRange", label: "Transport date" },
  {
    key: "region",
    kind: "select",
    label: "Region",
    placeholder: "All regions",
    options: regions,
  },
  {
    key: "tripStatus",
    kind: "select",
    label: "Trip status",
    placeholder: "All trip statuses",
    options: tripStatuses.map((status) => ({
      value: status,
      label: TRIP_STATUS_LABELS[status],
    })),
  },
  {
    // Deliver takes goods out to a customer; Pick-up fetches them — a
    // purchase order's goods, or material back from a processor.
    key: "action",
    kind: "select",
    label: "Action",
    placeholder: "Deliver and pick-up",
    options: [
      { value: "deliver", label: "Deliver" },
      { value: "pick-up", label: "Pick-up" },
    ],
  },
];
