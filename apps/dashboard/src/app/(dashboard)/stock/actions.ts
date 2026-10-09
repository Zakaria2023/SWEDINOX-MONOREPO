"use server";

import { db } from "@/db";
import { SelectStock, Stock } from "@/db/schema/stock";
import {
  SelectStockMovements,
  StockMovements,
} from "@/db/schema/stock-movements";
import { Products, SelectProducts } from "@/db/schema/products";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import {
  PurchaseOrderItems,
  SelectPurchaseOrderItems,
} from "@/db/schema/purchase-order-items";
import {
  SelectStockOptions,
  StockOptions,
} from "@/db/schema/stock-options";
import { Reservations, SelectReservations } from "@/db/schema/reservations";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import {
  PurchaseLineReceivals,
  SelectPurchaseLineReceivals,
} from "@/db/schema/purchase-line-receivals";
import {
  ProductionWorkOrderLines,
  ProductionWorkOrderPicks,
  ProductionWorkOrders,
  SelectProductionWorkOrders,
  SelectProductionWorkOrderLines,
} from "@/db/schema/production-work-orders";
import {
  SelectWarehouses,
  Warehouses,
} from "@/db/schema/warehouses";
import {
  WarehouseWorkOrderLines,
  WarehouseWorkOrders,
} from "@/db/schema/warehouse-work-orders";
import {
  describeError,
  generateUuid,
  LotLedger,
  lotLedger,
  LotWeights,
  lotWeights,
  normaliseCharge,
  STOCK_QUANTITY_SCALE,
} from "@/lib/helpers";
import { stockStatuses } from "@/lib/enums";
import {
  RELOCATION_REASON_LABELS,
  STOCK_LABEL_TYPE_LABELS,
} from "@/lib/labels";
import { requireAuth } from "@/lib/auth";
import {
  applyStockCorrection,
  applyStockSplit,
  applyStockTransfer,
} from "@/lib/server/stock-movements";
import { registerBatchForLot } from "@/lib/server/batches";
import { dryRun } from "@/lib/server/dry-run";
import { nextWorkOrderNumber } from "@/lib/server/work-order-numbers";
import {
  BatchRegistrationFormValues,
  batchRegistrationSchema,
  StockCorrectionFormValues,
  stockCorrectionSchema,
  StockLabelFormValues,
  stockLabelSchema,
  StockOptionsSaveValues,
  stockOptionsSaveSchema,
  StockRelocateFormValues,
  stockRelocateSchema,
  StockSplitFormValues,
  stockSplitSchema,
  StockTransferFormValues,
  stockTransferSchema,
} from "@/app/(dashboard)/stock/validation";
import { revalidatePath } from "next/cache";
import {
  booleanFilter,
  dateRangeFilter,
  enumFilter,
  numberRangeFilter,
  relationFilter,
  runPaged,
  tableOrderBy,
  tableWhere,
} from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { exportRows } from "@/lib/server/excel";
import { STOCK_COLUMNS } from "@/app/(dashboard)/stock/columns";
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  inArray,
  isNotNull,
  sum,
} from "drizzle-orm";

export type StockListItem = SelectStock & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  companyName: SelectCompanies["companyName"] | null;
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  originalQuantity: SelectPurchaseOrderItems["quantity"] | null;
};

export type StockDetail = StockListItem & {
  movements: SelectStockMovements[];
};

/** The Drizzle transaction handle passed into db.transaction(async (tx) => ...). */
type StockTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * One row of the `Reserveringen…` grid.
 *
 * `Order/R…` is order number and line in one cell (`O107163/20`), which is why
 * both arrive separately and the component joins them — a single stored string
 * could not link through to the order.
 */
export type LotReservationRow = {
  uuid: SelectReservations["uuid"];
  type: SelectReservations["type"];
  status: SelectReservations["status"];
  quantity: SelectReservations["quantity"];
  unit: SelectReservations["unit"];
  quantityKg: SelectReservations["quantityKg"];
  reservedFor: SelectReservations["reservedFor"];
  changedAt: SelectReservations["changedAt"];
  updatedAt: SelectReservations["updatedAt"];
  orderItemUuid: SelectReservations["orderItemUuid"];
  orderUuid: SelectOrders["uuid"] | null;
  orderNumber: SelectOrders["id"] | null;
  lineNumber: SelectOrderItems["lineNumber"] | null;
  companyName: SelectCompanies["companyName"] | null;
};

/** One `Inkoopleveringen` row — a reception, not a purchase line. */
export type SupplierDeliveryRow = {
  receivalUuid: SelectPurchaseLineReceivals["uuid"];
  purchaseOrderItemUuid: SelectPurchaseLineReceivals["purchaseOrderItemUuid"];
  purchaseOrderNumber: SelectPurchaseOrders["id"] | null;
  lineNumber: SelectPurchaseOrderItems["lineNumber"] | null;
  supplierCode: SelectCompanies["id"] | null;
  supplierName: SelectCompanies["companyName"] | null;
  /** `Artikel code` — the article the receival was booked against. */
  productCode: SelectProducts["productCode"] | null;
  receiptDate: SelectPurchaseLineReceivals["receiptDate"];
  lengthMm: SelectPurchaseOrderItems["lengthMm"] | null;
  widthMm: SelectPurchaseOrderItems["widthMm"] | null;
  qtyWeighed: SelectPurchaseLineReceivals["qtyActual"];
  /** `hvh eh.` — the unit the weighed quantity is counted in. */
  unit: SelectPurchaseLineReceivals["unit"];
  kgWeighed: SelectPurchaseLineReceivals["kgActual"];
  charge: SelectPurchaseLineReceivals["charge"];
  internalCharge: SelectPurchaseLineReceivals["internalCharge"];
};

/** `Zaagopdracht` — two columns in the reference, `Opdra… /` and `Ordernr`. */
export type SawOrderRow = {
  lineUuid: SelectProductionWorkOrderLines["uuid"];
  workOrderNumber: SelectProductionWorkOrders["number"];
  orderNumber: SelectProductionWorkOrderLines["orderNumber"];
  plannedDate: SelectProductionWorkOrders["plannedDate"];
  status: SelectProductionWorkOrderLines["status"];
};

/** `Locatie zoeken` — a tree, flattened with the depth to indent by. */
export type LocationTreeRow = {
  uuid: SelectWarehouses["uuid"];
  parentUuid: SelectWarehouses["parentUuid"];
  name: SelectWarehouses["name"];
  type: SelectWarehouses["type"];
  locationType: SelectWarehouses["locationType"];
  blocked: SelectWarehouses["blocked"];
  depth: number;
};

/** Everything the `Voorraad` toolbar's dialogs need to open. */
export type StockLotDialogData = {
  lot: SelectStock & {
    productCode: SelectProducts["productCode"] | null;
    productName: SelectProducts["name"] | null;
    locationName: SelectWarehouses["name"] | null;
  };
  ledger: LotLedger;
  weights: LotWeights;
  /**
   * `Nieuw` · `Vrijgegeven` · `Klaar` — the quantity on this lot's warehouse
   * work order lines, per status. The left half of the summary the
   * correction and transfer dialogs open with (233, 240). Summed in SQL.
   */
  workOrderQuantities: { new: number; released: number; ready: number };
  reservations: LotReservationRow[];
  options: SelectStockOptions[];
  /**
   * What `Specificatie` may hold for each option — the specifications already
   * on record against it. Feeds the combo on `Voorraad opties` (249).
   */
  optionSpecifications: Pick<SelectStockOptions, "option" | "specification">[];
};

/** What every lot action reports back. */
export type StockLotActionResult = {
  error?: string;
  success?: boolean;
  /** The lot that resulted, where an action made a new one. */
  stockUuid?: string;
  /** A confirmation worth showing, e.g. what was queued for printing. */
  message?: string;
};

export type StockCorrectionResult = {
  error?: string;
  success?: boolean;
  /** How many ledger rows the correction wrote, for the confirmation. */
  movements?: number;
};

/** One ledger row a simulated correction would write. */
export type StockCorrectionPreviewRow = Pick<
  SelectStockMovements,
  | "type"
  | "reason"
  | "attribute"
  | "valueBefore"
  | "valueAfter"
  | "quantity"
  | "quantityKg"
  | "valueEur"
>;

export type StockLotFigures = Pick<
  SelectStock,
  "quantity" | "quantityKg" | "valuationEuro"
>;

export type StockCorrectionSimulation = {
  error?: string;
  /** Set once a simulation has run — the rows it would write. */
  rows?: StockCorrectionPreviewRow[];
  before?: StockLotFigures;
  after?: StockLotFigures;
};

const STOCK_SEARCH = [
  Products.productCode,
  Products.name,
  Stock.charge,
  Stock.internalCharge,
] as const;

const STOCK_SORTABLE = {
  createdAt: Stock.createdAt,
  product: Products.productCode,
  status: Stock.status,
  receiptDate: Stock.receiptDate,
  quantity: Stock.quantity,
  valuationEuro: Stock.valuationEuro,
};

// A lot is looked for by article, by state, by where it sits and by who supplied
// it. `blocked` is offered because blocked stock is on the shelf but cannot be
// sold, which is exactly the discrepancy someone is chasing when they ask.
const STOCK_FILTERS = {
  status: enumFilter(Stock.status, stockStatuses),
  product: relationFilter(Stock.productUuid),
  location: relationFilter(Stock.locationUuid),
  supplier: relationFilter(Stock.supplierUuid),
  receiptDate: dateRangeFilter(Stock.receiptDate),
  quantity: numberRangeFilter(Stock.quantity),
  blocked: booleanFilter(Stock.blocked),
};

/**
 * The rows one view of the stock overview selects, as a window onto them.
 * Shared by the page and the export.
 */
const stockRows =
  (query: TableQuery) =>
  (limit: number, offset: number): Promise<StockListItem[]> =>
    db
      .select({
        ...getTableColumns(Stock),
        productCode: Products.productCode,
        productName: Products.name,
        companyName: Companies.companyName,
        purchaseOrderId: PurchaseOrders.id,
        originalQuantity: PurchaseOrderItems.quantity,
      })
      .from(Stock)
      .leftJoin(Products, eq(Stock.productUuid, Products.uuid))
      // 🔴 The supplier this **lot** came from, not a company linked to the
      // article. Origin travels with the metal: the reference's Stock mutations
      // names the supplier and the purchase order on a lot even as it leaves
      // the building. Joining through `Products.companyUuid` showed a dash on
      // every row, because that link is empty on almost every article — and the
      // Supplier filter beside it already filtered on `Stock.supplierUuid`, so
      // the column and the filter were answering different questions.
      .leftJoin(Companies, eq(Stock.supplierUuid, Companies.uuid))
      .leftJoin(
        PurchaseOrders,
        eq(Stock.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(
        PurchaseOrderItems,
        eq(Stock.purchaseOrderItemUuid, PurchaseOrderItems.uuid),
      )
      .where(
        tableWhere({ query, search: STOCK_SEARCH, filters: STOCK_FILTERS }),
      )
      .orderBy(
        ...tableOrderBy(
          STOCK_SORTABLE,
          query,
          [desc(Stock.createdAt)],
          Stock.id,
        ),
      )
      .limit(limit)
      .offset(offset);

/** Every stock lot the current view matches, as a workbook. */
export const exportStock = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Stock",
    columns: STOCK_COLUMNS,
    columnKeys,
    rows: stockRows(parseTableQuery(params)),
  });

export const getStock = async (
  query: TableQuery,
): Promise<Paged<StockListItem>> => {
  try {
    const where = tableWhere({
      query,
      search: STOCK_SEARCH,
      filters: STOCK_FILTERS,
    });

    return await runPaged(query, {
      rows: stockRows(query),

      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(Stock)
          .leftJoin(Products, eq(Stock.productUuid, Products.uuid))
          .where(where);
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch stock"));
  }
};

export const getStockDetail = async (
  uuid: string,
): Promise<StockDetail | null> => {
  const [stockRow] = await db
    .select({
      ...getTableColumns(Stock),
      productCode: Products.productCode,
      productName: Products.name,
      companyName: Companies.companyName,
      purchaseOrderId: PurchaseOrders.id,
      originalQuantity: PurchaseOrderItems.quantity,
    })
    .from(Stock)
    .leftJoin(Products, eq(Stock.productUuid, Products.uuid))
    .leftJoin(Companies, eq(Stock.supplierUuid, Companies.uuid))
    .leftJoin(PurchaseOrders, eq(Stock.purchaseOrderUuid, PurchaseOrders.uuid))
    .leftJoin(
      PurchaseOrderItems,
      eq(Stock.purchaseOrderItemUuid, PurchaseOrderItems.uuid),
    )
    .where(eq(Stock.uuid, uuid))
    .limit(1);

  if (!stockRow) {
    return null;
  }

  const movements = await db
    .select()
    .from(StockMovements)
    .where(eq(StockMovements.stockUuid, uuid))
    .orderBy(desc(StockMovements.createdAt));

  return { ...stockRow, movements };
};

/**
 * The parameters both `OK` and `Simulate` hand to `applyStockCorrection`, so
 * the simulation cannot drift from the real correction.
 */
const stockCorrectionParams = (
  lot: SelectStock,
  values: StockCorrectionFormValues,
  userId: string,
): Parameters<typeof applyStockCorrection>[1] => ({
  source: lot,
  reason: values.reason,
  description: values.description?.trim() || null,
  quantity: values.correctQuantity ? Number(values.quantity) : undefined,
  quantityKg:
    values.correctQuantity && values.quantityKg
      ? Number(values.quantityKg)
      : undefined,
  // 🔴 The two halves are not the two halves we had.
  //
  // We put category, quality and the dimensions under the
  // *characteristics* tickbox. The reference puts them under the
  // **quantity** one, beside `Nieuwe hoeveelheid`, and leaves exactly one
  // field under characteristics: `Voorraad opmerking`. So a dialog that
  // greys the grade when you only wanted to fix the count was greying the
  // wrong half.
  //
  // The four weights sit with the quantity too, which is the arrangement
  // that makes sense of it: the quantity half is "what and how much this
  // metal is", the characteristics half is "what somebody wrote about it".
  attributes: {
    ...(values.correctQuantity
      ? {
          stock_category: values.stockCategory,
          quality: values.quality,
          length_mm: values.lengthMm,
          width_mm: values.widthMm,
          thickness_mm: values.thicknessMm,
          weighed_weight_kg: values.weighedWeightKg,
          gross_weight_kg: values.grossWeightKg,
          net_weight_kg: values.netWeightKg,
        }
      : {}),
    ...(values.correctCharacteristics ? { remark: values.remark } : {}),
  },
  sawOrderUuid: values.sawOrderUuid?.trim() || null,
  userId,
});

const readStockLot = async (
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  stockUuid: string,
): Promise<SelectStock> => {
  const [lot] = await tx
    .select()
    .from(Stock)
    .where(eq(Stock.uuid, stockUuid))
    .limit(1);

  if (!lot) {
    throw new Error("Stock lot not found");
  }

  return lot;
};

/**
 * `Correction…` on a lot.
 *
 * 🔴 The whole of item 26b lives under this: the reference changed lot `404763`
 * from `Standaard` to `2nd choice` on 29-9-2026 and wrote nothing to the
 * mutation ledger, so nobody can tell from the books that a prime bundle was
 * downgraded. Ours writes a row per changed attribute. `applyStockCorrection`
 * carries the reasoning and the rules; this resolves the lot, validates, and
 * keeps it all in one transaction so a half-applied correction cannot exist.
 */
export const correctStockLot = async (
  _prevState: StockCorrectionResult,
  input: StockCorrectionFormValues,
): Promise<StockCorrectionResult> => {
  const userId = await requireAuth();

  const parsed = stockCorrectionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid correction" };
  }
  const values = parsed.data;

  try {
    const movements = await db.transaction(async (tx) => {
      const lot = await readStockLot(tx, values.stockUuid);
      const outcome = await applyStockCorrection(
        tx,
        stockCorrectionParams(lot, values, userId),
      );

      return outcome.movements;
    });

    revalidatePath(`/stock/${values.stockUuid}`);
    revalidatePath("/stock");
    revalidatePath("/stock-movements");
    revalidatePath("/stock-on-location");

    return { success: true, movements };
  } catch (error) {
    return { error: describeError(error, "Failed to correct the stock lot") };
  }
};

/**
 * `Simulate` beside `OK` on the correction — the reference's `Simuleer`
 * (PLANNED-CODE-CHANGES-6 §28b). The real correction, run and rolled back, so
 * what it shows is exactly what `OK` would write: the ledger rows and the lot's
 * quantity, kilos and value before and after.
 */
export const simulateStockCorrection = async (
  _prevState: StockCorrectionSimulation,
  input: StockCorrectionFormValues,
): Promise<StockCorrectionSimulation> => {
  const userId = await requireAuth();

  const parsed = stockCorrectionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid correction" };
  }
  const values = parsed.data;

  const figures = (row: SelectStock): StockLotFigures => ({
    quantity: row.quantity,
    quantityKg: row.quantityKg,
    valuationEuro: row.valuationEuro,
  });

  try {
    return await dryRun(async (tx) => {
      const lot = await readStockLot(tx, values.stockUuid);
      const outcome = await applyStockCorrection(
        tx,
        stockCorrectionParams(lot, values, userId),
      );
      const after = await readStockLot(tx, values.stockUuid);

      return {
        rows: outcome.rows.map((row) => ({
          type: row.type,
          reason: row.reason,
          attribute: row.attribute ?? null,
          valueBefore: row.valueBefore ?? null,
          valueAfter: row.valueAfter ?? null,
          quantity: row.quantity ?? null,
          quantityKg: row.quantityKg ?? null,
          valueEur: row.valueEur ?? null,
        })),
        before: figures(lot),
        after: figures(after),
      };
    });
  } catch (error) {
    return {
      error: describeError(error, "Failed to simulate the correction"),
    };
  }
};

/**
 * The two lines of the dialog ledger that have to be counted rather than
 * assumed, for one lot.
 *
 * Shared by the three actions that enforce `Totaal verplaatsbaar`, so the
 * ceiling the server checks is the same number the dialog showed. Computing it
 * twice in two places is how a UI that says 25 ends up refusing 25.
 */
const lotCommitments = async (
  tx: StockTransaction,
  stockUuid: string,
): Promise<{ onOpenWorkOrders: number; plannedMoves: number }> => {
  const [openWork] = await tx
    .select({ qty: sum(WarehouseWorkOrderLines.qtyPlanned) })
    .from(WarehouseWorkOrderLines)
    .where(
      and(
        eq(WarehouseWorkOrderLines.stockUuid, stockUuid),
        inArray(WarehouseWorkOrderLines.status, ["new", "released"]),
      ),
    );

  const [moves] = await tx
    .select({ qty: sum(WarehouseWorkOrderLines.qtyPlanned) })
    .from(WarehouseWorkOrderLines)
    .innerJoin(
      WarehouseWorkOrders,
      eq(WarehouseWorkOrderLines.workOrderUuid, WarehouseWorkOrders.uuid),
    )
    .where(
      and(
        eq(WarehouseWorkOrderLines.stockUuid, stockUuid),
        inArray(WarehouseWorkOrderLines.status, ["new", "released"]),
        inArray(WarehouseWorkOrders.type, ["relocating", "transferring"]),
      ),
    );

  const plannedMoves = Number(moves?.qty ?? 0);

  return {
    // Moves are reported on their own line, so they come back out of the
    // general figure rather than being counted in both.
    onOpenWorkOrders: Math.max(Number(openWork?.qty ?? 0) - plannedMoves, 0),
    plannedMoves,
  };
};

/**
 * What one line of a relocation weighs, apportioned from the lot.
 *
 * The *theoretical* weight apportions because it is arithmetic off the
 * dimensions. The weighed weight never does — see `applyStockSplit`.
 */
const apportionedKg = (
  lot: { quantity: string; quantityKg: string | null },
  quantity: number,
): string => {
  const total = Number(lot.quantity);
  if (total === 0) {
    return "0.00";
  }
  return ((Number(lot.quantityKg ?? 0) * quantity) / total).toFixed(2);
};

// ─────────────────────────────────────────────────────────────────────────────
// The `Voorraad` toolbar — every manual stock act the reference offers on a lot.
//
// Captured 5-10-2026 on `PK304L200315` at location `Laad`, lot `26AOSG`.
// See docs/reference-system/stock-lot-dialogs.md and FORMS-TO-REBUILD.md.
//
// ⚠️ `Aanvullen…` (Replenish) and `Verschrotten…` (Scrap) are **greyed** on a
// normal lot in the reference, with a lot selected. Grey is an answer: neither
// is reachable, so neither is built here. Scrapping already has a route through
// a warehouse work order of type `scrapping`.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Climb a location to the warehouse it belongs to.
 *
 * A relocation order is raised against a warehouse, and a lot only knows which
 * shelf it stands on. The bound is a guard against a parent cycle, not a claim
 * about how deep the tree goes — the reference's own tree showed one root,
 * `00 Hego Almere`, with locations nested beneath it.
 */
const warehouseOfLocation = async (
  tx: StockTransaction,
  locationUuid: string,
): Promise<string | null> => {
  const seen = new Set<string>();
  const climb = async (uuid: string): Promise<string | null> => {
    if (seen.has(uuid) || seen.size > 16) {
      return null;
    }
    seen.add(uuid);
    const [row] = await tx
      .select({ parentUuid: Warehouses.parentUuid })
      .from(Warehouses)
      .where(eq(Warehouses.uuid, uuid))
      .limit(1);
    if (!row) {
      return null;
    }
    return row.parentUuid ? climb(row.parentUuid) : uuid;
  };
  return climb(locationUuid);
};

/**
 * What the lot dialogs open with, in one query each.
 *
 * 🔑 **The ledger is the most important thing on these dialogs**, and we
 * rendered none of it. Somebody pressing `Correct` on our build could not see
 * that 25 of 25 pieces were reserved, which is the single fact that decides
 * whether the action is safe. The reference states it before you type anything.
 *
 * The two subtracting lines have to be counted, not assumed:
 *
 *   `Met onderhanden opdrachten`  metal on an open work order
 *   `Geplande verplaatsingen`     metal already scheduled to move
 *
 * Both are queried against work orders that have not been reported yet, because
 * a job that is finished has already moved its metal and would be counted
 * twice.
 *
 * ⚠️ Run sequentially rather than as one `Promise.all`. The shared MySQL
 * instance caps connections and a fan-out here is the kind of thing that
 * exhausts the pool under two concurrent users.
 */
export const getStockLotDialog = async (
  stockUuid: string,
): Promise<StockLotDialogData | null> => {
  const [lot] = await db
    .select({
      ...getTableColumns(Stock),
      productCode: Products.productCode,
      productName: Products.name,
      locationName: Warehouses.name,
    })
    .from(Stock)
    .leftJoin(Products, eq(Stock.productUuid, Products.uuid))
    .leftJoin(Warehouses, eq(Stock.locationUuid, Warehouses.uuid))
    .where(eq(Stock.uuid, stockUuid))
    .limit(1);

  if (!lot) {
    return null;
  }

  // `Met onderhanden opdrachten` — warehouse work order lines against this lot
  // that the floor has not reported yet.
  const [openWork] = await db
    .select({ qty: sum(WarehouseWorkOrderLines.qtyPlanned) })
    .from(WarehouseWorkOrderLines)
    .where(
      and(
        eq(WarehouseWorkOrderLines.stockUuid, stockUuid),
        inArray(WarehouseWorkOrderLines.status, ["new", "released"]),
      ),
    );

  // `Geplande verplaatsingen` — the subset of that work which is a *move*. It
  // is listed separately in the reference's ledger because it is the planned
  // relocation this dialog's own sibling raises, and the next dialog opened has
  // to be able to see what the last one committed.
  const [plannedMoves] = await db
    .select({ qty: sum(WarehouseWorkOrderLines.qtyPlanned) })
    .from(WarehouseWorkOrderLines)
    .innerJoin(
      WarehouseWorkOrders,
      eq(WarehouseWorkOrderLines.workOrderUuid, WarehouseWorkOrders.uuid),
    )
    .where(
      and(
        eq(WarehouseWorkOrderLines.stockUuid, stockUuid),
        inArray(WarehouseWorkOrderLines.status, ["new", "released"]),
        inArray(WarehouseWorkOrders.type, ["relocating", "transferring"]),
      ),
    );

  const movesPlanned = Number(plannedMoves?.qty ?? 0);
  // The open-work figure counts every type, relocations included, so the moves
  // are taken back out: the ledger shows them on their own line and adding them
  // twice would understate what can be moved.
  const onOpenWorkOrders = Math.max(
    Number(openWork?.qty ?? 0) - movesPlanned,
    0,
  );

  // `Nieuw` · `Vrijgegeven` · `Klaar` on `Corrigeren voorraad` (233) — what
  // stands on this lot's warehouse work order lines, by the line's status.
  const byStatus = await db
    .select({
      status: WarehouseWorkOrderLines.status,
      qty: sum(WarehouseWorkOrderLines.qtyPlanned),
    })
    .from(WarehouseWorkOrderLines)
    .where(
      and(
        eq(WarehouseWorkOrderLines.stockUuid, stockUuid),
        inArray(WarehouseWorkOrderLines.status, ["new", "released", "ready"]),
      ),
    )
    .groupBy(WarehouseWorkOrderLines.status);
  const quantityOf = (status: "new" | "released" | "ready"): number =>
    Number(byStatus.find((row) => row.status === status)?.qty ?? 0);

  const reservations = await getLotReservations(stockUuid);
  const options = await getLotOptions(stockUuid);
  const optionSpecifications = await db
    .selectDistinct({
      option: StockOptions.option,
      specification: StockOptions.specification,
    })
    .from(StockOptions)
    .where(isNotNull(StockOptions.specification))
    .orderBy(StockOptions.option, StockOptions.specification);

  return {
    lot,
    ledger: lotLedger({
      quantity: lot.quantity,
      reservedQuantity: lot.reservedQuantity,
      onOpenWorkOrders,
      plannedMoves: movesPlanned,
    }),
    weights: lotWeights(lot),
    workOrderQuantities: {
      new: quantityOf("new"),
      released: quantityOf("released"),
      ready: quantityOf("ready"),
    },
    reservations,
    options,
    optionSpecifications,
  };
};

/**
 * `Reserveringen…` on a lot — and the whole of H2's answer.
 *
 * 🔴 **The reference has no `New` button here.** The toolbar is `Order` ·
 * `Verwijder` and nothing else, so a reservation cannot be created by hand: it
 * is made by a sales order and the only manual act available is destroying one.
 *
 * `Order/R…` is order number and line in one cell (`O107163/20`), which is why
 * both are selected here rather than just the order.
 */
export const getLotReservations = async (
  stockUuid: string,
): Promise<LotReservationRow[]> =>
  db
    .select({
      uuid: Reservations.uuid,
      type: Reservations.type,
      status: Reservations.status,
      quantity: Reservations.quantity,
      unit: Reservations.unit,
      quantityKg: Reservations.quantityKg,
      reservedFor: Reservations.reservedFor,
      changedAt: Reservations.changedAt,
      updatedAt: Reservations.updatedAt,
      orderItemUuid: Reservations.orderItemUuid,
      orderUuid: OrderItems.orderUuid,
      orderNumber: Orders.id,
      lineNumber: OrderItems.lineNumber,
      companyName: Companies.companyName,
    })
    .from(Reservations)
    .leftJoin(OrderItems, eq(Reservations.orderItemUuid, OrderItems.uuid))
    .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
    .where(eq(Reservations.stockUuid, stockUuid))
    .orderBy(Reservations.reservedFor);

/**
 * `Verwijder` on the reservations panel — release the lot.
 *
 * The one manual act the reference offers. Deleting the claim has to give the
 * metal back, so the lot's `reservedQuantity` comes down by exactly what the
 * reservation held; leaving it would strand the quantity as reserved against
 * nothing and make the lot permanently unsellable.
 */
export const deleteLotReservation = async (
  _prevState: StockLotActionResult,
  input: { reservationUuid: string },
): Promise<StockLotActionResult> => {
  await requireAuth();

  try {
    const stockUuid = await db.transaction(async (tx) => {
      const [reservation] = await tx
        .select()
        .from(Reservations)
        .where(eq(Reservations.uuid, input.reservationUuid))
        .limit(1);

      if (!reservation) {
        throw new Error("That reservation no longer exists.");
      }

      await tx
        .delete(Reservations)
        .where(eq(Reservations.uuid, input.reservationUuid));

      if (!reservation.stockUuid) {
        // A hold on incoming supply names a purchase line, not a lot, so there
        // is no shelf quantity to give back.
        return null;
      }

      const [lot] = await tx
        .select({ reservedQuantity: Stock.reservedQuantity })
        .from(Stock)
        .where(eq(Stock.uuid, reservation.stockUuid))
        .limit(1);

      if (lot) {
        const released = Math.max(
          Number(lot.reservedQuantity ?? 0) - Number(reservation.quantity),
          0,
        );
        await tx
          .update(Stock)
          .set({ reservedQuantity: released.toFixed(STOCK_QUANTITY_SCALE) })
          .where(eq(Stock.uuid, reservation.stockUuid));
      }

      return reservation.stockUuid;
    });

    if (stockUuid) {
      revalidatePath(`/stock/${stockUuid}`);
    }
    revalidatePath("/stock");
    revalidatePath("/reservations");

    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to release the reservation") };
  }
};

/**
 * `Splits` — take pieces off a lot and make them a lot of their own.
 *
 * The weighed weight is passed through as typed, never apportioned: the pieces
 * coming off go on the scale, which is why the reference's dialog has a weight
 * box at all.
 */
export const splitStockLot = async (
  _prevState: StockLotActionResult,
  input: StockSplitFormValues,
): Promise<StockLotActionResult> => {
  await requireAuth();

  const parsed = stockSplitSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid split" };
  }
  const values = parsed.data;

  try {
    const outcome = await db.transaction(async (tx) => {
      const [lot] = await tx
        .select()
        .from(Stock)
        .where(eq(Stock.uuid, values.stockUuid))
        .limit(1);

      if (!lot) {
        throw new Error("Stock lot not found");
      }

      const commitments = await lotCommitments(tx, values.stockUuid);

      return applyStockSplit(tx, {
        source: lot,
        quantity: Number(values.quantity),
        weighedWeightKg:
          values.weighedWeightKg && values.weighedWeightKg !== ""
            ? Number(values.weighedWeightKg)
            : null,
        toLocationUuid: values.toLocationUuid || null,
        includeReservations: values.includeReservations,
        onOpenWorkOrders: commitments.onOpenWorkOrders,
        plannedMoves: commitments.plannedMoves,
      });
    });

    revalidatePath(`/stock/${values.stockUuid}`);
    revalidatePath(`/stock/${outcome.splitStockUuid}`);
    revalidatePath("/stock");
    revalidatePath("/stock-on-location");

    return { success: true, stockUuid: outcome.splitStockUuid };
  } catch (error) {
    return { error: describeError(error, "Failed to split the lot") };
  }
};

/**
 * `Verplaatsen…` — relocate a lot to another location.
 *
 * 🔑 **This raises an order, it does not move anything.** The reference's title
 * is `Aanmaken verplaatsopdracht` — *create relocation order* — and it carries
 * an execution date. Relocation is planned work for the warehouse floor, which
 * is exactly why `Geplande verplaatsingen` subtracts in the ledger at the top
 * of every one of these dialogs: raising the order commits the metal, and the
 * next dialog opened has to see that.
 *
 * So nothing here touches `Stock`. The lot moves when the floor reports the
 * work order line completed, through the path that already exists.
 */
export const relocateStockLot = async (
  _prevState: StockLotActionResult,
  input: StockRelocateFormValues,
): Promise<StockLotActionResult> => {
  const userId = await requireAuth();

  const parsed = stockRelocateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid relocation" };
  }
  const values = parsed.data;

  try {
    await db.transaction(async (tx) => {
      const [lot] = await tx
        .select({
          ...getTableColumns(Stock),
          productCode: Products.productCode,
        })
        .from(Stock)
        .leftJoin(Products, eq(Stock.productUuid, Products.uuid))
        .where(eq(Stock.uuid, values.stockUuid))
        .limit(1);

      if (!lot) {
        throw new Error("Stock lot not found");
      }

      if (lot.locationUuid === values.toLocationUuid) {
        throw new Error("The lot already stands at that location.");
      }

      const quantity = Number(values.quantity);
      const commitments = await lotCommitments(tx, values.stockUuid);
      const ledger = lotLedger({
        quantity: lot.quantity,
        reservedQuantity: lot.reservedQuantity,
        onOpenWorkOrders: commitments.onOpenWorkOrders,
        plannedMoves: commitments.plannedMoves,
      });

      // `Totaal verplaatsbaar` is the ceiling the reference enforces by greying
      // `OK en gereed`. 🔑 Reserved metal counts as movable — a reservation
      // binds the lot, not the shelf — so only open work orders and moves
      // already scheduled subtract.
      if (quantity > ledger.totalMovable) {
        throw new Error(
          `Only ${ledger.totalMovable} of this lot can be relocated — the rest is on an open work order or already scheduled to move.`,
        );
      }

      if (!lot.locationUuid) {
        throw new Error(
          "The lot does not stand anywhere yet, so there is nothing to relocate.",
        );
      }

      const warehouseUuid =
        (await warehouseOfLocation(tx, lot.locationUuid)) ?? null;
      if (!warehouseUuid) {
        throw new Error(
          "The lot's location does not belong to any warehouse, so no relocation can be planned.",
        );
      }

      const number = await nextWorkOrderNumber(tx);
      const workOrderUuid = generateUuid();

      await tx.insert(WarehouseWorkOrders).values({
        createdByUserId: userId,
        uuid: workOrderUuid,
        number,
        warehouseUuid,
        type: "relocating",
        plannedDate: values.executeOn,
        status: "new",
      });

      await tx.insert(WarehouseWorkOrderLines).values({
        modifiedByUserId: userId,
        uuid: generateUuid(),
        workOrderUuid,
        lineNumber: 10,
        stockUuid: lot.uuid,
        productUuid: lot.productUuid,
        productCode: lot.productCode,
        fromLocationUuid: lot.locationUuid,
        toLocationUuid: values.toLocationUuid,
        length: lot.lengthMm,
        width: lot.widthMm,
        thickness: lot.thicknessMm ? Number(lot.thicknessMm) : null,
        qtyPlanned: quantity.toFixed(3),
        kgPlanned: apportionedKg(lot, quantity),
        internalBatch: lot.internalBatch,
        charge: lot.charge,
        internalCharge: lot.internalCharge,
        quality: lot.quality,
        status: "new",
      });

      // `Reden` is recorded on the order's own remark rather than invented as a
      // column: the relocation reason is what a warehouse foreman reads off the
      // slip, and it has no behaviour attached — all four values route the
      // metal identically.
      await tx.insert(StockMovements).values({
        uuid: generateUuid(),
        productUuid: lot.productUuid,
        stockUuid: lot.uuid,
        type: "adjust",
        reason: "manual_correction",
        attribute: null,
        quantity: "0.000",
        quantityKg: "0.00",
        valueEur: "0.00",
        note: `Relocation order ${number} raised for ${quantity} — ${RELOCATION_REASON_LABELS[values.reason]}, to be executed ${values.executeOn}`,
        warehouseWorkOrderLineUuid: null,
        createdByUserId: userId,
      });
    });

    revalidatePath(`/stock/${values.stockUuid}`);
    revalidatePath("/stock");
    revalidatePath("/warehouse-work-orders");

    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to raise the relocation") };
  }
};

/**
 * `Overboeken…` — transfer a lot to another **article**.
 *
 * The one field that separates this from a relocation is `Naar Artikel`, and
 * unlike a relocation it takes effect immediately: the dialog offers no
 * `Uitvoerdatum` to plan it for.
 *
 * 🔑 The new article's grade and dimensions are read off the article rather than
 * typed, because re-classifying metal means it now *is* that article — leaving
 * the old shape on the lot would make every weight derived from it a fiction.
 */
export const transferStockLot = async (
  _prevState: StockLotActionResult,
  input: StockTransferFormValues,
): Promise<StockLotActionResult> => {
  const userId = await requireAuth();

  const parsed = stockTransferSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid transfer" };
  }
  const values = parsed.data;

  try {
    const outcome = await db.transaction(async (tx) => {
      const [lot] = await tx
        .select()
        .from(Stock)
        .where(eq(Stock.uuid, values.stockUuid))
        .limit(1);

      if (!lot) {
        throw new Error("Stock lot not found");
      }

      const [target] = await tx
        .select({ uuid: Products.uuid })
        .from(Products)
        .where(eq(Products.uuid, values.toProductUuid))
        .limit(1);

      if (!target) {
        throw new Error("The article being transferred to does not exist.");
      }

      const commitments = await lotCommitments(tx, values.stockUuid);

      // 🔑 Nothing about the metal's measured shape is passed, on purpose. A
      // lot's dimensions are its own measurements and every kilo on the row is
      // derived from them; re-classifying says the code was wrong, not that the
      // tape measure was. See `applyStockTransfer`.
      return applyStockTransfer(tx, {
        source: lot,
        quantity: Number(values.quantity),
        toProductUuid: values.toProductUuid,
        toLocationUuid: values.toLocationUuid || null,
        reason: values.reason,
        description: values.description?.trim() || null,
        onOpenWorkOrders: commitments.onOpenWorkOrders,
        plannedMoves: commitments.plannedMoves,
        userId,
      });
    });

    revalidatePath(`/stock/${values.stockUuid}`);
    revalidatePath(`/stock/${outcome.transferredStockUuid}`);
    revalidatePath("/stock");
    revalidatePath("/stock-movements");
    revalidatePath("/stock-on-location");

    return { success: true, stockUuid: outcome.transferredStockUuid };
  } catch (error) {
    return { error: describeError(error, "Failed to transfer the lot") };
  }
};

/**
 * `Opties bewerken` — the lot's options, as rows.
 *
 * 🔴 We held these as a column of text. The reference holds them as a grid of
 * `Optie · Specificatie · Status`, and the product's list (what this article
 * *can* have done) is a different list from the lot's (what has *been* done).
 */
export const getLotOptions = async (
  stockUuid: string,
): Promise<SelectStockOptions[]> =>
  db
    .select()
    .from(StockOptions)
    .where(eq(StockOptions.stockUuid, stockUuid))
    .orderBy(StockOptions.createdAt);

/**
 * `Opslaan` on `Voorraad opties` — commit the staged edits in one go.
 *
 * The reference (249-251) buffers every `Toevoegen` and every `Verwijder
 * geselecteerde optie` in the dialog and writes them only on `Opslaan`, so a
 * half-finished edit never reaches the lot. One transaction, removals first, so
 * re-adding an option that was just removed does not trip the unique index.
 *
 * 🔑 The status is stamped here, never chosen: a row added through
 * `Toevoegen` is `to_add` — pending work, not yet true of the metal.
 */
export const saveLotOptions = async (
  _prevState: StockLotActionResult,
  input: StockOptionsSaveValues,
): Promise<StockLotActionResult> => {
  await requireAuth();

  const parsed = stockOptionsSaveSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid options" };
  }
  const values = parsed.data;

  try {
    await db.transaction(async (tx) => {
      if (values.removals.length > 0) {
        await tx
          .delete(StockOptions)
          .where(
            and(
              eq(StockOptions.stockUuid, values.stockUuid),
              inArray(StockOptions.uuid, values.removals),
            ),
          );
      }

      if (values.additions.length > 0) {
        await tx.insert(StockOptions).values(
          values.additions.map((addition) => ({
            uuid: generateUuid(),
            stockUuid: values.stockUuid,
            option: addition.option,
            specification: addition.specification?.trim() || null,
            status: "to_add" as const,
          })),
        );
      }
    });

    revalidatePath(`/stock/${values.stockUuid}`);
    return { success: true };
  } catch (error) {
    // The unique index is what catches the same option twice on one lot, and
    // saying so is more useful than the driver's own message.
    return {
      error: describeError(
        error,
        "Failed to save the options — one may already be on this lot",
      ),
    };
  }
};

/**
 * `Partijregistratie…` — the deliveries a lot could have arrived on.
 *
 * 🔑 **This dialog is a picker, not a form.** You choose a supplier, it lists
 * that supplier's deliveries, and only `Charge` and `Fabrieksnummer` are yours
 * to type — order, line, receipt date, dimensions and weight are all read off
 * the purchase line and greyed.
 *
 * 🔑 **The grid is per instalment, not per line.** The captured dialog showed
 * `403773/10` twice — 23 pieces at 1 610 kg and 25 pieces at 1 754 kg, both the
 * same day, both the same heat — which is the receival grain proved from a third
 * direction. So this selects receivals, not purchase lines.
 */
export const getSupplierDeliveriesForLot = async (
  stockUuid: string,
): Promise<SupplierDeliveryRow[]> => {
  const [lot] = await db
    .select({
      productUuid: Stock.productUuid,
      supplierUuid: Stock.supplierUuid,
    })
    .from(Stock)
    .where(eq(Stock.uuid, stockUuid))
    .limit(1);

  if (!lot) {
    return [];
  }

  return db
    .select({
      receivalUuid: PurchaseLineReceivals.uuid,
      purchaseOrderItemUuid: PurchaseLineReceivals.purchaseOrderItemUuid,
      purchaseOrderNumber: PurchaseOrders.id,
      lineNumber: PurchaseOrderItems.lineNumber,
      supplierCode: Companies.id,
      supplierName: Companies.companyName,
      productCode: Products.productCode,
      receiptDate: PurchaseLineReceivals.receiptDate,
      lengthMm: PurchaseOrderItems.lengthMm,
      widthMm: PurchaseOrderItems.widthMm,
      qtyWeighed: PurchaseLineReceivals.qtyActual,
      unit: PurchaseLineReceivals.unit,
      kgWeighed: PurchaseLineReceivals.kgActual,
      charge: PurchaseLineReceivals.charge,
      internalCharge: PurchaseLineReceivals.internalCharge,
    })
    .from(PurchaseLineReceivals)
    .innerJoin(
      PurchaseOrderItems,
      eq(PurchaseLineReceivals.purchaseOrderItemUuid, PurchaseOrderItems.uuid),
    )
    .leftJoin(
      PurchaseOrders,
      eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
    )
    .leftJoin(Companies, eq(PurchaseOrders.supplierUuid, Companies.uuid))
    .leftJoin(Products, eq(PurchaseOrderItems.productUuid, Products.uuid))
    .where(
      and(
        eq(PurchaseOrderItems.productUuid, lot.productUuid),
        lot.supplierUuid
          ? eq(PurchaseOrders.supplierUuid, lot.supplierUuid)
          : undefined,
      ),
    )
    .orderBy(desc(PurchaseLineReceivals.receiptDate))
    .limit(50);
};

/**
 * `Partijregistratie…` — attach the mill's heat number to a lot.
 *
 * 🔑🔑 `charge` is the **supplier's** heat number, stamped by the mill;
 * `internalCharge` is **ours**, generated on receipt. They are two different
 * identities and this never writes one over the other — the reference shows
 * both side by side, `112770` against `26AOSG`, and greys ours.
 *
 * 🔴 There is **no certificate field** on this dialog. That is the finding, and
 * it is why every certificate column on the batch screens is empty: a
 * certificate is a stock option (`2.1 Certificate`), not a batch field.
 */
export const registerStockBatch = async (
  _prevState: StockLotActionResult,
  input: BatchRegistrationFormValues,
): Promise<StockLotActionResult> => {
  const userId = await requireAuth();

  const parsed = batchRegistrationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid batch registration",
    };
  }
  const values = parsed.data;

  try {
    await db.transaction(async (tx) => {
      const [lot] = await tx
        .select()
        .from(Stock)
        .where(eq(Stock.uuid, values.stockUuid))
        .limit(1);

      if (!lot) {
        throw new Error("Stock lot not found");
      }

      const [line] = await tx
        .select({
          uuid: PurchaseOrderItems.uuid,
          purchaseOrderUuid: PurchaseOrderItems.purchaseOrderUuid,
          receiptDate: PurchaseOrderItems.receiptDate,
        })
        .from(PurchaseOrderItems)
        .where(eq(PurchaseOrderItems.uuid, values.purchaseOrderItemUuid))
        .limit(1);

      if (!line) {
        throw new Error("That purchase delivery no longer exists.");
      }

      const charge = normaliseCharge(values.charge);
      const previousCharge = lot.charge;

      await tx
        .update(Stock)
        .set({
          charge,
          factoryNumber: values.factoryNumber?.trim() || null,
          // The lot is now traced to the delivery it came in on, which is the
          // whole point of the dialog. The internal charge is ours and is left
          // exactly as it was.
          purchaseOrderUuid: line.purchaseOrderUuid,
          purchaseOrderItemUuid: line.uuid,
          receiptDate: line.receiptDate ?? lot.receiptDate,
        })
        .where(eq(Stock.uuid, values.stockUuid));

      // The batch row is what traces a certificate back to this bundle. The
      // lot now names the delivery it arrived on, so the helper reads the rest
      // off the row it has just been given rather than being told twice.
      await registerBatchForLot(tx, values.stockUuid, {
        purchaseLineReceivalUuid: values.purchaseLineReceivalUuid ?? null,
        date: line.receiptDate ?? undefined,
      });

      // Re-identifying metal is worth a line in the ledger even though nothing
      // moved: the charge is how a certificate is traced back to a bundle, and
      // a silent change to it breaks that trace with nothing to show who did it.
      if (previousCharge !== charge) {
        await tx.insert(StockMovements).values({
          uuid: generateUuid(),
          productUuid: lot.productUuid,
          stockUuid: lot.uuid,
          type: "adjust",
          reason: "manual_correction",
          quantity: "0.000",
          quantityKg: "0.00",
          valueEur: "0.00",
          note: `Batch registration — charge ${previousCharge ?? "—"} → ${charge}`,
          createdByUserId: userId,
        });
      }
    });

    revalidatePath(`/stock/${values.stockUuid}`);
    revalidatePath("/stock");
    revalidatePath("/batches");

    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to register the batch") };
  }
};

/**
 * `Voorraadlabel` — `Selecteer type voorraadlabel en aantal`.
 *
 * Two label types, `Label` and `Sticker`, a count per line defaulting to 1, and
 * ☐ `Gebruik printers op locatie` — which implies printers are configured per
 * warehouse location.
 *
 * ⚠️ **There is no printer here, and this does not pretend there is.** What it
 * does is record the request, so that a print is auditable and so the printing
 * integration has one place to read from when it exists. A label that silently
 * went nowhere would be worse than one that is queued.
 */
export const printStockLabel = async (
  _prevState: StockLotActionResult,
  input: StockLabelFormValues,
): Promise<StockLotActionResult> => {
  const userId = await requireAuth();

  const parsed = stockLabelSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid label request" };
  }
  const values = parsed.data;

  try {
    const [lot] = await db
      .select({ productUuid: Stock.productUuid, uuid: Stock.uuid })
      .from(Stock)
      .where(eq(Stock.uuid, values.stockUuid))
      .limit(1);

    if (!lot) {
      return { error: "Stock lot not found" };
    }

    await db.insert(StockMovements).values({
      uuid: generateUuid(),
      productUuid: lot.productUuid,
      stockUuid: lot.uuid,
      type: "adjust",
      reason: "manual_correction",
      quantity: "0.000",
      quantityKg: "0.00",
      valueEur: "0.00",
      note: `${values.copies} × ${STOCK_LABEL_TYPE_LABELS[values.labelType]} requested${values.useLocationPrinters ? " (printers at the location)" : ""}`,
      createdByUserId: userId,
    });

    revalidatePath(`/stock/${values.stockUuid}`);

    return {
      success: true,
      message: `${values.copies} × ${STOCK_LABEL_TYPE_LABELS[values.labelType]} queued for printing.`,
    };
  } catch (error) {
    return { error: describeError(error, "Failed to queue the labels") };
  }
};

/**
 * `Zaagopdracht` on the correction dialog — the saw orders this lot has been
 * through, so a loss can be blamed on the cut that caused it.
 *
 * Two columns in the reference, `Opdra… /` and `Ordernr`: the production order
 * and the sales order it was cutting for.
 */
export const getSawOrdersForLot = async (
  stockUuid: string,
): Promise<SawOrderRow[]> =>
  db
    .selectDistinct({
      lineUuid: ProductionWorkOrderLines.uuid,
      workOrderNumber: ProductionWorkOrders.number,
      orderNumber: ProductionWorkOrderLines.orderNumber,
      plannedDate: ProductionWorkOrders.plannedDate,
      status: ProductionWorkOrderLines.status,
    })
    .from(ProductionWorkOrderPicks)
    .innerJoin(
      ProductionWorkOrderLines,
      eq(
        ProductionWorkOrderPicks.workOrderLineUuid,
        ProductionWorkOrderLines.uuid,
      ),
    )
    .innerJoin(
      ProductionWorkOrders,
      eq(ProductionWorkOrderLines.workOrderUuid, ProductionWorkOrders.uuid),
    )
    .where(eq(ProductionWorkOrderPicks.stockUuid, stockUuid))
    .orderBy(desc(ProductionWorkOrders.number))
    .limit(50);

/**
 * `Locatie zoeken` — locations are a **tree under one warehouse**.
 *
 * The reference's picker has `Zoek` / `Magazijn` tabs, a numbered depth toolbar
 * reading `1` `2`, and a single expandable root (`00 Hego Almere`). Ours was a
 * flat list, which is why this returns the depth with each row: a flat list
 * cannot tell `Laad` from the warehouse it hangs under.
 */
export const getLocationTreeForPicker = async (): Promise<
  LocationTreeRow[]
> => {
  const rows = await db
    .select({
      uuid: Warehouses.uuid,
      parentUuid: Warehouses.parentUuid,
      name: Warehouses.name,
      type: Warehouses.type,
      locationType: Warehouses.locationType,
      blocked: Warehouses.blocked,
    })
    .from(Warehouses)
    .orderBy(Warehouses.name);

  const byParent = new Map<string | null, typeof rows>();
  rows.forEach((row) => {
    const key = row.parentUuid ?? null;
    byParent.set(key, [...(byParent.get(key) ?? []), row]);
  });

  // Flattened depth-first with a depth on each row, which is what the `Select`
  // primitive's own `depth` renders and what the tree picker indents by. Built
  // here rather than in the component so the page does one query and the
  // client does no recursion over the whole warehouse.
  const flattened: LocationTreeRow[] = [];
  const walk = (parentUuid: string | null, depth: number) => {
    if (depth > 16) {
      return;
    }
    (byParent.get(parentUuid) ?? []).forEach((row) => {
      flattened.push({ ...row, depth });
      walk(row.uuid, depth + 1);
    });
  };
  walk(null, 0);

  return flattened;
};
