"use server";

import { db } from "@/db";
import {
  InsertOrders,
  InsertOrderSurcharges,
  Orders,
  OrderSurcharges,
  SelectOrders,
} from "@/db/schema/orders";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { Contracts, SelectContracts } from "@/db/schema/contracts";
import { Products, SelectProducts } from "@/db/schema/products";
import { SelectStock, Stock } from "@/db/schema/stock";
import { InsertTexts, Texts } from "@/db/schema/texts";
import {
  computeQuoteSummary,
  describeError,
  generateUuid,
  getQuoteVatRatePercent,
  quoteLineFinancials,
} from "@/lib/helpers";
import { checkCredit } from "@/lib/server/credit-control";
import {
  loadSalesPricingContext,
  minimumMarginFor,
  resolveLineNetPrice,
} from "@/lib/server/sales-pricing";
import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  gte,
  inArray,
  sql,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type OrderFields = Omit<
  InsertOrders,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type OrderItemInput = {
  stockUuid: string;
  quantity: string;
};

export type OrderSurchargeInput = Omit<
  InsertOrderSurcharges,
  "id" | "uuid" | "orderUuid" | "createdAt" | "updatedAt"
>;

export type OrderTextInput = Pick<
  InsertTexts,
  "title" | "textBlock" | "textCategoryUuid"
>;

export type OrderExtras = {
  surcharges: OrderSurchargeInput[];
  texts: OrderTextInput[];
  contractUuids: string[];
};

export type ContractOption = Pick<
  SelectContracts,
  "uuid" | "code" | "description" | "contractType"
>;

export type OrderActionResult = {
  orderUuid?: string;
  error?: string;
  success?: boolean;
};

export type OrderListItem = SelectOrders & {
  companyName: SelectCompanies["companyName"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
};

export type OrderOption = Pick<SelectOrders, "uuid" | "id">;

export type OrderItemDetail = SelectOrderItems & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
};

export type OrderDetail = SelectOrders & {
  companyName: SelectCompanies["companyName"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
  items: OrderItemDetail[];
};

export type OrderHeaderEdit = Pick<
  OrderFields,
  "customerRef" | "ourReference" | "deliveryDate" | "deliveryRemark" | "remarks"
>;

export const getOrdersForCompany = async (
  companyUuid: string,
): Promise<OrderOption[]> =>
  db
    .select({ uuid: Orders.uuid, id: Orders.id })
    .from(Orders)
    .where(eq(Orders.companyUuid, companyUuid))
    .orderBy(desc(Orders.createdAt));

export const getOrders = async (): Promise<OrderListItem[]> => {
  try {
    const rows = await db
      .select({
        ...getTableColumns(Orders),
        companyName: Companies.companyName,
        contactFirstName: Contacts.firstName,
        contactLastName: Contacts.lastName,
      })
      .from(Orders)
      .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
      .leftJoin(Contacts, eq(Orders.contactUuid, Contacts.uuid))
      .orderBy(desc(Orders.createdAt));
    return rows as OrderListItem[];
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch orders"));
  }
};

export const getContractsByCompanyUuid = async (
  companyUuid: string,
): Promise<ContractOption[]> =>
  db
    .select({
      uuid: Contracts.uuid,
      code: Contracts.code,
      description: Contracts.description,
      contractType: Contracts.contractType,
    })
    .from(Contracts)
    .where(
      and(
        eq(Contracts.companyUuid, companyUuid),
        inArray(Contracts.role, ["customer", "prospect"]),
      ),
    )
    .orderBy(asc(Contracts.code));

/**
 * Rolls an order's saved lines and surcharges into its header snapshot.
 *
 * Read back from the database rather than from what was just inserted, so the
 * summary always describes what is actually stored — including lines a caller
 * wrote by another path, such as a quote conversion.
 */
export const buildOrderSummary = async (
  tx: Pick<typeof db, "select">,
  orderUuid: string,
  companyUuid: string,
) => {
  const [lines, surcharges, [company]] = await Promise.all([
    tx.select().from(OrderItems).where(eq(OrderItems.orderUuid, orderUuid)),
    tx
      .select()
      .from(OrderSurcharges)
      .where(eq(OrderSurcharges.orderUuid, orderUuid)),
    tx
      .select({ calculateVat: Companies.calculateVat })
      .from(Companies)
      .where(eq(Companies.uuid, companyUuid))
      .limit(1),
  ]);

  const summary = computeQuoteSummary({
    lines: lines.map((line) => ({
      amount: Number(line.amount ?? 0),
      costAmount: Number(line.costAmount ?? 0),
      replacementCost:
        Number(line.replacementPrice ?? 0) * Number(line.quantity ?? 0),
      weightKg: Number(line.kgPlanned ?? 0),
      theoreticalWeightKg: Number(line.kgPlanned ?? 0),
    })),
    surcharges: surcharges.map((surcharge) => ({
      amount: Number(surcharge.amount ?? 0),
      profit: Number(surcharge.profit ?? 0),
    })),
    // An order carries no "calculate VAT if applicable" flag of its own, so it
    // follows the customer's setting alone.
    vatRatePercent: getQuoteVatRatePercent(true, company?.calculateVat),
  });

  return {
    materialsRevenue: summary.materials.revenue.toFixed(2),
    materialsProfit: summary.materials.profit.toFixed(2),
    materialsProfitReplPrice: summary.materials.profitReplPrice.toFixed(2),
    surchargesRevenue: summary.surcharges.revenue.toFixed(2),
    surchargesProfit: summary.surcharges.profit.toFixed(2),
    totalExclVat: summary.total.revenue.toFixed(2),
    vatAmount: summary.vatAmount.toFixed(2),
    totalInclVat: summary.totalInclVat.toFixed(2),
    avgKiloPrice: summary.avgKiloPrice.toFixed(2),
    totalWeightKg: summary.totalWeightKg.toFixed(2),
  };
};

export const createOrder = async (
  fields: OrderFields,
  items: OrderItemInput[] = [],
  extras: OrderExtras = { surcharges: [], texts: [], contractUuids: [] },
): Promise<OrderActionResult> => {
  const uuid = generateUuid();
  try {
    // Validate stock availability before opening the transaction.
    const stockByUuid = new Map<string, SelectStock>();
    if (items.length > 0) {
      const stockUuids = items.map((item) => item.stockUuid);
      const stockRows = await db
        .select()
        .from(Stock)
        .where(inArray(Stock.uuid, stockUuids));
      for (const row of stockRows) {
        stockByUuid.set(row.uuid, row);
      }

      for (const item of items) {
        const stockRow = stockByUuid.get(item.stockUuid);
        if (!stockRow) {
          return {
            error: "One or more selected stock items could not be found.",
          };
        }
        if (stockRow.status !== "pending") {
          return {
            error: "One or more selected stock items are no longer available.",
          };
        }
        const freeQuantity =
          Number(stockRow.quantity) - Number(stockRow.reservedQuantity);
        if (Number(item.quantity) > freeQuantity) {
          return {
            error: `Cannot reserve more than the available quantity (${freeQuantity.toFixed(3)}).`,
          };
        }
      }
    }

    // Price and cost the lines before opening the transaction — both are reads,
    // and neither should hold the stock rows locked while it happens.
    //
    // An order references its contracts the other way round (Contracts.orderUuid),
    // so the contract being applied is whichever was attached on the form; the
    // first is the one its prices come from.
    const pricingContext = await loadSalesPricingContext(
      extras.contractUuids[0] ?? null,
      [
        ...new Set(
          items.flatMap((item) => {
            const stockRow = stockByUuid.get(item.stockUuid);
            return stockRow ? [stockRow.productUuid] : [];
          }),
        ),
      ],
    );

    await db.transaction(async (tx) => {
      await tx.insert(Orders).values({ ...fields, uuid });

      // Only items whose stock lot still exists become order lines; the line
      // number counts those, not the raw submitted rows.
      const reservableItems = items.flatMap((item) => {
        const stockRow = stockByUuid.get(item.stockUuid);
        return stockRow ? [{ item, stockRow }] : [];
      });

      for (const [index, { item, stockRow }] of reservableItems.entries()) {
        const nextReserved = (
          Number(stockRow.reservedQuantity) + Number(item.quantity)
        ).toFixed(3);

        // Guard: only reserve if the free quantity we validated above is
        // still there — a concurrent reservation/consumption can't cause
        // this lot to be oversold.
        const [updateResult] = await tx
          .update(Stock)
          .set({ reservedQuantity: nextReserved })
          .where(
            and(
              eq(Stock.uuid, item.stockUuid),
              eq(Stock.status, "pending"),
              gte(
                sql`(${Stock.quantity} - ${Stock.reservedQuantity})`,
                item.quantity,
              ),
            ),
          );

        if (updateResult.affectedRows === 0) {
          throw new Error(
            "Stock changed while reserving — please refresh and try again.",
          );
        }

        const quantity = Number(item.quantity);
        const product = pricingContext.productByUuid.get(stockRow.productUuid);
        const { grossPrice, groupDiscount, lineDiscount, netPrice } =
          resolveLineNetPrice(pricingContext, stockRow.productUuid, quantity);

        // The line is allocated to this exact lot, so its cost is what the lot
        // is valued at — not an average across every lot of the product. That
        // is the whole reason an order can report a truer margin than the quote
        // it came from.
        const financials = quoteLineFinancials({
          netPrice,
          quantity,
          purchasePrice: Number(stockRow.valuationPrice ?? 0),
          replacementPrice: Number(product?.replacementPrice ?? 0),
          theoreticalWeight: Number(product?.theoreticalWeight ?? 0),
          lengthMm: Number(product?.length ?? 0),
          minProfitMargin: minimumMarginFor(product, fields.isPickup ?? false),
        });

        await tx.insert(OrderItems).values({
          uuid: generateUuid(),
          orderUuid: uuid,
          stockUuid: item.stockUuid,
          productUuid: stockRow.productUuid,
          quantity: item.quantity,
          // Planned = the ordered amount; nothing is called off yet, so the
          // full quantity is still "to be called" until call-offs reduce it.
          qtyPlanned: item.quantity,
          qtyReserved: item.quantity,
          kgPlanned: financials.weightKg.toFixed(2),
          lineNumber: index + 1,
          status: "reserved",

          grossPrice: grossPrice.toFixed(2),
          priceUnit: product?.priceUnit ?? null,
          groupDiscount: groupDiscount.toFixed(2),
          lineDiscount: lineDiscount.toFixed(2),
          netPrice: netPrice.toFixed(2),
          amount: financials.amount.toFixed(2),

          costPrice: financials.costPrice.toFixed(4),
          costAmount: financials.costAmount.toFixed(2),
          replacementPrice: Number(product?.replacementPrice ?? 0).toFixed(2),
          profit: financials.profit.toFixed(2),
          profitMargin: financials.profitMargin.toFixed(2),
          profitReplPrice: financials.profitReplPrice.toFixed(2),
          profitTooLow: financials.profitTooLow,
        });
      }

      if (extras.surcharges.length > 0) {
        await tx.insert(OrderSurcharges).values(
          extras.surcharges.map((surcharge) => ({
            ...surcharge,
            uuid: generateUuid(),
            orderUuid: uuid,
          })),
        );
      }

      if (extras.texts.length > 0) {
        await tx.insert(Texts).values(
          extras.texts.map((text) => ({
            uuid: generateUuid(),
            orderUuid: uuid,
            companyUuid: fields.companyUuid,
            title: text.title,
            textBlock: text.textBlock,
            textCategoryUuid: text.textCategoryUuid ?? null,
          })),
        );
      }

      if (extras.contractUuids.length > 0) {
        await tx
          .update(Contracts)
          .set({ orderUuid: uuid })
          .where(inArray(Contracts.uuid, extras.contractUuids));
      }

      const summary = await buildOrderSummary(tx, uuid, fields.companyUuid);

      // What the customer would owe once this order is invoiced, against the
      // limit recorded on the debtor. The order is held, not refused: it stays
      // a real order and surfaces on the Financially Blocked overview, where
      // someone with the authority can release it — which is also the only
      // thing that records who took that decision.
      //
      // A block is only ever added here, never lifted: an order the form
      // already marked blocked stays blocked whatever the arithmetic says.
      const credit = await checkCredit(tx, {
        companyUuid: fields.companyUuid,
        orderAmount: Number(summary.totalInclVat),
        paymentTerms: fields.paymentTerms,
      });

      await tx
        .update(Orders)
        .set({
          ...summary,
          ...(credit.blocked
            ? { financialBlockage: true, blockingReason: credit.reason }
            : {}),
        })
        .where(eq(Orders.uuid, uuid));
    });

    revalidatePath("/orders");
    revalidatePath("/stock");
    revalidatePath("/financially-blocked");
    return { success: true, orderUuid: uuid };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create order",
    };
  }
};

export const getOrderDetail = async (
  uuid: string,
): Promise<OrderDetail | null> => {
  const [order] = await db
    .select({
      ...getTableColumns(Orders),
      companyName: Companies.companyName,
      contactFirstName: Contacts.firstName,
      contactLastName: Contacts.lastName,
    })
    .from(Orders)
    .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
    .leftJoin(Contacts, eq(Orders.contactUuid, Contacts.uuid))
    .where(eq(Orders.uuid, uuid))
    .limit(1);

  if (!order) {
    return null;
  }

  const items = await db
    .select({
      ...getTableColumns(OrderItems),
      productCode: Products.productCode,
      productName: Products.name,
    })
    .from(OrderItems)
    .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
    .where(eq(OrderItems.orderUuid, uuid));

  return { ...order, items };
};

export const cancelOrder = async (uuid: string): Promise<OrderActionResult> => {
  try {
    const [order] = await db
      .select()
      .from(Orders)
      .where(eq(Orders.uuid, uuid))
      .limit(1);

    if (!order) {
      return { error: "Order not found." };
    }
    if (order.status === "cancelled") {
      return { error: "This order is already cancelled." };
    }

    const items = await db
      .select()
      .from(OrderItems)
      .where(eq(OrderItems.orderUuid, uuid));

    if (items.some((item) => item.status === "invoiced")) {
      return {
        error:
          "Cannot cancel: some products on this order have already been invoiced.",
      };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(Orders)
        .set({ status: "cancelled" })
        .where(eq(Orders.uuid, uuid));

      for (const item of items) {
        if (item.status !== "reserved") {
          continue;
        }

        await tx
          .update(OrderItems)
          .set({ status: "cancelled" })
          .where(eq(OrderItems.uuid, item.uuid));

        const [stockRow] = await tx
          .select()
          .from(Stock)
          .where(eq(Stock.uuid, item.stockUuid))
          .limit(1);

        if (!stockRow) {
          continue;
        }

        const releasedReserved = Math.max(
          0,
          Number(stockRow.reservedQuantity) - Number(item.quantity),
        ).toFixed(3);

        await tx
          .update(Stock)
          .set({ reservedQuantity: releasedReserved })
          .where(eq(Stock.uuid, item.stockUuid));
      }
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${uuid}`);
    revalidatePath("/stock");
    return { success: true, orderUuid: uuid };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to cancel order",
    };
  }
};

export const updateOrder = async (
  uuid: string,
  fields: OrderHeaderEdit,
): Promise<OrderActionResult> => {
  try {
    const [order] = await db
      .select({ status: Orders.status })
      .from(Orders)
      .where(eq(Orders.uuid, uuid))
      .limit(1);

    if (!order) {
      return { error: "Order not found." };
    }
    if (order.status === "cancelled") {
      return { error: "Cannot edit a cancelled order." };
    }

    await db.update(Orders).set(fields).where(eq(Orders.uuid, uuid));
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to update order",
    };
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${uuid}`);
  redirect(`/orders/${uuid}`);
};
