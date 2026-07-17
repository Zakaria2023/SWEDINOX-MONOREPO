"use server";

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
import { and, asc, eq, inArray, sql } from "drizzle-orm";

export type PurchaseOrderToReceiveRow = {
  purchaseOrderItemUuid: SelectPurchaseOrderItems["uuid"];
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
      .leftJoin(RevenueGroups, eq(Products.revenueGroupUuid, RevenueGroups.uuid))
      .where(
        and(
          inArray(PurchaseOrders.status, ["open", "confirmed", "pre_notified"]),
          sql`${PurchaseOrderItems.quantity} - ${PurchaseOrderItems.qtyReceived} > 0`,
        ),
      )
      .orderBy(asc(Companies.companyName), asc(PurchaseOrders.reference));

    return rows.map((row) => {
      const quantity = Number(row.quantity);
      const qtyReceived = Number(row.qtyReceived ?? 0);
      const kgPurchased = Number(row.kgPurchased ?? 0);
      // Attribute purchased kg to received/outstanding by the qty ratio.
      const receivedRatio = quantity > 0 ? qtyReceived / quantity : 0;
      const kgReceived = kgPurchased * receivedRatio;
      return {
        purchaseOrderItemUuid: row.purchaseOrderItemUuid,
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
        purchaser: row.purchaser,
        purchaserInitials: row.purchaserInitials,
      };
    });
  } catch {
    throw new Error("Failed to fetch purchase orders to be received");
  }
};
