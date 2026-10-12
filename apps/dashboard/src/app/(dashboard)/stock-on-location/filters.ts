import { LocationOption } from "@/app/(dashboard)/locations/actions";
import { stockLotViews } from "@/lib/enums";
import { STOCK_LOT_VIEW_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

// The reference's saved views, as filters: `Verkocht` (reserved) against
// `Beschikbare voorraad` (free) — which together partition the whole stock —
// one location, blocked lots, and the stock category.
export const stockLotFilters = (
  locations: LocationOption[],
): TableFilterControl[] => [
  // The reference's `View` dropdown: a column set and a filter in one.
  {
    key: "view",
    kind: "select",
    label: "View",
    placeholder: STOCK_LOT_VIEW_LABELS.standaard,
    options: stockLotViews.map((view) => ({
      value: view,
      label: STOCK_LOT_VIEW_LABELS[view],
    })),
  },
  { key: "productCode", kind: "textRange", label: "Product code" },
  {
    key: "bundles",
    kind: "list",
    label: "Bundles",
    placeholder: "404766, 404767 …",
  },
  {
    key: "reserved",
    kind: "select",
    label: "Reserved",
    placeholder: "All lots",
    options: [
      { value: "reserved", label: "Sold (reserved)" },
      { value: "free", label: "Available (not reserved)" },
    ],
  },
  {
    key: "location",
    kind: "select",
    label: "Location",
    placeholder: "All locations",
    options: locations.map((location) => ({
      value: location.uuid,
      label: location.name,
    })),
  },
  {
    key: "blocked",
    kind: "select",
    label: "Blocked",
    placeholder: "Blocked or not",
    options: [
      { value: "true", label: "Blocked" },
      { value: "false", label: "Not blocked" },
    ],
  },
  {
    key: "stockCategory",
    kind: "select",
    label: "Stock category",
    placeholder: "Any category",
    options: [
      { value: "2nd choice", label: "2nd choice" },
      { value: "Scrap", label: "Scrap" },
      { value: "Remaining", label: "Remaining" },
    ],
  },
];
