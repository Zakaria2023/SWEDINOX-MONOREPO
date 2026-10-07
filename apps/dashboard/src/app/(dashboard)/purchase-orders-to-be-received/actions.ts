"use server";

import { openPurchaseOrderStatuses } from "@/lib/enums";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { db } from "@/db";
import { Products } from "@/db/schema/products";
import {
  PurchaseOrderItems,
  SelectPurchaseOrderItems,
} from "@/db/schema/purchase-order-items";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { RevenueGroups, SelectRevenueGroups } from "@/db/schema/revenue-groups";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import {
  recordPurchaseLineReceipt,
  refreshPurchaseLineStatus,
} from "@/lib/server/purchase-lines";
import { describeError, todayDateString } from "@/lib/helpers";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type PurchaseOrderToReceiveRow = {
  purchaseOrderItemUuid: SelectPurchaseOrderItems["uuid"];
  // 🔴 The order's own number, and the line's. The `Purchase order` column used
  // to show `reference`, which is the **supplier's** reference and is empty on
  // almost every order — so the screen named no order anywhere and a buyer
  // could not find the one they had just placed.
  purchaseOrderUuid: SelectPurchaseOrders["uuid"];
  purchaseOrderId: SelectPurchaseOrders["id"];
  lineNumber: SelectPurchaseOrderItems["lineNumber"];
  productCode: string | null;
  reference: SelectPurchaseOrders["reference"];
  supplierName: SelectCompanies["companyName"] | null;
  companyCode: SelectCompanies["id"] | null;
  status: SelectPurchaseOrders["status"];
  orderDate: SelectPurchaseOrders["orderDate"];
  orderAmount: number;
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
  kgPurchased: number;
  kgReceived: number;
  kgStillToReceive: number;
  purchaser: SelectPurchaseOrders["purchaser"];
  purchaserInitials: SelectPurchaseOrders["purchaserInitials"];
};

export type ReceiveGoodsResult = {
  error?: string;
  success?: boolean;
  received?: number;
};

// The transaction handle passed into db.transaction(async (tx) => ...).
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

type ReceivableLine = {
  itemUuid: string;
  purchaseOrderUuid: string | null;
  purchaseOrderId: number;
  supplierUuid: string | null;
  productUuid: string | null;
  lineNumber: number | null;
  unit: SelectPurchaseOrderItems["unit"];
  quantity: string;
  qtyReceived: string | null;
  kgPurchased: string | null;
};

// Open purchase-order lines still awaiting delivery — quantity not yet fully
// received on orders that aren't completed or cancelled. Line-level amounts
// aren't stored (the order total lives on the header), so the value picture is
// the PO amount; the outstanding position is expressed in kg.
export const getPurchaseOrdersToBeReceived = async (): Promise<
  PurchaseOrderToReceiveRow[]
> => {
  try {
    const rows = await db
      .select({
        purchaseOrderItemUuid: PurchaseOrderItems.uuid,
        purchaseOrderUuid: PurchaseOrders.uuid,
        purchaseOrderId: PurchaseOrders.id,
        lineNumber: PurchaseOrderItems.lineNumber,
        productCode: Products.productCode,
        reference: PurchaseOrders.reference,
        supplierName: Companies.companyName,
        companyCode: Companies.id,
        status: PurchaseOrders.status,
        orderDate: PurchaseOrders.orderDate,
        orderAmount: PurchaseOrders.amount,
        revenueGroupNumber: RevenueGroups.number,
        revenueGroupName: RevenueGroups.name,
        kgPurchased: PurchaseOrderItems.kgPurchased,
        quantity: PurchaseOrderItems.quantity,
        qtyReceived: PurchaseOrderItems.qtyReceived,
        purchaser: PurchaseOrders.purchaser,
        purchaserInitials: PurchaseOrders.purchaserInitials,
      })
      .from(PurchaseOrderItems)
      .innerJoin(
        PurchaseOrders,
        eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .innerJoin(Companies, eq(PurchaseOrders.supplierUuid, Companies.uuid))
      .innerJoin(Products, eq(PurchaseOrderItems.productUuid, Products.uuid))
      .leftJoin(
        RevenueGroups,
        eq(Products.revenueGroupUuid, RevenueGroups.uuid),
      )
      .where(
        and(
          inArray(PurchaseOrders.status, [...openPurchaseOrderStatuses]),
          sql`${PurchaseOrderItems.quantity} - ${PurchaseOrderItems.qtyReceived} > 0`,
        ),
      )
      // Newest first. A buyer comes to this screen to receive the order they
      // just placed, and sorting by company name alphabetically buried it
      // hundreds of rows down with no search box to find it again.
      .orderBy(desc(PurchaseOrders.id), asc(PurchaseOrderItems.lineNumber));

    // The buyer is stored on the header as a Clerk user id; resolve it to a
    // display name (falling back to the raw id if it can't be resolved).
    const users = await getClerkUsersForSelect();
    const nameById = new Map(users.map((user) => [user.value, user.label]));

    return mapRows(rows, nameById);
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch purchase orders to be received"));
  }
};

const RECEIVABLE_LINE_COLUMNS = {
  itemUuid: PurchaseOrderItems.uuid,
  purchaseOrderUuid: PurchaseOrders.uuid,
  purchaseOrderId: PurchaseOrders.id,
  supplierUuid: PurchaseOrders.supplierUuid,
  productUuid: PurchaseOrderItems.productUuid,
  lineNumber: PurchaseOrderItems.lineNumber,
  unit: PurchaseOrderItems.unit,
  quantity: PurchaseOrderItems.quantity,
  qtyReceived: PurchaseOrderItems.qtyReceived,
  kgPurchased: PurchaseOrderItems.kgPurchased,
};

// Only orders that are still in flight have outstanding lines to receive.
const OPEN_STATUSES = openPurchaseOrderStatuses;

// Books one line's outstanding quantity as received: a PurchaseLineReceivals
// row plus setting the line's received quantity to full. Shared by the
// per-line and receive-all actions so both record an identical receipt.
const applyLineReceipt = async (
  tx: Transaction,
  line: ReceivableLine,
  today: string,
): Promise<void> => {
  const outstanding = (
    Number(line.quantity) - Number(line.qtyReceived ?? 0)
  ).toFixed(3);
  // The weight that arrives is the line's weight for the quantity arriving.
  const lineQty = Number(line.quantity);
  const lineKg = Number(line.kgPurchased ?? 0);
  const outstandingKg =
    lineQty > 0 ? (lineKg * Number(outstanding)) / lineQty : lineKg;

  // Fills the line's open receptions first, so a planned reception is marked
  // received rather than left open beside a second, duplicate one.
  await recordPurchaseLineReceipt(tx, {
    purchaseOrderItemUuid: line.itemUuid,
    quantity: Number(outstanding),
    kg: outstandingKg,
    date: today,
  });

  await tx
    .update(PurchaseOrderItems)
    .set({ qtyReceived: line.quantity })
    .where(eq(PurchaseOrderItems.uuid, line.itemUuid));

  await refreshPurchaseLineStatus(tx, line.itemUuid);
};

const revalidateReceiptPaths = () => {
  revalidatePath("/purchase-orders-to-be-received");
  revalidatePath("/purchase-invoices-to-be-received");
  revalidatePath("/purchase-receivals");
  revalidatePath("/receipts");
};

// Receives a single outstanding purchase-order line — the per-line "Receive"
// button in the table.
export const receivePurchaseOrderLine = async (
  purchaseOrderItemUuid: string,
): Promise<ReceiveGoodsResult> => {
  try {
    const [line] = await db
      .select(RECEIVABLE_LINE_COLUMNS)
      .from(PurchaseOrderItems)
      .innerJoin(
        PurchaseOrders,
        eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .where(
        and(
          eq(PurchaseOrderItems.uuid, purchaseOrderItemUuid),
          inArray(PurchaseOrders.status, [...OPEN_STATUSES]),
          sql`${PurchaseOrderItems.quantity} - ${PurchaseOrderItems.qtyReceived} > 0`,
        ),
      )
      .limit(1);

    if (!line) {
      return { error: "This line has already been fully received." };
    }

    const today = todayDateString();
    await db.transaction((tx) => applyLineReceipt(tx, line, today));

    revalidateReceiptPaths();
    return { success: true, received: 1 };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to receive line",
    };
  }
};

// Records a goods receipt for every open purchase-order line that still has
// quantity outstanding. This drives the Purchase receivals / Receipts overviews
// and moves not-yet-invoiced orders onto Purchase invoices to be received.
// Fully-received lines are skipped, so it can be re-run.
export const receiveOutstandingGoods =
  async (): Promise<ReceiveGoodsResult> => {
    try {
      const lines = await db
        .select(RECEIVABLE_LINE_COLUMNS)
        .from(PurchaseOrderItems)
        .innerJoin(
          PurchaseOrders,
          eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
        )
        .where(
          and(
            inArray(PurchaseOrders.status, [...OPEN_STATUSES]),
            sql`${PurchaseOrderItems.quantity} - ${PurchaseOrderItems.qtyReceived} > 0`,
          ),
        );

      if (lines.length === 0) {
        return {
          error: "No outstanding purchase-order lines to receive.",
        };
      }

      const today = todayDateString();

      await db.transaction(async (tx) => {
        for (const line of lines) {
          await applyLineReceipt(tx, line, today);
        }
      });

      revalidateReceiptPaths();
      return { success: true, received: lines.length };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to receive goods",
      };
    }
  };

const mapRows = (
  rows: {
    purchaseOrderItemUuid: string;
    purchaseOrderUuid: string;
    purchaseOrderId: number;
    lineNumber: SelectPurchaseOrderItems["lineNumber"];
    productCode: string | null;
    reference: SelectPurchaseOrders["reference"];
    supplierName: SelectCompanies["companyName"] | null;
    companyCode: SelectCompanies["id"] | null;
    status: SelectPurchaseOrders["status"];
    orderDate: SelectPurchaseOrders["orderDate"];
    orderAmount: string;
    revenueGroupNumber: SelectRevenueGroups["number"] | null;
    revenueGroupName: SelectRevenueGroups["name"] | null;
    kgPurchased: string | null;
    quantity: string;
    qtyReceived: string | null;
    purchaser: SelectPurchaseOrders["purchaser"];
    purchaserInitials: SelectPurchaseOrders["purchaserInitials"];
  }[],
  nameById: Map<string, string>,
): PurchaseOrderToReceiveRow[] =>
  rows.map((row) => {
    const quantity = Number(row.quantity);
    const qtyReceived = Number(row.qtyReceived ?? 0);
    const kgPurchased = Number(row.kgPurchased ?? 0);
    // Attribute purchased kg to received/outstanding by the qty ratio.
    const receivedRatio = quantity > 0 ? qtyReceived / quantity : 0;
    const kgReceived = kgPurchased * receivedRatio;
    return {
      purchaseOrderItemUuid: row.purchaseOrderItemUuid,
      purchaseOrderUuid: row.purchaseOrderUuid,
      purchaseOrderId: row.purchaseOrderId,
      lineNumber: row.lineNumber,
      productCode: row.productCode,
      reference: row.reference,
      supplierName: row.supplierName,
      companyCode: row.companyCode,
      status: row.status,
      orderDate: row.orderDate,
      orderAmount: Number(row.orderAmount),
      revenueGroupNumber: row.revenueGroupNumber,
      revenueGroupName: row.revenueGroupName,
      kgPurchased,
      kgReceived,
      kgStillToReceive: kgPurchased - kgReceived,
      purchaser: row.purchaser
        ? (nameById.get(row.purchaser) ?? row.purchaser)
        : row.purchaser,
      purchaserInitials: row.purchaserInitials,
    };
  });
