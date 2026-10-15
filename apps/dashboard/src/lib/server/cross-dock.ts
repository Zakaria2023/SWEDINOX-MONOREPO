import { db } from "@/db";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders } from "@/db/schema/orders";
import { Products } from "@/db/schema/products";
import {
  InsertPurchaseOrderItems,
  PurchaseOrderItems,
} from "@/db/schema/purchase-order-items";
import {
  InsertPurchaseOrders,
  PurchaseOrders,
} from "@/db/schema/purchase-orders";
import {
  InsertPurchaseRequestItems,
  PurchaseRequestItems,
} from "@/db/schema/purchase-request-items";
import {
  InsertPurchaseRequests,
  PurchaseRequests,
} from "@/db/schema/purchase-requests";
import { Reservations } from "@/db/schema/reservations";
import { SelectStock, Stock } from "@/db/schema/stock";
import {
  addLeadTime,
  articlePieceWeightKg,
  canEditPurchaseRequestLines,
  generateUuid,
  inferArticleQuality,
  isoWeekOf,
  moneyString,
  STOCK_QUANTITY_SCALE,
  toDateString,
  todayDateString,
} from "@/lib/helpers";
import {
  refreshPurchaseOrderTotals,
  syncPurchaseLineReceiptDates,
  syncPurchaseLineReceipts,
} from "@/lib/server/purchase-lines";
import { and, asc, eq, inArray, isNull, ne, sql } from "drizzle-orm";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Anything that can read — the database or an open transaction. */
type ReadQuery = Pick<typeof db, "select">;

type PurchaseLineCost = {
  /** The purchase line's amount — what the whole line is bought for. */
  amount: number;
  /** The purchase line's quantity, to share that amount out by. */
  quantity: number;
};

type ReceivedLot = {
  stockUuid: string;
  quantity: number;
  /** The lot's value, which is the price paid on what was unloaded. */
  value: number;
  unit: SelectStock["unit"];
};

/**
 * What a new purchase document takes from its supplier and from us — the
 * defaults a blank purchase order fills in by itself when the supplier is
 * typed (404355, 9-10-2026): contact, terms, our yard, the buyer.
 */
type CrossDockPurchaseHeader = Pick<
  InsertPurchaseOrders,
  | "contactUuid"
  | "paymentTerms"
  | "deliveryTerms"
  | "weightType"
  | "deliveryAddressUuid"
  | "purchaser"
> & {
  supplierUuid: string;
};

type CrossDockRequestHeader = Pick<
  InsertPurchaseRequests,
  | "companyUuid"
  | "companyType"
  | "contactUuid"
  | "paymentTerms"
  | "deliveryTerms"
  | "weightType"
  | "deliveryAddressUuid"
  | "purchaser"
>;

/** The sales line a `CD` purchase is raised for, with its article. */
type CrossDockSalesLine = Pick<
  SelectOrderItems,
  | "uuid"
  | "orderUuid"
  | "lineNumber"
  | "productUuid"
  | "quantity"
  | "unit"
  | "lengthMm"
  | "widthMm"
  | "thicknessMm"
  | "sourceType"
  | "status"
  | "purchaseOrderItemUuid"
> & {
  /** The line's own delivery date, or the order's when it has none. */
  deliveryDate: string | null;
  product: Parameters<typeof articlePieceWeightKg>[0];
};

type CrossDockPurchaseLineValues = Omit<
  InsertPurchaseOrderItems,
  "uuid" | "purchaseOrderUuid"
>;

type CrossDockRequestLineValues = Omit<
  InsertPurchaseRequestItems,
  "uuid" | "purchaseRequestUuid"
>;

type CreatedPurchaseOrder = {
  purchaseOrderUuid: string;
  purchaseOrderId: number;
};

type CreatedPurchaseRequest = {
  purchaseRequestUuid: string;
  purchaseRequestId: number;
};

/**
 * Restate a sales line's cost and margin from a cost amount.
 *
 * C11 of PLANNED-CODE-CHANGES-8: a `CD` line is costed at the purchase bought
 * for it. On `O108183/10` the reference reads `Purchase price` € 3 050,00 and
 * `Costs` € 6 661,20 — 3 050 €/TN on the 2,184 t **unloaded**, not the 2,1725 t
 * sold — and the profit (€ 508,05, 7,09 %) follows from it.
 */
const restateLineCost = async (
  tx: Transaction,
  orderItemUuid: string,
  costAmount: number,
): Promise<void> => {
  const [line] = await tx
    .select({ quantity: OrderItems.quantity, amount: OrderItems.amount })
    .from(OrderItems)
    .where(eq(OrderItems.uuid, orderItemUuid))
    .limit(1);

  if (!line) {
    return;
  }

  const quantity = Number(line.quantity ?? 0);
  const amount = Number(line.amount ?? 0);
  const profit = amount - costAmount;

  await tx
    .update(OrderItems)
    .set({
      costPrice: (quantity > 0 ? costAmount / quantity : 0).toFixed(4),
      costAmount: moneyString(costAmount),
      profit: moneyString(profit),
      profitMargin: (amount !== 0 ? (profit / amount) * 100 : 0).toFixed(2),
    })
    .where(eq(OrderItems.uuid, orderItemUuid));
};

/**
 * A purchase line has been raised **for** a sales line: point the sale at it
 * and make the sale `CD`.
 *
 * Captured 8-10-2026 on purchase order `404299` / sales order `O108183`: the
 * purchase line reads `For line O108183/10` and the sales line's `Type` reads
 * `CD`. A sales line that already holds stock of its own and is topped up by
 * the purchase is `Stk+CD`, the reference's third value.
 *
 * A line with no lot of its own is costed from the purchase straight away, by
 * its share of the purchase line (C11). The receipt restates it on what was
 * actually unloaded.
 */
export const coverSalesLineWithPurchase = async (
  tx: Transaction,
  orderItemUuid: string,
  purchaseOrderItemUuid: string,
  purchaseCost?: PurchaseLineCost,
): Promise<void> => {
  const [line] = await tx
    .select({
      qtyReserved: OrderItems.qtyReserved,
      stockUuid: OrderItems.stockUuid,
      quantity: OrderItems.quantity,
    })
    .from(OrderItems)
    .where(eq(OrderItems.uuid, orderItemUuid))
    .limit(1);

  if (!line) {
    return;
  }

  await tx
    .update(OrderItems)
    .set({
      purchaseOrderItemUuid,
      sourceType:
        Number(line.qtyReserved ?? 0) > 0 ? "stock_and_cross_dock" : "cross_dock",
    })
    .where(eq(OrderItems.uuid, orderItemUuid));

  if (!line.stockUuid && purchaseCost && purchaseCost.quantity > 0) {
    const share = Math.min(1, Number(line.quantity ?? 0) / purchaseCost.quantity);
    await restateLineCost(tx, orderItemUuid, purchaseCost.amount * share);
  }
};

/**
 * The goods bought for `CD` sales lines have been received: give each of
 * those lines the new lot and reserve it to them.
 *
 * Captured 8-10-2026: lot `404744` was created on 21-9-2026 already reserved
 * 41 of 41 to `O108183/10`, the line purchase order `404299` was raised for,
 * and placed straight on `Laad` for the customer's lorry. Lines are served in
 * line order until the lot runs out. Each takes the lot's own value for its
 * share as its cost (C11), which is the price paid on the weight unloaded.
 */
export const reserveReceiptToCoveredSalesLines = async (
  tx: Transaction,
  purchaseOrderItemUuid: string,
  lot: ReceivedLot,
  reservedFor: Date | null,
): Promise<number> => {
  const covered = await tx
    .select({
      uuid: OrderItems.uuid,
      quantity: OrderItems.quantity,
      kgPlanned: OrderItems.kgPlanned,
    })
    .from(OrderItems)
    .where(
      and(
        eq(OrderItems.purchaseOrderItemUuid, purchaseOrderItemUuid),
        isNull(OrderItems.stockUuid),
        eq(OrderItems.status, "reserved"),
      ),
    )
    .orderBy(OrderItems.lineNumber);

  // Served in line order until the lot runs out.
  const allocations = covered.reduce<
    { uuid: string; kgPlanned: string | null; take: number }[]
  >((taken, line) => {
    const used = taken.reduce((sum, entry) => sum + entry.take, 0);
    const take = Math.min(lot.quantity - used, Number(line.quantity ?? 0));
    return take > 0
      ? [...taken, { uuid: line.uuid, kgPlanned: line.kgPlanned, take }]
      : taken;
  }, []);

  for (const line of allocations) {
    await tx
      .update(OrderItems)
      .set({
        stockUuid: lot.stockUuid,
        qtyReserved: line.take.toFixed(STOCK_QUANTITY_SCALE),
      })
      .where(eq(OrderItems.uuid, line.uuid));

    await tx.insert(Reservations).values({
      uuid: generateUuid(),
      stockUuid: lot.stockUuid,
      orderItemUuid: line.uuid,
      type: "sale",
      status: "definitive",
      quantity: line.take.toFixed(STOCK_QUANTITY_SCALE),
      unit: lot.unit ?? "st",
      quantityKg: line.kgPlanned ?? "0.00",
      reservedFor,
    });

    await restateLineCost(
      tx,
      line.uuid,
      lot.quantity > 0 ? (lot.value * line.take) / lot.quantity : 0,
    );
  }

  const reserved = allocations.reduce((sum, entry) => sum + entry.take, 0);

  if (reserved > 0) {
    await tx
      .update(Stock)
      .set({ reservedQuantity: reserved.toFixed(STOCK_QUANTITY_SCALE) })
      .where(eq(Stock.uuid, lot.stockUuid));
  }

  return reserved;
};

/** The `CD` sales line a purchase is about to be raised for, checked. */
const loadCrossDockSalesLine = async (
  tx: Transaction,
  orderItemUuid: string,
): Promise<CrossDockSalesLine> => {
  const [row] = await tx
    .select({
      uuid: OrderItems.uuid,
      orderUuid: OrderItems.orderUuid,
      lineNumber: OrderItems.lineNumber,
      productUuid: OrderItems.productUuid,
      quantity: OrderItems.quantity,
      unit: OrderItems.unit,
      lengthMm: OrderItems.lengthMm,
      widthMm: OrderItems.widthMm,
      thicknessMm: OrderItems.thicknessMm,
      sourceType: OrderItems.sourceType,
      status: OrderItems.status,
      purchaseOrderItemUuid: OrderItems.purchaseOrderItemUuid,
      lineDeliveryDate: OrderItems.deliveryDate,
      orderDeliveryDate: Orders.deliveryDate,
      productCode: Products.productCode,
      productName: Products.name,
      dimensionShape: Products.dimensionShape,
      featuresQuality: Products.featuresQuality,
      densityKgDm3: Products.densityKgDm3,
      length: Products.length,
      widthDiameter: Products.widthDiameter,
      thickness: Products.thickness,
      theoreticalThickness: Products.theoreticalThickness,
      weightTheoretical: Products.weightTheoretical,
      theoreticalWeight: Products.theoreticalWeight,
      weightUnit: Products.weightUnit,
    })
    .from(OrderItems)
    .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .innerJoin(Products, eq(OrderItems.productUuid, Products.uuid))
    .where(eq(OrderItems.uuid, orderItemUuid))
    .limit(1);

  if (!row) {
    throw new Error("Sales order line not found.");
  }
  if (row.sourceType !== "cross_dock") {
    throw new Error("Only a CD line is purchased for.");
  }
  if (row.status === "cancelled") {
    throw new Error("This sales line has been cancelled.");
  }
  if (row.purchaseOrderItemUuid) {
    throw new Error("This sales line is already covered by a purchase.");
  }

  const {
    lineDeliveryDate,
    orderDeliveryDate,
    productCode,
    productName,
    dimensionShape,
    featuresQuality,
    densityKgDm3,
    length,
    widthDiameter,
    thickness,
    theoreticalThickness,
    weightTheoretical,
    theoreticalWeight,
    weightUnit,
    ...line
  } = row;

  return {
    ...line,
    deliveryDate:
      lineDeliveryDate ??
      (orderDeliveryDate ? toDateString(orderDeliveryDate) : null),
    product: {
      productCode,
      productName,
      dimensionShape,
      featuresQuality,
      densityKgDm3,
      length,
      widthDiameter,
      thickness,
      theoreticalThickness,
      weightTheoretical,
      theoreticalWeight,
      weightUnit,
    },
  };
};

/**
 * When the goods have to be in: the working day before the sale goes out.
 * Sales line O108307/10 for 15-10-2026 raised purchase order 404360 for
 * 14-10-2026 (13-10-2026). A line with no date is bought for the next working
 * day, as a blank purchase order is.
 */
const crossDockPurchaseDate = (salesDeliveryDate: string | null): string =>
  (salesDeliveryDate
    ? addLeadTime(salesDeliveryDate, -1, "working_days")
    : addLeadTime(todayDateString(), 1, "working_days")) ?? todayDateString();

/**
 * The purchase line a `CD` sale is bought on: the same article, quantity,
 * unit, quality and size, `Net Price` € 0 per `TN` until the buyer agrees a
 * price, and `Kg(p)` the **theoretical** weight — 157 kg on 404360/10 against
 * the 160 kg trade weight the sale is billed on (13-10-2026).
 */
const crossDockPurchaseLineValues = (
  line: CrossDockSalesLine,
): CrossDockPurchaseLineValues => {
  const quantity = Number(line.quantity ?? 0);
  const pieceWeightKg =
    articlePieceWeightKg(line.product, {
      lengthMm: line.lengthMm,
      widthMm: line.widthMm,
      thicknessMm: line.thicknessMm,
    }) ?? 0;

  return {
    productUuid: line.productUuid,
    quantity: line.quantity,
    qtyPlanned: line.quantity,
    unit: line.unit ?? undefined,
    status: "provisional",
    sourceType: "cross_dock",
    qualityCode:
      line.product.featuresQuality ??
      inferArticleQuality(line.product.productCode, line.product.productName),
    lengthMm: line.lengthMm,
    widthMm: line.widthMm,
    thicknessMm: line.thicknessMm,
    netPrice: "0.0000",
    priceUnit: "TN",
    kgPurchased: (pieceWeightKg * quantity).toFixed(2),
    amount: "0.00",
  };
};

/**
 * `Create purchase order` on the `Purchasing for Cross-docking order line`
 * dialog: a **Provisional** purchase order for the chosen supplier, with one
 * line bought for the sales line (O108307/10 → 404360, 13-10-2026). It gets
 * its reception and its totals as any new order does, and the sales line is
 * covered — `For line` on the purchase line reads `O108307/10`.
 */
export const createCrossDockPurchaseOrder = async (
  tx: Transaction,
  orderItemUuid: string,
  header: CrossDockPurchaseHeader,
): Promise<CreatedPurchaseOrder> => {
  const line = await loadCrossDockSalesLine(tx, orderItemUuid);
  const deliveryDate = crossDockPurchaseDate(line.deliveryDate);
  const purchaseOrderUuid = generateUuid();

  await tx.insert(PurchaseOrders).values({
    ...header,
    uuid: purchaseOrderUuid,
    status: "provisional",
    orderDate: todayDateString(),
    // What a blank purchase order reads (404355, 9-10-2026).
    purchaseOrderType: "materials",
    isOverlength: true,
    deliveryType: "date",
    deliveryDate: new Date(deliveryDate),
    deliveryWeek: isoWeekOf(deliveryDate),
    deliveryYear: Number(deliveryDate.slice(0, 4)),
  });

  const purchaseOrderItemUuid = generateUuid();
  await tx.insert(PurchaseOrderItems).values({
    ...crossDockPurchaseLineValues(line),
    uuid: purchaseOrderItemUuid,
    purchaseOrderUuid,
    lineNumber: 1,
  });

  await syncPurchaseLineReceiptDates(tx, purchaseOrderUuid);
  await syncPurchaseLineReceipts(tx, purchaseOrderUuid);
  await refreshPurchaseOrderTotals(tx, purchaseOrderUuid);

  await coverSalesLineWithPurchase(tx, orderItemUuid, purchaseOrderItemUuid, {
    amount: 0,
    quantity: Number(line.quantity ?? 0),
  });

  const [created] = await tx
    .select({ id: PurchaseOrders.id })
    .from(PurchaseOrders)
    .where(eq(PurchaseOrders.uuid, purchaseOrderUuid))
    .limit(1);
  if (!created) {
    throw new Error("The purchase order could not be read back.");
  }

  return { purchaseOrderUuid, purchaseOrderId: created.id };
};

/**
 * `Add line to a purchase order`: the sales line's purchase line appended to
 * a supplier's purchase order that is still provisional, numbered after its
 * last line.
 */
export const addCrossDockLineToPurchaseOrder = async (
  tx: Transaction,
  orderItemUuid: string,
  purchaseOrderUuid: string,
): Promise<CreatedPurchaseOrder> => {
  const line = await loadCrossDockSalesLine(tx, orderItemUuid);

  const [order] = await tx
    .select({ id: PurchaseOrders.id, status: PurchaseOrders.status })
    .from(PurchaseOrders)
    .where(eq(PurchaseOrders.uuid, purchaseOrderUuid))
    .limit(1);
  if (!order) {
    throw new Error("Purchase order not found.");
  }
  if (order.status !== "provisional") {
    throw new Error(
      `Purchase order ${order.id} has been made final, so no line can be added to it.`,
    );
  }

  const [last] = await tx
    .select({
      lineNumber: sql<number | null>`MAX(${PurchaseOrderItems.lineNumber})`,
    })
    .from(PurchaseOrderItems)
    .where(eq(PurchaseOrderItems.purchaseOrderUuid, purchaseOrderUuid));

  const purchaseOrderItemUuid = generateUuid();
  await tx.insert(PurchaseOrderItems).values({
    ...crossDockPurchaseLineValues(line),
    uuid: purchaseOrderItemUuid,
    purchaseOrderUuid,
    lineNumber: Number(last?.lineNumber ?? 0) + 1,
  });

  await syncPurchaseLineReceiptDates(tx, purchaseOrderUuid);
  await syncPurchaseLineReceipts(tx, purchaseOrderUuid);
  await refreshPurchaseOrderTotals(tx, purchaseOrderUuid);

  await coverSalesLineWithPurchase(tx, orderItemUuid, purchaseOrderItemUuid, {
    amount: 0,
    quantity: Number(line.quantity ?? 0),
  });

  return { purchaseOrderUuid, purchaseOrderId: order.id };
};

/** The request line a `CD` sale asks for, `For line` set to it. */
const crossDockRequestLineValues = (
  line: CrossDockSalesLine,
): CrossDockRequestLineValues => {
  const values = crossDockPurchaseLineValues(line);
  return {
    productUuid: line.productUuid,
    forOrderItemUuid: line.uuid,
    quantity: values.quantity,
    unit: values.unit,
    kg: values.kgPurchased,
    lengthMm: values.lengthMm,
    widthMm: values.widthMm,
    thicknessMm: values.thicknessMm,
    qualityCode: values.qualityCode,
    requiredDate: crossDockPurchaseDate(line.deliveryDate),
  };
};

/**
 * `Create purchase request`: a draft request with one line asking for what
 * the sales line sold. The line keeps `For line`, so the purchase order it
 * eventually becomes covers the sale (C4).
 */
export const createCrossDockPurchaseRequest = async (
  tx: Transaction,
  orderItemUuid: string,
  header: CrossDockRequestHeader,
): Promise<CreatedPurchaseRequest> => {
  const line = await loadCrossDockSalesLine(tx, orderItemUuid);
  const deliveryDate = crossDockPurchaseDate(line.deliveryDate);
  const purchaseRequestUuid = generateUuid();

  await tx.insert(PurchaseRequests).values({
    ...header,
    uuid: purchaseRequestUuid,
    status: "draft",
    purchaseOrderType: "materials",
    deliveryType: "date",
    deliveryDate: new Date(deliveryDate),
    deliveryWeek: isoWeekOf(deliveryDate),
    deliveryYear: Number(deliveryDate.slice(0, 4)),
  });

  await tx.insert(PurchaseRequestItems).values({
    ...crossDockRequestLineValues(line),
    uuid: generateUuid(),
    purchaseRequestUuid,
    lineNumber: 1,
  });

  const [created] = await tx
    .select({ id: PurchaseRequests.id })
    .from(PurchaseRequests)
    .where(eq(PurchaseRequests.uuid, purchaseRequestUuid))
    .limit(1);
  if (!created) {
    throw new Error("The purchase request could not be read back.");
  }

  return { purchaseRequestUuid, purchaseRequestId: created.id };
};

/**
 * `Add a line to a purchase request`: appended to a request whose lines may
 * still change — one still in draft, before any supplier was asked.
 */
export const addCrossDockLineToPurchaseRequest = async (
  tx: Transaction,
  orderItemUuid: string,
  purchaseRequestUuid: string,
): Promise<CreatedPurchaseRequest> => {
  const line = await loadCrossDockSalesLine(tx, orderItemUuid);

  const [request] = await tx
    .select({ id: PurchaseRequests.id, status: PurchaseRequests.status })
    .from(PurchaseRequests)
    .where(eq(PurchaseRequests.uuid, purchaseRequestUuid))
    .limit(1);
  if (!request) {
    throw new Error("Purchase request not found.");
  }
  if (!canEditPurchaseRequestLines(request.status)) {
    throw new Error(
      `Purchase request ${request.id} has already gone to a supplier, so no line can be added to it.`,
    );
  }

  const [last] = await tx
    .select({
      lineNumber: sql<number | null>`MAX(${PurchaseRequestItems.lineNumber})`,
    })
    .from(PurchaseRequestItems)
    .where(eq(PurchaseRequestItems.purchaseRequestUuid, purchaseRequestUuid));

  await tx.insert(PurchaseRequestItems).values({
    ...crossDockRequestLineValues(line),
    uuid: generateUuid(),
    purchaseRequestUuid,
    lineNumber: Number(last?.lineNumber ?? 0) + 1,
  });

  return { purchaseRequestUuid, purchaseRequestId: request.id };
};

/**
 * Why `Make final` refuses a purchase order bought for sales lines, or null
 * when nothing stands in the way (404360, 14-10-2026). The goods are bought
 * for a customer, so the sale has to be real first: every sales line it
 * covers released, and none of those orders financially blocked.
 */
export const crossDockReleaseRefusal = async (
  query: ReadQuery,
  purchaseOrderUuid: string,
): Promise<string | null> => {
  const covered = await query
    .select({
      orderId: Orders.id,
      orderStatus: Orders.status,
      financialBlockage: Orders.financialBlockage,
      lineNumber: OrderItems.lineNumber,
      lineStatus: OrderItems.lineStatus,
    })
    .from(OrderItems)
    .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .innerJoin(
      PurchaseOrderItems,
      eq(OrderItems.purchaseOrderItemUuid, PurchaseOrderItems.uuid),
    )
    .where(
      and(
        eq(PurchaseOrderItems.purchaseOrderUuid, purchaseOrderUuid),
        ne(OrderItems.status, "cancelled"),
      ),
    )
    .orderBy(asc(PurchaseOrderItems.lineNumber), asc(OrderItems.lineNumber));

  const unreleased = covered.find(
    (line) =>
      line.orderStatus === "provisional" || line.lineStatus === "provisional",
  );
  if (unreleased) {
    return `Sales line O${unreleased.orderId}/${(unreleased.lineNumber ?? 0) * 10} has not been released.`;
  }

  const blocked = covered.find((line) => line.financialBlockage);
  if (blocked) {
    return `Sales order ${blocked.orderId} is blocked.`;
  }

  return null;
};

/**
 * The purchase line's price moved, so the `CD` sales lines it covers are
 * costed again at once — on a released order too. Watched on 404360/10
 * (14-10-2026): `Net Price` € 2 500 per TN on 157 kg made O108307/10 cost
 * € 392,50 and earn € 87,50 (18,2 %) on its € 480, while `Profit w.r.t.
 * replacement price` stayed where it was. Each line takes its share of the
 * purchase line's amount, as `coverSalesLineWithPurchase` gives it.
 */
export const restateCoveredSalesLines = async (
  tx: Transaction,
  purchaseOrderItemUuid: string,
): Promise<void> => {
  const [purchaseLine] = await tx
    .select({
      amount: PurchaseOrderItems.amount,
      quantity: PurchaseOrderItems.quantity,
    })
    .from(PurchaseOrderItems)
    .where(eq(PurchaseOrderItems.uuid, purchaseOrderItemUuid))
    .limit(1);

  const purchaseQuantity = Number(purchaseLine?.quantity ?? 0);
  if (!purchaseLine || purchaseQuantity <= 0) {
    return;
  }

  const covered = await tx
    .select({ uuid: OrderItems.uuid, quantity: OrderItems.quantity })
    .from(OrderItems)
    .where(
      and(
        eq(OrderItems.purchaseOrderItemUuid, purchaseOrderItemUuid),
        eq(OrderItems.sourceType, "cross_dock"),
        ne(OrderItems.status, "cancelled"),
      ),
    );

  for (const line of covered) {
    const share = Math.min(1, Number(line.quantity ?? 0) / purchaseQuantity);
    await restateLineCost(
      tx,
      line.uuid,
      Number(purchaseLine.amount ?? 0) * share,
    );
  }
};

/**
 * The `CD` sales lines a pre-notified delivery now arrives too late for.
 * Pre-notifying 404360 for after O108307/10's delivery date warned `Sales
 * order line O108307/10 can now no longer be delivered as planned` and went
 * through all the same (15-10-2026).
 */
export const crossDockLateDeliveryWarnings = async (
  query: ReadQuery,
  purchaseOrderItemUuids: string[],
  advisedDate: string,
): Promise<string[]> => {
  if (purchaseOrderItemUuids.length === 0) {
    return [];
  }

  const covered = await query
    .select({
      orderId: Orders.id,
      lineNumber: OrderItems.lineNumber,
      lineDeliveryDate: OrderItems.deliveryDate,
      orderDeliveryDate: Orders.deliveryDate,
    })
    .from(OrderItems)
    .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .where(
      and(
        inArray(OrderItems.purchaseOrderItemUuid, purchaseOrderItemUuids),
        ne(OrderItems.status, "cancelled"),
      ),
    )
    .orderBy(asc(Orders.id), asc(OrderItems.lineNumber));

  return covered.flatMap((line) => {
    const salesDate =
      line.lineDeliveryDate ??
      (line.orderDeliveryDate ? toDateString(line.orderDeliveryDate) : null);
    return salesDate && advisedDate.slice(0, 10) > salesDate.slice(0, 10)
      ? [
          `Sales order line O${line.orderId}/${(line.lineNumber ?? 0) * 10} can now no longer be delivered as planned`,
        ]
      : [];
  });
};
