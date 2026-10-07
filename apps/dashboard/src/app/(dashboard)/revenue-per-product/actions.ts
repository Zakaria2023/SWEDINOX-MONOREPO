"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import { InvoiceItems } from "@/db/schema/invoice-items";
import { Invoices } from "@/db/schema/invoices";
import { OrderItems } from "@/db/schema/order-items";
import { Orders } from "@/db/schema/orders";
import { ProductGroups } from "@/db/schema/product-groups";
import { Products } from "@/db/schema/products";
import { REVENUE_PER_PRODUCT_COLUMNS } from "@/app/(dashboard)/revenue-per-product/columns";
import { exportRows } from "@/lib/server/excel";
import { dateRangeFilter, tableWhere } from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { count, desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

// The product hierarchy is up to four levels: the article's own group and
// three above it.
const Parent1 = alias(ProductGroups, "parent_1");
const Parent2 = alias(ProductGroups, "parent_2");
const Parent3 = alias(ProductGroups, "parent_3");

/**
 * One row of `Revenue per product`: a product's invoiced sales on one invoice
 * date, split by line type and the options worked on it — the reference's
 * grain, 2 782 rows × 21 columns (exports/revenu-per-products.tsv).
 */
export type RevenuePerProductRow = {
  productCode: string | null;
  productName: string | null;
  /** The group chain, nearest first: the article's group, then upwards. */
  groupChain: string[];
  invoiceDate: string | null;
  orderCategory: string | null;
  sourceType: string | null;
  options: string | null;
  priceUnit: string | null;
  sales: number;
  weightKg: number;
  revenue: number;
  profit: number;
  invoiceLines: number;
};

const SEARCH = [Products.productCode, Products.name] as const;

const FILTERS = {
  invoiceDate: dateRangeFilter(Invoices.invoiceDate),
};

// Sales in the line's own price unit: tonnes are the weight over a thousand,
// kilos the weight, everything else the quantity.
const salesInUnit = sql<string>`COALESCE(SUM(CASE
  WHEN UPPER(${InvoiceItems.priceUnit}) = 'TN' THEN ${InvoiceItems.weightKg} / 1000
  WHEN UPPER(${InvoiceItems.priceUnit}) = 'KG' THEN ${InvoiceItems.weightKg}
  ELSE ${InvoiceItems.quantity}
END), 0)`;

// Every column is aliased: the count wraps the grouped rows in a derived
// table, and a derived table may not carry four columns all called `name`.
const grouped = (query: TableQuery) =>
  db
    .select({
      productCode: sql<string | null>`${Products.productCode}`.as("product_code"),
      productName: sql<string | null>`${Products.name}`.as("product_name"),
      group0: sql<string | null>`${ProductGroups.name}`.as("group_0"),
      group1: sql<string | null>`${Parent1.name}`.as("group_1"),
      group2: sql<string | null>`${Parent2.name}`.as("group_2"),
      group3: sql<string | null>`${Parent3.name}`.as("group_3"),
      invoiceDate: sql<Date | string | null>`${Invoices.invoiceDate}`.as("invoice_date"),
      orderCategory: sql<string | null>`${Orders.orderCategory}`.as(
        "order_category",
      ),
      sourceType: sql<string | null>`${OrderItems.sourceType}`.as("source_type"),
      options: sql<string | null>`${OrderItems.options}`.as("options"),
      priceUnit: sql<string | null>`${InvoiceItems.priceUnit}`.as("price_unit"),
      sales: salesInUnit.as("sales"),
      weightKg: sql<string>`COALESCE(SUM(${InvoiceItems.weightKg}), 0)`.as(
        "weight_kg",
      ),
      revenue: sql<string>`COALESCE(SUM(${InvoiceItems.amount}), 0)`.as(
        "revenue",
      ),
      cost: sql<string>`COALESCE(SUM(${InvoiceItems.costAmount}), 0)`.as("cost"),
      invoiceLines: sql<number>`COUNT(*)`.as("invoice_lines"),
    })
    .from(InvoiceItems)
    .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
    .innerJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
    .leftJoin(ProductGroups, eq(Products.productGroupUuid, ProductGroups.uuid))
    .leftJoin(Parent1, eq(ProductGroups.parentUuid, Parent1.uuid))
    .leftJoin(Parent2, eq(Parent1.parentUuid, Parent2.uuid))
    .leftJoin(Parent3, eq(Parent2.parentUuid, Parent3.uuid))
    .leftJoin(OrderItems, eq(InvoiceItems.orderItemUuid, OrderItems.uuid))
    .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .where(
      tableWhere({
        query,
        search: SEARCH,
        filters: FILTERS,
        scope: [eq(Invoices.cancelled, false)],
      }),
    )
    .groupBy(
      Products.uuid,
      Products.productCode,
      Products.name,
      ProductGroups.name,
      Parent1.name,
      Parent2.name,
      Parent3.name,
      Invoices.invoiceDate,
      Orders.orderCategory,
      OrderItems.sourceType,
      OrderItems.options,
      InvoiceItems.priceUnit,
    );

const revenueRows =
  (query: TableQuery) =>
  async (limit: number, offset: number): Promise<RevenuePerProductRow[]> => {
    const rows = await grouped(query)
      .orderBy(desc(Invoices.invoiceDate), Products.productCode)
      .limit(limit)
      .offset(offset);
    return rows.map((row) => {
      const revenue = Number(row.revenue);
      return {
        productCode: row.productCode,
        productName: row.productName,
        groupChain: [row.group0, row.group1, row.group2, row.group3].filter(
          (name): name is string => Boolean(name),
        ),
        invoiceDate: row.invoiceDate
          ? String(
              row.invoiceDate instanceof Date
                ? row.invoiceDate.toISOString()
                : row.invoiceDate,
            ).slice(0, 10)
          : null,
        orderCategory: row.orderCategory,
        sourceType: row.sourceType,
        options: row.options,
        priceUnit: row.priceUnit,
        sales: Number(row.sales),
        weightKg: Number(row.weightKg),
        revenue,
        profit: revenue - Number(row.cost),
        invoiceLines: Number(row.invoiceLines),
      };
    });
  };

export const getRevenuePerProduct = async (
  query: TableQuery,
): Promise<Paged<RevenuePerProductRow>> => {
  try {
    const rows = await revenueRows(query)(
      query.pageSize,
      (query.page - 1) * query.pageSize,
    );
    const [total] = await db
      .select({ value: count() })
      .from(grouped(query).as("revenue_groups"));
    return {
      rows,
      total: Number(total?.value ?? 0),
      page: query.page,
      pageSize: query.pageSize,
    };
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch revenue per product"),
    );
  }
};

export const exportRevenuePerProduct = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Revenue per product",
    columns: REVENUE_PER_PRODUCT_COLUMNS,
    columnKeys,
    rows: revenueRows(parseTableQuery(params)),
  });
