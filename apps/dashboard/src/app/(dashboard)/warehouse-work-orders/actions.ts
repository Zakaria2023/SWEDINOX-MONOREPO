"use server";

import { db } from "@/db";
import { refreshOrderStatusForLine } from "@/lib/server/order-status";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { OrderItems } from "@/db/schema/order-items";
import { Orders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import { JournalEntries } from "@/db/schema/journal-entries";
import { SelectStock, Stock } from "@/db/schema/stock";
import { StockMovements } from "@/db/schema/stock-movements";
import {
  SelectWarehouseWorkOrderLines,
  SelectWarehouseWorkOrderPackagings,
  SelectWarehouseWorkOrderPicks,
  SelectWarehouseWorkOrders,
  WarehouseWorkOrderLines,
  WarehouseWorkOrderPackagings,
  WarehouseWorkOrderPicks,
  WarehouseWorkOrders,
} from "@/db/schema/warehouse-work-orders";
import { SelectWarehouses, Warehouses } from "@/db/schema/warehouses";
import {
  PackagingType,
  WarehouseStockEffect,
  workOrderStatuses,
  warehouseWorkOrderTypes,
} from "@/lib/enums";
import {
  customerLabelCount,
  customerLabelMedium,
  describeError,
  generateUuid,
  lotOrigin,
  moneyString,
  NON_SELLABLE_LOCATION_TYPES,
  normaliseCharge,
  PrintMedium,
  restateLotValue,
  stockLabelCount,
  todayDateString,
  toDecimalAmount,
  toDecimalQuantity,
  WAREHOUSE_WORK_ORDER_TYPE_META,
  STOCK_QUANTITY_SCALE,
} from "@/lib/helpers";
import {
  STOCK_MOVEMENT_REASON_LABELS,
  WAREHOUSE_WORK_ORDER_TYPE_LABELS,
} from "@/lib/labels";
import { recordFreightMovement } from "@/lib/server/freight";
import { applyReceipt } from "@/lib/server/receipts";
import { markSupplyDelivered } from "@/lib/server/external-processing";
import { applyMove } from "@/lib/server/stock-movements";
import { breachedTolerance, ToleranceKind } from "@/lib/server/tolerances";
import { getWorkOrderLineDetail, LineDetail } from "@/lib/server/work-order-line-detail";
import { buildInventoryMovementEntry, LEDGER_ACCOUNTS } from "@/lib/server/ledger";
import { exportRows } from "@/lib/server/excel";
import {
  dateRangeFilter,
  enumFilter,
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
import { WAREHOUSE_WORK_ORDER_COLUMNS } from "@/app/(dashboard)/warehouse-work-orders/columns";
import { currentUser } from "@clerk/nextjs/server";
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  gt,
  inArray,
  isNull,
  ne,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { revalidatePath } from "next/cache";

// The line names two places, so the warehouse tree is joined twice.
// The reference keeps one tolerance row per workorder type, and its four rows
// land on our four stock effects exactly: goods coming in are an unloading,
// goods going out or moving are a picking, and a count is its own rule.
const TOLERANCE_KIND_BY_STOCK_EFFECT: Record<
  WarehouseStockEffect,
  ToleranceKind
> = {
  in: "unloading",
  out: "picking",
  move: "picking",
  count: "count",
};

const FromLocation = alias(Warehouses, "from_location");
const ToLocation = alias(Warehouses, "to_location");

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type WorkOrderListItem = SelectWarehouseWorkOrders & {
  warehouseName: SelectWarehouses["name"] | null;
  // SUM/COUNT over the lines — no single column backs either.
  lineCount: number;
  qtyPlanned: number;
  qtyActual: number;
  kgPlanned: number;
  kgActual: number;
};

export type WorkOrderLineListItem = SelectWarehouseWorkOrderLines & {
  companyName: SelectCompanies["companyName"] | null;
  productName: SelectProducts["name"] | null;
  // Null is the company boundary rather than a missing name: the goods came
  // from outside, or they left.
  fromLocationName: SelectWarehouses["name"] | null;
  toLocationName: SelectWarehouses["name"] | null;
  // How many labels this line prints, which the two options on the product
  // already decide: per line, per collo or per piece for the customer's label,
  // and per bundle or a fixed count for the stock label. Derived rather than
  // stored — it follows the line's colli and quantity.
  customerLabels: number;
  stockLabels: number;
  labelMedium: PrintMedium | null;
};

/**
 * Every lot of the line's product, wherever it sits.
 *
 * The picker on the floor is looking at one line but needs to see the whole
 * shelf: what else is available, in what sizes, and under which charge. It is
 * why the panel lists lots the line has nothing to do with.
 */
export type {
  LineDetail,
  LineOptionRow,
  LineOrderContext,
  LineStockRow,
  LineTextRow,
} from "@/lib/server/work-order-line-detail";

/**
 * The lots a line may be drawn from: still on the shelf, not blocked, and not
 * standing somewhere that puts them out of reach — material at a processor or
 * already staged for another order is physically present but not free to take.
 */
export type AvailableStockOption = Pick<SelectStock, "uuid" | "quantity"> & {
  productUuid: SelectProducts["uuid"];
  productCode: SelectProducts["productCode"];
  productName: SelectProducts["name"];
};

/**
 * 🔴 A lot as the **warehouse** picker has to see it — which is not how the
 * sales picker sees it.
 *
 * Answered on 30-9-2026 and it closes O3. Clicking `Charge` on the reference's
 * `Report completion` dialog for line `323526/5` offered two lots, both reading
 * **`Available 50`**, while `Stock on location` read **`Available 0,00`** for
 * the same lot at the same moment: it held 50 and 50 were reserved.
 *
 * So `available` here is **physical stock, reservations ignored**, and that is
 * deliberate rather than a bug. The man on the floor is consuming metal *for
 * the very order that reserved it*; netting reservations off would leave him
 * looking at an empty shelf. The sales picker nets them off for the opposite
 * reason — a salesman must not sell metal somebody else is owed.
 *
 * `reserved` comes back beside it so the dialog can say who the metal is
 * spoken for by, without that ever deciding what may be picked.
 */
export type PickableLot = {
  uuid: SelectStock["uuid"];
  locationUuid: SelectStock["locationUuid"];
  locationName: SelectWarehouses["name"] | null;
  charge: SelectStock["charge"];
  internalCharge: SelectStock["internalCharge"];
  /** The six-digit parcel number — the reference's `Interne partij`. */
  internalBatch: SelectStock["internalBatch"];
  quality: SelectStock["quality"];
  stockCategory: SelectStock["stockCategory"];
  receiptDate: SelectStock["receiptDate"];
  valuationPrice: SelectStock["valuationPrice"];
  /** Physical stock. Not `quantity - reserved`. */
  available: number;
  reserved: number;
  /** True when the lot is on the location the line says to pick from. */
  onLineLocation: boolean;
};

export type WorkOrderPickRow = SelectWarehouseWorkOrderPicks & {
  stockCharge: SelectStock["charge"] | null;
  stockInternalCharge: SelectStock["internalCharge"] | null;
  stockQuantity: SelectStock["quantity"] | null;
  fromLocationName: SelectWarehouses["name"] | null;
};

/**
 * A line carrying the three levels above it, so the overview can be read as a
 * tree without nesting the query. The floor works day first, then by what kind
 * of job it is, then by order.
 */
export type WarehouseTreeRow = WorkOrderLineListItem & {
  lineUuid: string;
  workOrderNumber: SelectWarehouseWorkOrders["number"];
  // The job has a status of its own, and it is what Release and Cancel are
  // decisions about — a line can be reported while the job is still open.
  workOrderStatus: SelectWarehouseWorkOrders["status"];
  plannedDate: SelectWarehouseWorkOrders["plannedDate"];
  type: SelectWarehouseWorkOrders["type"];
  /** Level 2, as the floor reads it: "Picking". */
  groupLabel: string;
  /** Level 4: "1 Cold-rolled plate 304 1,5mm". */
  lineLabel: string;
};

export type WarehouseWorkOrderTree = {
  page: Paged<WorkOrderListItem>;
  rows: WarehouseTreeRow[];
};

export type WorkOrderDetail = WorkOrderListItem & {
  lines: WorkOrderLineListItem[];
  packagings: SelectWarehouseWorkOrderPackagings[];
};

export type WarehouseWorkOrderActionResult = {
  error?: string;
  success?: boolean;
};

export type AddWorkOrderLineInput = {
  workOrderUuid: string;
  lineNumber?: number | null;
  orderItemUuid?: string | null;
  orderNumber?: string | null;
  companyUuid?: string | null;
  stockUuid?: string | null;
  productUuid?: string | null;
  productCode?: string | null;
  purchaseOrderItemUuid?: string | null;
  /** Set instead of the purchase line when the unloading is a return. */
  returnOrderItemUuid?: string | null;
  fromLocationUuid?: string | null;
  toLocationUuid?: string | null;
  qtyPlanned: string;
  kgPlanned?: string | null;
  length?: number | null;
  width?: number | null;
  thickness?: number | null;
  priority?: number | null;
  rush?: boolean;
};

export type PreparePickInput = {
  stockUuid: string | null;
  toLocationUuid: string | null;
  qtyPlanned: string;
  kgPlanned?: string | null;
};

export type ReportPickInput = {
  uuid?: string;
  stockUuid: string | null;
  toLocationUuid: string | null;
  qtyPlanned: string;
  qtyActual: string;
  kgActual?: string | null;
  charge?: string | null;
  internalCharge?: string | null;
  internalBatch?: string | null;
};

export type ReportCompletionInput = {
  lineUuid: string;
  executedAt: string;
  executedByUserId?: string | null;
  picks: ReportPickInput[];
};

/**
 * What cancelling does. Deleting hands the demand back unplanned so it can be
 * planned again; closing at zero says the goods are never going and finishes
 * the order line short. Nothing physical has happened either way, which is why
 * neither has any stock to reverse.
 */
export type CancelWorkOrderMode = "restore" | "close_at_zero";

export type PackagingInput = {
  packaging: PackagingType;
  quantity: number;
  specification?: string | null;
};

const WORK_ORDER_SEARCH = [
  WarehouseWorkOrders.number,
  WarehouseWorkOrderLines.orderNumber,
  WarehouseWorkOrderLines.productCode,
] as const;

const WORK_ORDER_SORTABLE = {
  number: WarehouseWorkOrders.number,
  plannedDate: WarehouseWorkOrders.plannedDate,
  type: WarehouseWorkOrders.type,
  status: WarehouseWorkOrders.status,
  createdAt: WarehouseWorkOrders.createdAt,
};

// The floor narrows this list the way it works: which day, which kind of job,
// how far along it is, and which warehouse it belongs to.
const WORK_ORDER_FILTERS = {
  type: enumFilter(WarehouseWorkOrders.type, warehouseWorkOrderTypes),
  status: enumFilter(WarehouseWorkOrders.status, workOrderStatuses),
  warehouse: relationFilter(WarehouseWorkOrders.warehouseUuid),
  plannedDate: dateRangeFilter(WarehouseWorkOrders.plannedDate),
};

const LINE_TOTALS = {
  lineCount: sql<number>`COUNT(DISTINCT ${WarehouseWorkOrderLines.uuid})`,
  qtyPlanned: sql<number>`COALESCE(SUM(${WarehouseWorkOrderLines.qtyPlanned}), 0)`,
  qtyActual: sql<number>`COALESCE(SUM(${WarehouseWorkOrderLines.qtyActual}), 0)`,
  kgPlanned: sql<number>`COALESCE(SUM(${WarehouseWorkOrderLines.kgPlanned}), 0)`,
  kgActual: sql<number>`COALESCE(SUM(${WarehouseWorkOrderLines.kgActual}), 0)`,
};

/** Turns the SUM/COUNT strings MySQL returns into the numbers the type promises. */
const withTotals = <T extends Record<string, unknown>>(
  row: T & {
    warehouseName: string | null;
    lineCount: unknown;
    qtyPlanned: unknown;
    qtyActual: unknown;
    kgPlanned: unknown;
    kgActual: unknown;
  },
) => ({
  ...row,
  warehouseName: row.warehouseName ?? null,
  lineCount: Number(row.lineCount ?? 0),
  qtyPlanned: Number(row.qtyPlanned ?? 0),
  qtyActual: Number(row.qtyActual ?? 0),
  kgPlanned: Number(row.kgPlanned ?? 0),
  kgActual: Number(row.kgActual ?? 0),
});

const workOrderRows =
  (query: TableQuery) =>
  (limit: number, offset: number): Promise<WorkOrderListItem[]> =>
    db
      .select({
        ...getTableColumns(WarehouseWorkOrders),
        warehouseName: Warehouses.name,
        ...LINE_TOTALS,
      })
      .from(WarehouseWorkOrders)
      .leftJoin(
        Warehouses,
        eq(WarehouseWorkOrders.warehouseUuid, Warehouses.uuid),
      )
      .leftJoin(
        WarehouseWorkOrderLines,
        eq(WarehouseWorkOrderLines.workOrderUuid, WarehouseWorkOrders.uuid),
      )
      .where(
        tableWhere({
          query,
          search: WORK_ORDER_SEARCH,
          filters: WORK_ORDER_FILTERS,
        }),
      )
      .groupBy(WarehouseWorkOrders.id, Warehouses.name)
      .orderBy(
        ...tableOrderBy(
          WORK_ORDER_SORTABLE,
          query,
          [desc(WarehouseWorkOrders.plannedDate)],
          WarehouseWorkOrders.id,
        ),
      )
      .limit(limit)
      .offset(offset)
      .then((rows) => rows.map(withTotals));

export const getWarehouseWorkOrders = async (
  query: TableQuery,
): Promise<Paged<WorkOrderListItem>> => {
  try {
    return await runPaged(query, {
      rows: workOrderRows(query),
      count: async () => {
        const [row] = await db
          .select({
            value: sql<number>`COUNT(DISTINCT ${WarehouseWorkOrders.id})`,
          })
          .from(WarehouseWorkOrders)
          .leftJoin(
            Warehouses,
            eq(WarehouseWorkOrders.warehouseUuid, Warehouses.uuid),
          )
          .leftJoin(
            WarehouseWorkOrderLines,
            eq(WarehouseWorkOrderLines.workOrderUuid, WarehouseWorkOrders.uuid),
          )
          .where(
            tableWhere({
              query,
              search: WORK_ORDER_SEARCH,
              filters: WORK_ORDER_FILTERS,
            }),
          );
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch warehouse work orders"),
    );
  }
};

/** Every work order the current view matches, as a workbook. */
export const exportWarehouseWorkOrders = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Warehouse Work Orders",
    columns: WAREHOUSE_WORK_ORDER_COLUMNS,
    columnKeys,
    rows: workOrderRows(parseTableQuery(params)),
  });

// Not exported: every export in a "use server" file becomes a callable
// endpoint, and only the detail page needs these.
export const getWarehouseWorkOrderLines = async (
  workOrderUuids: string[],
): Promise<WorkOrderLineListItem[]> => {
  if (workOrderUuids.length === 0) {
    return [];
  }
  const rows = await db
    .select({
      ...getTableColumns(WarehouseWorkOrderLines),
      companyName: Companies.companyName,
      productName: Products.name,
      fromLocationName: FromLocation.name,
      toLocationName: ToLocation.name,
      customerLabelForPickingSlip: Products.customerLabelForPickingSlip,
      stockLabelBreakdown: Products.stockLabelBreakdown,
      stockLabelPieces: Products.stockLabelPieces,
    })
    .from(WarehouseWorkOrderLines)
    .leftJoin(
      Companies,
      eq(WarehouseWorkOrderLines.companyUuid, Companies.uuid),
    )
    // On the product's own reference, never on its code: a code is a label a
    // person types and two products can carry the same one, which would fan a
    // single line out into one row per product sharing it.
    .leftJoin(Products, eq(WarehouseWorkOrderLines.productUuid, Products.uuid))
    .leftJoin(
      FromLocation,
      eq(WarehouseWorkOrderLines.fromLocationUuid, FromLocation.uuid),
    )
    .leftJoin(
      ToLocation,
      eq(WarehouseWorkOrderLines.toLocationUuid, ToLocation.uuid),
    )
    .where(inArray(WarehouseWorkOrderLines.workOrderUuid, workOrderUuids))
    .orderBy(WarehouseWorkOrderLines.lineNumber, WarehouseWorkOrderLines.id);

  return rows.map(
    ({
      customerLabelForPickingSlip,
      stockLabelBreakdown,
      stockLabelPieces,
      ...line
    }) => ({
      ...line,
      companyName: line.companyName ?? null,
      productName: line.productName ?? null,
      fromLocationName: line.fromLocationName ?? null,
      toLocationName: line.toLocationName ?? null,
      customerLabels: customerLabelCount(customerLabelForPickingSlip, {
        colli: line.colliCount ?? 0,
        pieces: Number(line.qtyPlanned ?? 0),
      }),
      stockLabels: stockLabelCount(stockLabelBreakdown, {
        bundles: line.colliCount ?? 0,
        amountPerLine: stockLabelPieces ?? 0,
      }),
      labelMedium: customerLabelMedium(customerLabelForPickingSlip),
    }),
  );
};

/** The trips one line is made of — where each part of it comes from. */
/**
 * Everything behind one line: the shelf, the order, the finishing and the notes.
 *
 * The floor opens this to answer questions the line itself cannot — is there
 * more of this material somewhere else, who is it for, does it need stamping,
 * and is there a standing instruction about the delivery. Each part is
 * independent, so a line with no order still returns its stock.
 */
const availableQuantity = sql<string>`(${Stock.quantity} - ${Stock.reservedQuantity})`;

export const getAvailableStockForSelect = async (): Promise<
  AvailableStockOption[]
> =>
  db
    .select({
      uuid: Stock.uuid,
      quantity: availableQuantity,
      productUuid: Products.uuid,
      productCode: Products.productCode,
      productName: Products.name,
    })
    .from(Stock)
    .innerJoin(Products, eq(Stock.productUuid, Products.uuid))
    .leftJoin(Warehouses, eq(Stock.locationUuid, Warehouses.uuid))
    .where(
      and(
        eq(Stock.status, "pending"),
        eq(Stock.blocked, false),
        gt(availableQuantity, "0"),
        // Somebody else's metal is never ours to promise. The reference keeps
        // it on a screen of its own — `Klant voorraad op locatie`, 94 rows of
        // it — and marks it `Stock category = 3rd party inventory` with the
        // owning company in the `Supplier` field. It sits on ordinary `Pick`
        // locations (85 of 94), is unblocked on every row, and has stock and a
        // location like anything else, so nothing else in this WHERE clause
        // would have kept it out of a sales line.
        isNull(Stock.ownerCompanyUuid),
        // A lot with no location, or on a location whose type says nothing
        // about sellability, is assumed free; only the named unsellable kinds
        // are excluded.
        or(
          isNull(Stock.locationUuid),
          isNull(Warehouses.locationType),
          notInArray(Warehouses.locationType, NON_SELLABLE_LOCATION_TYPES),
        ),
      ),
    )
    .orderBy(desc(Stock.createdAt));

export const getWarehouseWorkOrderLineDetail = async (
  lineUuid: string,
): Promise<LineDetail | null> => {
  const [line] = await db
    .select({
      productUuid: WarehouseWorkOrderLines.productUuid,
      orderItemUuid: WarehouseWorkOrderLines.orderItemUuid,
    })
    .from(WarehouseWorkOrderLines)
    .where(eq(WarehouseWorkOrderLines.uuid, lineUuid))
    .limit(1);

  if (!line) {
    return null;
  }

  return getWorkOrderLineDetail(line);
};

/**
 * The lots the floor may report this line against.
 *
 * Scoped to the line's product, and ordered so the line's own `From location`
 * comes first — the reference scopes it harder still, opening with a filter
 * chip reading `Location = 2C7` and offering 2 of the product's 14 lots. The
 * chip is removable there, so the other locations are returned too and the
 * dialog decides which to show.
 *
 * Blocked lots and other people's metal stay out, as everywhere else. What does
 * *not* filter anything here is the reservation — see `PickableLot`.
 */
export const getPickableLotsForLine = async (
  lineUuid: string,
): Promise<PickableLot[]> => {
  const [line] = await db
    .select({
      productUuid: WarehouseWorkOrderLines.productUuid,
      fromLocationUuid: WarehouseWorkOrderLines.fromLocationUuid,
    })
    .from(WarehouseWorkOrderLines)
    .where(eq(WarehouseWorkOrderLines.uuid, lineUuid))
    .limit(1);

  if (!line?.productUuid) {
    return [];
  }

  // 🔴 Which lot goes first is the product's decision, not ours.
  //
  // `Stock control → Dispatch strategy` read `LIFO` on `PK44115025125`
  // (2-10-2026) — newest bundle first. Stainless does not perish, and the lot
  // that arrived last is the one still reachable rather than buried at the back.
  // We used to hard-code that ordering; now the product says, and a `FIFO`
  // product is served oldest-first as it should be.
  const [product] = await db
    .select({ dispatchStrategy: Products.batchDispatchStrategy })
    .from(Products)
    .where(eq(Products.uuid, line.productUuid))
    .limit(1);

  const dispatchStrategy = product?.dispatchStrategy ?? "lifo";

  const rows = await db
    .select({
      uuid: Stock.uuid,
      locationUuid: Stock.locationUuid,
      locationName: Warehouses.name,
      charge: Stock.charge,
      internalCharge: Stock.internalCharge,
      internalBatch: Stock.internalBatch,
      quality: Stock.quality,
      stockCategory: Stock.stockCategory,
      receiptDate: Stock.receiptDate,
      valuationPrice: Stock.valuationPrice,
      quantity: Stock.quantity,
      reserved: Stock.reservedQuantity,
    })
    .from(Stock)
    .leftJoin(Warehouses, eq(Stock.locationUuid, Warehouses.uuid))
    .where(
      and(
        eq(Stock.productUuid, line.productUuid),
        eq(Stock.status, "pending"),
        eq(Stock.blocked, false),
        isNull(Stock.ownerCompanyUuid),
        gt(Stock.quantity, "0"),
      ),
    )
    .orderBy(
      dispatchStrategy === "fifo"
        ? asc(Stock.receiptDate)
        : desc(Stock.receiptDate),
    );

  return rows
    .map(({ quantity, reserved, ...lot }) => ({
      ...lot,
      available: Number(quantity ?? 0),
      reserved: Number(reserved ?? 0),
      onLineLocation:
        line.fromLocationUuid !== null &&
        lot.locationUuid === line.fromLocationUuid,
    }))
    .sort((a, b) => Number(b.onLineLocation) - Number(a.onLineLocation));
};

export const getWarehouseWorkOrderPicks = async (
  lineUuid: string,
): Promise<WorkOrderPickRow[]> => {
  const rows = await db
    .select({
      ...getTableColumns(WarehouseWorkOrderPicks),
      stockCharge: Stock.charge,
      stockInternalCharge: Stock.internalCharge,
      stockQuantity: Stock.quantity,
      fromLocationName: Warehouses.name,
    })
    .from(WarehouseWorkOrderPicks)
    .leftJoin(Stock, eq(WarehouseWorkOrderPicks.stockUuid, Stock.uuid))
    .leftJoin(
      Warehouses,
      eq(WarehouseWorkOrderPicks.fromLocationUuid, Warehouses.uuid),
    )
    .where(eq(WarehouseWorkOrderPicks.workOrderLineUuid, lineUuid))
    .orderBy(WarehouseWorkOrderPicks.id);

  return rows.map((row) => ({
    ...row,
    stockCharge: row.stockCharge ?? null,
    stockInternalCharge: row.stockInternalCharge ?? null,
    stockQuantity: row.stockQuantity ?? null,
    fromLocationName: row.fromLocationName ?? null,
  }));
};

/**
 * One work order with the warehouse it belongs to, every line on it and the
 * packaging its goods went out on.
 */
/**
 * The overview, as the four-level tree the floor reads.
 *
 * Paged by work order rather than by line: a job's lines belong together, and
 * splitting one across two pages would show a total that means nothing.
 */
export const getWarehouseWorkOrderTree = async (
  query: TableQuery,
): Promise<WarehouseWorkOrderTree> => {
  const page = await getWarehouseWorkOrders(query);
  const lines = await getWarehouseWorkOrderLines(
    page.rows.map((workOrder) => workOrder.uuid),
  );

  const byUuid = new Map(page.rows.map((row) => [row.uuid, row]));

  return {
    page,
    rows: lines.flatMap((line) => {
      const workOrder = byUuid.get(line.workOrderUuid);
      if (!workOrder) {
        return [];
      }
      return [
        {
          ...line,
          lineUuid: line.uuid,
          workOrderNumber: workOrder.number,
          workOrderStatus: workOrder.status,
          plannedDate: workOrder.plannedDate,
          type: workOrder.type,
          groupLabel: WAREHOUSE_WORK_ORDER_TYPE_LABELS[workOrder.type],
          lineLabel: [line.lineNumber, line.productName ?? line.productCode]
            .filter((part) => part !== null && part !== undefined)
            .join(" "),
        },
      ];
    }),
  };
};

export const getWarehouseWorkOrderDetail = async (
  uuid: string,
): Promise<WorkOrderDetail | null> => {
  const [workOrder] = await db
    .select({
      ...getTableColumns(WarehouseWorkOrders),
      warehouseName: Warehouses.name,
      ...LINE_TOTALS,
    })
    .from(WarehouseWorkOrders)
    .leftJoin(
      Warehouses,
      eq(WarehouseWorkOrders.warehouseUuid, Warehouses.uuid),
    )
    .leftJoin(
      WarehouseWorkOrderLines,
      eq(WarehouseWorkOrderLines.workOrderUuid, WarehouseWorkOrders.uuid),
    )
    .where(eq(WarehouseWorkOrders.uuid, uuid))
    .groupBy(WarehouseWorkOrders.id, Warehouses.name)
    .limit(1);

  if (!workOrder) {
    return null;
  }

  // Sequential rather than concurrent: this database caps connections.
  const lines = await getWarehouseWorkOrderLines([uuid]);
  const packagings = await db
    .select()
    .from(WarehouseWorkOrderPackagings)
    .where(eq(WarehouseWorkOrderPackagings.workOrderUuid, uuid))
    .orderBy(WarehouseWorkOrderPackagings.id);

  return { ...withTotals(workOrder), lines, packagings };
};

export const addWarehouseWorkOrderLine = async (
  input: AddWorkOrderLineInput,
): Promise<WarehouseWorkOrderActionResult> => {
  try {
    const userId = (await currentUser())?.id ?? null;
    const [workOrder] = await db
      .select()
      .from(WarehouseWorkOrders)
      .where(eq(WarehouseWorkOrders.uuid, input.workOrderUuid))
      .limit(1);

    if (!workOrder) {
      return { error: "Work order not found." };
    }

    // Releasing freezes the job and hands it to the floor. Adding to it after
    // that would put goods on a list somebody is already picking from.
    if (workOrder.status !== "new") {
      return {
        error: "Lines can only be added while the work order is still new.",
      };
    }

    // A pick, a collection or a machine feed exists because a document asked
    // for it. Without that link the goods move but nothing is ever marked
    // delivered, and the order line stays open for material already gone.
    const serves = WAREHOUSE_WORK_ORDER_TYPE_META[workOrder.type].serves;
    if (serves === "order" && !input.orderItemUuid) {
      return {
        error:
          "A line of this type has to name the order line it is picking for.",
      };
    }
    if (serves === "purchase" && !input.purchaseOrderItemUuid) {
      return {
        error:
          "A receipt has to name the purchase line the goods arrived against.",
      };
    }

    // Where the goods come from and what they are is read off the lot rather
    // than taken on trust: a line whose source disagrees with where the lot
    // actually stands would send somebody to the wrong shelf.
    const [lot] = input.stockUuid
      ? await db
          .select({
            locationUuid: Stock.locationUuid,
            productUuid: Stock.productUuid,
            productCode: Products.productCode,
            charge: Stock.charge,
            internalCharge: Stock.internalCharge,
            quality: Stock.quality,
            lengthMm: Stock.lengthMm,
            widthMm: Stock.widthMm,
          })
          .from(Stock)
          .leftJoin(Products, eq(Stock.productUuid, Products.uuid))
          .where(eq(Stock.uuid, input.stockUuid))
          .limit(1)
      : [];

    if (input.stockUuid && !lot) {
      return { error: "That stock lot no longer exists." };
    }

    await db.insert(WarehouseWorkOrderLines).values({
      modifiedByUserId: userId,
      uuid: generateUuid(),
      workOrderUuid: input.workOrderUuid,
      lineNumber: input.lineNumber ?? null,
      orderItemUuid: input.orderItemUuid ?? null,
      orderNumber: input.orderNumber ?? null,
      companyUuid: input.companyUuid ?? null,
      stockUuid: input.stockUuid ?? null,
      productUuid: lot?.productUuid ?? input.productUuid ?? null,
      productCode: lot?.productCode ?? input.productCode ?? null,
      charge: lot?.charge ?? null,
      internalCharge: lot?.internalCharge ?? null,
      quality: lot?.quality ?? null,
      purchaseOrderItemUuid: input.purchaseOrderItemUuid ?? null,
      returnOrderItemUuid: input.returnOrderItemUuid ?? null,
      fromLocationUuid: lot?.locationUuid ?? input.fromLocationUuid ?? null,
      toLocationUuid: input.toLocationUuid ?? null,
      // Either decimal separator is accepted on the way in; the column only
      // reads one.
      qtyPlanned: toDecimalQuantity(input.qtyPlanned, "0.000"),
      kgPlanned: input.kgPlanned ? toDecimalAmount(input.kgPlanned) : null,
      length: input.length ?? lot?.lengthMm ?? null,
      width: input.width ?? lot?.widthMm ?? null,
      thickness: input.thickness ?? null,
      priority: input.priority ?? null,
      rush: input.rush ?? false,
    });

    revalidatePath(`/warehouse-work-orders/${input.workOrderUuid}`);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to add the line") };
  }
};

/**
 * Freeze the job and hand it to the floor.
 *
 * Release prints the papers and the stock labels — releasing without them is a
 * deliberate choice for goods that already carry one. It moves no stock: that
 * only happens when a line is reported completed, which is exactly why a
 * released order can still be cancelled outright.
 */
export const releaseWarehouseWorkOrder = async (
  uuid: string,
  printStockLabels: boolean,
): Promise<WarehouseWorkOrderActionResult> => {
  try {
    const [workOrder] = await db
      .select()
      .from(WarehouseWorkOrders)
      .where(eq(WarehouseWorkOrders.uuid, uuid))
      .limit(1);

    if (!workOrder) {
      return { error: "Work order not found." };
    }
    if (workOrder.status !== "new") {
      return { error: "Only a new work order can be released." };
    }

    const lines = await db
      .select({
        uuid: WarehouseWorkOrderLines.uuid,
        orderItemUuid: WarehouseWorkOrderLines.orderItemUuid,
      })
      .from(WarehouseWorkOrderLines)
      .where(eq(WarehouseWorkOrderLines.workOrderUuid, uuid));

    if (lines.length === 0) {
      return { error: "A work order with no lines has nothing to release." };
    }

    await db.transaction(async (tx) => {
      const [result] = await tx
        .update(WarehouseWorkOrders)
        .set({
          status: "released",
          releasedAt: new Date(),
          stockLabelsPrinted: printStockLabels,
        })
        .where(
          and(
            eq(WarehouseWorkOrders.uuid, uuid),
            eq(WarehouseWorkOrders.status, "new"),
          ),
        );

      if (result.affectedRows === 0) {
        throw new Error(
          "The work order changed while releasing it — please refresh and try again.",
        );
      }

      await tx
        .update(WarehouseWorkOrderLines)
        .set({ status: "released" })
        .where(eq(WarehouseWorkOrderLines.workOrderUuid, uuid));

      // The order line is now being worked on, and it names the job doing it —
      // which is what cancelling later has to put back.
      const orderItemUuids = lines
        .map((line) => line.orderItemUuid)
        .filter((value): value is string => value !== null);

      if (orderItemUuids.length > 0) {
        await tx
          .update(OrderItems)
          .set({
            lineStatus: "in_progress",
            deliveryStatus: "released",
            lastWarehouseWorkOrder: String(workOrder.number),
          })
          .where(inArray(OrderItems.uuid, orderItemUuids));
      }
    });

    revalidatePath("/warehouse-work-orders");
    revalidatePath(`/warehouse-work-orders/${uuid}`);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to release the work order") };
  }
};

/**
 * Say ahead of time which lots a line will be drawn from.
 *
 * Optional — the completion dialog opens with a single row taken from the line
 * itself when nobody has prepared it. It earns its place when the quantity has
 * to come out of several lots, which is the case the floor cannot improvise.
 */
export const prepareWarehouseWorkOrderLine = async (
  lineUuid: string,
  rawPicks: PreparePickInput[],
): Promise<WarehouseWorkOrderActionResult> => {
  try {
    // The floor may type either decimal separator, so the quantities are put
    // into the one form MySQL reads before anything counts them.
    const picks = rawPicks.map((pick) => ({
      ...pick,
      qtyPlanned: toDecimalQuantity(pick.qtyPlanned, "0.000"),
      kgPlanned: pick.kgPlanned ? toDecimalAmount(pick.kgPlanned) : pick.kgPlanned,
    }));

    const [line] = await db
      .select()
      .from(WarehouseWorkOrderLines)
      .where(eq(WarehouseWorkOrderLines.uuid, lineUuid))
      .limit(1);

    if (!line) {
      return { error: "Work order line not found." };
    }
    if (line.status === "approved") {
      return { error: "This line has already been reported completed." };
    }
    if (picks.length === 0) {
      return { error: "Give at least one lot to draw from." };
    }

    const planned = picks.reduce(
      (total, pick) => total + Number(pick.qtyPlanned),
      0,
    );
    if (planned <= 0) {
      return { error: "The prepared quantity has to be more than zero." };
    }

    await db.transaction(async (tx) => {
      // Only rows nobody has reported yet are replaced — a line part-reported
      // and then re-prepared must not lose what the floor already did.
      await tx
        .delete(WarehouseWorkOrderPicks)
        .where(
          and(
            eq(WarehouseWorkOrderPicks.workOrderLineUuid, lineUuid),
            isNull(WarehouseWorkOrderPicks.executedAt),
          ),
        );

      await tx.insert(WarehouseWorkOrderPicks).values(
        picks.map((pick) => ({
          uuid: generateUuid(),
          workOrderLineUuid: lineUuid,
          stockUuid: pick.stockUuid,
          fromLocationUuid: line.fromLocationUuid,
          toLocationUuid: pick.toLocationUuid ?? line.toLocationUuid,
          qtyPlanned: pick.qtyPlanned,
          kgPlanned: pick.kgPlanned ?? null,
          length: line.length,
          width: line.width,
        })),
      );
    });

    revalidatePath(`/warehouse-work-orders/${line.workOrderUuid}`);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to prepare the line") };
  }
};

/**
 * Take a lot off the shelf for good — collected by the customer, or scrapped.
 *
 * The value leaves inventory here rather than when the invoice is raised, which
 * is what the "goods delivered, not yet invoiced" account is for. Scrap has no
 * counterparty to bill, so its value goes straight to the result.
 */
const applyIssue = async (
  tx: Transaction,
  params: {
    source: SelectStock;
    quantity: number;
    reason: "warehouse_issue" | "warehouse_scrapped" | "external_processing_issue";
    userId: string;
    orderUuid: string | null;
    companyUuid: string | null;
    documentNo: string;
  /**
   * The work order line that moved the metal. The reference puts this in a
   * column of its own and fills it on 10.464 of its 10.584 real movements,
   * leaving it empty on every one of its 2.978 corrections — so an empty one
   * means somebody adjusted the books rather than shifted anything.
   */
    warehouseWorkOrderLineUuid: string | null;
  },
): Promise<number> => {
  const { source, quantity } = params;
  const previousQuantity = Number(source.quantity);

  if (quantity > previousQuantity) {
    throw new Error(
      `Cannot issue ${quantity} — the lot only holds ${previousQuantity}.`,
    );
  }

  const unitCost = Number(source.valuationPrice ?? 0);
  const previousValue = Number(source.valuationEuro ?? 0);
  const remainingQuantity = previousQuantity - quantity;
  const remainingValue = restateLotValue({
    previousQuantity,
    remainingQuantity,
    unitCost,
    previousValue,
  });
  const valueRemoved = previousValue - remainingValue;
  const released = Math.min(quantity, Number(source.reservedQuantity ?? 0));

  const [updated] = await tx
    .update(Stock)
    .set({
      quantity: remainingQuantity.toFixed(STOCK_QUANTITY_SCALE),
      reservedQuantity: (
        Number(source.reservedQuantity ?? 0) - released
      ).toFixed(STOCK_QUANTITY_SCALE),
      valuationEuro: moneyString(remainingValue),
      status: remainingQuantity > 0 ? "pending" : "received",
    })
    .where(and(eq(Stock.uuid, source.uuid), eq(Stock.quantity, source.quantity)));

  if (updated.affectedRows === 0) {
    throw new Error(
      "The lot changed while issuing it — please refresh and try again.",
    );
  }

  await tx.insert(StockMovements).values({
    uuid: generateUuid(),
    productUuid: source.productUuid,
    stockUuid: source.uuid,
    type: "out",
    reason: params.reason,
    quantity: quantity.toFixed(STOCK_QUANTITY_SCALE),
    // Origin travels with the metal: the reference names the supplier and the
    // purchase order on outbound rows too.
    ...lotOrigin(source),
    orderUuid: params.orderUuid,
    warehouseWorkOrderLineUuid: params.warehouseWorkOrderLineUuid,
    createdByUserId: params.userId,
  });

  await recordFreightMovement(tx, {
    productUuid: source.productUuid,
    quantity: quantity.toFixed(3),
    type: "out",
    reason: params.reason,
    companyUuid: params.companyUuid,
    orderUuid: params.orderUuid,
    valuationPrice: source.valuationPrice,
    operator: params.userId,
  });

  if (Math.abs(valueRemoved) >= 0.005) {
    await tx.insert(JournalEntries).values(
      buildInventoryMovementEntry({
        bookingDate: todayDateString(),
        documentNo: params.documentNo,
        description: `Warehouse — ${STOCK_MOVEMENT_REASON_LABELS[params.reason]}`,
        companyUuid: params.companyUuid,
        debCreditor: null,
        inventoryValue: -valueRemoved,
        counterAccount:
          params.reason === "warehouse_issue"
            ? LEDGER_ACCOUNTS.goodsDeliveredNotInvoiced
            : params.reason === "external_processing_issue"
              ? LEDGER_ACCOUNTS.stockAtProcessor
              : LEDGER_ACCOUNTS.inventoryDifferences,
        reference: `Stock lot ${source.uuid}`,
        userId: params.userId,
      }),
    );
  }

  return valueRemoved;
};

/**
 * Set a lot to what was actually found on the shelf.
 *
 * The reported figure is the new quantity, not an amount to shift — which is
 * what separates a count from every other kind of line. A difference has no
 * document behind it, so its value is a gain or a loss the moment it is
 * recorded.
 */
const applyCount = async (
  tx: Transaction,
  params: {
    source: SelectStock;
    countedQuantity: number;
    userId: string;
    documentNo: string;
  },
): Promise<void> => {
  const { source, countedQuantity } = params;
  const previousQuantity = Number(source.quantity);
  const delta = countedQuantity - previousQuantity;

  if (delta === 0) {
    return;
  }

  const unitCost = Number(source.valuationPrice ?? 0);
  const previousValue = Number(source.valuationEuro ?? 0);
  const nextValue =
    delta > 0
      ? previousValue + delta * unitCost
      : restateLotValue({
          previousQuantity,
          remainingQuantity: countedQuantity,
          unitCost,
          previousValue,
        });

  const [updated] = await tx
    .update(Stock)
    .set({
      quantity: countedQuantity.toFixed(3),
      valuationEuro: moneyString(nextValue),
      status: countedQuantity > 0 ? "pending" : "received",
    })
    .where(and(eq(Stock.uuid, source.uuid), eq(Stock.quantity, source.quantity)));

  if (updated.affectedRows === 0) {
    throw new Error(
      "The lot changed while counting it — please refresh and try again.",
    );
  }

  await tx.insert(StockMovements).values({
    uuid: generateUuid(),
    productUuid: source.productUuid,
    stockUuid: source.uuid,
    type: delta > 0 ? "in" : "out",
    reason: "count_correction",
    quantity: Math.abs(delta).toFixed(3),
    createdByUserId: params.userId,
  });

  await recordFreightMovement(tx, {
    productUuid: source.productUuid,
    quantity: Math.abs(delta).toFixed(3),
    type: delta > 0 ? "in" : "out",
    reason: "count_correction",
    valuationPrice: source.valuationPrice,
    operator: params.userId,
  });

  const valueChange = nextValue - previousValue;

  if (Math.abs(valueChange) >= 0.005) {
    await tx.insert(JournalEntries).values(
      buildInventoryMovementEntry({
        bookingDate: todayDateString(),
        documentNo: params.documentNo,
        description: "Warehouse — Count Correction",
        companyUuid: null,
        debCreditor: null,
        inventoryValue: valueChange,
        counterAccount: LEDGER_ACCOUNTS.inventoryDifferences,
        reference: `Stock lot ${source.uuid}`,
        userId: params.userId,
      }),
    );
  }
};

/**
 * Report what the floor actually did — and move the stock.
 *
 * This is the only place a warehouse work order changes what is on the shelf.
 * Releasing prints; cancelling undoes; reporting is the moment the goods are
 * really somewhere else. A line reported short still closes: the order line it
 * serves stays open for the remainder, and a later job picks that up.
 */
export const reportWarehouseWorkOrderLineCompletion = async (
  input: ReportCompletionInput,
): Promise<WarehouseWorkOrderActionResult> => {
  try {
    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return { error: "User not authenticated" };
    }

    const [row] = await db
      .select({
        line: getTableColumns(WarehouseWorkOrderLines),
        workOrder: getTableColumns(WarehouseWorkOrders),
      })
      .from(WarehouseWorkOrderLines)
      .innerJoin(
        WarehouseWorkOrders,
        eq(WarehouseWorkOrderLines.workOrderUuid, WarehouseWorkOrders.uuid),
      )
      .where(eq(WarehouseWorkOrderLines.uuid, input.lineUuid))
      .limit(1);

    if (!row) {
      return { error: "Work order line not found." };
    }

    const { line, workOrder } = row;

    // An unloading is reported straight away: on 327402 (9-10-2026)
    // `Vrijgeven` was greyed and `Gereedmelden…` live while the slip was
    // still New — a lorry is not released onto the floor, it arrives.
    if (workOrder.status === "new" && workOrder.type !== "unloading") {
      return {
        error: "Release the work order before reporting work against it.",
      };
    }
    if (line.status === "approved") {
      return { error: "This line has already been reported completed." };
    }

    const meta = WAREHOUSE_WORK_ORDER_TYPE_META[workOrder.type];
    // A blank actual says nothing about the row and is dropped; a zero is a
    // real answer and has to survive. Whatever remains is normalised to a dot
    // separator first, so a comma-typed quantity is not counted as NaN.
    const reported = input.picks
      .filter((pick) => pick.qtyActual.trim() !== "")
      .map((pick) => ({
        ...pick,
        qtyActual: toDecimalQuantity(pick.qtyActual, "0.000"),
        kgActual: pick.kgActual ? toDecimalAmount(pick.kgActual) : pick.kgActual,
      }));

    if (reported.length === 0) {
      return { error: "Report at least one row." };
    }

    // 🔴 A heat number per bundle, or the metal does not become stock.
    //
    // Watched on 21-9-2026, reporting the unloading of purchase order 401141.
    // Its dialog offered five bundles and kept `OK` greyed out through every
    // other attempt — ticking rows, committing cells, filling `By:` — until
    // every row carrying a quantity had a `Charge`. It is the hardest
    // validation rule found anywhere in the reference, and it is the reason a
    // delivered sheet can always be traced back to the heat it was rolled from.
    //
    // Only on the way in. A pick takes its charge from the lot it draws on, and
    // a move carries whatever the lot already holds.
    if (meta.stockEffect === "in") {
      const missing = reported.filter(
        (pick) =>
          Number(pick.qtyActual) > 0 && !normaliseCharge(pick.charge ?? null),
      );
      if (missing.length > 0) {
        return {
          error:
            missing.length === reported.length
              ? "Every bundle needs its charge — the heat number from the certificate — before these goods can become stock."
              : `${missing.length} of ${reported.length} bundles have no charge. Every bundle needs the heat number from its certificate before these goods can become stock.`,
        };
      }
    }

    // 🔴 And on the way out: a lot per row, or there is nothing to take from.
    //
    // Watched on 29-9-2026. The reference does not guard this. `Report
    // completion` was pressed on picking work order `312722`, whose five lines
    // all carried `Charge` = `-`, and `ez2Lib.Shared 3.13.0.508` threw a
    // `NullReferenceException` and offered nothing but `Close application` —
    // twice, on two different work orders.
    //
    // The cause is the mirror of the rule above. On an unloading the charge is
    // typed; on a picking it is *pre-filled from the allocated lot*. With no
    // lot there is nothing to pre-fill, and the dialog dereferences it.
    //
    // So allocation is a step of its own, before reporting. The reference
    // leaves that implicit and crashes when it is skipped. We say it out loud.
    if (meta.stockEffect === "out" || meta.stockEffect === "move") {
      const unallocated = reported.filter(
        (pick) => Number(pick.qtyActual) > 0 && !pick.stockUuid,
      );
      if (unallocated.length > 0) {
        return {
          error:
            unallocated.length === reported.length
              ? "No row has a lot to draw from. Allocate stock to this line before reporting it."
              : `${unallocated.length} of ${reported.length} rows have no lot to draw from. Allocate stock to every row before reporting it.`,
        };
      }
    }

    // 🔴 How far a report may stray from its plan is a property of the product.
    //
    // Read off `PK44115025125` on 2-10-2026 — unloading 5/5, count 0/0, picking
    // 5/5, production —/0 — and the three different rules are the point. A count
    // must be exact or it is not a count. A picking may be 5 % out, which is the
    // slack that absorbs the 1,911 % gap between trade and theoretical density
    // and the 2–4 % by which cold-rolled coil runs under nominal.
    //
    // The reference's four rows land on our four stock effects exactly, so the
    // branch is the one the completion routine already makes.
    const toleranceBreach = await breachedTolerance({
      productUuid: line.productUuid,
      kind: TOLERANCE_KIND_BY_STOCK_EFFECT[meta.stockEffect],
      qtyPlanned: Number(line.qtyPlanned ?? 0),
      kgPlanned: Number(line.kgPlanned ?? 0),
      reported,
    });
    if (toleranceBreach) {
      return { error: toleranceBreach };
    }

    const [approvalRule] = line.productUuid
      ? await db
          .select({
            manual: Products.alwaysApproveManuallyWarehouseWorkorderLine,
          })
          .from(Products)
          .where(eq(Products.uuid, line.productUuid))
          .limit(1)
      : [];
    const approveManually = approvalRule?.manual === true;

    const documentNo = `WWO-${workOrder.number}`;
    const executedAt = new Date(input.executedAt);
    if (Number.isNaN(executedAt.getTime())) {
      return { error: "The execution date is not a real date." };
    }

    const orderUuid = line.orderItemUuid
      ? ((
          await db
            .select({ uuid: Orders.uuid })
            .from(OrderItems)
            .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
            .where(eq(OrderItems.uuid, line.orderItemUuid))
            .limit(1)
        )[0]?.uuid ?? null)
      : null;

    await db.transaction(async (tx) => {
      // What the line ends up carrying, in the order it was reported. A floor
      // that walked to a different parcel than the one planned has to leave the
      // line naming the heat it really shipped, or the delivery note traces to
      // metal that never left the building — so these are resolved against the
      // lot each row drew on, not against what the dialog arrived holding.
      const reportedIdentities: {
        charge: string | null;
        internalCharge: string | null;
        internalBatch: string | null;
      }[] = [];

      for (const pick of reported) {
        const quantity = Number(pick.qtyActual);

        if (Number.isNaN(quantity) || quantity < 0) {
          throw new Error("A reported quantity has to be zero or more.");
        }

        // Zero is a real answer, and it means two different things. On a move,
        // an issue or a receipt it means nothing was picked — the row is still
        // written, there is simply nothing to shift. On a count it means the
        // shelf was empty, which is a finding: the lot has to be written down to
        // nothing rather than left standing at whatever it claimed to hold.
        const isCount = meta.stockEffect === "count";

        // Read before the branch, because the row records where the metal
        // actually came from as well as what it did. A split report may draw
        // its second parcel off a lot on another shelf than the line names —
        // which is the whole point of the reference's `+ New` — so the line's
        // own `From location` is a default, not the answer.
        const source = pick.stockUuid
          ? (
              await tx
                .select()
                .from(Stock)
                .where(eq(Stock.uuid, pick.stockUuid))
                .limit(1)
            )[0]
          : undefined;

        if (quantity > 0 || isCount) {
          if (meta.stockEffect === "in") {
            const toLocationUuid = pick.toLocationUuid ?? line.toLocationUuid;
            if (!toLocationUuid) {
              throw new Error("An unloading needs a location to put goods in.");
            }
            if (!line.productUuid) {
              throw new Error("An unloading needs to know which product it is receiving.");
            }
            await applyReceipt(tx, {
              productUuid: line.productUuid,
              quantity,
              toLocationUuid,
              purchaseOrderItemUuid: line.purchaseOrderItemUuid,
              returnOrderItemUuid: line.returnOrderItemUuid,
              charge: pick.charge ?? null,
              internalCharge: pick.internalCharge ?? null,
              internalBatch: pick.internalBatch ?? null,
              // What this bundle actually weighed on the way in.
              weighedKg:
                pick.kgActual === null || pick.kgActual === undefined
                  ? null
                  : Number(pick.kgActual),
              userId,
              companyUuid: line.companyUuid,
              documentNo,
              warehouseWorkOrderLineUuid: input.lineUuid,
            });
          } else {
            if (!source) {
              throw new Error(
                "This line has no lot to draw from — prepare it against stock first.",
              );
            }

            if (line.purchaseOrderSupplyUuid) {
              // 🔑 A supply to a processor (C8): picking it sends the lot out.
              // `315201` took the coil from `5G` to `Laad` and the lorry took
              // it to Decomecc; here the lot leaves stock on the report, into
              // 3100, and the supply reads `Delivered`.
              const sentKg =
                Number(source.quantity) > 0
                  ? (Number(source.quantityKg ?? 0) * quantity) /
                    Number(source.quantity)
                  : 0;
              const valueSent = await applyIssue(tx, {
                source,
                quantity,
                reason: "external_processing_issue",
                userId,
                orderUuid,
                companyUuid: line.companyUuid,
                documentNo,
                warehouseWorkOrderLineUuid: input.lineUuid,
              });
              await markSupplyDelivered(tx, line.purchaseOrderSupplyUuid, {
                quantity,
                kg:
                  pick.kgActual === null || pick.kgActual === undefined
                    ? sentKg
                    : Number(pick.kgActual),
                value: valueSent,
              });
            } else if (meta.stockEffect === "move") {
              const toLocationUuid = pick.toLocationUuid ?? line.toLocationUuid;
              if (!toLocationUuid) {
                throw new Error("A move needs a destination location.");
              }
              await applyMove(tx, {
                source,
                quantity,
                toLocationUuid,
                committedToOrder: line.orderItemUuid !== null,
                reason: "warehouse_transfer",
                userId,
                orderUuid,
                warehouseWorkOrderLineUuid: input.lineUuid,
              });
            } else if (meta.stockEffect === "out") {
              await applyIssue(tx, {
                source,
                quantity,
                reason:
                  meta.movementReason === "warehouse_scrapped"
                    ? "warehouse_scrapped"
                    : "warehouse_issue",
                userId,
                orderUuid,
                companyUuid: line.companyUuid,
                documentNo,
                warehouseWorkOrderLineUuid: input.lineUuid,
              });
            } else {
              // No work order is stamped on the movement this writes. A
              // count difference is a `Correctie` in the reference, and not one
              // of its 2.978 corrections names the document behind it — the
              // books were adjusted, nothing was carried anywhere.
              await applyCount(tx, {
                source,
                countedQuantity: quantity,
                userId,
                documentNo,
              });
            }
          }
        }

        const values = {
          workOrderLineUuid: input.lineUuid,
          stockUuid: pick.stockUuid,
          fromLocationUuid: source?.locationUuid ?? line.fromLocationUuid,
          toLocationUuid: pick.toLocationUuid ?? line.toLocationUuid,
          qtyPlanned: pick.qtyPlanned,
          qtyActual: pick.qtyActual,
          kgActual: pick.kgActual ?? null,
          // On the way out the three identifiers belong to the lot, not to
          // whatever the dialog was carrying: the reference pre-fills them from
          // the allocated lot and its own `Report completion` grid shows
          // `Internal batch 0` where it failed to. Typed values are kept only
          // on an unloading, where there is no lot yet to read them off.
          charge: source?.charge ?? pick.charge ?? null,
          internalCharge: source?.internalCharge ?? pick.internalCharge ?? null,
          internalBatch: source?.internalBatch ?? pick.internalBatch ?? null,
          executedAt,
          executedByUserId: input.executedByUserId ?? userId,
        };

        if (pick.uuid) {
          await tx
            .update(WarehouseWorkOrderPicks)
            .set(values)
            .where(eq(WarehouseWorkOrderPicks.uuid, pick.uuid));
        } else {
          await tx
            .insert(WarehouseWorkOrderPicks)
            .values({ ...values, uuid: generateUuid() });
        }

        if (quantity > 0) {
          reportedIdentities.push({
            charge: values.charge,
            internalCharge: values.internalCharge,
            internalBatch: values.internalBatch,
          });
        }
      }

      const qtyActual = reported.reduce(
        (total, pick) => total + Number(pick.qtyActual),
        0,
      );
      const kgActual = reported.reduce(
        (total, pick) => total + Number(pick.kgActual ?? 0),
        0,
      );

      // 🔴 Reporting a line approves it — unless the product says otherwise.
      //
      // `Always approve manually → Warehouse workorder line` was **unticked** on
      // `PK44115025125` (2-10-2026), and that is why nobody ever presses
      // `Approve` in the reference: there is nothing to press. A product that
      // opts in stops at `ready` and waits for a person.
      await tx
        .update(WarehouseWorkOrderLines)
        .set({
          status: approveManually ? "ready" : "approved",
          modifiedByUserId: userId,
          qtyActual: qtyActual.toFixed(3),
          kgActual: kgActual.toFixed(2),
          charge: reportedIdentities[0]?.charge ?? line.charge,
          internalCharge:
            reportedIdentities[0]?.internalCharge ?? line.internalCharge,
          internalBatch:
            reportedIdentities[0]?.internalBatch ?? line.internalBatch,
        })
        .where(eq(WarehouseWorkOrderLines.uuid, input.lineUuid));

      // The goods have physically gone to the customer, so the order line has
      // been delivered by that much. Short-picking closes the job, not the
      // demand: the line stays open for what is still owed.
      if (meta.stockEffect === "out" && line.orderItemUuid) {
        const [orderItem] = await tx
          .select()
          .from(OrderItems)
          .where(eq(OrderItems.uuid, line.orderItemUuid))
          .limit(1);

        if (orderItem) {
          const deliveredQty = Number(orderItem.qtyActual ?? 0) + qtyActual;
          const owed = Number(orderItem.qtyPlanned ?? orderItem.quantity);

          await tx
            .update(OrderItems)
            .set({
              qtyActual: deliveredQty.toFixed(3),
              kgActual: (Number(orderItem.kgActual ?? 0) + kgActual).toFixed(2),
              deliveryStatus: "completed",
              lineStatus:
                deliveredQty >= owed ? "completed" : "partially_delivered",
            })
            .where(eq(OrderItems.uuid, line.orderItemUuid));
          await refreshOrderStatusForLine(tx, line.orderItemUuid);
        }
      }

      // The job is finished when none of its lines is still outstanding.
      const [outstanding] = await tx
        .select({ value: count() })
        .from(WarehouseWorkOrderLines)
        .where(
          and(
            eq(WarehouseWorkOrderLines.workOrderUuid, workOrder.uuid),
            ne(WarehouseWorkOrderLines.status, "approved"),
          ),
        );

      if (Number(outstanding?.value ?? 0) === 0) {
        await tx
          .update(WarehouseWorkOrders)
          .set({ status: "approved" })
          .where(eq(WarehouseWorkOrders.uuid, workOrder.uuid));
      }
    });

    revalidatePath("/warehouse-work-orders");
    revalidatePath(`/warehouse-work-orders/${workOrder.uuid}`);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to report the line") };
  }
};

/**
 * Undo a job that has not been done.
 *
 * Nothing physical has happened until a line is reported, so neither option has
 * any stock to put back — which is what makes cancelling safe right up to the
 * moment the floor reports. Once a work order is approved it is finished, and
 * there is no way back.
 */
/**
 * Approve a line that was reported but held back for a person to look at.
 *
 * 🔴 Only products that tick `Always approve manually → Warehouse workorder
 * line` ever reach this. On every other product reporting *is* approval, which
 * is why the reference's `Approve` button sits there unpressed — the flag was
 * off on every product anybody looked at.
 *
 * Approving the last outstanding line closes the job, exactly as reporting it
 * would have done.
 */
export const approveWarehouseWorkOrderLine = async (
  lineUuid: string,
): Promise<WarehouseWorkOrderActionResult> => {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return { error: "User not authenticated" };
    }

    const [line] = await db
      .select({
        uuid: WarehouseWorkOrderLines.uuid,
        status: WarehouseWorkOrderLines.status,
        workOrderUuid: WarehouseWorkOrderLines.workOrderUuid,
      })
      .from(WarehouseWorkOrderLines)
      .where(eq(WarehouseWorkOrderLines.uuid, lineUuid))
      .limit(1);

    if (!line) {
      return { error: "Work order line not found." };
    }
    if (line.status === "approved") {
      return { error: "This line has already been approved." };
    }
    if (line.status !== "ready") {
      return { error: "Report the line before approving it." };
    }

    await db.transaction(async (tx) => {
      const [result] = await tx
        .update(WarehouseWorkOrderLines)
        .set({ status: "approved", modifiedByUserId: user.id })
        .where(
          and(
            eq(WarehouseWorkOrderLines.uuid, lineUuid),
            eq(WarehouseWorkOrderLines.status, "ready"),
          ),
        );

      if (result.affectedRows === 0) {
        throw new Error(
          "The line changed while approving it — please refresh and try again.",
        );
      }

      const [outstanding] = await tx
        .select({ value: count() })
        .from(WarehouseWorkOrderLines)
        .where(
          and(
            eq(WarehouseWorkOrderLines.workOrderUuid, line.workOrderUuid),
            ne(WarehouseWorkOrderLines.status, "approved"),
          ),
        );

      if (Number(outstanding?.value ?? 0) === 0) {
        await tx
          .update(WarehouseWorkOrders)
          .set({ status: "approved" })
          .where(eq(WarehouseWorkOrders.uuid, line.workOrderUuid));
      }
    });

    revalidatePath("/warehouse-work-orders");
    revalidatePath(`/warehouse-work-orders/${line.workOrderUuid}`);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to approve the line") };
  }
};

export const cancelWarehouseWorkOrder = async (
  uuid: string,
  mode: CancelWorkOrderMode,
): Promise<WarehouseWorkOrderActionResult> => {
  try {
    const [workOrder] = await db
      .select()
      .from(WarehouseWorkOrders)
      .where(eq(WarehouseWorkOrders.uuid, uuid))
      .limit(1);

    if (!workOrder) {
      return { error: "Work order not found." };
    }
    if (workOrder.status === "approved") {
      return { error: "An approved work order can no longer be cancelled." };
    }

    const lines = await db
      .select({
        uuid: WarehouseWorkOrderLines.uuid,
        orderItemUuid: WarehouseWorkOrderLines.orderItemUuid,
      })
      .from(WarehouseWorkOrderLines)
      .where(eq(WarehouseWorkOrderLines.workOrderUuid, uuid));

    const orderItemUuids = lines
      .map((line) => line.orderItemUuid)
      .filter((value): value is string => value !== null);

    await db.transaction(async (tx) => {
      if (orderItemUuids.length > 0) {
        await tx
          .update(OrderItems)
          .set(
            mode === "restore"
              ? {
                  // Back to waiting to be planned, with no job holding it.
                  lineStatus: "released",
                  deliveryStatus: "new",
                  lastWarehouseWorkOrder: null,
                }
              : {
                  // The goods are never going. The demand is finished, short.
                  lineStatus: "cancelled",
                  deliveryStatus: "new",
                  lastWarehouseWorkOrder: null,
                },
          )
          .where(inArray(OrderItems.uuid, orderItemUuids));
      }

      if (lines.length > 0) {
        await tx.delete(WarehouseWorkOrderPicks).where(
          inArray(
            WarehouseWorkOrderPicks.workOrderLineUuid,
            lines.map((line) => line.uuid),
          ),
        );
      }

      await tx
        .delete(WarehouseWorkOrderLines)
        .where(eq(WarehouseWorkOrderLines.workOrderUuid, uuid));
      await tx
        .delete(WarehouseWorkOrderPackagings)
        .where(eq(WarehouseWorkOrderPackagings.workOrderUuid, uuid));
      await tx
        .delete(WarehouseWorkOrders)
        .where(eq(WarehouseWorkOrders.uuid, uuid));
    });

    revalidatePath("/warehouse-work-orders");
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to cancel the work order") };
  }
};

/**
 * Record the returnable packaging the goods went out on.
 *
 * Entered against the job rather than its lines because a load is packed as a
 * load: four pallets and a bundle cover whatever happens to be on them.
 */
export const saveWarehouseWorkOrderPackaging = async (
  workOrderUuid: string,
  entries: PackagingInput[],
): Promise<WarehouseWorkOrderActionResult> => {
  try {
    const used = entries.filter((entry) => entry.quantity > 0);

    if (used.length === 0) {
      return { error: "Give a count against at least one kind of packaging." };
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(WarehouseWorkOrderPackagings)
        .where(eq(WarehouseWorkOrderPackagings.workOrderUuid, workOrderUuid));

      await tx.insert(WarehouseWorkOrderPackagings).values(
        used.map((entry) => ({
          uuid: generateUuid(),
          workOrderUuid,
          packaging: entry.packaging,
          quantity: entry.quantity,
          specification: entry.specification || null,
        })),
      );
    });

    revalidatePath(`/warehouse-work-orders/${workOrderUuid}`);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to save the packaging") };
  }
};
