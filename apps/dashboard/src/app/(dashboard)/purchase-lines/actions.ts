"use server";
import { describeError } from "@/lib/helpers";

import { db } from "@/db";
import {
  PurchaseOrderItems,
  SelectPurchaseOrderItems,
} from "@/db/schema/purchase-order-items";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Products, SelectProducts } from "@/db/schema/products";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { count, desc, eq, getTableColumns, sql } from "drizzle-orm";
import { PurchaseLineReceivals } from "@/db/schema/purchase-line-receivals";
import {
  dateRangeFilter,
  numberRangeFilter,
  relationFilter,
  tableOrderBy,
  tablePage,
  tableWhere,
} from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { exportRows } from "@/lib/server/excel";
import { PURCHASE_LINE_COLUMNS } from "@/app/(dashboard)/purchase-lines/columns";

export type PurchaseLineItem = Omit<SelectPurchaseOrderItems, "amount"> & {
  /** Net price x weight, in the price's own unit — derived, never stale. */
  amount: number;
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  orderDate: SelectPurchaseOrders["orderDate"] | null;
  supplierName: SelectCompanies["companyName"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  /** Weight actually booked in against the line, summed over its receivals. */
  kgActual: number;
  /** Ordered weight less what has arrived. */
  kgStillToReceive: number;
  /** That outstanding weight at the line's own price. */
  amountYetToBeReceived: number;
  /** Still inbound and not yet promised to anyone, in the purchase unit. */
  availableQty: number;
  /** The same, in kilograms. */
  availableKg: number;
};

export type PurchaseLineDetail = PurchaseLineItem & {
  supplierUuid: SelectCompanies["uuid"] | null;
  purchaseOrderStatus: SelectPurchaseOrders["status"] | null;
  purchaseOrderReference: SelectPurchaseOrders["reference"] | null;
};

// What is still coming, and what it is worth.
//
// Weight received is summed from the line's receivals rather than stored on
// the line, because a line is received in instalments and only the receivals
// know how much of it has actually turned up.
//
// "Available" on a purchase line means still inbound and unpromised — a
// different thing from a warehouse lot's available, which is quantity less
// reserved. Both exist; conflating them double-counts.
const kgActualSql = sql<number>`(
  SELECT COALESCE(SUM(${PurchaseLineReceivals.kgActual}), 0)
  FROM ${PurchaseLineReceivals}
  WHERE ${PurchaseLineReceivals.purchaseOrderItemUuid} = ${PurchaseOrderItems.uuid}
)`;

// Reserved is held in purchase units, so its weight is that share of the
// line's weight.
const reservedKgSql = sql<number>`(
  CASE WHEN COALESCE(${PurchaseOrderItems.qtyPlanned}, 0) > 0
    THEN COALESCE(${PurchaseOrderItems.kgPurchased}, 0)
       * COALESCE(${PurchaseOrderItems.reservedQty}, 0)
       / ${PurchaseOrderItems.qtyPlanned}
    ELSE 0
  END
)`;

const purchaseLineDerived = {
  // Derived rather than read from the stored column, exactly as the reference
  // does it. A stored amount goes stale the moment a line is re-priced or its
  // weight corrected, and nothing recomputes it.
  amount: sql<number>`
    COALESCE(${PurchaseOrderItems.netPrice}, 0) *
    CASE WHEN UPPER(COALESCE(${PurchaseOrderItems.priceUnit}, 'TN')) = 'KG'
      THEN COALESCE(${PurchaseOrderItems.kgPurchased}, 0)
      ELSE COALESCE(${PurchaseOrderItems.kgPurchased}, 0) / 1000
    END`.mapWith(Number),
  kgActual: sql<number>`${kgActualSql}`.mapWith(Number),
  kgStillToReceive:
    sql<number>`GREATEST(0, COALESCE(${PurchaseOrderItems.kgPurchased}, 0) - ${kgActualSql})`.mapWith(
      Number,
    ),
  amountYetToBeReceived: sql<number>`
    COALESCE(${PurchaseOrderItems.netPrice}, 0) *
    CASE WHEN UPPER(COALESCE(${PurchaseOrderItems.priceUnit}, 'TN')) = 'KG'
      THEN GREATEST(0, COALESCE(${PurchaseOrderItems.kgPurchased}, 0) - ${kgActualSql})
      ELSE GREATEST(0, COALESCE(${PurchaseOrderItems.kgPurchased}, 0) - ${kgActualSql}) / 1000
    END`.mapWith(Number),
  availableQty: sql<number>`GREATEST(0,
    COALESCE(${PurchaseOrderItems.qtyPlanned}, 0)
    - COALESCE(${PurchaseOrderItems.qtyReceived}, 0)
    - COALESCE(${PurchaseOrderItems.reservedQty}, 0))`.mapWith(Number),
  availableKg:
    sql<number>`GREATEST(0, COALESCE(${PurchaseOrderItems.kgPurchased}, 0) - ${kgActualSql} - ${reservedKgSql})`.mapWith(
      Number,
    ),
};

const PURCHASE_LINE_SEARCH = [
  Products.productCode,
  Products.name,
  Companies.companyName,
] as const;

const PURCHASE_LINE_SORTABLE = {
  createdAt: PurchaseOrderItems.createdAt,
  orderDate: PurchaseOrders.orderDate,
  supplier: Companies.companyName,
  productCode: Products.productCode,
  quantity: PurchaseOrderItems.quantity,
};

// Whose order it was on, which article, and when it was placed.
const PURCHASE_LINE_FILTERS = {
  supplier: relationFilter(PurchaseOrders.supplierUuid),
  product: relationFilter(PurchaseOrderItems.productUuid),
  orderDate: dateRangeFilter(PurchaseOrders.orderDate),
  quantity: numberRangeFilter(PurchaseOrderItems.quantity),
};

/**
 * The rows one view of the purchase lines overview selects, as a window onto
 * them.
 *
 * Shared by the page and the export, including the buyer's name: that is
 * resolved here from Clerk rather than in SQL, so a second copy of this query
 * would be a second answer to who bought a line.
 */
const purchaseLineRows =
  (query: TableQuery) =>
  async (limit: number, offset: number): Promise<PurchaseLineItem[]> => {
    const rows = await db
      .select({
        ...getTableColumns(PurchaseOrderItems),
        ...purchaseLineDerived,
        purchaseOrderId: PurchaseOrders.id,
        orderDate: PurchaseOrders.orderDate,
        supplierName: Companies.companyName,
        productCode: Products.productCode,
        productName: Products.name,
        // The buyer is recorded on the order header as a Clerk user id.
        orderPurchaserId: PurchaseOrders.purchaser,
      })
      .from(PurchaseOrderItems)
      .leftJoin(
        PurchaseOrders,
        eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(Companies, eq(PurchaseOrders.supplierUuid, Companies.uuid))
      .leftJoin(Products, eq(PurchaseOrderItems.productUuid, Products.uuid))
      .where(
        tableWhere({
          query,
          search: PURCHASE_LINE_SEARCH,
          filters: PURCHASE_LINE_FILTERS,
        }),
      )
      .orderBy(
        ...tableOrderBy(
          PURCHASE_LINE_SORTABLE,
          query,
          [desc(PurchaseOrderItems.createdAt)],
          PurchaseOrderItems.id,
        ),
      )
      .limit(limit)
      .offset(offset);

    // Resolve the buyer's Clerk id to a display name. Fall back to a
    // line-level purchaser if one was set, then to the raw id.
    const users = await getClerkUsersForSelect();
    const nameById = new Map(users.map((user) => [user.value, user.label]));

    return rows.map(({ orderPurchaserId, ...row }) => ({
      ...row,
      purchaser:
        row.purchaser ??
        (orderPurchaserId
          ? (nameById.get(orderPurchaserId) ?? orderPurchaserId)
          : null),
    }));
  };

/** Every purchase line the current view matches, as a workbook. */
export const exportPurchaseLines = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Purchase Lines",
    columns: PURCHASE_LINE_COLUMNS,
    columnKeys,
    rows: purchaseLineRows(parseTableQuery(params)),
  });

export const getPurchaseLines = async (
  query: TableQuery,
): Promise<Paged<PurchaseLineItem>> => {
  try {
    const { limit, offset } = tablePage(query);
    const rows = await purchaseLineRows(query)(limit, offset);

    const [totalRow] = await db
      .select({ value: count() })
      .from(PurchaseOrderItems)
      .leftJoin(
        PurchaseOrders,
        eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(Companies, eq(PurchaseOrders.supplierUuid, Companies.uuid))
      .leftJoin(Products, eq(PurchaseOrderItems.productUuid, Products.uuid))
      .where(
        tableWhere({
          query,
          search: PURCHASE_LINE_SEARCH,
          filters: PURCHASE_LINE_FILTERS,
        }),
      );

    return {
      rows,
      total: Number(totalRow?.value ?? 0),
      page: query.page,
      pageSize: query.pageSize,
    };
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch purchase lines"));
  }
};

/**
 * One purchase order line with the order, supplier and product behind it. The
 * buyer is resolved from the Clerk user id on the order header the same way the
 * overview resolves it.
 */
export const getPurchaseLineDetail = async (
  uuid: string,
): Promise<PurchaseLineDetail | null> => {
  try {
    const [row] = await db
      .select({
        ...getTableColumns(PurchaseOrderItems),
        ...purchaseLineDerived,
        purchaseOrderId: PurchaseOrders.id,
        purchaseOrderStatus: PurchaseOrders.status,
        purchaseOrderReference: PurchaseOrders.reference,
        orderDate: PurchaseOrders.orderDate,
        supplierName: Companies.companyName,
        supplierUuid: Companies.uuid,
        productCode: Products.productCode,
        productName: Products.name,
        orderPurchaserId: PurchaseOrders.purchaser,
      })
      .from(PurchaseOrderItems)
      .leftJoin(
        PurchaseOrders,
        eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(Companies, eq(PurchaseOrders.supplierUuid, Companies.uuid))
      .leftJoin(Products, eq(PurchaseOrderItems.productUuid, Products.uuid))
      .where(eq(PurchaseOrderItems.uuid, uuid))
      .limit(1);

    if (!row) {
      return null;
    }

    const users = await getClerkUsersForSelect();
    const nameById = new Map(users.map((user) => [user.value, user.label]));

    const { orderPurchaserId, ...line } = row;

    return {
      ...line,
      purchaser:
        line.purchaser ??
        (orderPurchaserId
          ? (nameById.get(orderPurchaserId) ?? orderPurchaserId)
          : null),
    };
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch purchase line"));
  }
};
