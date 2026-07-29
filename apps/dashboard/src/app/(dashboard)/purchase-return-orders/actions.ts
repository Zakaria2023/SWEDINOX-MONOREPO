"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
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
import { PurchaseOrders, SelectPurchaseOrders } from "@/db/schema/purchase-orders";
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
  describeError,
  generateUuid,
  getPaymentTermDueDate,
  summarisePurchaseInvoice,
  todayDateString,
  toDateString,
} from "@/lib/helpers";
import { recordFreightMovement } from "@/lib/server/freight";
import { buildPurchaseJournalEntry } from "@/lib/server/ledger";
import { currentUser } from "@clerk/nextjs/server";
import { and, desc, eq, getTableColumns, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
  netPrice: SelectPurchaseOrderItems["netPrice"];
  priceUnit: SelectPurchaseOrderItems["priceUnit"];
  stockUuid: SelectStock["uuid"] | null;
  // Quantity − reserved on that lot: what can physically leave today.
  availableQuantity: string;
};

export type PurchaseReturnOrderLineDetail = SelectPurchaseReturnOrderItems & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
};

export type PurchaseReturnOrderDetail = SelectPurchaseReturnOrders & {
  supplierName: SelectCompanies["companyName"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
  originalPurchaseOrderId: SelectPurchaseOrders["id"] | null;
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
      .leftJoin(Companies, eq(PurchaseReturnOrders.supplierUuid, Companies.uuid))
      .leftJoin(Contacts, eq(PurchaseReturnOrders.contactUuid, Contacts.uuid))
      .orderBy(desc(PurchaseReturnOrders.createdAt));
    return rows;
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch purchase return orders"));
  }
};

/**
 * Received purchase lines that could go back to the supplier.
 *
 * A line only appears once goods actually arrived — the receipt is what created
 * the stock lot, and without a lot there is nothing to send back and no
 * valuation to reverse. What is already on another return is netted off, so the
 * same delivery can't be returned twice.
 */
export const getReturnablePurchaseLines = async (
  supplierUuid: string,
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
      netPrice: PurchaseOrderItems.netPrice,
      priceUnit: PurchaseOrderItems.priceUnit,
      stockUuid: Stock.uuid,
      stockQuantity: Stock.quantity,
      stockReserved: Stock.reservedQuantity,
    })
    .from(PurchaseOrderItems)
    .innerJoin(
      PurchaseOrders,
      eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
    )
    .innerJoin(
      PurchaseInvoiceItems,
      eq(PurchaseInvoiceItems.productUuid, PurchaseOrderItems.productUuid),
    )
    .innerJoin(Stock, eq(PurchaseInvoiceItems.stockUuid, Stock.uuid))
    .leftJoin(Products, eq(PurchaseOrderItems.productUuid, Products.uuid))
    .where(
      and(
        eq(PurchaseOrders.supplierUuid, supplierUuid),
        eq(Stock.purchaseOrderItemUuid, PurchaseOrderItems.uuid),
        sql`${PurchaseOrderItems.qtyReceived} > 0`,
      ),
    )
    .orderBy(desc(PurchaseOrderItems.createdAt));

  // Everything already sitting on a return, so a line can't be sent back twice.
  const returned = await db
    .select({
      purchaseOrderItemUuid:
        PurchaseReturnOrderItems.originalPurchaseOrderItemUuid,
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
    .where(sql`${PurchaseReturnOrders.status} <> 'cancelled'`)
    .groupBy(PurchaseReturnOrderItems.originalPurchaseOrderItemUuid);

  const returnedByLine = new Map(
    returned.map((row) => [row.purchaseOrderItemUuid, Number(row.quantity)]),
  );

  return rows.flatMap((row) => {
    const alreadyReturned =
      returnedByLine.get(row.purchaseOrderItemUuid) ?? 0;
    const onShelf =
      Number(row.stockQuantity ?? 0) - Number(row.stockReserved ?? 0);
    // Goods already sold on can't be sent back, however much was received.
    const available = Math.min(
      Number(row.receivedQuantity ?? 0) - alreadyReturned,
      onShelf,
    );

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
        netPrice: row.netPrice,
        priceUnit: row.priceUnit,
        stockUuid: row.stockUuid,
        availableQuantity: available.toFixed(3),
      },
    ];
  });
};

/** The Summary panel on the document, rolled up from its lines and surcharges. */
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
    materialsRevenue: summary.materials.toFixed(2),
    optionsRevenue: summary.optionsAmount.toFixed(2),
    surchargesRevenue: summary.surcharges.toFixed(2),
    totalExclVat: summary.totalExclVat.toFixed(2),
    vatAmount: summary.vatTotal.toFixed(2),
    totalInclVat: summary.totalInclVat.toFixed(2),
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
    })
    .from(PurchaseReturnOrders)
    .leftJoin(Companies, eq(PurchaseReturnOrders.supplierUuid, Companies.uuid))
    .leftJoin(Contacts, eq(PurchaseReturnOrders.contactUuid, Contacts.uuid))
    .leftJoin(
      PurchaseOrders,
      eq(PurchaseReturnOrders.purchaseOrderUuid, PurchaseOrders.uuid),
    )
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
      })
      .from(PurchaseReturnOrderItems)
      .leftJoin(
        Products,
        eq(PurchaseReturnOrderItems.productUuid, Products.uuid),
      )
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
      .select({ status: PurchaseReturnOrders.status })
      .from(PurchaseReturnOrders)
      .where(eq(PurchaseReturnOrders.uuid, uuid))
      .limit(1);

    if (!returnOrder) {
      return { error: "Purchase return order not found." };
    }
    if (returnOrder.status === "received" || returnOrder.status === "credited") {
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
        .set({ status: "received", returnDate: new Date() })
        .where(
          and(
            eq(PurchaseReturnOrders.uuid, uuid),
            inArray(PurchaseReturnOrders.status, ["open", "in_progress"]),
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

        const nextQuantity = (Number(stockRow.quantity) - returned).toFixed(3);

        const [stockUpdate] = await tx
          .update(Stock)
          .set({
            quantity: nextQuantity,
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
      }
    });

    revalidatePath("/purchase-return-orders");
    revalidatePath(`/purchase-return-orders/${uuid}`);
    revalidatePath("/stock");
    revalidatePath("/stock-movements");
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
    if (returnOrder.status === "credited") {
      return { error: "This return has already been credited." };
    }
    if (returnOrder.status !== "received") {
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
        .set({ status: "credited" })
        .where(
          and(
            eq(PurchaseReturnOrders.uuid, uuid),
            eq(PurchaseReturnOrders.status, "received"),
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
        materials: summary.materials.toFixed(2),
        optionsAmount: summary.optionsAmount.toFixed(2),
        surcharges: summary.surcharges.toFixed(2),
        // Reversed in the same three bands the goods were received under, so
        // the VAT return nets each rate off against itself.
        vatHigh: summary.vatHigh.toFixed(2),
        vatMiddle: summary.vatMiddle.toFixed(2),
        vatLow: summary.vatLow.toFixed(2),
        remainder: summary.remainder.toFixed(2),
        invoiceTotal: summary.totalGeneral.toFixed(2),
        // Negative: this reduces what we owe rather than adding to it.
        outstanding: summary.totalGeneral.toFixed(2),
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
    const returnableByUuid = new Map(
      returnable.map((line) => [line.purchaseOrderItemUuid, line]),
    );

    for (const item of items) {
      const line = returnableByUuid.get(item.purchaseOrderItemUuid);
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
      await tx.insert(PurchaseReturnOrders).values({ ...fields, uuid });

      // Lines were previously dropped here, exactly as they were on the sales
      // side — which is why a purchase return could never move stock or money.
      for (const [index, item] of items.entries()) {
        const line = returnableByUuid.get(item.purchaseOrderItemUuid);
        if (!line) {
          continue;
        }

        const returnQty = Number(item.returnQty);
        const netPrice = Number(line.netPrice ?? 0);

        await tx.insert(PurchaseReturnOrderItems).values({
          uuid: generateUuid(),
          purchaseReturnOrderUuid: uuid,
          productUuid: line.productUuid,
          originalPurchaseOrderUuid: line.purchaseOrderUuid,
          originalPurchaseOrderLine: line.lineNumber,
          originalPurchaseOrderItemUuid: line.purchaseOrderItemUuid,
          stockUuid: line.stockUuid,
          lineNumber: index + 1,
          reference:
            line.purchaseOrderId != null ? String(line.purchaseOrderId) : null,
          unit: line.unit,
          quantity: line.receivedQuantity,
          returnQty: returnQty.toFixed(3),
          returnReason: item.returnReason ?? fields.returnReason ?? null,
          netPrice: netPrice.toFixed(4),
          priceUnit: line.priceUnit,
          amount: (netPrice * returnQty).toFixed(2),
          returnDate: fields.returnDate
            ? toDateString(new Date(fields.returnDate))
            : todayDateString(),
        });
      }

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
