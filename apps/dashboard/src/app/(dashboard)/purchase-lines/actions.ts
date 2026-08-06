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
import { count, desc, eq, getTableColumns } from "drizzle-orm";
import {
  dateRangeFilter,
  numberRangeFilter,
  relationFilter,
  tableOrderBy,
  tablePage,
  tableWhere,
} from "@/lib/server/table-query";
import { Paged, TableQuery } from "@/lib/table-query";

export type PurchaseLineItem = SelectPurchaseOrderItems & {
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  orderDate: SelectPurchaseOrders["orderDate"] | null;
  supplierName: SelectCompanies["companyName"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
};

export type PurchaseLineDetail = PurchaseLineItem & {
  supplierUuid: SelectCompanies["uuid"] | null;
  purchaseOrderStatus: SelectPurchaseOrders["status"] | null;
  purchaseOrderReference: SelectPurchaseOrders["reference"] | null;
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

export const getPurchaseLines = async (
  query: TableQuery,
): Promise<Paged<PurchaseLineItem>> => {
  try {
    const where = tableWhere({
      query,
      search: PURCHASE_LINE_SEARCH,
      filters: PURCHASE_LINE_FILTERS,
    });

    const { limit, offset } = tablePage(query);

    const rows = await db
      .select({
        ...getTableColumns(PurchaseOrderItems),
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
      .where(where)
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

    const [totalRow] = await db
      .select({ value: count() })
      .from(PurchaseOrderItems)
      .leftJoin(
        PurchaseOrders,
        eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(Companies, eq(PurchaseOrders.supplierUuid, Companies.uuid))
      .leftJoin(Products, eq(PurchaseOrderItems.productUuid, Products.uuid))
      .where(where);

    // Resolve the buyer's Clerk id to a display name. Fall back to a
    // line-level purchaser if one was set, then to the raw id.
    const users = await getClerkUsersForSelect();
    const nameById = new Map(users.map((user) => [user.value, user.label]));

    return {
      rows: rows.map(({ orderPurchaserId, ...row }) => ({
        ...row,
        purchaser:
          row.purchaser ??
          (orderPurchaserId
            ? (nameById.get(orderPurchaserId) ?? orderPurchaserId)
            : null),
      })),
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
