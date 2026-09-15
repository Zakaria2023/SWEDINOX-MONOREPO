"use server";

import { db } from "@/db";
import {
  PurchaseLineReceivals,
  SelectPurchaseLineReceivals,
} from "@/db/schema/purchase-line-receivals";
import { ProductGroups, SelectProductGroups } from "@/db/schema/product-groups";
import { Products, SelectProducts } from "@/db/schema/products";
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import { PURCHASE_RESULT_COLUMNS } from "@/app/(dashboard)/purchase-results/columns";
import { ReceiptStatus } from "@/lib/enums";
import { describeError } from "@/lib/helpers";
import { exportRows } from "@/lib/server/excel";
import { runPaged, tableOrderBy, tableWhere } from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  lte,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

// The hierarchy is one self-referencing tree and the screen shows two of its
// levels: the root, and the one directly above the product. Level two is
// skipped, exactly as it is on Sold products.
const Parent = alias(ProductGroups, "group_parent");
const Grandparent = alias(ProductGroups, "group_grandparent");
const Root = alias(ProductGroups, "group_root");

// Only goods that actually arrived. A reception still new, released or waiting
// on its unloading has not cost anything yet.
const ARRIVED_RECEIPT_STATUSES: ReceiptStatus[] = [
  "partially_received",
  "received",
  "invoiced",
];

// The day the goods came in: the actual delivery date, else the receipt date.
const receiptDateSql = sql<
  SelectPurchaseLineReceivals["receiptDate"]
>`COALESCE(${PurchaseLineReceivals.deliveryDateActual}, ${PurchaseLineReceivals.receiptDate})`;

// What the arrived weight cost at the line's own price and price unit.
const purchaseValueSql = sql<number>`
  COALESCE(${PurchaseOrderItems.netPrice}, 0) *
  CASE WHEN UPPER(COALESCE(${PurchaseOrderItems.priceUnit}, 'TN')) = 'KG'
    THEN COALESCE(${PurchaseLineReceivals.kgActual}, 0)
    ELSE COALESCE(${PurchaseLineReceivals.kgActual}, 0) / 1000
  END`;

const PURCHASE_RESULT_SEARCH = [
  Products.productCode,
  Products.name,
  ProductGroups.name,
] as const;

const PURCHASE_RESULT_SORTABLE = {
  receiptDate: receiptDateSql,
  productCode: Products.productCode,
  purchaseValue: purchaseValueSql,
};

const PURCHASE_RESULT_FILTER_BINDINGS = {
  // The reference's only filter, "Receipt date" from / to.
  receiptDate: (values: string[]) => {
    const [from, to] = (values[0] ?? "").split("..");
    return and(
      from ? gte(receiptDateSql, from) : undefined,
      to ? lte(receiptDateSql, to) : undefined,
    );
  },
};

export type PurchaseResultRow = {
  /** The reception this row is: one row per reception, so it has an identity. */
  uuid: SelectPurchaseLineReceivals["uuid"];
  /** The root of the product hierarchy. */
  mainGroup: SelectProductGroups["name"] | null;
  /** The level directly above the product. */
  subgroup: SelectProductGroups["name"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  receiptDate: SelectPurchaseLineReceivals["receiptDate"];
  /** Derived from the receipt date, not stored — the reference groups by them. */
  year: number | null;
  month: number | null;
  /** What the goods that arrived cost, at the line's own price. */
  purchaseValue: number;
};

/**
 * The rows one view of Purchase results selects, as a window onto them.
 *
 * One row per reception that goods actually arrived on — not aggregated. The
 * reference's own 1,800-row export covers only 466 (subgroup, receipt date)
 * pairs, and a line received in two goes appears twice. Every receipt path
 * (Receive, an approved unloading, a purchase invoice that creates the lot)
 * records its arrival on the receptions, so they are complete.
 *
 * `Replacement value` and the two differences against it are left out: they
 * were zero on all 1,800 reference rows.
 */
const purchaseResultRows =
  (query: TableQuery) =>
  async (limit: number, offset: number): Promise<PurchaseResultRow[]> =>
    db
      .select({
        uuid: PurchaseLineReceivals.uuid,
        mainGroup: sql<
          SelectProductGroups["name"] | null
        >`COALESCE(${Root.name}, ${Grandparent.name}, ${Parent.name}, ${ProductGroups.name})`,
        subgroup: ProductGroups.name,
        productCode: Products.productCode,
        productName: Products.name,
        receiptDate: receiptDateSql,
        year: sql<number | null>`YEAR(${receiptDateSql})`.mapWith(Number),
        month: sql<number | null>`MONTH(${receiptDateSql})`.mapWith(Number),
        purchaseValue: purchaseValueSql.mapWith(Number),
      })
      .from(PurchaseLineReceivals)
      .innerJoin(Products, eq(PurchaseLineReceivals.productUuid, Products.uuid))
      .leftJoin(
        PurchaseOrderItems,
        eq(PurchaseLineReceivals.purchaseOrderItemUuid, PurchaseOrderItems.uuid),
      )
      .leftJoin(ProductGroups, eq(Products.productGroupUuid, ProductGroups.uuid))
      .leftJoin(Parent, eq(ProductGroups.parentUuid, Parent.uuid))
      .leftJoin(Grandparent, eq(Parent.parentUuid, Grandparent.uuid))
      .leftJoin(Root, eq(Grandparent.parentUuid, Root.uuid))
      .where(
        tableWhere({
          query,
          search: PURCHASE_RESULT_SEARCH,
          filters: PURCHASE_RESULT_FILTER_BINDINGS,
          scope: [
            inArray(PurchaseLineReceivals.receiptStatus, ARRIVED_RECEIPT_STATUSES),
          ],
        }),
      )
      .orderBy(
        ...tableOrderBy(
          PURCHASE_RESULT_SORTABLE,
          query,
          [desc(receiptDateSql), asc(Products.productCode)],
          PurchaseLineReceivals.id,
        ),
      )
      .limit(limit)
      .offset(offset);

/** Every row the current view matches, as a workbook. */
export const exportPurchaseResults = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Purchase results",
    columns: PURCHASE_RESULT_COLUMNS,
    columnKeys,
    rows: purchaseResultRows(parseTableQuery(params)),
  });

export const getPurchaseResults = async (
  query: TableQuery,
): Promise<Paged<PurchaseResultRow>> => {
  try {
    return await runPaged(query, {
      rows: purchaseResultRows(query),
      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(PurchaseLineReceivals)
          .innerJoin(
            Products,
            eq(PurchaseLineReceivals.productUuid, Products.uuid),
          )
          .leftJoin(
            ProductGroups,
            eq(Products.productGroupUuid, ProductGroups.uuid),
          )
          .where(
            tableWhere({
              query,
              search: PURCHASE_RESULT_SEARCH,
              filters: PURCHASE_RESULT_FILTER_BINDINGS,
              scope: [
                inArray(
                  PurchaseLineReceivals.receiptStatus,
                  ARRIVED_RECEIPT_STATUSES,
                ),
              ],
            }),
          );
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch purchase results"));
  }
};
