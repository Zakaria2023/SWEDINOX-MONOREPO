import {
  STOCK_LOT_COLUMNS,
  StockLotColumnKey,
} from "@/app/(dashboard)/stock-on-location/columns";
import { StockLotView, stockLotViews } from "@/lib/enums";

// What `Standaard` shows (docs/reference-system/stock-on-location.md): the lot,
// where it is, what it is, how much, what it is worth and where it came from.
const STANDAARD_COLUMNS: readonly StockLotColumnKey[] = [
  "location",
  "blocked",
  "productCode",
  "productType",
  "quality",
  "stockCategory",
  "options",
  "lengthMm",
  "widthMm",
  "thickness",
  "quantity",
  "reserved",
  "available",
  "stockUnit",
  "quantityKg",
  "stockValue",
  "charge",
  "internalCharge",
  "bundle",
  "supplier",
  "purchaseOrder",
  "receiptDate",
];

// `GIP` adds the valuation columns and sorts newest change first; `Controle`
// adds the warehouse above the location.
const VIEW_COLUMNS: Record<StockLotView, readonly StockLotColumnKey[]> = {
  standaard: STANDAARD_COLUMNS,
  gip: [...STANDAARD_COLUMNS, "gipGroup", "valuationPrice", "updatedAt"],
  verkocht: STANDAARD_COLUMNS,
  beschikbare_voorraad: STANDAARD_COLUMNS,
  controle: ["section", ...STANDAARD_COLUMNS],
  cuvelje: STANDAARD_COLUMNS,
  available_in_house: STANDAARD_COLUMNS,
};

/** The view a URL names, or `Standaard` when it names none or a wrong one. */
export const stockLotViewOf = (value: string | undefined): StockLotView =>
  stockLotViews.find((view) => view === value) ?? "standaard";

/** The columns a view opens with; the column selector still offers the rest. */
export const stockLotViewVisibility = (
  view: StockLotView,
): Partial<Record<StockLotColumnKey, boolean>> => {
  const shown = new Set<StockLotColumnKey>(VIEW_COLUMNS[view]);
  return Object.fromEntries(
    STOCK_LOT_COLUMNS.map((col) => [col.key, shown.has(col.key)]),
  );
};
