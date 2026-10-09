"use server";

import { PURCHASE_ORDER_TO_RECEIVE_COLUMNS } from "@/app/(dashboard)/purchase-orders-to-be-received/columns";
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
import { exportRows } from "@/lib/server/excel";
import {
  dateRangeFilter,
  enumFilter,
  FilterBindings,
  relationFilter,
  runPaged,
  SortableColumns,
  tableOrderBy,
  tableWhere,
} from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// The order's number, the article, the supplier and the supplier's reference —
// what a buyer has in hand when a delivery turns up at the door.
const PURCHASE_ORDER_TO_RECEIVE_SEARCH = [
  PurchaseOrders.id,
  Products.productCode,
  Companies.companyName,
  PurchaseOrders.reference,
] as const;

const PURCHASE_ORDER_TO_RECEIVE_FILTERS: FilterBindings = {
  supplier: relationFilter(PurchaseOrders.supplierUuid),
  // Only the open statuses can reach this screen, so only they are offered.
  status: enumFilter(PurchaseOrders.status, openPurchaseOrderStatuses),
  orderDate: dateRangeFilter(PurchaseOrders.orderDate),
};

// The kilo columns are worked out per row after the query, so they are not
// sortable; everything read straight off a column is.
const PURCHASE_ORDER_TO_RECEIVE_SORTABLE: SortableColumns = {
  purchaseOrderId: PurchaseOrders.id,
  productCode: Products.productCode,
  supplierName: Companies.companyName,
  status: PurchaseOrders.status,
  orderDate: PurchaseOrders.orderDate,
  orderAmount: PurchaseOrderItems.amount,
};

// What makes a line belong on this screen at all, whatever the URL asks for:
// an order still in flight, with quantity still to come.
const PURCHASE_ORDER_TO_RECEIVE_SCOPE = [
  inArray(PurchaseOrders.status, [...openPurchaseOrderStatuses]),
  sql`${PurchaseOrderItems.quantity} - ${PurchaseOrderItems.qtyReceived} > 0`,
];

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
// received on orders that aren't completed or cancelled. The screen is one row
// per line, so the amount is the line's own (`PurchaseOrderItems.amount`), not
// the header total — which reads EUR 0.00 on almost every order and, where it
// is filled, repeated the whole order's value down each of its lines. The
// outstanding position is expressed in kg.
//
// The rows one view selects, as a window onto them. Shared by the page and the
// export.
const purchaseOrderToReceiveRows =
  (query: TableQuery) =>
  async (
    limit: number,
    offset: number,
  ): Promise<PurchaseOrderToReceiveRow[]> => {
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
        orderAmount: PurchaseOrderItems.amount,
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
        tableWhere({
          query,
          search: PURCHASE_ORDER_TO_RECEIVE_SEARCH,
          filters: PURCHASE_ORDER_TO_RECEIVE_FILTERS,
          scope: PURCHASE_ORDER_TO_RECEIVE_SCOPE,
        }),
      )
      // Newest first. A buyer comes to this screen to receive the order they
      // just placed, and sorting by company name alphabetically buried it
      // hundreds of rows down.
      .orderBy(
        ...tableOrderBy(
          PURCHASE_ORDER_TO_RECEIVE_SORTABLE,
          query,
          [desc(PurchaseOrders.id), asc(PurchaseOrderItems.lineNumber)],
          PurchaseOrderItems.id,
        ),
      )
      .limit(limit)
      .offset(offset);

    if (rows.length === 0) {
      return [];
    }

    // The buyer is stored on the header as a Clerk user id; resolve it to a
    // display name (falling back to the raw id if it can't be resolved).
    const users = await getClerkUsersForSelect();
    const nameById = new Map(users.map((user) => [user.value, user.label]));

    return mapRows(rows, nameById);
  };

export const getPurchaseOrdersToBeReceived = async (
  query: TableQuery,
): Promise<Paged<PurchaseOrderToReceiveRow>> => {
  try {
    return await runPaged(query, {
      rows: purchaseOrderToReceiveRows(query),
      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(PurchaseOrderItems)
          .innerJoin(
            PurchaseOrders,
            eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
          )
          .innerJoin(
            Companies,
            eq(PurchaseOrders.supplierUuid, Companies.uuid),
          )
          .innerJoin(
            Products,
            eq(PurchaseOrderItems.productUuid, Products.uuid),
          )
          .where(
            tableWhere({
              query,
              search: PURCHASE_ORDER_TO_RECEIVE_SEARCH,
              filters: PURCHASE_ORDER_TO_RECEIVE_FILTERS,
              scope: PURCHASE_ORDER_TO_RECEIVE_SCOPE,
            }),
          );
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch purchase orders to be received"));
  }
};

export const exportPurchaseOrdersToBeReceived = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Purchase orders to be received",
    columns: PURCHASE_ORDER_TO_RECEIVE_COLUMNS,
    columnKeys,
    rows: purchaseOrderToReceiveRows(parseTableQuery(params)),
  });

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

// Receives a single outstanding purchase-order line — the toolbar's "Receive"
// button, acting on the row selected in the grid.
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
    orderAmount: SelectPurchaseOrderItems["amount"];
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
