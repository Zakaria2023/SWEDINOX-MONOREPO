"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import {
  CompanyAddresses,
  SelectCompanyAddresses,
} from "@/db/schema/company-addresses";
import { Complaints, SelectComplaints } from "@/db/schema/complaints";
import {
  PurchaseLineReceivals,
  SelectPurchaseLineReceivals,
} from "@/db/schema/purchase-line-receivals";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import {
  InsertPurchaseReturnOrders,
  InsertPurchaseReturnOrderSurcharges,
  PurchaseReturnOrders,
  PurchaseReturnOrderSurcharges,
  SelectPurchaseReturnOrders,
  SelectPurchaseReturnOrderSurcharges,
} from "@/db/schema/purchase-return-orders";
import {
  PurchaseReturnOrderItems,
  SelectPurchaseReturnOrderItems,
} from "@/db/schema/purchase-return-order-items";
import {
  PurchaseOrderItems,
  SelectPurchaseOrderItems,
} from "@/db/schema/purchase-order-items";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { PurchaseInvoiceItems } from "@/db/schema/purchase-invoice-items";
import {
  PurchaseInvoices,
  SelectPurchaseInvoices,
} from "@/db/schema/purchase-invoices";
import { JournalEntries } from "@/db/schema/journal-entries";
import { Products, SelectProducts } from "@/db/schema/products";
import { SelectStock, Stock } from "@/db/schema/stock";
import { StockMovements } from "@/db/schema/stock-movements";
import { SelectTexts } from "@/db/schema/texts";
import { InsertTexts, Texts } from "@/db/schema/texts";
import { PurchaseReturnOrderReason } from "@/lib/enums";
import {
  amountForWeight,
  defaultTransportModeFor,
  describeError,
  generateUuid,
  getPaymentTermDueDate,
  isPurchaseReturnOrderEditable,
  moneyString,
  restateLotValue,
  summarisePurchaseInvoice,
  toDateString,
  todayDateString,
  STOCK_QUANTITY_SCALE,
} from "@/lib/helpers";
import { recordFreightMovement } from "@/lib/server/freight";
import {
  buildInventoryMovementEntry,
  buildPurchaseJournalEntry,
  LEDGER_ACCOUNTS,
} from "@/lib/server/ledger";
import { currentUser } from "@clerk/nextjs/server";
import { and, asc, desc, eq, getTableColumns, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type PurchaseReturnOrderFields = Omit<
  InsertPurchaseReturnOrders,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type PurchaseReturnOrderSurchargeInput = Omit<
  InsertPurchaseReturnOrderSurcharges,
  "id" | "uuid" | "purchaseReturnOrderUuid" | "createdAt" | "updatedAt"
>;

export type PurchaseReturnOrderTextInput = Pick<
  InsertTexts,
  "title" | "textBlock" | "textCategoryUuid"
>;

export type PurchaseReturnOrderExtras = {
  surcharges: PurchaseReturnOrderSurchargeInput[];
  texts: PurchaseReturnOrderTextInput[];
};

export type PurchaseReturnOrderActionResult = {
  purchaseReturnOrderUuid?: string;
  error?: string;
  success?: boolean;
};

export type PurchaseReturnOrderListItem = SelectPurchaseReturnOrders & {
  supplierName: SelectCompanies["companyName"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
};

// Which received line is going back, and how much of it.
export type PurchaseReturnOrderItemInput = {
  purchaseOrderItemUuid: string;
  /**
   * The lot going back. A line received in three parcels has three lots, and
   * the reference's return picker offers each parcel on its own row
   * (`Create Purchase Return order lines`, 7-10-2026). Without it the line's
   * first lot is taken.
   */
  stockUuid?: string;
  returnQty: string;
  returnReason?: PurchaseReturnOrderReason | null;
};

// A received purchase line that could go back: what we paid, which lot it sits
// in, and how much of it is still both unreturned and physically on the shelf.
export type ReturnablePurchaseLine = {
  purchaseOrderItemUuid: SelectPurchaseOrderItems["uuid"];
  purchaseOrderUuid: SelectPurchaseOrderItems["purchaseOrderUuid"];
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  lineNumber: SelectPurchaseOrderItems["lineNumber"];
  productUuid: SelectPurchaseOrderItems["productUuid"];
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  unit: SelectPurchaseOrderItems["unit"];
  receivedQuantity: SelectPurchaseOrderItems["qtyReceived"];
  plannedQuantity: SelectPurchaseOrderItems["qtyPlanned"];
  kgPurchased: SelectPurchaseOrderItems["kgPurchased"];
  netPrice: SelectPurchaseOrderItems["netPrice"];
  priceUnit: SelectPurchaseOrderItems["priceUnit"];
  stockUuid: SelectStock["uuid"] | null;
  // The parcel's own identity, as the reference's picker prints it: the heat
  // it came in under and the day it arrived.
  charge: SelectStock["charge"] | null;
  receiptDate: SelectStock["receiptDate"] | null;
  // The rest of the reference picker's columns: the bill of lading the
  // parcel arrived on and the lot's own dimensions.
  billOfLading: SelectPurchaseLineReceivals["billOfLading"] | null;
  lengthMm: SelectStock["lengthMm"] | null;
  widthMm: SelectStock["widthMm"] | null;
  // Quantity − reserved on that lot − already on an open return: what can
  // physically leave today.
  availableQuantity: string;
};

export type PurchaseReturnOrderLineDetail = SelectPurchaseReturnOrderItems & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  // The price build-up of the purchase line the goods came in on — the
  // reference's Gross price, Line discount and Group discount columns.
  grossPrice: SelectPurchaseOrderItems["grossPrice"] | null;
  lineDiscountPercent: SelectPurchaseOrderItems["lineDiscountPercent"] | null;
  groupDiscountPercent: SelectPurchaseOrderItems["groupDiscountPercent"] | null;
  lotLengthMm: SelectStock["lengthMm"] | null;
};

export type PurchaseReturnOrderDetail = SelectPurchaseReturnOrders & {
  supplierName: SelectCompanies["companyName"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
  originalPurchaseOrderId: SelectPurchaseOrders["id"] | null;
  deliveryStreetAndNo: SelectCompanyAddresses["streetAndNo"] | null;
  deliveryPostalCode: SelectCompanyAddresses["postalCode"] | null;
  deliveryCity: SelectCompanyAddresses["city"] | null;
  complaintId: SelectComplaints["id"] | null;
  complaintStatus: SelectComplaints["status"] | null;
  complaintReportDate: SelectComplaints["reportDate"] | null;
  complaintDescription: SelectComplaints["description"] | null;
  items: PurchaseReturnOrderLineDetail[];
  surcharges: SelectPurchaseReturnOrderSurcharges[];
  texts: SelectTexts[];
  // The supplier credit notes raised against this return.
  credits: SelectPurchaseInvoices[];
};

export const getPurchaseReturnOrders = async (): Promise<
  PurchaseReturnOrderListItem[]
> => {
  try {
    const rows = await db
      .select({
        ...getTableColumns(PurchaseReturnOrders),
        supplierName: Companies.companyName,
        contactFirstName: Contacts.firstName,
        contactLastName: Contacts.lastName,
      })
      .from(PurchaseReturnOrders)
      .leftJoin(
        Companies,
        eq(PurchaseReturnOrders.supplierUuid, Companies.uuid),
      )
      .leftJoin(Contacts, eq(PurchaseReturnOrders.contactUuid, Contacts.uuid))
      .orderBy(desc(PurchaseReturnOrders.createdAt));
    return rows;
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch purchase return orders"),
    );
  }
};

/**
 * The lots that could go back to a supplier — one row per parcel received.
 *
 * 🔴 Rewritten 7-10-2026. This used to reach the lot through a purchase
 * *invoice* line, matched on product alone — a leftover from when invoicing
 * created stock. Since the unloading work order became what creates a lot,
 * goods that had arrived but were not yet billed could not be returned at
 * all, though the reference returns them (404102's 8-9 delivery went back
 * before it was invoiced). Now: every lot whose `purchaseOrderItemUuid` is a
 * received line of this supplier, optionally of one order.
 *
 * What may go is what is on the shelf and unreserved, less whatever already
 * sits on a return that has not left yet — a return that has gone has already
 * taken its quantity off the lot.
 */
export const getReturnablePurchaseLines = async (
  supplierUuid: string,
  purchaseOrderUuid?: string,
): Promise<ReturnablePurchaseLine[]> => {
  const rows = await db
    .select({
      purchaseOrderItemUuid: PurchaseOrderItems.uuid,
      purchaseOrderUuid: PurchaseOrderItems.purchaseOrderUuid,
      purchaseOrderId: PurchaseOrders.id,
      lineNumber: PurchaseOrderItems.lineNumber,
      productUuid: PurchaseOrderItems.productUuid,
      productCode: Products.productCode,
      productName: Products.name,
      unit: PurchaseOrderItems.unit,
      receivedQuantity: PurchaseOrderItems.qtyReceived,
      plannedQuantity: PurchaseOrderItems.qtyPlanned,
      kgPurchased: PurchaseOrderItems.kgPurchased,
      netPrice: PurchaseOrderItems.netPrice,
      priceUnit: PurchaseOrderItems.priceUnit,
      stockUuid: Stock.uuid,
      stockQuantity: Stock.quantity,
      stockReserved: Stock.reservedQuantity,
      charge: Stock.charge,
      receiptDate: Stock.receiptDate,
      lengthMm: Stock.lengthMm,
      widthMm: Stock.widthMm,
      // A lot does not name the reception it came from, so the bill of lading
      // is the one on this line's reception of the same day, else its latest.
      billOfLading: sql<SelectPurchaseLineReceivals["billOfLading"]>`(
        SELECT ${PurchaseLineReceivals.billOfLading}
        FROM ${PurchaseLineReceivals}
        WHERE ${PurchaseLineReceivals.purchaseOrderItemUuid} = ${PurchaseOrderItems.uuid}
          AND ${PurchaseLineReceivals.billOfLading} IS NOT NULL
          AND ${PurchaseLineReceivals.billOfLading} <> ''
        ORDER BY (${PurchaseLineReceivals.receiptDate} <=> ${Stock.receiptDate}) DESC,
          ${PurchaseLineReceivals.receiptDate} DESC
        LIMIT 1
      )`,
    })
    .from(Stock)
    .innerJoin(
      PurchaseOrderItems,
      eq(Stock.purchaseOrderItemUuid, PurchaseOrderItems.uuid),
    )
    .innerJoin(
      PurchaseOrders,
      eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
    )
    .leftJoin(Products, eq(PurchaseOrderItems.productUuid, Products.uuid))
    .where(
      and(
        eq(PurchaseOrders.supplierUuid, supplierUuid),
        purchaseOrderUuid
          ? eq(PurchaseOrders.uuid, purchaseOrderUuid)
          : undefined,
        sql`${PurchaseOrderItems.qtyReceived} > 0`,
      ),
    )
    .orderBy(desc(Stock.receiptDate), PurchaseOrderItems.lineNumber);

  // What is already on a return that has not gone yet, per lot.
  const pending = await db
    .select({
      stockUuid: PurchaseReturnOrderItems.stockUuid,
      quantity: sql<string>`COALESCE(SUM(${PurchaseReturnOrderItems.returnQty}), 0)`,
    })
    .from(PurchaseReturnOrderItems)
    .innerJoin(
      PurchaseReturnOrders,
      eq(
        PurchaseReturnOrderItems.purchaseReturnOrderUuid,
        PurchaseReturnOrders.uuid,
      ),
    )
    .where(inArray(PurchaseReturnOrders.status, ["provisional", "released"]))
    .groupBy(PurchaseReturnOrderItems.stockUuid);

  const pendingByLot = new Map(
    pending.map((row) => [row.stockUuid, Number(row.quantity)]),
  );

  return rows.flatMap((row) => {
    const onShelf =
      Number(row.stockQuantity ?? 0) - Number(row.stockReserved ?? 0);
    const available = onShelf - (pendingByLot.get(row.stockUuid) ?? 0);

    if (available <= 0) {
      return [];
    }

    return [
      {
        purchaseOrderItemUuid: row.purchaseOrderItemUuid,
        purchaseOrderUuid: row.purchaseOrderUuid,
        purchaseOrderId: row.purchaseOrderId,
        lineNumber: row.lineNumber,
        productUuid: row.productUuid,
        productCode: row.productCode,
        productName: row.productName,
        unit: row.unit,
        receivedQuantity: row.receivedQuantity,
        plannedQuantity: row.plannedQuantity,
        kgPurchased: row.kgPurchased,
        netPrice: row.netPrice,
        priceUnit: row.priceUnit,
        stockUuid: row.stockUuid,
        charge: row.charge,
        receiptDate: row.receiptDate,
        billOfLading: row.billOfLading,
        lengthMm: row.lengthMm,
        widthMm: row.widthMm,
        availableQuantity: available.toFixed(3),
      },
    ];
  });
};

type ReturnLineWriter = Pick<typeof db, "select" | "insert">;

type ReturnLinesToInsert = {
  purchaseReturnOrderUuid: string;
  lines: Array<{
    line: ReturnablePurchaseLine;
    returnQty: number;
    returnReason: PurchaseReturnOrderReason | null;
  }>;
  returnDate: Date | string | null;
  /** The number the first new line takes; lines are numbered after it. */
  firstLineNumber: number;
};

/**
 * Write return lines against the lots they take back. Shared by creating a
 * return with its lines and by adding lines to a provisional one.
 */
const insertPurchaseReturnLines = async (
  tx: ReturnLineWriter,
  { purchaseReturnOrderUuid, lines, returnDate, firstLineNumber }: ReturnLinesToInsert,
): Promise<void> => {
  for (const [index, { line, returnQty, returnReason }] of lines.entries()) {
    const netPrice = Number(line.netPrice ?? 0);

    // Only part of a line usually goes back, so the weight returned is the
    // line's weight scaled to the quantity going with it. Money follows
    // the weight, because the price is struck per tonne.
    const plannedQty = Number(line.plannedQuantity ?? 0);
    const returnedWeightKg =
      plannedQty > 0
        ? Number(line.kgPurchased ?? 0) * (returnQty / plannedQty)
        : 0;

    await tx.insert(PurchaseReturnOrderItems).values({
      uuid: generateUuid(),
      purchaseReturnOrderUuid,
      productUuid: line.productUuid,
      originalPurchaseOrderUuid: line.purchaseOrderUuid,
      originalPurchaseOrderLine: line.lineNumber,
      originalPurchaseOrderItemUuid: line.purchaseOrderItemUuid,
      stockUuid: line.stockUuid,
      lineNumber: firstLineNumber + index,
      reference:
        line.purchaseOrderId != null ? String(line.purchaseOrderId) : null,
      unit: line.unit,
      quantity: line.receivedQuantity,
      returnQty: returnQty.toFixed(3),
      returnReason,
      netPrice: netPrice.toFixed(4),
      priceUnit: line.priceUnit,
      weightKg: returnedWeightKg.toFixed(2),
      amount: moneyString(
        amountForWeight(netPrice, line.priceUnit, returnedWeightKg, {
          quantity: returnQty,
        }),
      ),
      returnDate: returnDate
        ? toDateString(new Date(returnDate))
        : todayDateString(),
    });
  }
};

const buildPurchaseReturnSummary = async (
  tx: Pick<typeof db, "select">,
  purchaseReturnOrderUuid: string,
) => {
  const [lines, surcharges] = await Promise.all([
    tx
      .select({
        amount: PurchaseReturnOrderItems.amount,
        weightKg: PurchaseReturnOrderItems.weightKg,
        // The VAT band the goods were received under, so this panel reports
        // the same figure as the credit note it will produce.
        vatCode: PurchaseInvoiceItems.vatCode,
      })
      .from(PurchaseReturnOrderItems)
      .leftJoin(
        PurchaseInvoiceItems,
        eq(
          PurchaseInvoiceItems.purchaseOrderItemUuid,
          PurchaseReturnOrderItems.originalPurchaseOrderItemUuid,
        ),
      )
      .where(
        eq(
          PurchaseReturnOrderItems.purchaseReturnOrderUuid,
          purchaseReturnOrderUuid,
        ),
      ),
    tx
      .select({ amount: PurchaseReturnOrderSurcharges.amount })
      .from(PurchaseReturnOrderSurcharges)
      .where(
        eq(
          PurchaseReturnOrderSurcharges.purchaseReturnOrderUuid,
          purchaseReturnOrderUuid,
        ),
      ),
  ]);

  // Positive here — this panel states what is going back, not the reversal.
  // The credit note negates the same figures.
  const summary = summarisePurchaseInvoice({
    lines: lines.map((line) => ({
      amount: Number(line.amount ?? 0),
      vatCode: line.vatCode,
    })),
    surcharges: surcharges.map((row) => Number(row.amount ?? 0)),
    creditRestriction: 0,
    invoiceTotal: 0,
  });

  const totalWeightKg = lines.reduce(
    (sum, line) => sum + Number(line.weightKg ?? 0),
    0,
  );

  return {
    materialsRevenue: moneyString(summary.materials),
    optionsRevenue: moneyString(summary.optionsAmount),
    surchargesRevenue: moneyString(summary.surcharges),
    totalExclVat: moneyString(summary.totalExclVat),
    vatAmount: moneyString(summary.vatTotal),
    totalInclVat: moneyString(summary.totalInclVat),
    totalWeightKg: totalWeightKg.toFixed(2),
  };
};

export const getPurchaseReturnOrderDetail = async (
  uuid: string,
): Promise<PurchaseReturnOrderDetail | null> => {
  const [returnOrder] = await db
    .select({
      ...getTableColumns(PurchaseReturnOrders),
      supplierName: Companies.companyName,
      contactFirstName: Contacts.firstName,
      contactLastName: Contacts.lastName,
      originalPurchaseOrderId: PurchaseOrders.id,
      deliveryStreetAndNo: CompanyAddresses.streetAndNo,
      deliveryPostalCode: CompanyAddresses.postalCode,
      deliveryCity: CompanyAddresses.city,
      complaintId: Complaints.id,
      complaintStatus: Complaints.status,
      complaintReportDate: Complaints.reportDate,
      complaintDescription: Complaints.description,
    })
    .from(PurchaseReturnOrders)
    .leftJoin(Companies, eq(PurchaseReturnOrders.supplierUuid, Companies.uuid))
    .leftJoin(Contacts, eq(PurchaseReturnOrders.contactUuid, Contacts.uuid))
    .leftJoin(
      PurchaseOrders,
      eq(PurchaseReturnOrders.purchaseOrderUuid, PurchaseOrders.uuid),
    )
    .leftJoin(
      CompanyAddresses,
      eq(PurchaseReturnOrders.deliveryAddressUuid, CompanyAddresses.uuid),
    )
    .leftJoin(Complaints, eq(PurchaseReturnOrders.complaintUuid, Complaints.uuid))
    .where(eq(PurchaseReturnOrders.uuid, uuid))
    .limit(1);

  if (!returnOrder) {
    return null;
  }

  const [items, surcharges, texts, credits] = await Promise.all([
    db
      .select({
        ...getTableColumns(PurchaseReturnOrderItems),
        productCode: Products.productCode,
        productName: Products.name,
        grossPrice: PurchaseOrderItems.grossPrice,
        lineDiscountPercent: PurchaseOrderItems.lineDiscountPercent,
        groupDiscountPercent: PurchaseOrderItems.groupDiscountPercent,
        lotLengthMm: Stock.lengthMm,
      })
      .from(PurchaseReturnOrderItems)
      .leftJoin(
        Products,
        eq(PurchaseReturnOrderItems.productUuid, Products.uuid),
      )
      .leftJoin(
        PurchaseOrderItems,
        eq(
          PurchaseReturnOrderItems.originalPurchaseOrderItemUuid,
          PurchaseOrderItems.uuid,
        ),
      )
      .leftJoin(Stock, eq(PurchaseReturnOrderItems.stockUuid, Stock.uuid))
      .where(eq(PurchaseReturnOrderItems.purchaseReturnOrderUuid, uuid))
      .orderBy(PurchaseReturnOrderItems.lineNumber),

    db
      .select()
      .from(PurchaseReturnOrderSurcharges)
      .where(eq(PurchaseReturnOrderSurcharges.purchaseReturnOrderUuid, uuid)),

    db.select().from(Texts).where(eq(Texts.purchaseReturnOrderUuid, uuid)),

    db
      .select()
      .from(PurchaseInvoices)
      .where(eq(PurchaseInvoices.purchaseReturnOrderUuid, uuid))
      .orderBy(desc(PurchaseInvoices.createdAt)),
  ]);

  return { ...returnOrder, items, surcharges, texts, credits };
};

/**
 * Sends the goods back: stock leaves the lot it arrived in and the return is
 * marked processed.
 *
 * The mirror of receiving a sales return. Stock is drawn out of the exact lot
 * the purchase receipt created, so the quantity and the valuation reverse
 * together and the lot's history reads as one story.
 */
export const dispatchPurchaseReturnOrder = async (
  uuid: string,
): Promise<PurchaseReturnOrderActionResult> => {
  try {
    const [returnOrder] = await db
      .select({
        id: PurchaseReturnOrders.id,
        status: PurchaseReturnOrders.status,
        supplierUuid: PurchaseReturnOrders.supplierUuid,
      })
      .from(PurchaseReturnOrders)
      .where(eq(PurchaseReturnOrders.uuid, uuid))
      .limit(1);

    if (!returnOrder) {
      return { error: "Purchase return order not found." };
    }
    if (
      returnOrder.status === "delivered" ||
      returnOrder.status === "invoiced"
    ) {
      return { error: "These goods have already been sent back." };
    }
    if (returnOrder.status === "cancelled") {
      return { error: "This return was cancelled." };
    }

    const items = await db
      .select()
      .from(PurchaseReturnOrderItems)
      .where(eq(PurchaseReturnOrderItems.purchaseReturnOrderUuid, uuid));

    if (items.length === 0) {
      return { error: "This return has no lines to send back." };
    }

    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return { error: "User not authenticated" };
    }

    await db.transaction(async (tx) => {
      const [claimed] = await tx
        .update(PurchaseReturnOrders)
        .set({ status: "delivered", returnDate: new Date() })
        .where(
          and(
            eq(PurchaseReturnOrders.uuid, uuid),
            inArray(PurchaseReturnOrders.status, ["provisional", "released"]),
          ),
        );

      if (claimed.affectedRows === 0) {
        throw new Error(
          "This return was already sent back — please refresh and try again.",
        );
      }

      for (const item of items) {
        if (!item.stockUuid) {
          continue;
        }

        const [stockRow] = await tx
          .select()
          .from(Stock)
          .where(eq(Stock.uuid, item.stockUuid))
          .limit(1);

        if (!stockRow) {
          continue;
        }

        const returned = Number(item.returnQty ?? 0);
        const free =
          Number(stockRow.quantity) - Number(stockRow.reservedQuantity);

        // Reserved goods are promised to a customer; they can't be sent back to
        // the supplier without breaking that promise.
        if (returned > free) {
          throw new Error(
            `Only ${free.toFixed(3)} of this lot is free to return — the rest is reserved for a customer.`,
          );
        }

        const nextQuantity = (Number(stockRow.quantity) - returned).toFixed(
          STOCK_QUANTITY_SCALE,
        );

        // Material leaving for the supplier takes its value with it. Reducing
        // the quantity alone left the rest of the lot carrying the value of
        // goods that had gone back, so every purchase return overstated stock.
        const previousValue = Number(stockRow.valuationEuro ?? 0);
        const nextValue = restateLotValue({
          previousQuantity: Number(stockRow.quantity),
          remainingQuantity: Number(nextQuantity),
          unitCost: Number(stockRow.valuationPrice ?? 0),
          previousValue,
        });

        const [stockUpdate] = await tx
          .update(Stock)
          .set({
            quantity: nextQuantity,
            valuationEuro: moneyString(nextValue),
            status: Number(nextQuantity) > 0 ? "pending" : "received",
          })
          .where(
            and(
              eq(Stock.uuid, item.stockUuid),
              eq(Stock.quantity, stockRow.quantity),
            ),
          );

        if (stockUpdate.affectedRows === 0) {
          throw new Error(
            "Stock changed while sending the return — please refresh and try again.",
          );
        }

        await tx.insert(StockMovements).values({
          uuid: generateUuid(),
          productUuid: stockRow.productUuid,
          stockUuid: item.stockUuid,
          type: "out",
          reason: "purchase_return",
          quantity: item.returnQty ?? "0.000",
          purchaseOrderUuid: item.originalPurchaseOrderUuid,
          createdByUserId: userId,
        });

        await recordFreightMovement(tx, {
          productUuid: stockRow.productUuid,
          quantity: item.returnQty ?? "0.000",
          type: "out",
          reason: "purchase_return",
          purchaseOrderUuid: item.originalPurchaseOrderUuid,
          operator: userId,
        });

        // The goods are gone but the supplier has not credited them yet, so
        // what they owe us for them is held until their credit note arrives.
        const valueOut = previousValue - nextValue;

        if (Math.abs(valueOut) >= 0.005) {
          await tx.insert(JournalEntries).values(
            buildInventoryMovementEntry({
              bookingDate: todayDateString(),
              documentNo: String(returnOrder.id),
              description: "Goods returned to supplier",
              companyUuid: returnOrder.supplierUuid,
              debCreditor: null,
              inventoryValue: -valueOut,
              counterAccount: LEDGER_ACCOUNTS.goodsReturnedNotCredited,
              reference: `Purchase return line ${item.uuid}`,
              userId,
            }),
          );
        }
      }
    });

    revalidatePath("/purchase-return-orders");
    revalidatePath(`/purchase-return-orders/${uuid}`);
    return { success: true, purchaseReturnOrderUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to send the purchase return back",
    };
  }
};

/**
 * Books the supplier's credit note for goods sent back.
 *
 * The mirror of crediting a sales return: a PurchaseInvoices row with its
 * amounts negated, so the negative `outstanding` nets down what we owe the
 * supplier and the purchase journal reverses the cost that was booked when the
 * goods arrived.
 */
export const creditPurchaseReturnOrder = async (
  uuid: string,
): Promise<PurchaseReturnOrderActionResult> => {
  const creditNoteUuid = generateUuid();
  try {
    const [returnOrder] = await db
      .select()
      .from(PurchaseReturnOrders)
      .where(eq(PurchaseReturnOrders.uuid, uuid))
      .limit(1);

    if (!returnOrder) {
      return { error: "Purchase return order not found." };
    }
    if (returnOrder.status === "invoiced") {
      return { error: "This return has already been credited." };
    }
    if (returnOrder.status !== "delivered") {
      return {
        error: "Send the goods back before booking the supplier's credit note.",
      };
    }

    const items = await db
      .select()
      .from(PurchaseReturnOrderItems)
      .where(eq(PurchaseReturnOrderItems.purchaseReturnOrderUuid, uuid));

    if (items.length === 0) {
      return { error: "This return has no lines to credit." };
    }

    const surchargeRows = await db
      .select({ amount: PurchaseReturnOrderSurcharges.amount })
      .from(PurchaseReturnOrderSurcharges)
      .where(eq(PurchaseReturnOrderSurcharges.purchaseReturnOrderUuid, uuid));

    // The VAT band each line was received under. Read from the purchase
    // invoice that booked it rather than from the product as it stands today,
    // so the credit reverses the band actually charged — recoding a product
    // afterwards must not move an old receipt into a different VAT box.
    const orderItemUuids = items.flatMap((item) =>
      item.originalPurchaseOrderItemUuid
        ? [item.originalPurchaseOrderItemUuid]
        : [],
    );

    const bookedRows =
      orderItemUuids.length > 0
        ? await db
            .select({
              purchaseOrderItemUuid: PurchaseInvoiceItems.purchaseOrderItemUuid,
              vatCode: PurchaseInvoiceItems.vatCode,
            })
            .from(PurchaseInvoiceItems)
            .where(
              inArray(
                PurchaseInvoiceItems.purchaseOrderItemUuid,
                orderItemUuids,
              ),
            )
        : [];

    const vatCodeByOrderItem = new Map(
      bookedRows.map((row) => [row.purchaseOrderItemUuid, row.vatCode]),
    );

    // Negative throughout: the same summary the invoice uses, reversed. No
    // supplier total is keyed here — we raise this document ourselves from the
    // goods sent back — so the build-up stands on its own and nothing is left
    // unexplained.
    const summary = summarisePurchaseInvoice({
      lines: items.map((item) => ({
        amount: -Number(item.amount ?? 0),
        vatCode: item.originalPurchaseOrderItemUuid
          ? (vatCodeByOrderItem.get(item.originalPurchaseOrderItemUuid) ?? null)
          : null,
      })),
      surcharges: surchargeRows.map((row) => -Number(row.amount ?? 0)),
      creditRestriction: 0,
      invoiceTotal: 0,
    });

    const user = await currentUser();
    const userId = user?.id ?? null;

    const dueDate = getPaymentTermDueDate(
      returnOrder.paymentTerms ?? null,
      toDateString(new Date()),
    );

    await db.transaction(async (tx) => {
      const [claimed] = await tx
        .update(PurchaseReturnOrders)
        .set({ status: "invoiced" })
        .where(
          and(
            eq(PurchaseReturnOrders.uuid, uuid),
            eq(PurchaseReturnOrders.status, "delivered"),
          ),
        );

      if (claimed.affectedRows === 0) {
        throw new Error(
          "This return was already credited — please refresh and try again.",
        );
      }

      await tx.insert(PurchaseInvoices).values({
        uuid: creditNoteUuid,
        documentType: "credit_note",
        purchaseReturnOrderUuid: uuid,
        companyUuid: returnOrder.supplierUuid,
        invoiceSentByContactUuid: returnOrder.contactUuid,
        bookingDate: new Date(),
        invoiceDate: new Date(),
        expirationDate: dueDate ? new Date(`${dueDate}T00:00:00`) : null,
        paymentTerms: returnOrder.paymentTerms,
        purchaseOrderNumber: returnOrder.purchaseOrderReference,
        materials: moneyString(summary.materials),
        optionsAmount: moneyString(summary.optionsAmount),
        surcharges: moneyString(summary.surcharges),
        // Reversed in the same three bands the goods were received under, so
        // the VAT return nets each rate off against itself.
        vatHigh: moneyString(summary.vatHigh),
        vatMiddle: moneyString(summary.vatMiddle),
        vatLow: moneyString(summary.vatLow),
        remainder: moneyString(summary.remainder),
        invoiceTotal: moneyString(summary.totalGeneral),
        // Negative: this reduces what we owe rather than adding to it.
        outstanding: moneyString(summary.totalGeneral),
        remarks: `Supplier credit note for purchase return ${returnOrder.id}`,
      });

      const [inserted] = await tx
        .select({ id: PurchaseInvoices.id })
        .from(PurchaseInvoices)
        .where(eq(PurchaseInvoices.uuid, creditNoteUuid))
        .limit(1);

      await tx.insert(JournalEntries).values(
        buildPurchaseJournalEntry({
          purchaseInvoiceUuid: creditNoteUuid,
          invoiceId: inserted?.id ?? null,
          companyUuid: returnOrder.supplierUuid,
          debCreditor: null,
          invoiceDate: new Date(),
          // Already negative, so this books as a reduction of cost without
          // needing the reversal flag.
          amountExclVat: summary.totalExclVat,
          vatAmount: summary.vatTotal,
          // The stock left the shelf when the goods were shipped back, so this
          // clears what the supplier owed us for them rather than removing the
          // same material from inventory a second time.
          inventoryValue: summary.materials,
          goodsAccount: LEDGER_ACCOUNTS.goodsReturnedNotCredited,
          userId,
          description: "Purchase credit note",
        }),
      );
    });

    revalidatePath("/purchase-return-orders");
    revalidatePath(`/purchase-return-orders/${uuid}`);
    revalidatePath("/purchase-invoices");
    return { success: true, purchaseReturnOrderUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to credit the purchase return",
    };
  }
};

/**
 * Changes the terms a return is going back on: header, surcharges and texts.
 *
 * The returned lines are not touched. They name the exact lot each item came
 * out of and the price it was received at, which is what dispatching reverses —
 * re-picking them is creating a different return, not editing this one.
 */
export const updatePurchaseReturnOrder = async (
  uuid: string,
  fields: PurchaseReturnOrderFields,
  extras: PurchaseReturnOrderExtras,
): Promise<PurchaseReturnOrderActionResult> => {
  try {
    const [returnOrder] = await db
      .select({ status: PurchaseReturnOrders.status })
      .from(PurchaseReturnOrders)
      .where(eq(PurchaseReturnOrders.uuid, uuid))
      .limit(1);

    if (!returnOrder) {
      return { error: "Purchase return order not found." };
    }
    if (!isPurchaseReturnOrderEditable(returnOrder.status)) {
      return {
        error:
          returnOrder.status === "cancelled"
            ? "This return order is cancelled."
            : "This return has already gone back to the supplier.",
      };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(PurchaseReturnOrders)
        .set(fields)
        .where(eq(PurchaseReturnOrders.uuid, uuid));

      await tx
        .delete(PurchaseReturnOrderSurcharges)
        .where(eq(PurchaseReturnOrderSurcharges.purchaseReturnOrderUuid, uuid));

      if (extras.surcharges.length > 0) {
        await tx.insert(PurchaseReturnOrderSurcharges).values(
          extras.surcharges.map((surcharge) => ({
            ...surcharge,
            uuid: generateUuid(),
            purchaseReturnOrderUuid: uuid,
          })),
        );
      }

      await tx.delete(Texts).where(eq(Texts.purchaseReturnOrderUuid, uuid));

      if (extras.texts.length > 0) {
        await tx.insert(Texts).values(
          extras.texts.map((text) => ({
            uuid: generateUuid(),
            purchaseReturnOrderUuid: uuid,
            companyUuid: fields.supplierUuid,
            title: text.title,
            textBlock: text.textBlock,
            textCategoryUuid: text.textCategoryUuid ?? null,
          })),
        );
      }

      // Surcharges are part of what the return is worth, so the stored totals
      // are rebuilt rather than left describing the old set.
      await tx
        .update(PurchaseReturnOrders)
        .set(await buildPurchaseReturnSummary(tx, uuid))
        .where(eq(PurchaseReturnOrders.uuid, uuid));
    });
  } catch (error) {
    return {
      error: describeError(error, "Failed to update purchase return order"),
    };
  }

  revalidatePath("/purchase-return-orders");
  revalidatePath(`/purchase-return-orders/${uuid}`);
  redirect(`/purchase-return-orders/${uuid}`);
};

export const createPurchaseReturnOrder = async (
  fields: PurchaseReturnOrderFields,
  extras: PurchaseReturnOrderExtras,
  items: PurchaseReturnOrderItemInput[] = [],
): Promise<PurchaseReturnOrderActionResult> => {
  const uuid = generateUuid();
  try {
    // Resolve what is going back before writing anything: the line has to be
    // one this supplier actually delivered, and still on the shelf.
    const returnable = await getReturnablePurchaseLines(fields.supplierUuid);
    const resolveLot = (item: PurchaseReturnOrderItemInput) =>
      returnable.find((line) =>
        item.stockUuid
          ? line.stockUuid === item.stockUuid
          : line.purchaseOrderItemUuid === item.purchaseOrderItemUuid,
      );

    for (const item of items) {
      const line = resolveLot(item);
      if (!line) {
        return {
          error:
            "One or more selected lines were not received from this supplier, or are no longer available to return.",
        };
      }
      const returnQty = Number(item.returnQty ?? 0);
      if (returnQty <= 0) {
        return { error: "Every returned line needs a quantity." };
      }
      if (returnQty > Number(line.availableQuantity)) {
        return {
          error: `Cannot return more than is still available (${Number(line.availableQuantity).toFixed(3)}).`,
        };
      }
    }

    await db.transaction(async (tx) => {
      await tx.insert(PurchaseReturnOrders).values({
        ...fields,
        uuid,
        // Where the goods are going back to decides how they travel: road within
        // Europe, sea to Asia and South America.
        transportMode:
          fields.transportMode ??
          defaultTransportModeFor(fields.transportRegion),
      });

      // Lines were previously dropped here, exactly as they were on the sales
      // side — which is why a purchase return could never move stock or money.
      await insertPurchaseReturnLines(tx, {
        purchaseReturnOrderUuid: uuid,
        lines: items.flatMap((item) => {
          const line = resolveLot(item);
          return line
            ? [
                {
                  line,
                  returnQty: Number(item.returnQty),
                  returnReason: item.returnReason ?? fields.returnReason ?? null,
                },
              ]
            : [];
        }),
        returnDate: fields.returnDate ?? null,
        firstLineNumber: 1,
      });

      if (extras.surcharges.length > 0) {
        await tx.insert(PurchaseReturnOrderSurcharges).values(
          extras.surcharges.map((surcharge) => ({
            ...surcharge,
            uuid: generateUuid(),
            purchaseReturnOrderUuid: uuid,
          })),
        );
      }

      if (extras.texts.length > 0) {
        await tx.insert(Texts).values(
          extras.texts.map((text) => ({
            uuid: generateUuid(),
            purchaseReturnOrderUuid: uuid,
            companyUuid: fields.supplierUuid,
            title: text.title,
            textBlock: text.textBlock,
            textCategoryUuid: text.textCategoryUuid ?? null,
          })),
        );
      }

      await tx
        .update(PurchaseReturnOrders)
        .set(await buildPurchaseReturnSummary(tx, uuid))
        .where(eq(PurchaseReturnOrders.uuid, uuid));
    });
    revalidatePath("/purchase-return-orders");
    return { success: true, purchaseReturnOrderUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create purchase return order",
    };
  }
};

/**
 * `Par. return` on a purchase order: open a provisional return against it.
 *
 * 🔑 Watched on `404102`, 7-10-2026. The button does not open a form — it
 * saves the return at once, `Provisional`, next in its own series, already
 * linked to the order, and with **no lines**. What it fills in:
 *
 * - the order's supplier, contact, payment terms and type
 * - **purchaser = whoever pressed it** (not the order's buyer)
 * - **return date = tomorrow**
 * - **pick-up = our yard** (the order's own delivery address) and delivery =
 *   the supplier's address
 *
 * Lines are added afterwards from `Create Purchase Return order lines`, one
 * per parcel received (`addPurchaseReturnLines`).
 *
 * - **a new complaint**, against the purchase order and the supplier, linked
 *   to the return (`40412` beside `950034`) — every return opens one
 */
export const startPurchaseReturnFromOrder = async (
  purchaseOrderUuid: string,
): Promise<PurchaseReturnOrderActionResult> => {
  const uuid = generateUuid();
  try {
    const user = await currentUser();
    if (!user?.id) {
      return { error: "User not authenticated" };
    }

    const [order] = await db
      .select({
        id: PurchaseOrders.id,
        supplierUuid: PurchaseOrders.supplierUuid,
        contactUuid: PurchaseOrders.contactUuid,
        paymentTerms: PurchaseOrders.paymentTerms,
        purchaseOrderType: PurchaseOrders.purchaseOrderType,
        deliveryAddressUuid: PurchaseOrders.deliveryAddressUuid,
        supplierAddressUuid: PurchaseOrders.supplierAddressUuid,
        status: PurchaseOrders.status,
      })
      .from(PurchaseOrders)
      .where(eq(PurchaseOrders.uuid, purchaseOrderUuid))
      .limit(1);

    if (!order) {
      return { error: "Purchase order not found." };
    }
    if (!order.supplierUuid) {
      return { error: "This purchase order names no supplier to return to." };
    }
    if (order.status === "cancelled") {
      return { error: "A cancelled purchase order cannot be returned against." };
    }

    const returnable = await getReturnablePurchaseLines(
      order.supplierUuid,
      purchaseOrderUuid,
    );
    if (returnable.length === 0) {
      return {
        error:
          "Nothing received on this order is still on the shelf to send back.",
      };
    }

    // Pick-up is our yard: the address the order delivered to.
    const [yard] = order.deliveryAddressUuid
      ? await db
          .select({
            streetAndNo: CompanyAddresses.streetAndNo,
            postalCode: CompanyAddresses.postalCode,
            city: CompanyAddresses.city,
          })
          .from(CompanyAddresses)
          .where(eq(CompanyAddresses.uuid, order.deliveryAddressUuid))
          .limit(1)
      : [];
    const pickupAddress = yard
      ? [yard.streetAndNo, [yard.postalCode, yard.city].filter(Boolean).join(" ")]
          .filter(Boolean)
          .join(", ") || null
      : null;

    // Delivery is the supplier's address. 404102 names none, yet its return
    // 950034 still went to `Am Rennfeuer 2, Ganderkesee` (8-10-2026): the
    // supplier's own first delivery or visiting address stands in.
    const supplierAddresses = order.supplierAddressUuid
      ? []
      : await db
          .select({
            uuid: CompanyAddresses.uuid,
            category: CompanyAddresses.category,
          })
          .from(CompanyAddresses)
          .where(eq(CompanyAddresses.companyUuid, order.supplierUuid))
          .orderBy(
            asc(CompanyAddresses.sequenceNumber),
            asc(CompanyAddresses.id),
          );
    const supplierAddressUuid =
      order.supplierAddressUuid ??
      supplierAddresses.find((address) =>
        address.category.some(
          (category) => category === "delivery" || category === "visit",
        ),
      )?.uuid ??
      null;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const supplierUuid = order.supplierUuid;
    const assignedByName =
      user.fullName ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.username ||
      "";

    await db.transaction(async (tx) => {
      const complaintUuid = generateUuid();
      await tx.insert(Complaints).values({
        uuid: complaintUuid,
        companyUuid: supplierUuid,
        contactUuid: order.contactUuid,
        complaintType: "purchase_order",
        purchaseOrderUuid,
        reportDate: new Date(),
        status: "new",
        statusHistory: [
          {
            status: "new",
            statusDate: new Date().toISOString(),
            assignedByUserId: user.id,
            assignedByName,
          },
        ],
        createdByUserId: user.id,
        modifiedByUserId: user.id,
      });
      const [complaint] = await tx
        .select({ id: Complaints.id })
        .from(Complaints)
        .where(eq(Complaints.uuid, complaintUuid))
        .limit(1);

      await tx.insert(PurchaseReturnOrders).values({
        uuid,
        supplierUuid,
        purchaseOrderUuid,
        purchaseOrderReference: String(order.id),
        complaintUuid,
        complaintRef: complaint ? String(complaint.id) : null,
        contactUuid: order.contactUuid,
        purchaser: user.id,
        paymentTerms: order.paymentTerms,
        purchaseOrderType: order.purchaseOrderType,
        status: "provisional",
        returnDate: tomorrow,
        isDropOff: false,
        deliveryAddressUuid: supplierAddressUuid,
        pickupAddress,
      });
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to start the purchase return",
    };
  }

  revalidatePath("/purchase-return-orders");
  revalidatePath("/complaints");
  revalidatePath(`/purchase-orders/${purchaseOrderUuid}`);
  redirect(`/purchase-return-orders/${uuid}`);
};

/** The lots a provisional return could still take, for its line picker. */
export const getReturnableLotsForReturn = async (
  purchaseReturnOrderUuid: string,
): Promise<ReturnablePurchaseLine[]> => {
  const [returnOrder] = await db
    .select({
      supplierUuid: PurchaseReturnOrders.supplierUuid,
      purchaseOrderUuid: PurchaseReturnOrders.purchaseOrderUuid,
    })
    .from(PurchaseReturnOrders)
    .where(eq(PurchaseReturnOrders.uuid, purchaseReturnOrderUuid))
    .limit(1);

  if (!returnOrder?.supplierUuid) {
    return [];
  }
  return getReturnablePurchaseLines(
    returnOrder.supplierUuid,
    returnOrder.purchaseOrderUuid ?? undefined,
  );
};

/**
 * `Lines → New` on a provisional return — the reference's `Create Purchase
 * Return order lines`: tick the parcels going back, each a lot of its own.
 */
export const addPurchaseReturnLines = async (
  purchaseReturnOrderUuid: string,
  items: Array<{ stockUuid: string; returnQty: string }>,
): Promise<PurchaseReturnOrderActionResult> => {
  try {
    if (items.length === 0) {
      return { error: "Tick at least one parcel to send back." };
    }

    const [returnOrder] = await db
      .select({
        status: PurchaseReturnOrders.status,
        returnDate: PurchaseReturnOrders.returnDate,
        returnReason: PurchaseReturnOrders.returnReason,
      })
      .from(PurchaseReturnOrders)
      .where(eq(PurchaseReturnOrders.uuid, purchaseReturnOrderUuid))
      .limit(1);

    if (!returnOrder) {
      return { error: "Purchase return order not found." };
    }
    if (!isPurchaseReturnOrderEditable(returnOrder.status)) {
      return { error: "Lines can only be added before the goods have gone." };
    }

    const returnable = await getReturnableLotsForReturn(purchaseReturnOrderUuid);
    const byLot = new Map(returnable.map((line) => [line.stockUuid, line]));

    const lines: ReturnLinesToInsert["lines"] = [];
    for (const item of items) {
      const line = byLot.get(item.stockUuid);
      if (!line) {
        return {
          error:
            "One of the ticked parcels is no longer available to send back — refresh and try again.",
        };
      }
      const returnQty = Number(item.returnQty);
      if (!(returnQty > 0)) {
        return { error: "Every ticked parcel needs a quantity." };
      }
      if (returnQty > Number(line.availableQuantity)) {
        return {
          error: `Cannot return more than is still available (${Number(line.availableQuantity).toFixed(3)}).`,
        };
      }
      lines.push({ line, returnQty, returnReason: returnOrder.returnReason });
    }

    const [{ last }] = await db
      .select({
        last: sql<number>`COALESCE(MAX(${PurchaseReturnOrderItems.lineNumber}), 0)`,
      })
      .from(PurchaseReturnOrderItems)
      .where(
        eq(
          PurchaseReturnOrderItems.purchaseReturnOrderUuid,
          purchaseReturnOrderUuid,
        ),
      );

    await db.transaction(async (tx) => {
      await insertPurchaseReturnLines(tx, {
        purchaseReturnOrderUuid,
        lines,
        returnDate: returnOrder.returnDate,
        firstLineNumber: Number(last) + 1,
      });

      await tx
        .update(PurchaseReturnOrders)
        .set(await buildPurchaseReturnSummary(tx, purchaseReturnOrderUuid))
        .where(eq(PurchaseReturnOrders.uuid, purchaseReturnOrderUuid));
    });

    revalidatePath(`/purchase-return-orders/${purchaseReturnOrderUuid}`);
    return { success: true, purchaseReturnOrderUuid };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to add return lines",
    };
  }
};

/**
 * `Lines → Delete` on a provisional return: the selected line comes off, and
 * the stored totals are rebuilt without it. Once the goods have gone the line
 * records stock that physically left, so it stays.
 */
export const deletePurchaseReturnLine = async (
  purchaseReturnOrderUuid: string,
  itemUuid: string,
): Promise<PurchaseReturnOrderActionResult> => {
  try {
    const [returnOrder] = await db
      .select({ status: PurchaseReturnOrders.status })
      .from(PurchaseReturnOrders)
      .where(eq(PurchaseReturnOrders.uuid, purchaseReturnOrderUuid))
      .limit(1);

    if (!returnOrder) {
      return { error: "Purchase return order not found." };
    }
    if (!isPurchaseReturnOrderEditable(returnOrder.status)) {
      return { error: "Lines can only be deleted before the goods have gone." };
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(PurchaseReturnOrderItems)
        .where(
          and(
            eq(PurchaseReturnOrderItems.uuid, itemUuid),
            eq(
              PurchaseReturnOrderItems.purchaseReturnOrderUuid,
              purchaseReturnOrderUuid,
            ),
          ),
        );

      await tx
        .update(PurchaseReturnOrders)
        .set(await buildPurchaseReturnSummary(tx, purchaseReturnOrderUuid))
        .where(eq(PurchaseReturnOrders.uuid, purchaseReturnOrderUuid));
    });

    revalidatePath(`/purchase-return-orders/${purchaseReturnOrderUuid}`);
    return { success: true, purchaseReturnOrderUuid };
  } catch (error) {
    return {
      error: describeError(error, "Failed to delete the return line"),
    };
  }
};
