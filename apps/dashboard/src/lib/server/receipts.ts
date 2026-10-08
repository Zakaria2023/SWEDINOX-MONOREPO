
import { db } from "@/db";
import { OrderItems } from "@/db/schema/order-items";
import { BatchCertificates } from "@/db/schema/batch-certificates";
import { reserveReceiptToCoveredSalesLines } from "@/lib/server/cross-dock";
import { ReturnOrderItems, SelectReturnOrderItems } from "@/db/schema/return-order-items";
import { Products } from "@/db/schema/products";
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import { JournalEntries } from "@/db/schema/journal-entries";
import { Stock } from "@/db/schema/stock";
import { StockMovements } from "@/db/schema/stock-movements";
import {
  generateUuid,
  moneyString,
  nextInternalBatch,
  nextInternalCharge,
  normaliseCharge,
  priceMeasureFor,
  lotPieceWeightKg,
  roundToCents,
  todayDateString,
  unitCostString,
  STOCK_QUANTITY_SCALE,
} from "@/lib/helpers";
import { recordFreightMovement } from "@/lib/server/freight";
import { registerBatchForLot } from "@/lib/server/batches";
import { recordPurchaseLineReceipt, refreshPurchaseLineStatus } from "@/lib/server/purchase-lines";
import { buildInventoryMovementEntry, LEDGER_ACCOUNTS } from "@/lib/server/ledger";
import {
  and,
  eq,
  isNull,
  or,
  sql,
} from "drizzle-orm";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Book goods a customer sent back onto the shelf.
 *
 * 🔴 Item 25, and the finding that matters in it. Return order `290247` was
 * watched end to end on 29-9-2026. It raised an `Unloading` work order with no
 * purchase order behind it, the goods were reported back with charge
 * `RET290247` typed into the dialog, and the lot that appeared — `404763` —
 * read like this:
 *
 *     Valuation price  0        Charge           (empty)
 *     Stock (€)        0        Internal charge  (empty)
 *     Receipt date     0        Supplier         (empty)
 *     Stock category   (prime)  Blocked          False
 *
 * 35,325 kg of prime, unblocked, immediately sellable metal, on the books at
 * nothing, undated, and untraceable to whoever sent it. Sell it and the margin
 * reads 100 %. Three separate defects, so three separate things this fixes:
 *
 * 1. **It carries a value.** The cost the line went out at — the same figure
 *    the credit note hands back, so the two agree and the account holding the
 *    cost in between clears to nothing. The return line's own cost price first,
 *    then the sale it reverses. A return worth nothing is bookable only when
 *    the sale genuinely cost nothing.
 * 2. **The typed charge persists.** It was entered and the reference dropped
 *    it, which breaks traceability on every return — there is no route from
 *    the lot back to who sent it, and the charge is free text so it is no route
 *    either.
 * 3. **It is dated.** `receiptDate` set, because an undated lot is skipped by
 *    every age-based report. In the 22-9 stock analysis 38 of 2 035 lots had no
 *    receipt date and dropped out of the ageing entirely.
 *
 * And one thing the reference does not do at all: the lot names the sales line
 * it came back off, so a credit can be checked against what was charged.
 */
const applyReturnReceipt = async (
  tx: Transaction,
  params: {
    productUuid: string;
    quantity: number;
    toLocationUuid: string;
    charge: string | null;
    internalCharge: string | null;
    internalBatch: string | null;
    returnLine: SelectReturnOrderItems;
    userId: string;
    companyUuid: string | null;
    documentNo: string;
    warehouseWorkOrderLineUuid: string | null;
  },
): Promise<void> => {
  const { returnLine, quantity } = params;

  const [originalLine] = returnLine.originalOrderItemUuid
    ? await tx
        .select({
          costPrice: OrderItems.costPrice,
          stockUuid: OrderItems.stockUuid,
          orderUuid: OrderItems.orderUuid,
          quantity: OrderItems.quantity,
        })
        .from(OrderItems)
        .where(eq(OrderItems.uuid, returnLine.originalOrderItemUuid))
        .limit(1)
    : [];

  // Per piece, both of them: `costPrice` on a sales line is what one of them
  // cost, which is what `restateLotValue` assumes when a lot is drawn down.
  const unitCost =
    Number(returnLine.costPrice ?? 0) || Number(originalLine?.costPrice ?? 0);
  const value = roundToCents(unitCost * quantity);

  const weightKg =
    Number(returnLine.weightKg ?? 0) > 0
      ? (Number(returnLine.weightKg) * quantity) /
        Math.max(Number(returnLine.returnQty ?? 0) || quantity, 1)
      : 0;

  const stockUuid = generateUuid();

  await tx.insert(Stock).values({
    uuid: stockUuid,
    productUuid: params.productUuid,
    // 🔑 No purchase order, and that is legal here. What the lot names
    // instead is the sales line it came back off — the reference names nothing
    // at all, and without this a credit cannot be checked against what was
    // charged.
    orderItemUuid: returnLine.originalOrderItemUuid,
    locationUuid: params.toLocationUuid,
    quantity: quantity.toFixed(STOCK_QUANTITY_SCALE),
    quantityKg: weightKg.toFixed(STOCK_QUANTITY_SCALE),
    status: "pending",
    charge: normaliseCharge(params.charge),
    internalCharge: normaliseCharge(params.internalCharge),
    internalBatch: params.internalBatch,
    receiptDate: todayDateString(),
    quality: returnLine.qualityCode,
    stockCategory: returnLine.stockCategory,
    options: returnLine.options,
    lengthMm: returnLine.lengthMm,
    widthMm: returnLine.widthMm,
    thicknessMm: returnLine.thicknessMm,
    valuationPrice: unitCostString(unitCost),
    valuationEuro: moneyString(value),
  });

  await registerBatchForLot(tx, stockUuid, { date: todayDateString() });

  await tx.insert(StockMovements).values({
    uuid: generateUuid(),
    productUuid: params.productUuid,
    stockUuid,
    type: "in",
    reason: "sales_return",
    quantity: quantity.toFixed(STOCK_QUANTITY_SCALE),
    quantityKg: weightKg.toFixed(2),
    valueEur: moneyString(value),
    orderUuid: originalLine?.orderUuid ?? null,
    // Item 26: the return document links to nothing, but its movement does.
    returnOrderUuid: returnLine.returnOrderUuid,
    returnOrderItemUuid: returnLine.uuid,
    warehouseWorkOrderLineUuid: params.warehouseWorkOrderLineUuid,
    createdByUserId: params.userId,
  });

  await recordFreightMovement(tx, {
    productUuid: params.productUuid,
    quantity: quantity.toFixed(3),
    type: "in",
    reason: "sales_return",
    orderUuid: originalLine?.orderUuid ?? null,
    valuationPrice: unitCostString(unitCost),
    operator: params.userId,
  });

  // The mirror of a delivery: the metal is back, and its cost is owed back to
  // the customer but not credited yet.
  if (Math.abs(value) >= 0.005) {
    await tx.insert(JournalEntries).values(
      buildInventoryMovementEntry({
        bookingDate: todayDateString(),
        documentNo: params.documentNo,
        description: "Warehouse — Sales Return",
        companyUuid: params.companyUuid,
        debCreditor: null,
        inventoryValue: value,
        counterAccount: LEDGER_ACCOUNTS.goodsDeliveredNotInvoiced,
        reference: `Return order line ${returnLine.uuid}`,
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
 *
 * ⚠️ The purchase price is per the line's **own** unit — `TN` on 2 191 of the
 * reference's 2 247 lots — so it cannot be multiplied by a piece count. The
 * reference's own figures settle it: `Stock (€) = valuation price × the measure
 * that unit names`, exact to the cent on 2 114 of 2 115 priced lots. Eighteen
 * plates at € 2 158/TN are worth € 101,66, not € 38 844.
 *
 * `Stock.valuationPrice` stays a **per-piece** cost, because that is what the
 * eight `restateLotValue` callers assume when they scale a lot down after a
 * partial issue. So the line price is converted here rather than stored raw.
 */
export const applyReceipt = async (
  tx: Transaction,
  params: {
    productUuid: string;
    quantity: number;
    toLocationUuid: string;
    purchaseOrderItemUuid: string | null;
    charge: string | null;
    internalCharge: string | null;
    /**
     * Our own six-digit number for the physical bundle. The unloading line
     * already records it — `WarehouseWorkOrderPicks.internalBatch` — and until
     * now the lot that unloading created did not, so a bundle that was
     * identified on the way in became anonymous the moment it hit the rack.
     */
    internalBatch: string | null;
    /**
     * 🔑 The other thing an unloading can be receiving. Return order
     * `290247` raised an `Unloading` work order with `Purchase order` empty on
     * 29-9-2026 — goods coming back use the same verb as goods arriving from a
     * mill — so one of these two says which cause it was.
     */
    returnOrderItemUuid: string | null;
    /**
     * 🔴 What the scale said, when the floor weighed the bundle.
     *
     * The purchase order's own standing terms: *"Uitsluitend het gewogen
     * gewicht wordt ons als basis voor de facturering geaccepteerd"* — only the
     * weighed weight is accepted as the basis for invoicing. Steel is never its
     * nominal weight: cold-rolled plate runs 2-4 % under, coil can run over, and
     * the reference's own orders drift both ways (`400656/10` billed 1 438,0
     * against a theoretical 1 475,8; `400474/30` billed 5 825,8 against 5 809,0).
     *
     * Null when nobody weighed it, and then the plan's figure stands — which is
     * what an order shows from the moment it is placed until a lorry arrives.
     */
    weighedKg: number | null;
    userId: string;
    companyUuid: string | null;
    documentNo: string;
    warehouseWorkOrderLineUuid: string | null;
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

  const [returnLine] =
    !purchaseLine && params.returnOrderItemUuid
      ? await tx
          .select()
          .from(ReturnOrderItems)
          .where(eq(ReturnOrderItems.uuid, params.returnOrderItemUuid))
          .limit(1)
      : [];

  if (!purchaseLine && !returnLine) {
    throw new Error(
      "An unloading needs the line it is receiving — a purchase line or a return line. Without one the goods would go on the shelf at no value.",
    );
  }

  // 🔴 Goods coming back are received here too, and they are received
  // *valued*. Item 25: the reference put returned lot `404763` on the shelf at
  // € 0 — prime, unblocked, immediately sellable, with no charge, no supplier
  // and `Receipt date` reading 0. Sell it and the margin reads 100 %.
  //
  // Nothing in the reference repairs that, so this does not copy it. The return
  // comes back at what it cost to go out, which is the same figure the credit
  // note hands back, so the two agree and the account holding the cost in
  // between clears to nothing. The line's own cost price is the first answer;
  // the sale it reverses is the second.
  if (returnLine) {
    await applyReturnReceipt(tx, { ...params, returnLine, quantity });
    return;
  }

  if (!purchaseLine) {
    throw new Error(
      "An unloading needs the purchase line it is receiving — without one the goods would go on the shelf at no value.",
    );
  }

  // The weight arrives with the goods, and everything downstream — the stock
  // position, the value, the goods-flow return — is this number. The line's own
  // planned weight is the best answer; failing that, the product's density is
  // what the reference falls back on.
  const [product] = await tx
    .select({
      theoreticalWeight: Products.theoreticalWeight,
      weightUnit: Products.weightUnit,
      weightTheoretical: Products.weightTheoretical,
    })
    .from(Products)
    .where(eq(Products.uuid, params.productUuid))
    .limit(1);

  const lengthMm = purchaseLine.lengthMm;
  const widthMm = purchaseLine.widthMm;
  const thicknessMm = Number(purchaseLine.thicknessMm ?? 0);
  const plannedQty =
    Number(purchaseLine.qtyPlanned ?? 0) || Number(purchaseLine.quantity ?? 0);
  const lineKg = Number(purchaseLine.kgPurchased ?? 0);
  const pieceKg =
    plannedQty > 0 && lineKg > 0
      ? lineKg / plannedQty
      : // 🔑 The parcel's own measurements, not the article's nominal ones. A
        // lot of nominal 1,50 mm plate that measures 1,44 weighs 35,325 kg, and
        // the reference weighs it from the 1,44. `productPieceWeightKg` would
        // return the stored per-piece figure and throw these away.
        (product
          ? lotPieceWeightKg(
              {
                weightTheoretical: product.weightTheoretical,
                theoreticalWeight: product.theoreticalWeight,
                weightUnit: product.weightUnit,
              },
              { lengthMm, widthMm, thicknessMm },
            )
          : null) ?? 0;
  // The scale beats the formula. Without one the plan's figure stands.
  const weighed = Number(params.weighedKg ?? 0);
  const weightKg = weighed > 0 ? weighed : pieceKg * quantity;

  const pricePerUnit = Number(purchaseLine.netPrice ?? 0);
  // A measure nobody can work out falls back to the piece, which is what the
  // line was charged by before any unit was recorded.
  const measure =
    priceMeasureFor(purchaseLine.priceUnit, {
      quantity,
      weightKg,
      lengthMm,
      widthMm,
      thicknessMm,
    }) ?? quantity;
  // What the receipt is worth to the ledger: the price actually agreed on the
  // purchase line. Confirmed on 21-9-2026 — the five mutation rows purchase
  // order 401141 produced read € 4.239,00 / € 5.298,75 / € 4.239,00 /
  // € 5.298,75 / € 2.119,50, and every one of them divides out to exactly
  // € 2.000,00 per tonne, the price on the line. The running balance closed on
  // it too: € 35.311,54 → € 56.506,54.
  const value = roundToCents(pricePerUnit * measure);

  // ⚠️ The LOT is valued differently, and we cannot yet reproduce it.
  //
  // Those same five lots carry `Valuation price` **2 058,8151**, not the
  // 2 000,00 that was paid — and the same 2 058,8151 appears on lots received
  // against a different purchase order in April 2025. So it is a price carried
  // by the product, which the reference calls **APP**, and the gap between it
  // and the paid price is what the two revaluation accounts are for.
  //
  // It is not FSP: order 102191's own profit panel prints `w.r.t. APP` at
  // € 2 058,82 and `w.r.t. FSP` at € 0,00 side by side for this product.
  //
  // We do derive an average purchase price per product already
  // (`lib/server/purchase-pricing.ts`), so valuing the lot that way is within
  // reach. What is missing is where the difference goes: receiving at the
  // carried price while paying another *creates* a revaluation, and which pair
  // of accounts takes it is unknown.
  //
  // A lot valued correctly with its revaluation unposted is a worse state than
  // one valued consistently, so the paid price stands until that is answered.
  // See PLANNED-CODE-CHANGES-6.md item 3 / O9 / O10.
  const unitCost = quantity > 0 ? value / quantity : 0;
  const stockUuid = generateUuid();

  // Every receipt gets an internal charge — the key a delivered sheet traces
  // back by. A typed one wins (imported history, a label already on the
  // bundle). Otherwise bundles unloaded on the same line share one, as the
  // reference's 82 multi-row charges do, and a new line takes the next number.
  const typedCharge = normaliseCharge(params.internalCharge);
  const [sameReceipt] =
    !typedCharge && params.warehouseWorkOrderLineUuid
      ? await tx
          .select({ internalCharge: Stock.internalCharge })
          .from(StockMovements)
          .innerJoin(Stock, eq(StockMovements.stockUuid, Stock.uuid))
          .where(
            and(
              eq(
                StockMovements.warehouseWorkOrderLineUuid,
                params.warehouseWorkOrderLineUuid,
              ),
              eq(StockMovements.reason, "warehouse_receipt"),
              sql`${Stock.internalCharge} IS NOT NULL`,
            ),
          )
          .limit(1)
      : [];
  const year = new Date().getFullYear();
  const [lastOfYear] =
    typedCharge || sameReceipt?.internalCharge
      ? []
      : await tx
          .select({
            charge: sql<string | null>`MAX(${Stock.internalCharge})`,
          })
          .from(Stock)
          .where(
            sql`${Stock.internalCharge} REGEXP ${`^${String(year % 100).padStart(2, "0")}[A-Z]{4}$`}`,
          );
  const internalCharge =
    typedCharge ??
    sameReceipt?.internalCharge ??
    nextInternalCharge(year, lastOfYear?.charge ?? null);

  // The bundle's own number, which is not the charge above. Watched on
  // 21-9-2026: one lorry-load became five lots, all sharing internal charge
  // `26ADRC` and each taking the next number — 389823 … 389827. The charge
  // names the receipt; this names the lot.
  //
  // A typed one wins, for imported history and for bundles that arrive already
  // labelled. Otherwise the series continues.
  const [lastBatch] = params.internalBatch
    ? []
    : await tx
        .select({
          batch: sql<string | null>`MAX(CAST(${Stock.internalBatch} AS UNSIGNED))`,
        })
        .from(Stock)
        .where(sql`${Stock.internalBatch} REGEXP '^[0-9]+$'`);
  const internalBatch =
    params.internalBatch ?? nextInternalBatch(lastBatch?.batch ?? null);

  await tx.insert(Stock).values({
    uuid: stockUuid,
    productUuid: params.productUuid,
    purchaseOrderUuid: purchaseLine.purchaseOrderUuid,
    purchaseOrderItemUuid: purchaseLine.uuid,
    supplierUuid: params.companyUuid,
    locationUuid: params.toLocationUuid,
    quantity: quantity.toFixed(STOCK_QUANTITY_SCALE),
    quantityKg: weightKg.toFixed(STOCK_QUANTITY_SCALE),
    status: "pending",
    // Folded through the sentinels: `nvt`, `ntv` and `-` are all how somebody
    // wrote "no heat number", and a lot must not end up traceable to a heat
    // called "ntv".
    charge: normaliseCharge(params.charge),
    internalCharge,
    internalBatch,
    receiptDate: todayDateString(),
    valuationPrice: unitCostString(unitCost),
    valuationEuro: moneyString(value),
  });

  await tx
    .update(PurchaseOrderItems)
    .set({
      qtyReceived: sql`${PurchaseOrderItems.qtyReceived} + ${quantity.toFixed(3)}`,
    })
    .where(eq(PurchaseOrderItems.uuid, purchaseLine.uuid));

  await refreshPurchaseLineStatus(tx, purchaseLine.uuid);

  // The unloading is the moment goods arrive, so it completes the reception.
  const receivalUuid = await recordPurchaseLineReceipt(tx, {
    purchaseOrderItemUuid: purchaseLine.uuid,
    quantity,
    kg: weightKg,
    date: todayDateString(),
  });

  // And it is where the batch is born: the reference writes a Batches row for
  // every receipt, carrying the heat and internal charge the lot now holds.
  const batchUuid = await registerBatchForLot(tx, stockUuid, {
    purchaseLineReceivalUuid: receivalUuid,
    date: todayDateString(),
  });

  // The documents the supplier sent ahead — entered on the order's `Product
  // Receipt Documents` before there was a batch to hang them on (C19) — now
  // have one: those for this reception, or for the line with no reception.
  if (batchUuid) {
    await tx
      .update(BatchCertificates)
      .set({ batchUuid })
      .where(
        and(
          isNull(BatchCertificates.batchUuid),
          eq(BatchCertificates.purchaseOrderItemUuid, purchaseLine.uuid),
          or(
            isNull(BatchCertificates.purchaseLineReceivalUuid),
            eq(BatchCertificates.purchaseLineReceivalUuid, receivalUuid ?? ""),
          ),
        ),
      );
  }

  // 🔴 Goods bought for a sale arrive already sold. Lot `404744` was born
  // reserved 41 of 41 to `O108183/10`, the line `404299` was raised for
  // (C3, 8-10-2026), so the `CD` lines this purchase line covers take the lot
  // now, and their cost becomes what was paid for it (C11).
  await reserveReceiptToCoveredSalesLines(
    tx,
    purchaseLine.uuid,
    { stockUuid, quantity, value, unit: purchaseLine.unit },
    null,
  );

  await tx.insert(StockMovements).values({
    uuid: generateUuid(),
    productUuid: params.productUuid,
    stockUuid,
    type: "in",
    reason: "warehouse_receipt",
    quantity: quantity.toFixed(3),
    purchaseOrderUuid: purchaseLine.purchaseOrderUuid,
    warehouseWorkOrderLineUuid: params.warehouseWorkOrderLineUuid,
    createdByUserId: params.userId,
  });

  await recordFreightMovement(tx, {
    productUuid: params.productUuid,
    quantity: quantity.toFixed(3),
    type: "in",
    reason: "warehouse_receipt",
    purchaseOrderUuid: purchaseLine.purchaseOrderUuid,
    supplierUuid: params.companyUuid,
    valuationPrice: unitCostString(unitCost),
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

