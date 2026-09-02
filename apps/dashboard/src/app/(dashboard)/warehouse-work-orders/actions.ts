"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { OrderItems } from "@/db/schema/order-items";
import {
  OrderItemOptions,
  SelectOrderItemOptions,
} from "@/db/schema/order-item-options";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { CompanyAddresses } from "@/db/schema/company-addresses";
import { SalesOptions, SelectSalesOptions } from "@/db/schema/sales-options";
import { SelectTexts, Texts } from "@/db/schema/texts";
import {
  SelectTextCategories,
  TextCategories,
} from "@/db/schema/text-categories";
import { Products, SelectProducts } from "@/db/schema/products";
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
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
  warehouseWorkOrderStatuses,
  warehouseWorkOrderTypes,
} from "@/lib/enums";
import {
  customerLabelCount,
  customerLabelMedium,
  NON_SELLABLE_LOCATION_TYPES,
  describeError,
  generateUuid,
  PrintMedium,
  restateLotValue,
  stockLabelCount,
  toDecimalAmount,
  toDecimalQuantity,
  todayDateString,
  WAREHOUSE_WORK_ORDER_TYPE_META,
} from "@/lib/helpers";
import { STOCK_MOVEMENT_REASON_LABELS } from "@/lib/labels";
import { recordFreightMovement } from "@/lib/server/freight";
import {
  buildInventoryMovementEntry,
  LEDGER_ACCOUNTS,
} from "@/lib/server/ledger";
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
export type LineStockRow = {
  uuid: SelectStock["uuid"];
  locationName: SelectWarehouses["name"] | null;
  productName: SelectProducts["name"] | null;
  lengthMm: SelectStock["lengthMm"];
  widthMm: SelectStock["widthMm"];
  thicknessMm: SelectStock["thicknessMm"];
  // Technical is what stands on the shelf, reserved is what is spoken for, and
  // available is the difference — which goes negative when more has been
  // promised than held, and is left that way rather than clamped.
  technical: number;
  reserved: number;
  available: number;
  charge: SelectStock["charge"];
  internalCharge: SelectStock["internalCharge"];
  quality: SelectStock["quality"];
  remark: SelectStock["remark"];
};

/** The sales order behind the line, as the floor needs to read it. */
export type LineOrderContext = {
  orderUuid: SelectOrders["uuid"];
  orderNumber: SelectOrders["id"];
  companyUuid: SelectCompanies["uuid"] | null;
  companyName: SelectCompanies["companyName"] | null;
  status: SelectOrders["status"];
  deliveryDate: SelectOrders["deliveryDate"];
  customerRef: SelectOrders["customerRef"];
  seller: SelectOrders["seller"];
  contactName: string | null;
  telephone: SelectContacts["telephone"] | null;
  deliveryAddress: string | null;
};

export type LineOptionRow = {
  uuid: SelectOrderItemOptions["uuid"];
  // The order the options were added in. No column records it, so it is the
  // row's position rather than a stored sequence — enough to keep a two-step
  // finish in the order somebody meant it, which is what the floor reads it for.
  sequenceNumber: number;
  name: SelectSalesOptions["name"] | null;
  code: SelectSalesOptions["code"] | null;
  quantity: SelectOrderItemOptions["quantity"];
  unit: SelectOrderItemOptions["unit"];
};

export type LineTextRow = {
  uuid: SelectTexts["uuid"];
  categoryName: SelectTextCategories["name"] | null;
  title: SelectTexts["title"];
  textBlock: SelectTexts["textBlock"];
};

/** Everything the Details panel shows for one line, in one round trip. */
export type LineDetail = {
  stock: LineStockRow[];
  order: LineOrderContext | null;
  options: LineOptionRow[];
  texts: LineTextRow[];
};

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

export type WorkOrderPickRow = SelectWarehouseWorkOrderPicks & {
  stockCharge: SelectStock["charge"] | null;
  stockInternalCharge: SelectStock["internalCharge"] | null;
  stockQuantity: SelectStock["quantity"] | null;
  fromLocationName: SelectWarehouses["name"] | null;
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
  status: enumFilter(WarehouseWorkOrders.status, warehouseWorkOrderStatuses),
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
const getWarehouseWorkOrderLines = async (
  workOrderUuid: string,
): Promise<WorkOrderLineListItem[]> => {
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
    .where(eq(WarehouseWorkOrderLines.workOrderUuid, workOrderUuid))
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
      companyUuid: WarehouseWorkOrderLines.companyUuid,
    })
    .from(WarehouseWorkOrderLines)
    .where(eq(WarehouseWorkOrderLines.uuid, lineUuid))
    .limit(1);

  if (!line) {
    return null;
  }

  const empty: LineDetail = { stock: [], order: null, options: [], texts: [] };

  // Sequential rather than concurrent: this database caps connections.
  const stockRows = line.productUuid
    ? await db
        .select({
          uuid: Stock.uuid,
          locationName: Warehouses.name,
          productName: Products.name,
          lengthMm: Stock.lengthMm,
          widthMm: Stock.widthMm,
          thicknessMm: Stock.thicknessMm,
          quantity: Stock.quantity,
          reservedQuantity: Stock.reservedQuantity,
          charge: Stock.charge,
          internalCharge: Stock.internalCharge,
          quality: Stock.quality,
          remark: Stock.remark,
        })
        .from(Stock)
        .leftJoin(Warehouses, eq(Stock.locationUuid, Warehouses.uuid))
        .leftJoin(Products, eq(Stock.productUuid, Products.uuid))
        .where(eq(Stock.productUuid, line.productUuid))
        .orderBy(Warehouses.name, Stock.charge)
    : [];

  const stock: LineStockRow[] = stockRows.map((row) => {
    const technical = Number(row.quantity ?? 0);
    const reserved = Number(row.reservedQuantity ?? 0);
    return {
      uuid: row.uuid,
      locationName: row.locationName ?? null,
      productName: row.productName ?? null,
      lengthMm: row.lengthMm,
      widthMm: row.widthMm,
      thicknessMm: row.thicknessMm,
      technical,
      reserved,
      // Deliberately not clamped: more can be promised than held, and hiding
      // that would tell the floor there is stock to pick when there is not.
      available: technical - reserved,
      charge: row.charge,
      internalCharge: row.internalCharge,
      quality: row.quality,
      remark: row.remark,
    };
  });

  if (!line.orderItemUuid) {
    return { ...empty, stock };
  }

  const [orderRow] = await db
    .select({
      orderUuid: Orders.uuid,
      orderNumber: Orders.id,
      companyUuid: Companies.uuid,
      companyName: Companies.companyName,
      status: Orders.status,
      deliveryDate: Orders.deliveryDate,
      customerRef: Orders.customerRef,
      seller: Orders.seller,
      firstName: Contacts.firstName,
      lastName: Contacts.lastName,
      telephone: Contacts.telephone,
      street: CompanyAddresses.streetAndNo,
      postalCode: CompanyAddresses.postalCode,
      city: CompanyAddresses.city,
      country: CompanyAddresses.country,
    })
    .from(OrderItems)
    .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
    .leftJoin(Contacts, eq(Orders.contactUuid, Contacts.uuid))
    .leftJoin(
      CompanyAddresses,
      eq(Orders.deliveryAddressUuid, CompanyAddresses.uuid),
    )
    .where(eq(OrderItems.uuid, line.orderItemUuid))
    .limit(1);

  const optionRows = await db
    .select({
      uuid: OrderItemOptions.uuid,
      name: SalesOptions.name,
      code: SalesOptions.code,
      quantity: OrderItemOptions.quantity,
      unit: OrderItemOptions.unit,
    })
    .from(OrderItemOptions)
    .leftJoin(SalesOptions, eq(OrderItemOptions.optionUuid, SalesOptions.uuid))
    .where(eq(OrderItemOptions.orderItemUuid, line.orderItemUuid))
    .orderBy(OrderItemOptions.id);

  // A note reaches the floor either because it was written on this order or
  // because it stands against the customer for every order they place — the
  // goods-reception hours on a delivery address are the second kind.
  const textRows = orderRow
    ? await db
        .select({
          uuid: Texts.uuid,
          categoryName: TextCategories.name,
          title: Texts.title,
          textBlock: Texts.textBlock,
        })
        .from(Texts)
        .leftJoin(
          TextCategories,
          eq(Texts.textCategoryUuid, TextCategories.uuid),
        )
        .where(
          orderRow.companyUuid
            ? or(
                eq(Texts.orderUuid, orderRow.orderUuid),
                eq(Texts.companyUuid, orderRow.companyUuid),
              )
            : eq(Texts.orderUuid, orderRow.orderUuid),
        )
        .orderBy(Texts.sequenceNumber, Texts.id)
    : [];

  const contactName =
    [orderRow?.firstName, orderRow?.lastName].filter(Boolean).join(" ") || null;

  const deliveryAddress =
    [
      orderRow?.street,
      [orderRow?.postalCode, orderRow?.city].filter(Boolean).join(" "),
      orderRow?.country,
    ]
      .filter((part) => part && part.trim() !== "")
      .join(", ") || null;

  return {
    stock,
    order: orderRow
      ? {
          orderUuid: orderRow.orderUuid,
          orderNumber: orderRow.orderNumber,
          companyUuid: orderRow.companyUuid ?? null,
          companyName: orderRow.companyName ?? null,
          status: orderRow.status,
          deliveryDate: orderRow.deliveryDate,
          customerRef: orderRow.customerRef,
          seller: orderRow.seller,
          contactName,
          telephone: orderRow.telephone ?? null,
          deliveryAddress,
        }
      : null,
    options: optionRows.map((row, index) => ({
      uuid: row.uuid,
      sequenceNumber: (index + 1) * 10,
      name: row.name ?? null,
      code: row.code ?? null,
      quantity: row.quantity,
      unit: row.unit,
    })),
    texts: textRows.map((row) => ({
      uuid: row.uuid,
      categoryName: row.categoryName ?? null,
      title: row.title,
      textBlock: row.textBlock,
    })),
  };
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
  const lines = await getWarehouseWorkOrderLines(uuid);
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
 * Move a lot from one location to another.
 *
 * The quantity leaves the source lot and joins a lot of the same material
 * standing at the destination, or starts one if none is there. Value travels
 * with it, so the two lots together are worth exactly what the one was — which
 * is why an internal move posts nothing to the ledger.
 *
 * The reservation travels too. A lot picked for a customer arrives at the
 * staging shelf spoken for, which is what stops the same steel being sold twice
 * while it waits to be loaded.
 */
const applyMove = async (
  tx: Transaction,
  params: {
    source: SelectStock;
    quantity: number;
    toLocationUuid: string;
    committedToOrder: boolean;
    reason: "warehouse_transfer";
    userId: string;
    orderUuid: string | null;
  },
): Promise<void> => {
  const { source, quantity } = params;
  const previousQuantity = Number(source.quantity);

  if (quantity > previousQuantity) {
    throw new Error(
      `Cannot move ${quantity} — the lot only holds ${previousQuantity}.`,
    );
  }

  // Moving a lot to where it already stands would split it in two for no
  // reason. Nothing has to happen, so nothing does.
  if (source.locationUuid === params.toLocationUuid) {
    return;
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
  const valueMoved = previousValue - remainingValue;

  // The reservation follows the goods, capped at what is actually there to
  // release. A lot picked for a customer arrives spoken for even when the bin
  // it came out of held no reservation at all — being picked is what commits
  // it, which is what stops the same steel being sold twice while it waits on
  // the staging shelf.
  const carried = Math.min(quantity, Number(source.reservedQuantity ?? 0));
  const arrivingReserved = params.committedToOrder ? quantity : carried;

  const [updated] = await tx
    .update(Stock)
    .set({
      quantity: remainingQuantity.toFixed(3),
      reservedQuantity: (
        Number(source.reservedQuantity ?? 0) - carried
      ).toFixed(3),
      valuationEuro: remainingValue.toFixed(2),
    })
    .where(and(eq(Stock.uuid, source.uuid), eq(Stock.quantity, source.quantity)));

  if (updated.affectedRows === 0) {
    throw new Error(
      "The lot changed while moving it — please refresh and try again.",
    );
  }

  // Candidates are narrowed in SQL and matched in code: a lot is the same lot
  // as this one when its charge and internal charge agree, and NULL does not
  // compare equal to NULL in SQL.
  const candidates = await tx
    .select()
    .from(Stock)
    .where(
      and(
        eq(Stock.productUuid, source.productUuid),
        eq(Stock.locationUuid, params.toLocationUuid),
        eq(Stock.status, "pending"),
        ne(Stock.uuid, source.uuid),
      ),
    );

  const destination = candidates.find(
    (lot) =>
      lot.charge === source.charge &&
      lot.internalCharge === source.internalCharge &&
      lot.quality === source.quality,
  );

  const destinationUuid = destination?.uuid ?? generateUuid();

  if (destination) {
    await tx
      .update(Stock)
      .set({
        quantity: (Number(destination.quantity) + quantity).toFixed(3),
        reservedQuantity: (
          Number(destination.reservedQuantity ?? 0) + arrivingReserved
        ).toFixed(3),
        valuationEuro: (
          Number(destination.valuationEuro ?? 0) + valueMoved
        ).toFixed(2),
      })
      .where(eq(Stock.uuid, destination.uuid));
  } else {
    const {
      id: _id,
      uuid: _uuid,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...attributes
    } = source;

    // Everything else about the lot travels with it — its charge, its quality,
    // its supplier, the purchase it arrived on, whether it is blocked — because
    // it is the same steel standing somewhere else. Only where it is, how much
    // of it there is and what that much is worth are new. The status is stated
    // rather than copied: a lot that has just been put down is holding goods.
    await tx.insert(Stock).values({
      ...attributes,
      uuid: destinationUuid,
      locationUuid: params.toLocationUuid,
      status: "pending",
      quantity: quantity.toFixed(3),
      reservedQuantity: arrivingReserved.toFixed(3),
      valuationEuro: valueMoved.toFixed(2),
    });
  }

  // Two movements, because two lots changed. Netting them into one would leave
  // the stock ledger unable to say where the material actually went.
  await tx.insert(StockMovements).values([
    {
      uuid: generateUuid(),
      productUuid: source.productUuid,
      stockUuid: source.uuid,
      type: "out",
      reason: params.reason,
      quantity: quantity.toFixed(3),
      orderUuid: params.orderUuid,
      createdByUserId: params.userId,
    },
    {
      uuid: generateUuid(),
      productUuid: source.productUuid,
      stockUuid: destinationUuid,
      type: "in",
      reason: params.reason,
      quantity: quantity.toFixed(3),
      orderUuid: params.orderUuid,
      createdByUserId: params.userId,
    },
  ]);
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
    reason: "warehouse_issue" | "warehouse_scrapped";
    userId: string;
    orderUuid: string | null;
    companyUuid: string | null;
    documentNo: string;
  },
): Promise<void> => {
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
      quantity: remainingQuantity.toFixed(3),
      reservedQuantity: (
        Number(source.reservedQuantity ?? 0) - released
      ).toFixed(3),
      valuationEuro: remainingValue.toFixed(2),
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
    quantity: quantity.toFixed(3),
    orderUuid: params.orderUuid,
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
            : LEDGER_ACCOUNTS.inventoryDifferences,
        reference: `Stock lot ${source.uuid}`,
        userId: params.userId,
      }),
    );
  }
};

/**
 * Book arriving goods onto the shelf.
 *
 * The lot is valued at what the purchase order agreed to pay, because this is
 * the moment a cost enters the business — every sale later drawn from this lot
 * is costed against the figure set here. The supplier has not billed yet, so
 * the other side of the entry waits on the goods-received account.
 */
const applyReceipt = async (
  tx: Transaction,
  params: {
    productUuid: string;
    quantity: number;
    toLocationUuid: string;
    purchaseOrderItemUuid: string | null;
    charge: string | null;
    internalCharge: string | null;
    userId: string;
    companyUuid: string | null;
    documentNo: string;
  },
): Promise<void> => {
  const { quantity } = params;

  if (quantity <= 0) {
    return;
  }

  const [purchaseLine] = params.purchaseOrderItemUuid
    ? await tx
        .select()
        .from(PurchaseOrderItems)
        .where(eq(PurchaseOrderItems.uuid, params.purchaseOrderItemUuid))
        .limit(1)
    : [];

  if (!purchaseLine) {
    throw new Error(
      "An unloading needs the purchase line it is receiving — without one the goods would go on the shelf at no value.",
    );
  }

  const unitCost = Number(purchaseLine.netPrice ?? 0);
  const value = unitCost * quantity;
  const stockUuid = generateUuid();

  await tx.insert(Stock).values({
    uuid: stockUuid,
    productUuid: params.productUuid,
    purchaseOrderUuid: purchaseLine.purchaseOrderUuid,
    purchaseOrderItemUuid: purchaseLine.uuid,
    supplierUuid: params.companyUuid,
    locationUuid: params.toLocationUuid,
    quantity: quantity.toFixed(3),
    status: "pending",
    charge: params.charge,
    internalCharge: params.internalCharge,
    receiptDate: todayDateString(),
    valuationPrice: unitCost.toFixed(4),
    valuationEuro: value.toFixed(2),
  });

  await tx
    .update(PurchaseOrderItems)
    .set({
      qtyReceived: sql`${PurchaseOrderItems.qtyReceived} + ${quantity.toFixed(3)}`,
    })
    .where(eq(PurchaseOrderItems.uuid, purchaseLine.uuid));

  await tx.insert(StockMovements).values({
    uuid: generateUuid(),
    productUuid: params.productUuid,
    stockUuid,
    type: "in",
    reason: "warehouse_receipt",
    quantity: quantity.toFixed(3),
    purchaseOrderUuid: purchaseLine.purchaseOrderUuid,
    createdByUserId: params.userId,
  });

  await recordFreightMovement(tx, {
    productUuid: params.productUuid,
    quantity: quantity.toFixed(3),
    type: "in",
    reason: "warehouse_receipt",
    purchaseOrderUuid: purchaseLine.purchaseOrderUuid,
    supplierUuid: params.companyUuid,
    valuationPrice: unitCost.toFixed(4),
    operator: params.userId,
  });

  if (Math.abs(value) >= 0.005) {
    await tx.insert(JournalEntries).values(
      buildInventoryMovementEntry({
        bookingDate: todayDateString(),
        documentNo: params.documentNo,
        description: "Warehouse — Warehouse Receipt",
        companyUuid: params.companyUuid,
        debCreditor: null,
        inventoryValue: value,
        counterAccount: LEDGER_ACCOUNTS.goodsReceivedNotInvoiced,
        reference: `Stock lot ${stockUuid}`,
        userId: params.userId,
      }),
    );
  }
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
      valuationEuro: nextValue.toFixed(2),
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

    if (workOrder.status === "new") {
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

        if (quantity > 0 || isCount) {
          const source = pick.stockUuid
            ? (
                await tx
                  .select()
                  .from(Stock)
                  .where(eq(Stock.uuid, pick.stockUuid))
                  .limit(1)
              )[0]
            : undefined;

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
              charge: pick.charge ?? null,
              internalCharge: pick.internalCharge ?? null,
              userId,
              companyUuid: line.companyUuid,
              documentNo,
            });
          } else {
            if (!source) {
              throw new Error(
                "This line has no lot to draw from — prepare it against stock first.",
              );
            }

            if (meta.stockEffect === "move") {
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
              });
            } else {
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
          fromLocationUuid: line.fromLocationUuid,
          toLocationUuid: pick.toLocationUuid ?? line.toLocationUuid,
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
            .update(WarehouseWorkOrderPicks)
            .set(values)
            .where(eq(WarehouseWorkOrderPicks.uuid, pick.uuid));
        } else {
          await tx
            .insert(WarehouseWorkOrderPicks)
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
        .update(WarehouseWorkOrderLines)
        .set({
          status: "approved",
          qtyActual: qtyActual.toFixed(3),
          kgActual: kgActual.toFixed(2),
          charge: reported[0]?.charge ?? line.charge,
          internalCharge: reported[0]?.internalCharge ?? line.internalCharge,
          internalBatch: reported[0]?.internalBatch ?? line.internalBatch,
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
              deliveryStatus: "delivered",
              lineStatus:
                deliveredQty >= owed ? "delivered" : "partially_delivered",
            })
            .where(eq(OrderItems.uuid, line.orderItemUuid));
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
                  deliveryStatus: "not_ready",
                  lastWarehouseWorkOrder: null,
                }
              : {
                  // The goods are never going. The demand is finished, short.
                  lineStatus: "cancelled",
                  deliveryStatus: "not_ready",
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
