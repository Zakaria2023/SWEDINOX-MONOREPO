"use server";

import { db } from "@/db";
import { JournalEntries } from "@/db/schema/journal-entries";
import { OrderDeblocks } from "@/db/schema/order-deblocks";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Products, SelectProducts } from "@/db/schema/products";
import { Reservations } from "@/db/schema/reservations";
import { Stock } from "@/db/schema/stock";
import { StockMovements } from "@/db/schema/stock-movements";
import { mailDocument, sendDeliveryNoteEmail } from "@/emails/documents";
import {
  describeError,
  generateUuid,
  moneyString,
  restateLotValue,
  todayDateString,
} from "@/lib/helpers";
import { checkCredit } from "@/lib/server/credit-control";
import { recordFreightMovement } from "@/lib/server/freight";
import { writeSystemLog } from "@/lib/server/system-log";
import {
  BlockDeliveryFormValues,
  blockDeliverySchema,
} from "@/app/(dashboard)/deliveries/validation";
import {
  buildInventoryMovementEntry,
  LEDGER_ACCOUNTS,
} from "@/lib/server/ledger";
import { currentUser } from "@clerk/nextjs/server";
import { and, asc, desc, eq, getTableColumns, ne, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type DeliveryActionResult = {
  error?: string;
  success?: boolean;
};

export type BlockDeliveryPayload = BlockDeliveryFormValues & {
  orderItemUuid: string;
};

export type DeliveryLineItem = SelectOrderItems & {
  orderId: SelectOrders["id"] | null;
  orderCategory: SelectOrders["orderCategory"] | null;
  customerName: SelectCompanies["companyName"] | null;
  customerRef: SelectOrders["customerRef"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
};

const lineColumns = {
  ...getTableColumns(OrderItems),
  orderId: Orders.id,
  orderCategory: Orders.orderCategory,
  customerName: Companies.companyName,
  customerRef: Orders.customerRef,
  productCode: Products.productCode,
  productName: Products.name,
};

// Deliverable order lines — everything not cancelled, newest first.
export const getDeliveries = async (): Promise<DeliveryLineItem[]> => {
  try {
    return await db
      .select(lineColumns)
      .from(OrderItems)
      .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
      .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
      .where(ne(OrderItems.status, "cancelled"))
      .orderBy(desc(OrderItems.createdAt));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch deliveries"));
  }
};

// Lines held back by a commercial, financial or transport block.
export const getBlockedDeliveries = async (): Promise<DeliveryLineItem[]> => {
  try {
    return await db
      .select(lineColumns)
      .from(OrderItems)
      .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
      .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
      .where(
        or(
          eq(OrderItems.commercialBlock, true),
          eq(OrderItems.financialBlock, true),
          eq(OrderItems.transportBlock, true),
        ),
      )
      .orderBy(desc(OrderItems.createdAt));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch blocked deliveries"));
  }
};

/**
 * Release an order's commercial block — every line of the order at once — and
 * record it as a `commercial` release in the audit trail.
 *
 * The reference's `Unblocked orders` has two release types and this is the
 * second: 27 `Commerciële deblokkering` against 544 financial. They are done by
 * different people (15 of the 27 by one commercial manager) and take days, not
 * the hour a financial release takes — a margin or price review. A release is
 * per order there, so it is per order here.
 */
export const releaseCommercialBlock = async (
  orderUuid: string,
): Promise<DeliveryActionResult> => {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return { error: "User not authenticated" };
    }
    const userId = user.id;

    await db.transaction(async (tx) => {
      const [update] = await tx
        .update(OrderItems)
        .set({ commercialBlock: false })
        .where(
          and(
            eq(OrderItems.orderUuid, orderUuid),
            eq(OrderItems.commercialBlock, true),
          ),
        );

      if (update.affectedRows === 0) {
        throw new Error("This order has no commercially blocked lines.");
      }

      await tx.insert(OrderDeblocks).values({
        uuid: generateUuid(),
        orderUuid,
        deblockType: "commercial",
        deblockedByUserId: userId,
      });

      await writeSystemLog(tx, {
        category: "commercial_unblock",
        message: `Commercial block released on ${update.affectedRows} line(s) of the order`,
        orderUuid,
        userId,
      });
    });

    revalidatePath("/blocked-deliveries");
    revalidatePath("/unblocked-orders");
    revalidatePath("/deliveries");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to release the commercial block",
    };
  }
};

/**
 * Hold one line's delivery by hand, with the reason written on it.
 *
 * The reference's task panel keeps `Order lines with manually blocked
 * deliveries` apart from the automatic ones, and a delivery line carries its
 * own block reason. Until now nothing here could set a commercial block at all,
 * so the release on Blocked deliveries had nothing to release.
 *
 * Only a line still waiting to ship can be held; one that has left is past
 * stopping.
 */
export const blockOrderLineDelivery = async (
  _prevState: DeliveryActionResult,
  { orderItemUuid, ...values }: BlockDeliveryPayload,
): Promise<DeliveryActionResult> => {
  const parsed = blockDeliverySchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid block reason",
    };
  }

  try {
    const user = await currentUser();
    if (!user?.id) {
      return { error: "User not authenticated" };
    }
    const userId = user.id;

    const [line] = await db
      .select({
        orderUuid: OrderItems.orderUuid,
        lineNumber: OrderItems.lineNumber,
      })
      .from(OrderItems)
      .where(eq(OrderItems.uuid, orderItemUuid))
      .limit(1);

    if (!line) {
      return { error: "Order line not found." };
    }

    await db.transaction(async (tx) => {
      const [update] = await tx
        .update(OrderItems)
        .set({ commercialBlock: true, blockingReason: parsed.data.reason })
        .where(
          and(
            eq(OrderItems.uuid, orderItemUuid),
            eq(OrderItems.status, "reserved"),
            eq(OrderItems.commercialBlock, false),
          ),
        );

      if (update.affectedRows === 0) {
        throw new Error(
          "Only a reserved line without a commercial block can be blocked.",
        );
      }

      await writeSystemLog(tx, {
        category: "commercial_block",
        message: `Delivery of line ${line.lineNumber ?? "?"} blocked by hand — ${parsed.data.reason}`,
        orderUuid: line.orderUuid,
        userId,
      });
    });

    revalidatePath("/blocked-deliveries");
    revalidatePath("/deliveries");
    revalidatePath(`/order-lines/${orderItemUuid}`);
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to block the delivery",
    };
  }
};

// Deliver a reserved order line: this is where stock physically leaves the
// warehouse. It consumes the reserved stock and writes the "out" movement, so
// invoicing afterwards is purely financial. Cancelling the invoice does NOT
// bring the stock back — the goods have already shipped.
/**
 * Deliver one reserved line.
 *
 * The trip is optional and usually absent, which is a real difference from the
 * reference rather than an oversight. There, goods leave on a trip: of its 5.043
 * customer deliveries, 4.189 name a `6xxxxx` trip as the document that moved
 * them and only 854 a warehouse work order — a lorry takes several orders at
 * once, so the trip is the unit of despatch and this screen's line is not.
 *
 * Until deliveries are planned onto trips here, a caller that knows the trip can
 * still say so, and the movement records it.
 */
export const deliverOrderItem = async (
  orderItemUuid: string,
  transportWorkOrderUuid: string | null = null,
): Promise<DeliveryActionResult> => {
  try {
    const [orderItem] = await db
      .select()
      .from(OrderItems)
      .where(eq(OrderItems.uuid, orderItemUuid))
      .limit(1);

    if (!orderItem) {
      return { error: "Order line not found." };
    }

    if (orderItem.status !== "reserved") {
      return { error: "Only a reserved line can be delivered." };
    }

    // A block has to actually stop the goods, or it is only a label. Both the
    // line's own holds and the order's financial block are refused here, and
    // both are lifted the same way: deliberately, by someone with the
    // authority, leaving a record of who did it.
    if (orderItem.commercialBlock) {
      return { error: "This line is on a commercial block." };
    }
    if (orderItem.financialBlock) {
      return { error: "This line is on a financial block." };
    }
    if (orderItem.transportBlock) {
      return { error: "This line is on a transport block." };
    }

    const [order] = await db
      .select({
        id: Orders.id,
        companyUuid: Orders.companyUuid,
        financialBlockage: Orders.financialBlockage,
        blockingReason: Orders.blockingReason,
        changedAfterFinancialDeblock: Orders.changedAfterFinancialDeblock,
      })
      .from(Orders)
      .where(eq(Orders.uuid, orderItem.orderUuid))
      .limit(1);

    if (order?.financialBlockage) {
      return {
        error: order.blockingReason
          ? `This order is financially blocked — ${order.blockingReason}. Release it on the Financially Blocked overview before delivering.`
          : "This order is financially blocked. Release it on the Financially Blocked overview before delivering.",
      };
    }

    // The credit rule is not only an order-entry test. In the reference 3 of
    // the 29 orders held on 14-9-2026 had been released before and were held
    // again, and 78 of 451 orders were released more than once: invoices go
    // overdue and limits fill up after an order is taken. So the rule runs
    // again before goods leave.
    //
    // A release is respected. Someone with the authority looked at this order
    // and let it go; holding it again at the very next step would make the
    // release worthless.
    //
    // Unless the order changed afterwards: the release covered the order as it
    // stood, and the reference flags an edit made since
    // (`CHANGEDAFTERFINANCIALDEBLOCK`). Only a *financial* release counts — a
    // commercial one says nothing about credit.
    if (order) {
      const [released] = await db
        .select({ uuid: OrderDeblocks.uuid })
        .from(OrderDeblocks)
        .where(
          and(
            eq(OrderDeblocks.orderUuid, orderItem.orderUuid),
            eq(OrderDeblocks.deblockType, "financial"),
          ),
        )
        .limit(1);

      if (!released || order.changedAfterFinancialDeblock) {
        const credit = await checkCredit(db, {
          companyUuid: order.companyUuid,
          orderAmount: 0,
          // Its own lines are already committed, so they count once, there.
        });
        if (credit.blocked) {
          await db.transaction(async (tx) => {
            await tx
              .update(Orders)
              .set({
                financialBlockage: true,
                financialBlockManual: false,
                changedAfterFinancialDeblock: false,
                blockingReason: credit.reason,
              })
              .where(eq(Orders.uuid, orderItem.orderUuid));
            await writeSystemLog(tx, {
              category: "financial_block",
              message: `Order held again at delivery by the credit rule — ${credit.reason}`,
              orderUuid: orderItem.orderUuid,
            });
          });
          revalidatePath("/financially-blocked");
          return {
            error: `This order is now financially blocked — ${credit.reason}. Release it on the Financially Blocked overview before delivering.`,
          };
        }
      }
    }

    const user = await currentUser();
    const userId = user?.id;

    if (!userId) {
      return { error: "User not authenticated" };
    }

    await db.transaction(async (tx) => {
      // Guard: only deliver a line that's still "reserved".
      const [itemUpdate] = await tx
        .update(OrderItems)
        .set({
          status: "delivered",
          // The reference has no `delivered` rung. A line that has left the
          // warehouse and is not yet invoiced reads `Completed` on both
          // ladders — 58 of 58 lines pair that way in its Deliveries export.
          deliveryStatus: "completed",
          lineStatus: "completed",
          deliveryDate: todayDateString(),
        })
        .where(
          and(
            eq(OrderItems.uuid, orderItemUuid),
            eq(OrderItems.status, "reserved"),
          ),
        );

      if (itemUpdate.affectedRows === 0) {
        throw new Error(
          "This line was already delivered or cancelled — please refresh and try again.",
        );
      }

      const [stockRow] = await tx
        .select()
        .from(Stock)
        .where(eq(Stock.uuid, orderItem.stockUuid))
        .limit(1);

      if (stockRow) {
        const nextQuantity = (
          Number(stockRow.quantity) - Number(orderItem.quantity)
        ).toFixed(3);
        const nextReserved = (
          Number(stockRow.reservedQuantity) - Number(orderItem.quantity)
        ).toFixed(3);

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
            reservedQuantity: nextReserved,
            status: Number(nextQuantity) > 0 ? "pending" : "received",
            // Shipping material out has to take its value with it. Reducing the
            // quantity alone left the remainder carrying the whole lot's value,
            // so stock valuation climbed a little with every delivery and never
            // came back down.
            valuationEuro: moneyString(nextValue),
          })
          .where(
            and(
              eq(Stock.uuid, orderItem.stockUuid),
              eq(Stock.quantity, stockRow.quantity),
              eq(Stock.reservedQuantity, stockRow.reservedQuantity),
            ),
          );

        if (stockUpdate.affectedRows === 0) {
          throw new Error(
            "Stock changed while delivering — please refresh and try again.",
          );
        }

        // Delivered metal is no longer reserved, it is gone. The claim goes
        // with it: `Stock.reservedQuantity` is decremented above, and the row
        // that said who was holding it has nothing left to say.
        await tx
          .delete(Reservations)
          .where(eq(Reservations.orderItemUuid, orderItem.uuid));

        await tx.insert(StockMovements).values({
          uuid: generateUuid(),
          productUuid: orderItem.productUuid,
          stockUuid: orderItem.stockUuid,
          type: "out",
          reason: "sale_consumption",
          quantity: orderItem.quantity,
          orderUuid: orderItem.orderUuid,
          transportWorkOrderUuid,
          createdByUserId: userId,
        });

        await recordFreightMovement(tx, {
          productUuid: orderItem.productUuid,
          quantity: orderItem.quantity,
          type: "out",
          reason: "sale_consumption",
          orderUuid: orderItem.orderUuid,
          operator: userId,
        });

        // The stock ledger has to move when the stock does. The goods are no
        // longer on the shelf, but nobody has been billed for them either, so
        // their cost is parked until the invoice charges it to cost of sales.
        // Waiting for the invoice would leave the balance sheet claiming stock
        // that had already been shipped.
        //
        // The figure posted is the value the lot actually gave up, not what the
        // order line says it should have — that is what keeps the inventory
        // account reconcilable to the Stock table line by line.
        const valueOut = previousValue - nextValue;

        if (Math.abs(valueOut) >= 0.005) {
          await tx.insert(JournalEntries).values(
            buildInventoryMovementEntry({
              bookingDate: todayDateString(),
              documentNo: order?.id != null ? String(order.id) : null,
              description: "Goods delivered",
              companyUuid: order?.companyUuid ?? null,
              debCreditor: null,
              inventoryValue: -valueOut,
              counterAccount: LEDGER_ACCOUNTS.goodsDeliveredNotInvoiced,
              reference: `Order line ${orderItemUuid}`,
              userId,
            }),
          );
        }
      }
    });

    // The goods have physically left, so the customer is told what shipped.
    // Sent after the transaction commits and never allowed to fail the
    // delivery — the stock is already gone either way.
    await mailDocument(
      () => sendDeliveryNoteEmail(orderItemUuid),
      `Delivery note for order line ${orderItemUuid}`,
    );

    revalidatePath("/deliveries");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to deliver order line",
    };
  }
};

// Lines still to be arranged that hold no stock reservation yet.
export const getDeliveriesToArrange = async (): Promise<DeliveryLineItem[]> => {
  try {
    return await db
      .select(lineColumns)
      .from(OrderItems)
      .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
      .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
      .where(eq(OrderItems.qtyReserved, "0.000"))
      // A worklist is worked customer by customer, so the sort is part of the
      // screen rather than a default — the reference orders by customer, then
      // by the date the promise falls due.
      .orderBy(asc(Companies.companyName), asc(OrderItems.deliveryDate));
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch deliveries to arrange"),
    );
  }
};
