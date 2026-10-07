"use server";

import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";

import { db } from "@/db";
import {
  OrderItemOptions,
  SelectOrderItemOptions,
} from "@/db/schema/order-item-options";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { CompanyAddresses } from "@/db/schema/company-addresses";
import { OPTION_LINE_COLUMNS } from "@/app/(dashboard)/options/columns";
import { orderLineStatuses, orderTypes } from "@/lib/enums";
import { exportRows } from "@/lib/server/excel";
import {
  enumFilter,
  relationFilter,
  runPaged,
  tableOrderBy,
  tableWhere,
} from "@/lib/server/table-query";
import { buildOrderSummary } from "@/app/(dashboard)/orders/actions";
import { RevenueGroups, SelectRevenueGroups } from "@/db/schema/revenue-groups";
import {
  ProductOptionPrices,
  SalesOptions,
  SelectSalesOptions,
} from "@/db/schema/sales-options";
import {
  describeError,
  generateUuid,
  moneyString,
  optionAmount,
  todayDateString,
} from "@/lib/helpers";
import {
  and,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lte,
  getTableColumns,
  or,
  sql,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";

/** The customer's own city — its visiting address. */
const visiting = db
  .select({
    companyUuid: CompanyAddresses.companyUuid,
    city: sql<string | null>`MIN(${CompanyAddresses.city})`.as("option_city"),
  })
  .from(CompanyAddresses)
  .where(sql`JSON_CONTAINS(${CompanyAddresses.category}, '"visit"')`)
  .groupBy(CompanyAddresses.companyUuid)
  .as("option_visiting");

/**
 * One row of `Options`: one option charged on one order line — the
 * reference's grain, 2 890 rows × 31 columns
 * (docs/reference-system/sales-options-and-calloff.md).
 */
export type OptionLineRow = SelectOrderItemOptions & {
  optionCode: SelectSalesOptions["code"] | null;
  optionName: SelectSalesOptions["name"] | null;
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
  orderId: SelectOrders["id"] | null;
  ourReference: SelectOrders["ourReference"] | null;
  customerRef: SelectOrders["customerRef"] | null;
  orderType: SelectOrders["orderType"] | null;
  isConsignment: SelectOrders["isConsignment"] | null;
  lineNumber: SelectOrderItems["lineNumber"] | null;
  sourceType: SelectOrderItems["sourceType"] | null;
  lengthMm: SelectOrderItems["lengthMm"] | null;
  widthMm: SelectOrderItems["widthMm"] | null;
  deliveryDate: SelectOrderItems["deliveryDate"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  customerCode: SelectCompanies["id"] | null;
  customerName: SelectCompanies["companyName"] | null;
  representative: SelectCompanies["representative"] | null;
  city: string | null;
};

export type GenerateOptionChargesResult = {
  error?: string;
  success?: boolean;
  createdCharges?: number;
};

const OPTION_SEARCH = [
  Products.productCode,
  Companies.companyName,
  SalesOptions.code,
  SalesOptions.name,
  Orders.customerRef,
] as const;

const OPTION_SORTABLE = {
  order: Orders.id,
  createdAt: OrderItemOptions.createdAt,
  optionCode: SalesOptions.code,
  customer: Companies.companyName,
  amount: OrderItemOptions.amount,
  deliveryDate: OrderItems.deliveryDate,
};

const OPTION_FILTERS = {
  lineStatus: enumFilter(OrderItemOptions.lineStatus, orderLineStatuses),
  option: relationFilter(OrderItemOptions.optionUuid),
  revenueGroup: relationFilter(OrderItemOptions.revenueGroupUuid),
  orderType: enumFilter(Orders.orderType, orderTypes),
};

const optionLineRows =
  (query: TableQuery) =>
  (limit: number, offset: number): Promise<OptionLineRow[]> =>
    db
      .select({
        ...getTableColumns(OrderItemOptions),
        optionCode: SalesOptions.code,
        optionName: SalesOptions.name,
        revenueGroupNumber: RevenueGroups.number,
        revenueGroupName: RevenueGroups.name,
        orderId: Orders.id,
        ourReference: Orders.ourReference,
        customerRef: Orders.customerRef,
        orderType: Orders.orderType,
        isConsignment: Orders.isConsignment,
        lineNumber: OrderItems.lineNumber,
        sourceType: OrderItems.sourceType,
        lengthMm: OrderItems.lengthMm,
        widthMm: OrderItems.widthMm,
        deliveryDate: OrderItems.deliveryDate,
        productCode: Products.productCode,
        productName: Products.name,
        customerCode: Companies.id,
        customerName: Companies.companyName,
        representative: Companies.representative,
        city: visiting.city,
      })
      .from(OrderItemOptions)
      .leftJoin(SalesOptions, eq(OrderItemOptions.optionUuid, SalesOptions.uuid))
      .leftJoin(
        RevenueGroups,
        eq(OrderItemOptions.revenueGroupUuid, RevenueGroups.uuid),
      )
      .leftJoin(OrderItems, eq(OrderItemOptions.orderItemUuid, OrderItems.uuid))
      .leftJoin(Orders, eq(OrderItemOptions.orderUuid, Orders.uuid))
      .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
      .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
      .leftJoin(visiting, eq(visiting.companyUuid, Companies.uuid))
      .where(
        tableWhere({ query, search: OPTION_SEARCH, filters: OPTION_FILTERS }),
      )
      .orderBy(
        ...tableOrderBy(
          OPTION_SORTABLE,
          query,
          [desc(OrderItemOptions.createdAt)],
          OrderItemOptions.id,
        ),
      )
      .limit(limit)
      .offset(offset);

// Books the priced options onto the order lines that don't carry them yet.
//
// For every order line, each option that has a price for that product and is
// valid today is charged at that price times the line quantity; the option's
// cost price gives the cost, and the difference is the profit the Options
// overview reports. The price is copied onto the charge, so changing the option
// price later does not rewrite revenue that was already booked.
//
// Order lines that already carry option charges are skipped, so it can be
// re-run after adding orders.
export const generateOptionCharges =
  async (): Promise<GenerateOptionChargesResult> => {
    try {
      const today = todayDateString();

      const lines = await db
        .select({
          uuid: OrderItems.uuid,
          orderUuid: OrderItems.orderUuid,
          productUuid: OrderItems.productUuid,
          quantity: OrderItems.quantity,
          unit: OrderItems.unit,
          weightKg: OrderItems.kgPlanned,
          // Dimensions come along because a surface treatment is charged by
          // area, not by piece.
          lengthMm: OrderItems.lengthMm,
          widthMm: OrderItems.widthMm,
          lineStatus: OrderItems.lineStatus,
          productRevenueGroupUuid: Products.revenueGroupUuid,
        })
        .from(OrderItems)
        .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid));

      if (lines.length === 0) {
        return { error: "No order lines yet. Create an order first." };
      }

      const charged = new Set(
        (
          await db
            .select({ orderItemUuid: OrderItemOptions.orderItemUuid })
            .from(OrderItemOptions)
        ).map((row) => row.orderItemUuid),
      );

      const openLines = lines.filter((line) => !charged.has(line.uuid));
      if (openLines.length === 0) {
        return {
          error: "Every order line already carries its option charges.",
        };
      }

      // Every option price in force today, keyed by product.
      const prices = await db
        .select({
          productUuid: ProductOptionPrices.productUuid,
          optionUuid: ProductOptionPrices.optionUuid,
          basePrice: ProductOptionPrices.basePrice,
          costPrice: ProductOptionPrices.costPrice,
          priceUnit: ProductOptionPrices.priceUnit,
          optionRevenueGroupUuid: SalesOptions.revenueGroupUuid,
        })
        .from(ProductOptionPrices)
        .innerJoin(
          SalesOptions,
          eq(ProductOptionPrices.optionUuid, SalesOptions.uuid),
        )
        .where(
          and(
            eq(SalesOptions.isActive, true),
            or(
              isNull(ProductOptionPrices.validFrom),
              lte(ProductOptionPrices.validFrom, today),
            ),
            or(
              isNull(ProductOptionPrices.validUntil),
              gte(ProductOptionPrices.validUntil, today),
            ),
          ),
        );

      if (prices.length === 0) {
        return {
          error:
            "No option prices in force. Price the options on /option-prices-per-product first.",
        };
      }

      const pricesByProduct = new Map<string, typeof prices>();
      for (const price of prices) {
        const existing = pricesByProduct.get(price.productUuid) ?? [];
        existing.push(price);
        pricesByProduct.set(price.productUuid, existing);
      }

      const rows: (typeof OrderItemOptions.$inferInsert)[] = [];

      for (const line of openLines) {
        const linePrices = pricesByProduct.get(line.productUuid) ?? [];
        const quantity = Number(line.quantity ?? 0);

        for (const price of linePrices) {
          const unitPrice = Number(price.basePrice ?? 0);
          const unitCost = Number(price.costPrice ?? 0);

          // An option's price carries the basis it is struck in, so the charge
          // is that measure of the line rather than its piece count. Grinding
          // at EUR 1,70 per m2 on ten 2000 x 1000 sheets is EUR 34,00, not
          // EUR 17,00.
          const measured = {
            quantity,
            weightKg: Number(line.weightKg ?? 0),
            lengthMm: line.lengthMm,
            widthMm: line.widthMm,
          };
          const amount = optionAmount(unitPrice, price.priceUnit, measured);
          const cost = optionAmount(unitCost, price.priceUnit, measured);

          rows.push({
            uuid: generateUuid(),
            orderUuid: line.orderUuid,
            orderItemUuid: line.uuid,
            optionUuid: price.optionUuid,
            revenueGroupUuid:
              price.optionRevenueGroupUuid ?? line.productRevenueGroupUuid,
            lineStatus: line.lineStatus,
            quantity: quantity.toFixed(3),
            unit: line.unit,
            weightKg: line.weightKg ?? "0.00",
            price: moneyString(unitPrice),
            priceUnit: price.priceUnit,
            costPrice: moneyString(unitCost),
            amount: moneyString(amount),
            cost: moneyString(cost),
            profit: moneyString(amount - cost),
          });
        }
      }

      if (rows.length === 0) {
        return {
          error:
            "None of the ordered products have an option price in force today.",
        };
      }

      await db.insert(OrderItemOptions).values(rows);

      // Options are revenue of the order they ride on, so each order they were
      // added to has its totals — and the figure its credit check weighs —
      // rebuilt.
      const orderUuids = [
        ...new Set(rows.map((row) => row.orderUuid)),
      ];
      const orders = await db
        .select({ uuid: Orders.uuid, companyUuid: Orders.companyUuid })
        .from(Orders)
        .where(inArray(Orders.uuid, orderUuids));
      for (const order of orders) {
        await db
          .update(Orders)
          .set(await buildOrderSummary(db, order.uuid, order.companyUuid))
          .where(eq(Orders.uuid, order.uuid));
      }

      revalidatePath("/options");
      revalidatePath("/orders");
      return { success: true, createdCharges: rows.length };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate option charges",
      };
    }
  };

/** One page of `Options`, searched, filtered and sorted in SQL. */
export const getOptionLines = async (
  query: TableQuery,
): Promise<Paged<OptionLineRow>> => {
  try {
    const where = tableWhere({
      query,
      search: OPTION_SEARCH,
      filters: OPTION_FILTERS,
    });
    return await runPaged(query, {
      rows: optionLineRows(query),
      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(OrderItemOptions)
          .leftJoin(
            SalesOptions,
            eq(OrderItemOptions.optionUuid, SalesOptions.uuid),
          )
          .leftJoin(
            OrderItems,
            eq(OrderItemOptions.orderItemUuid, OrderItems.uuid),
          )
          .leftJoin(Orders, eq(OrderItemOptions.orderUuid, Orders.uuid))
          .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
          .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
          .where(where);
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch options"));
  }
};

/** Every option line the current view matches, as a workbook. */
export const exportOptionLines = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Options",
    columns: OPTION_LINE_COLUMNS,
    columnKeys,
    rows: optionLineRows(parseTableQuery(params)),
  });
