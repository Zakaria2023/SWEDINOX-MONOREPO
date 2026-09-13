"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Machines, SelectMachines } from "@/db/schema/machines";
import { OrderItems } from "@/db/schema/order-items";
import { Orders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import {
  ProductionWorkOrderLines,
  ProductionWorkOrderPackagings,
  ProductionWorkOrderPicks,
  ProductionWorkOrderRemainders,
  ProductionWorkOrders,
  SelectProductionWorkOrderLines,
  SelectProductionWorkOrderPackagings,
  SelectProductionWorkOrderPicks,
  SelectProductionWorkOrderRemainders,
  SelectProductionWorkOrders,
} from "@/db/schema/production-work-orders";
import { SelectStock, Stock } from "@/db/schema/stock";
import { SelectWarehouses, Warehouses } from "@/db/schema/warehouses";
import {
  machineOptionTypes,
  PackagingType,
  RemainderCategory,
  workOrderStatuses,
} from "@/lib/enums";
import {
  describeError,
  generateUuid,
  machineOptionCuts,
  moneyString,
  productionRunBalance,
  profitMarginPercent,
  todayDateString,
  toDecimalAmount,
  toDecimalQuantity,
} from "@/lib/helpers";
import { exportRows } from "@/lib/server/excel";
import { recordFreightMovement } from "@/lib/server/freight";
import {
  dateRangeFilter,
  enumFilter,
  relationFilter,
  runPaged,
  tableOrderBy,
  tableWhere,
} from "@/lib/server/table-query";
import {
  applyMove,
  applyProductionConsume,
  applyProductionOutput,
} from "@/lib/server/stock-movements";
import { getWorkOrderLineDetail } from "@/lib/server/work-order-line-detail";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { PRODUCTION_WORK_ORDER_COLUMNS } from "@/app/(dashboard)/production-workorders/columns";
import { MACHINE_OPTION_LABELS } from "@/lib/labels";
import { currentUser } from "@clerk/nextjs/server";
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  inArray,
  ne,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { revalidatePath } from "next/cache";

// The Drizzle transaction handle passed into db.transaction(async (tx) => ...).
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type ProductionWorkOrderActionResult = {
  error?: string;
  success?: boolean;
};

export type ProductionWorkOrderListItem = SelectProductionWorkOrders & {
  machineName: SelectMachines["name"] | null;
  machineCode: SelectMachines["code"] | null;
  // SUM/COUNT over the lines — no single column backs any of them.
  lineCount: number;
  qtyPlanned: number;
  qtyActual: number;
  kgPlanned: number;
  kgActual: number;
};

export type ProductionWorkOrderLineItem = SelectProductionWorkOrderLines & {
  companyName: SelectCompanies["companyName"] | null;
  productName: SelectProducts["name"] | null;
  // The three places a run touches: the machine it is taken from, where the
  // finished work goes, and the rack the leftovers return to.
  fromLocationName: SelectWarehouses["name"] | null;
  toLocationName: SelectWarehouses["name"] | null;
  backLocationName: SelectWarehouses["name"] | null;
};

/**
 * A line carrying the three levels above it, so the overview can be read as a
 * tree without nesting the query. The floor works day first, then by what the
 * machine is set up to do, then by order.
 */
export type ProductionTreeRow = ProductionWorkOrderLineItem & {
  lineUuid: string;
  workOrderNumber: SelectProductionWorkOrders["number"];
  // The run has a status of its own, and it is what Release, Approve and Cancel
  // are decisions about — a line can be reported while the run is still open.
  workOrderStatus: SelectProductionWorkOrders["status"];
  plannedDate: SelectProductionWorkOrders["plannedDate"];
  option: SelectProductionWorkOrders["option"];
  machineName: SelectMachines["name"] | null;
  /** Level 2, as the floor reads it: "ShearCut (KNIP)". */
  groupLabel: string;
  /** Level 4: "1 Cold-rolled plate 304 1,5mm". */
  lineLabel: string;
  /** Whether reporting this run has to balance its kilos. */
  cuts: boolean;
};

export type ProductionWorkOrderTree = {
  page: Paged<ProductionWorkOrderListItem>;
  rows: ProductionTreeRow[];
};

export type ProductionWorkOrderDetail = ProductionWorkOrderListItem & {
  /** Whether this run has to balance its kilos to be reported. */
  cuts: boolean;
  lines: ProductionWorkOrderLineItem[];
  picks: ProductionPickRow[];
  remainders: ProductionRemainderRow[];
  packagings: SelectProductionWorkOrderPackagings[];
};

export type ProductionPickRow = SelectProductionWorkOrderPicks & {
  stockCharge: SelectStock["charge"] | null;
  stockInternalCharge: SelectStock["internalCharge"] | null;
  stockQuantity: SelectStock["quantity"] | null;
  fromLocationName: SelectWarehouses["name"] | null;
};

export type ProductionRemainderRow = SelectProductionWorkOrderRemainders & {
  productName: SelectProducts["name"] | null;
  productCode: SelectProducts["productCode"] | null;
  toLocationName: SelectWarehouses["name"] | null;
};

/** One row of the flat grid a treatment is reported on. */
export type ReportTreatmentPickInput = {
  uuid?: string;
  stockUuid?: string;
  qtyPlanned: string;
  qtyActual: string;
  kgActual?: string;
  charge?: string;
  internalCharge?: string;
  internalBatch?: string;
};

export type ReportTreatmentInput = {
  lineUuid: string;
  executedAt: string;
  executedByUserId?: string;
  picks: ReportTreatmentPickInput[];
};

/** One lot taken to the machine, on the Fetched panel of a cut. */
export type ReportCutFetchedInput = {
  uuid?: string;
  stockUuid: string;
  qtyActual: string;
  kgActual: string;
};

/** One line's finished goods, on the Components panel of a cut. */
export type ReportCutComponentInput = {
  lineUuid: string;
  qtyActual: string;
  kgActual: string;
};

/** One offcut or bin of scrap, on the Remainders panel of a cut. */
export type ReportCutRemainderInput = {
  category: RemainderCategory;
  productUuid?: string;
  quantity: string;
  kg: string;
  toLocationUuid?: string;
  remark?: string;
};

export type ReportCutInput = {
  workOrderUuid: string;
  executedAt: string;
  executedByUserId?: string;
  fetched: ReportCutFetchedInput[];
  components: ReportCutComponentInput[];
  remainders: ReportCutRemainderInput[];
};

/**
 * What cancelling does to the demand behind the run. `restore` puts the order
 * line back in the queue to be planned again; `close` says the goods are never
 * being made and finishes the line short.
 */
export type CancelProductionWorkOrderMode = "restore" | "close_at_zero";

export type ProductionPackagingInput = {
  packaging: PackagingType;
  quantity: number;
  specification?: string | null;
};

export type {
  LineDetail,
  LineOptionRow,
  LineOrderContext,
  LineStockRow,
  LineTextRow,
} from "@/lib/server/work-order-line-detail";

const FromLocation = alias(Warehouses, "prod_from_location");
const ToLocation = alias(Warehouses, "prod_to_location");
const BackLocation = alias(Warehouses, "prod_back_location");

const WORK_ORDER_SEARCH = [
  ProductionWorkOrders.number,
  ProductionWorkOrderLines.orderNumber,
  ProductionWorkOrderLines.productCode,
] as const;

const WORK_ORDER_SORTABLE = {
  number: ProductionWorkOrders.number,
  plannedDate: ProductionWorkOrders.plannedDate,
  option: ProductionWorkOrders.option,
  status: ProductionWorkOrders.status,
  createdAt: ProductionWorkOrders.createdAt,
};

// The shop narrows this list the way it works: which day, what the machine is
// set up to do, how far along it is, and which machine is doing it.
const WORK_ORDER_FILTERS = {
  option: enumFilter(ProductionWorkOrders.option, machineOptionTypes),
  status: enumFilter(ProductionWorkOrders.status, workOrderStatuses),
  machine: relationFilter(ProductionWorkOrders.machineUuid),
  plannedDate: dateRangeFilter(ProductionWorkOrders.plannedDate),
};

const LINE_TOTALS = {
  lineCount: sql<number>`COUNT(DISTINCT ${ProductionWorkOrderLines.uuid})`,
  qtyPlanned: sql<number>`COALESCE(SUM(${ProductionWorkOrderLines.qtyPlanned}), 0)`,
  qtyActual: sql<number>`COALESCE(SUM(${ProductionWorkOrderLines.qtyActual}), 0)`,
  kgPlanned: sql<number>`COALESCE(SUM(${ProductionWorkOrderLines.kgPlanned}), 0)`,
  kgActual: sql<number>`COALESCE(SUM(${ProductionWorkOrderLines.kgActual}), 0)`,
};

/** Turns the SUM/COUNT strings MySQL returns into the numbers the type promises. */
const withTotals = <T extends Record<string, unknown>>(
  row: T & {
    machineName: string | null;
    machineCode: string | null;
    lineCount: unknown;
    qtyPlanned: unknown;
    qtyActual: unknown;
    kgPlanned: unknown;
    kgActual: unknown;
  },
) => ({
  ...row,
  machineName: row.machineName ?? null,
  machineCode: row.machineCode ?? null,
  lineCount: Number(row.lineCount ?? 0),
  qtyPlanned: Number(row.qtyPlanned ?? 0),
  qtyActual: Number(row.qtyActual ?? 0),
  kgPlanned: Number(row.kgPlanned ?? 0),
  kgActual: Number(row.kgActual ?? 0),
});

const workOrderRows =
  (query: TableQuery) =>
  (limit: number, offset: number): Promise<ProductionWorkOrderListItem[]> =>
    db
      .select({
        ...getTableColumns(ProductionWorkOrders),
        machineName: Machines.name,
        machineCode: Machines.code,
        ...LINE_TOTALS,
      })
      .from(ProductionWorkOrders)
      .leftJoin(Machines, eq(ProductionWorkOrders.machineUuid, Machines.uuid))
      .leftJoin(
        ProductionWorkOrderLines,
        eq(ProductionWorkOrderLines.workOrderUuid, ProductionWorkOrders.uuid),
      )
      .where(
        tableWhere({
          query,
          search: WORK_ORDER_SEARCH,
          filters: WORK_ORDER_FILTERS,
        }),
      )
      .groupBy(ProductionWorkOrders.id, Machines.name, Machines.code)
      .orderBy(
        ...tableOrderBy(
          WORK_ORDER_SORTABLE,
          query,
          [desc(ProductionWorkOrders.plannedDate)],
          ProductionWorkOrders.id,
        ),
      )
      .limit(limit)
      .offset(offset)
      .then((rows) => rows.map(withTotals));

export const getProductionWorkOrders = async (
  query: TableQuery,
): Promise<Paged<ProductionWorkOrderListItem>> => {
  try {
    return await runPaged(query, {
      rows: workOrderRows(query),
      count: async () => {
        const [row] = await db
          .select({
            value: sql<number>`COUNT(DISTINCT ${ProductionWorkOrders.id})`,
          })
          .from(ProductionWorkOrders)
          .leftJoin(
            Machines,
            eq(ProductionWorkOrders.machineUuid, Machines.uuid),
          )
          .leftJoin(
            ProductionWorkOrderLines,
            eq(
              ProductionWorkOrderLines.workOrderUuid,
              ProductionWorkOrders.uuid,
            ),
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
      describeError(error, "Failed to fetch production work orders"),
    );
  }
};

/** Every run the current view matches, as a workbook. */
export const exportProductionWorkOrders = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Production Work Orders",
    columns: PRODUCTION_WORK_ORDER_COLUMNS,
    columnKeys,
    rows: workOrderRows(parseTableQuery(params)),
  });

// Not exported: every export in a "use server" file becomes a callable
// endpoint, and only the detail page needs this.
//
// The product is joined on its own reference and never on its code. A code is a
// label somebody types and two products can carry the same one, which would fan
// a single line out into one row per product sharing it.
export const getProductionWorkOrderLines = async (
  workOrderUuids: string[],
): Promise<ProductionWorkOrderLineItem[]> =>
  workOrderUuids.length === 0
    ? []
    : db
        .select({
          ...getTableColumns(ProductionWorkOrderLines),
          companyName: Companies.companyName,
          productName: Products.name,
          fromLocationName: FromLocation.name,
          toLocationName: ToLocation.name,
          backLocationName: BackLocation.name,
        })
        .from(ProductionWorkOrderLines)
        .leftJoin(
          Companies,
          eq(ProductionWorkOrderLines.companyUuid, Companies.uuid),
        )
        .leftJoin(
          Products,
          eq(ProductionWorkOrderLines.productUuid, Products.uuid),
        )
        .leftJoin(
          FromLocation,
          eq(ProductionWorkOrderLines.fromLocationUuid, FromLocation.uuid),
        )
        .leftJoin(
          ToLocation,
          eq(ProductionWorkOrderLines.toLocationUuid, ToLocation.uuid),
        )
        .leftJoin(
          BackLocation,
          eq(ProductionWorkOrderLines.backLocationUuid, BackLocation.uuid),
        )
        .where(inArray(ProductionWorkOrderLines.workOrderUuid, workOrderUuids))
        .orderBy(
          ProductionWorkOrderLines.lineNumber,
          ProductionWorkOrderLines.id,
        );

/**
 * The overview, as the four-level tree the floor reads.
 *
 * Paged by work order rather than by line: a run's lines belong together, and
 * splitting one across two pages would show a total that means nothing.
 */
export const getProductionWorkOrderTree = async (
  query: TableQuery,
): Promise<ProductionWorkOrderTree> => {
  const page = await getProductionWorkOrders(query);
  const lines = await getProductionWorkOrderLines(
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
      const option = workOrder.option
        ? MACHINE_OPTION_LABELS[workOrder.option]
        : "No option";
      return [
        {
          ...line,
          lineUuid: line.uuid,
          workOrderNumber: workOrder.number,
          workOrderStatus: workOrder.status,
          plannedDate: workOrder.plannedDate,
          option: workOrder.option,
          machineName: workOrder.machineName,
          groupLabel: workOrder.machineName
            ? `${option} (${workOrder.machineName})`
            : option,
          lineLabel: [line.lineNumber, line.productName ?? line.productCode]
            .filter((part) => part !== null && part !== undefined)
            .join(" "),
          cuts: machineOptionCuts(workOrder.option),
        },
      ];
    }),
  };
};

/** One run with its lines, what was fetched for it, and what it left behind. */
export const getProductionWorkOrderDetail = async (
  uuid: string,
): Promise<ProductionWorkOrderDetail | null> => {
  const [workOrder] = await db
    .select({
      ...getTableColumns(ProductionWorkOrders),
      machineName: Machines.name,
      machineCode: Machines.code,
      ...LINE_TOTALS,
    })
    .from(ProductionWorkOrders)
    .leftJoin(Machines, eq(ProductionWorkOrders.machineUuid, Machines.uuid))
    .leftJoin(
      ProductionWorkOrderLines,
      eq(ProductionWorkOrderLines.workOrderUuid, ProductionWorkOrders.uuid),
    )
    .where(eq(ProductionWorkOrders.uuid, uuid))
    .groupBy(ProductionWorkOrders.id, Machines.name, Machines.code)
    .limit(1);

  if (!workOrder) {
    return null;
  }

  // Sequential rather than concurrent: this database caps connections.
  const lines = await getProductionWorkOrderLines([uuid]);

  const picks = await db
    .select({
      ...getTableColumns(ProductionWorkOrderPicks),
      stockCharge: Stock.charge,
      stockInternalCharge: Stock.internalCharge,
      stockQuantity: Stock.quantity,
      fromLocationName: Warehouses.name,
    })
    .from(ProductionWorkOrderPicks)
    .leftJoin(Stock, eq(ProductionWorkOrderPicks.stockUuid, Stock.uuid))
    .leftJoin(
      Warehouses,
      eq(ProductionWorkOrderPicks.fromLocationUuid, Warehouses.uuid),
    )
    .where(eq(ProductionWorkOrderPicks.workOrderUuid, uuid))
    .orderBy(ProductionWorkOrderPicks.id);

  const remainders = await db
    .select({
      ...getTableColumns(ProductionWorkOrderRemainders),
      productName: Products.name,
      productCode: Products.productCode,
      toLocationName: Warehouses.name,
    })
    .from(ProductionWorkOrderRemainders)
    .leftJoin(
      Products,
      eq(ProductionWorkOrderRemainders.productUuid, Products.uuid),
    )
    .leftJoin(
      Warehouses,
      eq(ProductionWorkOrderRemainders.toLocationUuid, Warehouses.uuid),
    )
    .where(eq(ProductionWorkOrderRemainders.workOrderUuid, uuid))
    .orderBy(ProductionWorkOrderRemainders.id);

  const packagings = await db
    .select()
    .from(ProductionWorkOrderPackagings)
    .where(eq(ProductionWorkOrderPackagings.workOrderUuid, uuid))
    .orderBy(ProductionWorkOrderPackagings.id);

  return {
    ...withTotals(workOrder),
    cuts: machineOptionCuts(workOrder.option),
    lines,
    picks,
    remainders,
    packagings,
  };
};

/** The rows a line was prepared with, which the completion dialog opens on. */
export const getProductionWorkOrderPicks = async (
  lineUuid: string,
): Promise<ProductionPickRow[]> =>
  db
    .select({
      ...getTableColumns(ProductionWorkOrderPicks),
      stockCharge: Stock.charge,
      stockInternalCharge: Stock.internalCharge,
      stockQuantity: Stock.quantity,
      fromLocationName: Warehouses.name,
    })
    .from(ProductionWorkOrderPicks)
    .leftJoin(Stock, eq(ProductionWorkOrderPicks.stockUuid, Stock.uuid))
    .leftJoin(
      Warehouses,
      eq(ProductionWorkOrderPicks.fromLocationUuid, Warehouses.uuid),
    )
    .where(eq(ProductionWorkOrderPicks.workOrderLineUuid, lineUuid))
    .orderBy(ProductionWorkOrderPicks.id);

/** The Details panel behind one line — the same four tabs the warehouse shows. */
export const getProductionWorkOrderLineDetail = async (lineUuid: string) => {
  const [line] = await db
    .select({
      productUuid: ProductionWorkOrderLines.productUuid,
      orderItemUuid: ProductionWorkOrderLines.orderItemUuid,
    })
    .from(ProductionWorkOrderLines)
    .where(eq(ProductionWorkOrderLines.uuid, lineUuid))
    .limit(1);

  if (!line) {
    return null;
  }

  return getWorkOrderLineDetail(line);
};

/**
 * Freeze the run and hand it to the floor.
 *
 * Release prints the papers. It moves no stock — that only happens when work is
 * reported back — which is exactly why a released run can still be cancelled
 * outright with nothing to put back.
 */
export const releaseProductionWorkOrder = async (
  uuid: string,
): Promise<ProductionWorkOrderActionResult> => {
  try {
    const [workOrder] = await db
      .select()
      .from(ProductionWorkOrders)
      .where(eq(ProductionWorkOrders.uuid, uuid))
      .limit(1);

    if (!workOrder) {
      return { error: "Work order not found." };
    }
    if (workOrder.status !== "new") {
      return { error: "Only a new work order can be released." };
    }

    const lines = await db
      .select({
        uuid: ProductionWorkOrderLines.uuid,
        orderItemUuid: ProductionWorkOrderLines.orderItemUuid,
      })
      .from(ProductionWorkOrderLines)
      .where(eq(ProductionWorkOrderLines.workOrderUuid, uuid));

    if (lines.length === 0) {
      return { error: "A work order with no lines has nothing to release." };
    }

    await db.transaction(async (tx) => {
      const [result] = await tx
        .update(ProductionWorkOrders)
        .set({ status: "released", releasedAt: new Date() })
        .where(
          and(
            eq(ProductionWorkOrders.uuid, uuid),
            eq(ProductionWorkOrders.status, "new"),
          ),
        );

      if (result.affectedRows === 0) {
        throw new Error(
          "The work order changed while releasing it — please refresh and try again.",
        );
      }

      await tx
        .update(ProductionWorkOrderLines)
        .set({ status: "released" })
        .where(eq(ProductionWorkOrderLines.workOrderUuid, uuid));

      const orderItemUuids = lines
        .map((line) => line.orderItemUuid)
        .filter((value): value is string => value !== null);

      if (orderItemUuids.length > 0) {
        await tx
          .update(OrderItems)
          .set({ lineStatus: "in_progress" })
          .where(inArray(OrderItems.uuid, orderItemUuids));
      }
    });

    revalidatePath("/production-workorders");
    revalidatePath(`/production-workorders/${uuid}`);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to release the work order") };
  }
};

/**
 * Report a treatment back.
 *
 * Grinding two plates gives two ground plates: nothing is consumed, nothing is
 * created, and the count is unchanged. So the whole job is a move — the goods
 * go from where they are to where the finished work belongs — and the reported
 * figures are what the floor actually handled rather than a transformation to
 * reconcile.
 */
export const reportProductionTreatmentCompletion = async (
  input: ReportTreatmentInput,
): Promise<ProductionWorkOrderActionResult> => {
  try {
    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return { error: "User not authenticated" };
    }

    const [row] = await db
      .select({
        line: getTableColumns(ProductionWorkOrderLines),
        workOrder: getTableColumns(ProductionWorkOrders),
      })
      .from(ProductionWorkOrderLines)
      .innerJoin(
        ProductionWorkOrders,
        eq(ProductionWorkOrderLines.workOrderUuid, ProductionWorkOrders.uuid),
      )
      .where(eq(ProductionWorkOrderLines.uuid, input.lineUuid))
      .limit(1);

    if (!row) {
      return { error: "Production line not found." };
    }

    const { line, workOrder } = row;

    if (workOrder.status === "new") {
      return {
        error: "Release the work order before reporting work against it.",
      };
    }
    if (line.status === "ready" || line.status === "approved") {
      return { error: "This line has already been reported." };
    }
    if (machineOptionCuts(workOrder.option)) {
      return {
        error:
          "This run cuts the material, so it has to be reported for the whole work order and balanced.",
      };
    }

    // A blank actual says nothing about the row and is dropped; a zero is a real
    // answer and has to survive. What remains is normalised to a dot separator
    // so a comma-typed quantity is not read as NaN.
    const reported = input.picks
      .filter((pick) => pick.qtyActual.trim() !== "")
      .map((pick) => ({
        ...pick,
        qtyActual: toDecimalQuantity(pick.qtyActual, "0.000"),
        kgActual: pick.kgActual
          ? toDecimalAmount(pick.kgActual)
          : pick.kgActual,
      }));

    if (reported.length === 0) {
      return { error: "Report at least one row." };
    }

    const executedAt = new Date(input.executedAt);
    if (Number.isNaN(executedAt.getTime())) {
      return { error: "The execution date is not a real date." };
    }

    const orderUuid = await orderUuidForItem(line.orderItemUuid);

    await db.transaction(async (tx) => {
      for (const pick of reported) {
        const quantity = Number(pick.qtyActual);
        if (Number.isNaN(quantity) || quantity < 0) {
          throw new Error("A reported quantity has to be zero or more.");
        }

        if (quantity > 0) {
          if (!pick.stockUuid) {
            throw new Error(
              "This row has no lot to draw from — say which stock it came out of.",
            );
          }
          const [source] = await tx
            .select()
            .from(Stock)
            .where(eq(Stock.uuid, pick.stockUuid))
            .limit(1);

          if (!source) {
            throw new Error("The lot this row draws from could not be found.");
          }
          if (!line.toLocationUuid) {
            throw new Error(
              "This line has no destination, so there is nowhere to put the finished work.",
            );
          }

          await applyMove(tx, {
            source,
            quantity,
            toLocationUuid: line.toLocationUuid,
            committedToOrder: line.orderItemUuid !== null,
            reason: "warehouse_transfer",
            userId,
            orderUuid,
          });
        }

        const values = {
          workOrderUuid: workOrder.uuid,
          workOrderLineUuid: input.lineUuid,
          stockUuid: pick.stockUuid ?? null,
          fromLocationUuid: line.fromLocationUuid,
          toLocationUuid: line.toLocationUuid,
          qtyPlanned: pick.qtyPlanned,
          qtyActual: pick.qtyActual,
          kgActual: pick.kgActual ?? null,
          charge: pick.charge ?? null,
          internalCharge: pick.internalCharge ?? null,
          internalBatch: pick.internalBatch ?? null,
          executedAt,
          executedByUserId: input.executedByUserId ?? userId,
        };

        if (pick.uuid) {
          await tx
            .update(ProductionWorkOrderPicks)
            .set(values)
            .where(eq(ProductionWorkOrderPicks.uuid, pick.uuid));
        } else {
          await tx
            .insert(ProductionWorkOrderPicks)
            .values({ ...values, uuid: generateUuid() });
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

      await tx
        .update(ProductionWorkOrderLines)
        .set({
          status: "ready",
          qtyActual: qtyActual.toFixed(3),
          kgActual: kgActual.toFixed(2),
          unitActual: line.unitPlanned,
          dateFinished: todayDateString(),
          charge: reported[0]?.charge ?? line.charge,
        })
        .where(eq(ProductionWorkOrderLines.uuid, input.lineUuid));

      await settleRunStatus(tx, workOrder.uuid);
    });

    revalidatePath("/production-workorders");
    revalidatePath(`/production-workorders/${workOrder.uuid}`);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to report the line") };
  }
};

/**
 * Report a cut back.
 *
 * Everything fetched has to come out again as finished goods plus remainders,
 * weighed. Pieces are no guide — two plates can legitimately become five — so
 * the kilos are what the run is checked against, and a run that does not balance
 * is refused rather than reconciled by inventing or destroying steel.
 *
 * What then happens to stock is a transformation, not a move: the lots that went
 * on the bed are drawn down and restated, and the goods, the offcut and the
 * scrap are booked as new lots carrying the run's cost between them.
 */
export const reportProductionCutCompletion = async (
  input: ReportCutInput,
): Promise<ProductionWorkOrderActionResult> => {
  try {
    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return { error: "User not authenticated" };
    }

    const [workOrder] = await db
      .select()
      .from(ProductionWorkOrders)
      .where(eq(ProductionWorkOrders.uuid, input.workOrderUuid))
      .limit(1);

    if (!workOrder) {
      return { error: "Work order not found." };
    }
    if (workOrder.status === "new") {
      return {
        error: "Release the work order before reporting work against it.",
      };
    }
    if (workOrder.status === "approved") {
      return { error: "This work order has already been approved." };
    }
    if (!machineOptionCuts(workOrder.option)) {
      return {
        error:
          "This run only treats the goods it was given, so its lines are reported one at a time.",
      };
    }

    const executedAt = new Date(input.executedAt);
    if (Number.isNaN(executedAt.getTime())) {
      return { error: "The execution date is not a real date." };
    }

    const fetched = input.fetched
      .filter((row) => row.stockUuid && row.kgActual.trim() !== "")
      .map((row) => ({
        ...row,
        qtyActual: toDecimalQuantity(row.qtyActual, "0.000"),
        kgActual: toDecimalAmount(row.kgActual),
      }));

    if (fetched.length === 0) {
      return { error: "Say what was taken to the machine." };
    }

    const components = input.components.map((row) => ({
      ...row,
      qtyActual: toDecimalQuantity(row.qtyActual, "0.000"),
      kgActual: toDecimalAmount(row.kgActual),
    }));

    const remainders = input.remainders
      .filter((row) => row.kg.trim() !== "")
      .map((row) => ({
        ...row,
        quantity: toDecimalQuantity(row.quantity, "0.000"),
        kg: toDecimalAmount(row.kg),
      }));

    const lines = await db
      .select()
      .from(ProductionWorkOrderLines)
      .where(eq(ProductionWorkOrderLines.workOrderUuid, input.workOrderUuid));

    const lineByUuid = new Map(lines.map((line) => [line.uuid, line]));
    for (const component of components) {
      if (!lineByUuid.has(component.lineUuid)) {
        return { error: "A reported component does not belong to this run." };
      }
    }

    const sourceLots = await db
      .select()
      .from(Stock)
      .where(
        inArray(
          Stock.uuid,
          fetched.map((row) => row.stockUuid),
        ),
      );

    const lotByUuid = new Map(sourceLots.map((lot) => [lot.uuid, lot]));
    for (const row of fetched) {
      if (!lotByUuid.has(row.stockUuid)) {
        return { error: "One of the fetched lots could not be found." };
      }
    }

    const componentKg = components.reduce(
      (total, row) => total + Number(row.kgActual),
      0,
    );
    const remnantKg = remainders
      .filter((row) => row.category === "remnant")
      .reduce((total, row) => total + Number(row.kg), 0);
    const scrapKg = remainders
      .filter((row) => row.category === "scrap")
      .reduce((total, row) => total + Number(row.kg), 0);

    const balance = productionRunBalance({
      fetched: fetched.map((row) => {
        const lot = lotByUuid.get(row.stockUuid);
        const lotQuantity = Number(lot?.quantity ?? 0);
        const lotKg = Number(lot?.quantityKg ?? 0);
        // The lot is valued per unit, and the run is struck in kilos, so the
        // unit cost is restated per kilo using what the lot itself weighs.
        const perKg =
          lotKg > 0
            ? Number(lot?.valuationEuro ?? 0) / lotKg
            : lotQuantity > 0
              ? Number(lot?.valuationPrice ?? 0)
              : 0;
        return { kg: Number(row.kgActual), costPerKg: perKg };
      }),
      componentKg,
      remnantKg,
      scrapKg,
    });

    if (!balance.balanced) {
      const over = balance.differenceKg > 0;
      return {
        error: `The run does not balance: ${balance.fetchedKg.toFixed(2)} kg went to the machine and ${(
          componentKg +
          remnantKg +
          scrapKg
        ).toFixed(2)} kg came off it — ${Math.abs(balance.differenceKg).toFixed(
          2,
        )} kg ${over ? "unaccounted for" : "more than was fetched"}.`,
      };
    }

    // What the produced lots inherit — charge, quality, supplier. A cut mixes
    // whatever it was fed, so the first lot on the bed stands for the run.
    const template: SelectStock | null =
      lotByUuid.get(fetched[0]?.stockUuid ?? "") ?? null;

    await db.transaction(async (tx) => {
      // 1. Everything on the bed stops existing as the lot it was.
      for (const row of fetched) {
        const source = lotByUuid.get(row.stockUuid);
        if (!source) {
          throw new Error("One of the fetched lots could not be found.");
        }

        const quantity = Number(row.qtyActual);
        if (quantity > 0) {
          // No production line is stamped on this one. A cut fetches lots for
          // the whole run and the bed mixes them, so the steel that goes on it
          // belongs to no single line — which is why `ReportCutFetchedInput`
          // carries no line either. The same goes for the offcuts below.
          await applyProductionConsume(tx, {
            source,
            quantity,
            userId,
            orderUuid: null,
          });
        }

        const values = {
          workOrderUuid: workOrder.uuid,
          workOrderLineUuid: null,
          stockUuid: row.stockUuid,
          fromLocationUuid: source.locationUuid,
          qtyPlanned: row.qtyActual,
          qtyActual: row.qtyActual,
          kgActual: row.kgActual,
          charge: source.charge,
          internalCharge: source.internalCharge,
          executedAt,
          executedByUserId: input.executedByUserId ?? userId,
        };

        if (row.uuid) {
          await tx
            .update(ProductionWorkOrderPicks)
            .set(values)
            .where(eq(ProductionWorkOrderPicks.uuid, row.uuid));
        } else {
          await tx
            .insert(ProductionWorkOrderPicks)
            .values({ ...values, uuid: generateUuid() });
        }
      }

      // 2. What came off the machine, booked as new lots at the run's cost.
      for (const component of components) {
        const line = lineByUuid.get(component.lineUuid);
        if (!line) {
          throw new Error("A reported component does not belong to this run.");
        }
        if (!line.productUuid) {
          throw new Error(
            "A line with no product cannot book what it produced into stock.",
          );
        }

        const quantity = Number(component.qtyActual);
        const kg = Number(component.kgActual);
        const value = balance.componentCostPerKg * kg;

        const producedStockUuid =
          quantity > 0
            ? await applyProductionOutput(tx, {
                productUuid: line.productUuid,
                quantity,
                quantityKg: kg,
                locationUuid: line.toLocationUuid,
                template,
                value,
                reserved: line.orderItemUuid !== null,
                reason: "production_output",
                // Inherited, not minted: cutting a plate does not change which
                // heat it was poured from, and the certificate follows it.
                charge: template?.charge ?? line.charge ?? null,
                internalCharge: template?.internalCharge ?? null,
                remark: null,
                userId,
                orderUuid: await orderUuidForItem(line.orderItemUuid),
                productionWorkOrderLineUuid: line.uuid,
              })
            : null;

        await tx
          .update(ProductionWorkOrderLines)
          .set({
            status: "ready",
            qtyActual: component.qtyActual,
            kgActual: component.kgActual,
            unitActual: line.unitPlanned,
            dateFinished: todayDateString(),
            charge: template?.charge ?? line.charge,
          })
          .where(eq(ProductionWorkOrderLines.uuid, line.uuid));

        if (producedStockUuid && line.orderItemUuid) {
          await pointOrderLineAtProducedLot(tx, {
            orderItemUuid: line.orderItemUuid,
            producedStockUuid,
            quantity,
            cost: value,
          });
        }

        if (producedStockUuid) {
          await recordFreightMovement(tx, {
            productUuid: line.productUuid,
            quantity: quantity.toFixed(3),
            type: "in",
            reason: "production_output",
            companyUuid: line.companyUuid,
            operator: userId,
          });
        }
      }

      // 3. The offcut goes back to a rack worth something; the scrap does not.
      await tx
        .delete(ProductionWorkOrderRemainders)
        .where(eq(ProductionWorkOrderRemainders.workOrderUuid, workOrder.uuid));

      for (const remainder of remainders) {
        const quantity = Number(remainder.quantity);
        const kg = Number(remainder.kg);
        const isRemnant = remainder.category === "remnant";
        const productUuid =
          remainder.productUuid ?? (isRemnant ? template?.productUuid : null);

        const stockUuid =
          productUuid && quantity > 0
            ? await applyProductionOutput(tx, {
                productUuid,
                quantity,
                quantityKg: kg,
                locationUuid: remainder.toLocationUuid ?? null,
                template: isRemnant ? template : null,
                value: isRemnant
                  ? balance.remnantCost * (remnantKg > 0 ? kg / remnantKg : 0)
                  : 0,
                // Free for anyone to order next — that is what makes it an
                // offcut rather than a piece of somebody's order.
                reserved: false,
                reason: isRemnant ? "production_remnant" : "sawing_waste",
                charge: isRemnant ? (template?.charge ?? null) : null,
                internalCharge: isRemnant
                  ? (template?.internalCharge ?? null)
                  : null,
                remark: remainder.remark ?? null,
                userId,
                orderUuid: null,
              })
            : null;

        await tx.insert(ProductionWorkOrderRemainders).values({
          uuid: generateUuid(),
          workOrderUuid: workOrder.uuid,
          category: remainder.category,
          productUuid: productUuid ?? null,
          quantity: remainder.quantity,
          unit: isRemnant ? (template?.unit ?? "kg") : "kg",
          kg: remainder.kg,
          toLocationUuid: remainder.toLocationUuid ?? null,
          charge: isRemnant ? (template?.charge ?? null) : null,
          remark: remainder.remark ?? null,
          stockUuid,
        });
      }

      await settleRunStatus(tx, workOrder.uuid);
    });

    revalidatePath("/production-workorders");
    revalidatePath(`/production-workorders/${workOrder.uuid}`);
    revalidatePath("/control-sawing-waste");
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to report the work order") };
  }
};

/**
 * Sign the run off.
 *
 * Reporting a run puts it on `ready`, not straight to `approved`, because what
 * came off a machine has to be looked at before it counts — which is where a
 * production run parts company with a warehouse one, where the floor either
 * moved the goods or it did not.
 */
export const approveProductionWorkOrder = async (
  uuid: string,
): Promise<ProductionWorkOrderActionResult> => {
  try {
    const [workOrder] = await db
      .select()
      .from(ProductionWorkOrders)
      .where(eq(ProductionWorkOrders.uuid, uuid))
      .limit(1);

    if (!workOrder) {
      return { error: "Work order not found." };
    }
    if (workOrder.status !== "ready") {
      return {
        error: "Only a work order that has been reported back can be approved.",
      };
    }

    await db.transaction(async (tx) => {
      const [result] = await tx
        .update(ProductionWorkOrders)
        .set({ status: "approved" })
        .where(
          and(
            eq(ProductionWorkOrders.uuid, uuid),
            eq(ProductionWorkOrders.status, "ready"),
          ),
        );

      if (result.affectedRows === 0) {
        throw new Error(
          "The work order changed while approving it — please refresh and try again.",
        );
      }

      await tx
        .update(ProductionWorkOrderLines)
        .set({ status: "approved" })
        .where(eq(ProductionWorkOrderLines.workOrderUuid, uuid));
    });

    revalidatePath("/production-workorders");
    revalidatePath(`/production-workorders/${uuid}`);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to approve the work order") };
  }
};

/**
 * Undo a run that has not been done.
 *
 * Nothing physical happens until the run is reported, so there is no stock to
 * put back — which is what makes cancelling safe right up to that moment. Once
 * it is approved it is finished, and there is no way back.
 */
export const cancelProductionWorkOrder = async (
  uuid: string,
  mode: CancelProductionWorkOrderMode,
): Promise<ProductionWorkOrderActionResult> => {
  try {
    const [workOrder] = await db
      .select()
      .from(ProductionWorkOrders)
      .where(eq(ProductionWorkOrders.uuid, uuid))
      .limit(1);

    if (!workOrder) {
      return { error: "Work order not found." };
    }
    if (workOrder.status === "approved") {
      return { error: "An approved work order can no longer be cancelled." };
    }

    const lines = await db
      .select({
        uuid: ProductionWorkOrderLines.uuid,
        orderItemUuid: ProductionWorkOrderLines.orderItemUuid,
      })
      .from(ProductionWorkOrderLines)
      .where(eq(ProductionWorkOrderLines.workOrderUuid, uuid));

    const orderItemUuids = lines
      .map((line) => line.orderItemUuid)
      .filter((value): value is string => value !== null);

    await db.transaction(async (tx) => {
      if (orderItemUuids.length > 0) {
        await tx
          .update(OrderItems)
          .set(
            mode === "restore"
              ? { lineStatus: "released", deliveryStatus: "new" }
              : { lineStatus: "cancelled", deliveryStatus: "new" },
          )
          .where(inArray(OrderItems.uuid, orderItemUuids));
      }

      await tx
        .delete(ProductionWorkOrderPicks)
        .where(eq(ProductionWorkOrderPicks.workOrderUuid, uuid));
      await tx
        .delete(ProductionWorkOrderRemainders)
        .where(eq(ProductionWorkOrderRemainders.workOrderUuid, uuid));
      await tx
        .delete(ProductionWorkOrderLines)
        .where(eq(ProductionWorkOrderLines.workOrderUuid, uuid));
      await tx
        .delete(ProductionWorkOrderPackagings)
        .where(eq(ProductionWorkOrderPackagings.workOrderUuid, uuid));
      await tx
        .delete(ProductionWorkOrders)
        .where(eq(ProductionWorkOrders.uuid, uuid));
    });

    revalidatePath("/production-workorders");
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to cancel the work order") };
  }
};

/**
 * Record the returnable packaging the goods went out on. Entered against the run
 * rather than its lines because a load is packed as a load.
 */
export const saveProductionWorkOrderPackaging = async (
  workOrderUuid: string,
  entries: ProductionPackagingInput[],
): Promise<ProductionWorkOrderActionResult> => {
  try {
    const used = entries.filter((entry) => entry.quantity > 0);

    if (used.length === 0) {
      return { error: "Give a count against at least one kind of packaging." };
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(ProductionWorkOrderPackagings)
        .where(eq(ProductionWorkOrderPackagings.workOrderUuid, workOrderUuid));

      await tx.insert(ProductionWorkOrderPackagings).values(
        used.map((entry) => ({
          uuid: generateUuid(),
          workOrderUuid,
          packaging: entry.packaging,
          quantity: entry.quantity,
          specification: entry.specification || null,
        })),
      );
    });

    revalidatePath(`/production-workorders/${workOrderUuid}`);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to save the packaging") };
  }
};

/** The order a line belongs to, for stamping on the stock movements it causes. */
const orderUuidForItem = async (
  orderItemUuid: string | null,
): Promise<string | null> => {
  if (!orderItemUuid) {
    return null;
  }
  const [row] = await db
    .select({ uuid: Orders.uuid })
    .from(OrderItems)
    .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .where(eq(OrderItems.uuid, orderItemUuid))
    .limit(1);
  return row?.uuid ?? null;
};

/**
 * Move the run on once none of its lines is still outstanding. It stops at
 * `ready` rather than `approved` — somebody still has to look at the work.
 */
const settleRunStatus = async (
  tx: Transaction,
  workOrderUuid: string,
): Promise<void> => {
  const [outstanding] = await tx
    .select({ value: count() })
    .from(ProductionWorkOrderLines)
    .where(
      and(
        eq(ProductionWorkOrderLines.workOrderUuid, workOrderUuid),
        ne(ProductionWorkOrderLines.status, "ready"),
        ne(ProductionWorkOrderLines.status, "approved"),
      ),
    );

  if (Number(outstanding?.value ?? 0) === 0) {
    await tx
      .update(ProductionWorkOrders)
      .set({ status: "ready" })
      .where(eq(ProductionWorkOrders.uuid, workOrderUuid));
  }
};

/**
 * Point the order line at what it will actually be delivered from.
 *
 * Without this, delivery would go looking for the plate that has since been cut
 * up. The agreed prices are snapshots and stay untouched; only the figures that
 * depend on quantity and on what the goods now cost are recomputed — so a run
 * that wasted material shows a thinner margin on the line that caused it, which
 * is the whole point of charging the scrap to the output rather than burying it
 * in the stock valuation.
 */
const pointOrderLineAtProducedLot = async (
  tx: Transaction,
  params: {
    orderItemUuid: string;
    producedStockUuid: string;
    quantity: number;
    cost: number;
  },
): Promise<void> => {
  const [orderItem] = await tx
    .select()
    .from(OrderItems)
    .where(eq(OrderItems.uuid, params.orderItemUuid))
    .limit(1);

  if (!orderItem) {
    return;
  }

  const netPrice = Number(orderItem.netPrice ?? 0);
  const replacementPrice = Number(orderItem.replacementPrice ?? 0);
  const amount = netPrice * params.quantity;
  const profit = amount - params.cost;

  await tx
    .update(OrderItems)
    .set({
      stockUuid: params.producedStockUuid,
      quantity: params.quantity.toFixed(3),
      qtyReserved: params.quantity.toFixed(3),
      amount: moneyString(amount),
      costPrice: (params.quantity > 0
        ? params.cost / params.quantity
        : 0
      ).toFixed(4),
      costAmount: moneyString(params.cost),
      profit: moneyString(profit),
      profitMargin: profitMarginPercent(amount, profit).toFixed(2),
      profitReplPrice: moneyString(amount - replacementPrice * params.quantity),
    })
    .where(eq(OrderItems.uuid, params.orderItemUuid));
};
