"use server";

import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";

import { db } from "@/db";
import {
  ReturnOrderItems,
  SelectReturnOrderItems,
} from "@/db/schema/return-order-items";
import { ReturnOrders, SelectReturnOrders } from "@/db/schema/return-orders";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import { Complaints, SelectComplaints } from "@/db/schema/complaints";
import { CompanyAddresses } from "@/db/schema/company-addresses";
import {
  RevenueGroups,
  SelectRevenueGroups,
} from "@/db/schema/revenue-groups";
import { WarehouseWorkOrderLines } from "@/db/schema/warehouse-work-orders";
import { returnOrderReasons } from "@/lib/enums";
import { describeError, generateUuid, todayDateString } from "@/lib/helpers";
import { exportRows } from "@/lib/server/excel";
import { getClerkUserNames } from "@/lib/server/clerk";
import {
  dateRangeFilter,
  enumFilter,
  runPaged,
  tableOrderBy,
  tableWhere,
} from "@/lib/server/table-query";
import { returnLineColumns } from "@/app/(dashboard)/return-lines/columns";
import { count, desc, eq, getTableColumns, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { revalidatePath } from "next/cache";

const OriginalOrder = alias(Orders, "original_order");
const OriginalLine = alias(OrderItems, "original_line");

/** The customer's own city and country — its visiting address. */
const visiting = db
  .select({
    companyUuid: CompanyAddresses.companyUuid,
    city: sql<string | null>`MIN(${CompanyAddresses.city})`.as("return_city"),
    country: sql<string | null>`MIN(${CompanyAddresses.country})`.as(
      "return_country",
    ),
  })
  .from(CompanyAddresses)
  .where(sql`JSON_CONTAINS(${CompanyAddresses.category}, '"visit"')`)
  .groupBy(CompanyAddresses.companyUuid)
  .as("return_visiting");

/** Where the return is collected from or delivered to. */
const destination = db
  .select({
    addressUuid: CompanyAddresses.uuid,
    country: CompanyAddresses.country,
  })
  .from(CompanyAddresses)
  .as("return_destination");

export type ReturnLineItem = SelectReturnOrderItems & {
  returnOrderId: SelectReturnOrders["id"] | null;
  customerName: SelectCompanies["companyName"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  // Computed margin figures (no single column backs them).
  profit: number;
  profitMargin: number;
};

/**
 * One row of `Return lines` — all 64 columns of the reference's export (88
 * lines, docs/reference-system/returns-and-complaints.md).
 */
export type ReturnLineRow = SelectReturnOrderItems & {
  returnOrderId: SelectReturnOrders["id"] | null;
  returnOrderRef: SelectReturnOrders["customerRef"] | null;
  ourReference: SelectReturnOrders["ourReference"] | null;
  customerCode: SelectCompanies["id"] | null;
  customerName: SelectCompanies["companyName"] | null;
  representative: SelectCompanies["representative"] | null;
  region: SelectCompanies["region"] | null;
  city: string | null;
  country: string | null;
  destinationCountry: string | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  productPriceUnit: SelectProducts["priceUnit"] | null;
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
  complaintNumber: SelectComplaints["id"] | null;
  complaintDescription: SelectComplaints["description"] | null;
  complaintDate: SelectComplaints["reportDate"] | null;
  originalOrderId: SelectOrders["id"] | null;
  originalOrderType: SelectOrders["orderType"] | null;
  originalConsignment: SelectOrders["isConsignment"] | null;
  originalLineNumber: SelectOrderItems["lineNumber"] | null;
  seller: SelectOrderItems["seller"] | null;
  // Computed.
  deliveries: number;
  originalBillOfLading: string | null;
};

export type GenerateReturnLinesResult = {
  error?: string;
  success?: boolean;
};

export type ReturnLineDetail = ReturnLineItem & {
  companyUuid: SelectCompanies["uuid"] | null;
  returnOrderReason: SelectReturnOrders["returnReason"] | null;
  returnOrderStatus: SelectReturnOrders["status"] | null;
};

const RETURN_LINE_SEARCH = [
  Products.productCode,
  Products.name,
  Companies.companyName,
  ReturnOrderItems.reference,
] as const;

const RETURN_LINE_SORTABLE = {
  order: ReturnOrders.id,
  createdAt: ReturnOrderItems.createdAt,
  productCode: Products.productCode,
  customer: Companies.companyName,
  amount: ReturnOrderItems.amount,
  deliveryDate: ReturnOrderItems.deliveryDate,
};

const RETURN_LINE_FILTERS = {
  returnReason: enumFilter(ReturnOrderItems.returnReason, returnOrderReasons),
  createdAt: dateRangeFilter(ReturnOrderItems.createdAt),
};

const returnLineRows =
  (query: TableQuery) =>
  (limit: number, offset: number): Promise<ReturnLineRow[]> =>
    db
      .select({
        ...getTableColumns(ReturnOrderItems),
        returnOrderId: ReturnOrders.id,
        returnOrderRef: ReturnOrders.customerRef,
        ourReference: ReturnOrders.ourReference,
        customerCode: Companies.id,
        customerName: Companies.companyName,
        representative: Companies.representative,
        region: Companies.region,
        city: visiting.city,
        country: visiting.country,
        destinationCountry: destination.country,
        productCode: Products.productCode,
        productName: Products.name,
        productPriceUnit: Products.priceUnit,
        revenueGroupNumber: RevenueGroups.number,
        revenueGroupName: RevenueGroups.name,
        complaintNumber: Complaints.id,
        complaintDescription: Complaints.description,
        complaintDate: Complaints.reportDate,
        originalOrderId: OriginalOrder.id,
        originalOrderType: OriginalOrder.orderType,
        originalConsignment: OriginalOrder.isConsignment,
        originalLineNumber: OriginalLine.lineNumber,
        seller: OriginalLine.seller,
        // How often the goods came back in: the return receipts booked
        // against this line.
        deliveries: sql<number>`(
          SELECT COUNT(*) FROM ${WarehouseWorkOrderLines}
          WHERE ${WarehouseWorkOrderLines.returnOrderItemUuid} = ${ReturnOrderItems.uuid}
        )`.mapWith(Number),
        // The trip the original line left on — its delivery's bill of lading.
        originalBillOfLading: sql<string | null>`(
          SELECT MAX(${sql.raw("`tl`.`bill_of_lading`")})
          FROM ${sql.raw("`TransportWorkOrderLines` AS `tl`")}
          WHERE ${sql.raw("`tl`.`order_item_uuid`")} = ${ReturnOrderItems.originalOrderItemUuid}
        )`,
      })
      .from(ReturnOrderItems)
      .leftJoin(
        ReturnOrders,
        eq(ReturnOrderItems.returnOrderUuid, ReturnOrders.uuid),
      )
      .leftJoin(Companies, eq(ReturnOrders.companyUuid, Companies.uuid))
      .leftJoin(visiting, eq(visiting.companyUuid, Companies.uuid))
      .leftJoin(
        destination,
        eq(destination.addressUuid, ReturnOrders.deliveryAddressUuid),
      )
      .leftJoin(Products, eq(ReturnOrderItems.productUuid, Products.uuid))
      .leftJoin(RevenueGroups, eq(Products.revenueGroupUuid, RevenueGroups.uuid))
      .leftJoin(Complaints, eq(ReturnOrderItems.complaintUuid, Complaints.uuid))
      .leftJoin(
        OriginalOrder,
        eq(ReturnOrderItems.originalOrderUuid, OriginalOrder.uuid),
      )
      .leftJoin(
        OriginalLine,
        eq(ReturnOrderItems.originalOrderItemUuid, OriginalLine.uuid),
      )
      .where(
        tableWhere({
          query,
          search: RETURN_LINE_SEARCH,
          filters: RETURN_LINE_FILTERS,
        }),
      )
      .orderBy(
        ...tableOrderBy(
          RETURN_LINE_SORTABLE,
          query,
          [desc(ReturnOrderItems.createdAt)],
          ReturnOrderItems.id,
        ),
      )
      .limit(limit)
      .offset(offset);

/**
 * One return line with the return order, customer and product behind it. Margin
 * is derived the same way the overview derives it.
 */
export const getReturnLineDetail = async (
  uuid: string,
): Promise<ReturnLineDetail | null> => {
  try {
    const [row] = await db
      .select({
        ...getTableColumns(ReturnOrderItems),
        returnOrderId: ReturnOrders.id,
        returnOrderReason: ReturnOrders.returnReason,
        returnOrderStatus: ReturnOrders.status,
        customerName: Companies.companyName,
        companyUuid: Companies.uuid,
        productCode: Products.productCode,
        productName: Products.name,
      })
      .from(ReturnOrderItems)
      .leftJoin(
        ReturnOrders,
        eq(ReturnOrderItems.returnOrderUuid, ReturnOrders.uuid),
      )
      .leftJoin(Companies, eq(ReturnOrders.companyUuid, Companies.uuid))
      .leftJoin(Products, eq(ReturnOrderItems.productUuid, Products.uuid))
      .where(eq(ReturnOrderItems.uuid, uuid))
      .limit(1);

    if (!row) {
      return null;
    }

    const amount = Number(row.amount);
    const profit = amount - Number(row.costPrice) * Number(row.quantity);

    return {
      ...row,
      profit,
      profitMargin: amount === 0 ? 0 : (profit / amount) * 100,
    };
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch return line"));
  }
};

// Turns sales orders into return orders + return lines — one return order per
// order (linked via orderUuid), with a return line mirroring each order item.
// Orders that already have a return order are skipped, so it can be re-run.
export const generateReturnLinesFromOrders =
  async (): Promise<GenerateReturnLinesResult> => {
    try {
      const orders = await db
        .select({
          uuid: Orders.uuid,
          id: Orders.id,
          companyUuid: Orders.companyUuid,
          contactUuid: Orders.contactUuid,
        })
        .from(Orders);
      if (orders.length === 0) {
        return { error: "No orders to return from. Create an order first." };
      }

      const existingReturns = await db
        .select({ orderUuid: ReturnOrders.orderUuid })
        .from(ReturnOrders);
      const returnedOrderUuids = new Set(
        existingReturns
          .map((row) => row.orderUuid)
          .filter((uuid): uuid is string => uuid !== null),
      );

      const newOrders = orders.filter(
        (order) => !returnedOrderUuids.has(order.uuid),
      );
      if (newOrders.length === 0) {
        return { error: "Every order already has a return order." };
      }

      const today = todayDateString();

      await db.transaction(async (tx) => {
        for (const order of newOrders) {
          const items = await tx
            .select({
              productUuid: OrderItems.productUuid,
              quantity: OrderItems.quantity,
              unit: OrderItems.unit,
              lineNumber: OrderItems.lineNumber,
              lengthMm: OrderItems.lengthMm,
              widthMm: OrderItems.widthMm,
              thicknessMm: OrderItems.thicknessMm,
              grossPrice: OrderItems.grossPrice,
              amount: OrderItems.amount,
              deliveryDate: OrderItems.deliveryDate,
            })
            .from(OrderItems)
            .where(eq(OrderItems.orderUuid, order.uuid));
          if (items.length === 0) {
            continue;
          }

          const returnOrderUuid = generateUuid();
          await tx.insert(ReturnOrders).values({
            uuid: returnOrderUuid,
            companyUuid: order.companyUuid,
            orderUuid: order.uuid,
            orderReference: String(order.id),
            contactUuid: order.contactUuid,
            status: "open",
            orderDate: today,
          });

          for (const [index, item] of items.entries()) {
            await tx.insert(ReturnOrderItems).values({
              uuid: generateUuid(),
              returnOrderUuid,
              productUuid: item.productUuid,
              originalOrderUuid: order.uuid,
              originalOrderLine: item.lineNumber,
              lineNumber: index + 1,
              quantity: item.quantity,
              returnQty: item.quantity,
              unit: item.unit,
              lengthMm: item.lengthMm,
              widthMm: item.widthMm,
              thicknessMm: item.thicknessMm,
              netPrice: item.grossPrice,
              amount: item.amount,
              deliveryDate: item.deliveryDate,
              reference: String(order.id),
            });
          }
        }
      });

      revalidatePath("/return-lines");
      revalidatePath("/return-orders");
      return { success: true };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate return lines",
      };
    }
  };

/** One page of `Return lines`, searched, filtered and sorted in SQL. */
export const getReturnLines = async (
  query: TableQuery,
): Promise<Paged<ReturnLineRow>> => {
  try {
    const where = tableWhere({
      query,
      search: RETURN_LINE_SEARCH,
      filters: RETURN_LINE_FILTERS,
    });
    return await runPaged(query, {
      rows: returnLineRows(query),
      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(ReturnOrderItems)
          .leftJoin(
            ReturnOrders,
            eq(ReturnOrderItems.returnOrderUuid, ReturnOrders.uuid),
          )
          .leftJoin(Companies, eq(ReturnOrders.companyUuid, Companies.uuid))
          .leftJoin(Products, eq(ReturnOrderItems.productUuid, Products.uuid))
          .where(where);
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch return lines"));
  }
};

/** Every return line the current view matches, as a workbook. */
export const exportReturnLines = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Return lines",
    columns: returnLineColumns(await getClerkUserNames()),
    columnKeys,
    rows: returnLineRows(parseTableQuery(params)),
  });
