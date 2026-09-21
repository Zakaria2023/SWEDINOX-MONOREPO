"use server";

import { ORDER_COLUMNS } from "@/app/(dashboard)/orders/columns";
import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { CompanyAddresses } from "@/db/schema/company-addresses";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { Contracts, SelectContracts } from "@/db/schema/contracts";
import { OrderDeblocks } from "@/db/schema/order-deblocks";
import { OrderItemOptions } from "@/db/schema/order-item-options";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import {
  InsertOrders,
  InsertOrderSurcharges,
  Orders,
  OrderSurcharges,
  SelectOrders,
} from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import { Reservations } from "@/db/schema/reservations";
import {
  TransportWorkOrderLines,
  TransportWorkOrders,
} from "@/db/schema/transport-work-orders";
import {
  WarehouseWorkOrderLines,
  WarehouseWorkOrders,
} from "@/db/schema/warehouse-work-orders";
import { Warehouses } from "@/db/schema/warehouses";
import { SelectStock, Stock } from "@/db/schema/stock";
import { InsertTexts, Texts } from "@/db/schema/texts";
import { requireAuth } from "@/lib/auth";
import {
  AddressCategory,
  invoicePaymentTerms,
  orderStatuses,
  orderTypes,
} from "@/lib/enums";
import {
  computeQuoteSummary,
  describeError,
  formatDateColumn,
  generateUuid,
  getQuoteVatRatePercent,
  moneyString,
  pieceWeightForBasis,
  productPieceWeightKg,
  quoteLineFinancials,
  quoteOrderPolicy,
  resolveSurchargeAmounts,
  toDateString,
  todayDateString,
  unloadingRequirements,
} from "@/lib/helpers";
import { checkCredit } from "@/lib/server/credit-control";
import { exportRows } from "@/lib/server/excel";
import { writeSystemLog } from "@/lib/server/system-log";
import { nextWorkOrderNumber } from "@/lib/server/work-order-numbers";
import {
  assertWorkPanelFree,
  releaseWorkPanelLockFor,
} from "@/lib/server/work-panel-locks";
import {
  loadSalesPricingContext,
  minimumMarginFor,
  resolveLineNetPrice,
} from "@/lib/server/sales-pricing";
import {
  booleanFilter,
  dateRangeFilter,
  enumFilter,
  numberRangeFilter,
  relationFilter,
  runPaged,
  tableOrderBy,
  tableWhere,
} from "@/lib/server/table-query";
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
  getTableColumns,
  gte,
  inArray,
  ne,
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

export type OrderCustomerDefaults = {
  paymentTerms: SelectCompanies["paymentTerms"];
  deliveryTerms: SelectCompanies["deliveryTerms"];
  weightType: SelectCompanies["weightType"];
  /** The company's only contact, when it has exactly one. */
  contactUuid: SelectContacts["uuid"] | null;
  deliveryAddressUuid: string | null;
  billingAddressUuid: string | null;
};

export const getOrdersForCompany = async (
  companyUuid: string,
): Promise<OrderOption[]> =>
  db
    .select({ uuid: Orders.uuid, id: Orders.id })
    .from(Orders)
    .where(eq(Orders.companyUuid, companyUuid))
    .orderBy(desc(Orders.createdAt));

const ORDER_SEARCH = [
  Orders.customerRef,
  Orders.ourReference,
  Companies.companyName,
] as const;

const ORDER_SORTABLE = {
  createdAt: Orders.createdAt,
  company: Companies.companyName,
  status: Orders.status,
  deliveryDate: Orders.deliveryDate,
  totalInclVat: Orders.totalInclVat,
};

// Who it is for, what state it is in, when it ships, what it is worth — and the
// financial block, because an order held for credit is the one people go
// looking for. See /financially-blocked, which is this filter as a screen.
const ORDER_FILTERS = {
  status: enumFilter(Orders.status, orderStatuses),
  orderType: enumFilter(Orders.orderType, orderTypes),
  company: relationFilter(Orders.companyUuid),
  paymentTerms: enumFilter(Orders.paymentTerms, invoicePaymentTerms),
  deliveryDate: dateRangeFilter(Orders.deliveryDate),
  total: numberRangeFilter(Orders.totalInclVat),
  financialBlockage: booleanFilter(Orders.financialBlockage),
};

/**
 * The rows one view of the orders overview selects, as a window onto them.
 *
 * Shared by the page and the export so the file cannot drift from the screen:
 * the export is this same query with the page window opened up.
 */
const orderRows =
  (query: TableQuery) =>
  async (limit: number, offset: number): Promise<OrderListItem[]> => {
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
      .where(
        tableWhere({ query, search: ORDER_SEARCH, filters: ORDER_FILTERS }),
      )
      .orderBy(
        ...tableOrderBy(
          ORDER_SORTABLE,
          query,
          [desc(Orders.createdAt)],
          Orders.id,
        ),
      )
      .limit(limit)
      .offset(offset);
    return rows as OrderListItem[];
  };

export const getOrders = async (
  query: TableQuery,
): Promise<Paged<OrderListItem>> => {
  try {
    return await runPaged(query, {
      rows: orderRows(query),

      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(Orders)
          .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
          .where(
            tableWhere({ query, search: ORDER_SEARCH, filters: ORDER_FILTERS }),
          );
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch orders"));
  }
};

/** Every order the current view matches, as a workbook. */
export const exportOrders = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Orders",
    columns: ORDER_COLUMNS,
    columnKeys,
    rows: orderRows(parseTableQuery(params)),
  });

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
 * What a new order for this customer starts out as.
 *
 * Watched on 21-9-2026: typing customer 13000 into a blank order filled the
 * contact, the delivery address, the billing address, the payment terms,
 * `(FCA) Free carrier` and `Trade weight` — all before a line existed.
 *
 * 🔴 `weightType` is the one that earns its keep. It decides which of the
 * product's two densities a line is billed on, and on that order it meant the
 * customer was invoiced for 540 kg of steel that physically weighs 529,9. It is
 * a property of the customer, so a line can neither infer it nor default it.
 *
 * An address is only offered when the customer has exactly one of that kind.
 * Picking the first of several would be a guess, and a delivery address chosen
 * for the wrong site is worse than an empty field somebody has to fill.
 */
export const getOrderCustomerDefaults = async (
  companyUuid: string,
): Promise<OrderCustomerDefaults | null> => {
  const [company] = await db
    .select({
      paymentTerms: Companies.paymentTerms,
      deliveryTerms: Companies.deliveryTerms,
      weightType: Companies.weightType,
    })
    .from(Companies)
    .where(eq(Companies.uuid, companyUuid))
    .limit(1);

  if (!company) {
    return null;
  }

  const contacts = await db
    .select({ uuid: Contacts.uuid })
    .from(Contacts)
    .where(eq(Contacts.companyUuid, companyUuid))
    .limit(2);

  const addresses = await db
    .select({ uuid: CompanyAddresses.uuid, category: CompanyAddresses.category })
    .from(CompanyAddresses)
    .where(eq(CompanyAddresses.companyUuid, companyUuid));

  const onlyAddressFor = (category: AddressCategory): string | null => {
    const matching = addresses.filter((address) =>
      address.category.includes(category),
    );
    return matching.length === 1 ? matching[0].uuid : null;
  };

  return {
    ...company,
    contactUuid: contacts.length === 1 ? contacts[0].uuid : null,
    deliveryAddressUuid: onlyAddressFor("delivery"),
    billingAddressUuid: onlyAddressFor("invoice"),
  };
};

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
  const [lines, options, surcharges, [company]] = await Promise.all([
    tx.select().from(OrderItems).where(eq(OrderItems.orderUuid, orderUuid)),
    // The options charged on the order's lines are revenue of the order too —
    // they are billed with the lines they ride on.
    tx
      .select({ amount: OrderItemOptions.amount, cost: OrderItemOptions.cost })
      .from(OrderItemOptions)
      .where(eq(OrderItemOptions.orderUuid, orderUuid)),
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
    options: options.map((option) => ({
      amount: Number(option.amount ?? 0),
      cost: Number(option.cost ?? 0),
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
    materialsRevenue: moneyString(summary.materials.revenue),
    materialsProfit: moneyString(summary.materials.profit),
    materialsProfitReplPrice: moneyString(summary.materials.profitReplPrice),
    surchargesRevenue: moneyString(summary.surcharges.revenue),
    surchargesProfit: moneyString(summary.surcharges.profit),
    totalExclVat: moneyString(summary.total.revenue),
    vatAmount: moneyString(summary.vatAmount),
    totalInclVat: moneyString(summary.totalInclVat),
    avgKiloPrice: moneyString(summary.avgKiloPrice),
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
    // What the customer's own quote/order settings require of a new document.
    // "Reference required" means the customer will not accept a document that
    // does not quote their reference back at them, and "default pickup" means
    // they collect unless somebody says otherwise.
    const [customer] = await db
      .select({ quoteOrderSettings: Companies.quoteOrderSettings })
      .from(Companies)
      .where(eq(Companies.uuid, fields.companyUuid))
      .limit(1);
    const policy = quoteOrderPolicy(customer?.quoteOrderSettings);

    if (policy.referenceRequired && !fields.customerRef?.trim()) {
      return {
        error: "This customer requires their own reference on every order.",
      };
    }

    // What is available at the delivery address to get the goods off the lorry
    // decides what kind of lorry has to bring them. A site that unloads by crane
    // needs one with a crane on it, and nobody should have to remember that per
    // order.
    const [deliveryAddress] = fields.deliveryAddressUuid
      ? await db
          .select({ availableAt: CompanyAddresses.availableAt })
          .from(CompanyAddresses)
          .where(eq(CompanyAddresses.uuid, fields.deliveryAddressUuid))
          .limit(1)
      : [];
    const unloading = unloadingRequirements(deliveryAddress?.availableAt);

    const orderFields: OrderFields = {
      ...fields,
      isPickup: fields.isPickup ?? policy.defaultPickup,
      completeDelivery: fields.completeDelivery ?? policy.completeDelivery,
      vehicleWithCrane:
        fields.vehicleWithCrane || unloading.needsVehicleWithCrane,
    };

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
      await tx.insert(Orders).values({
        ...orderFields,
        uuid,
        // A block ticked on the form is somebody's decision, not the credit
        // rule's, and the queue shows which is which.
        financialBlockManual: Boolean(orderFields.financialBlockage),
        changedAfterFinancialDeblock: false,
      });

      // Only items whose stock lot still exists become order lines; the line
      // number counts those, not the raw submitted rows.
      const reservableItems = items.flatMap((item) => {
        const stockRow = stockByUuid.get(item.stockUuid);
        return stockRow ? [{ item, stockRow }] : [];
      });

      // What the surcharges below are measured against, accumulated as the
      // lines are priced: a per-kilo surcharge needs the order's weight and a
      // percentage one its value, and neither is known until then.
      const lineTotals = { goodsValue: 0, weightKg: 0 };

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
        const lineLengthMm = Number(product?.length ?? 0);
        const lineWidthMm = Number(product?.widthDiameter ?? 0);
        const lineThicknessMm = Number(product?.thickness ?? 0);

        const financials = quoteLineFinancials({
          netPrice,
          quantity,
          purchasePrice: Number(stockRow.valuationPrice ?? 0),
          replacementPrice: Number(product?.replacementPrice ?? 0),
          // `theoreticalWeight` is a density when the weight unit says M3, so
          // it is only ever read through the helper that checks the unit.
          theoreticalWeight:
            productPieceWeightKg({
              weightTheoretical: product?.weightTheoretical,
              theoreticalWeight: product?.theoreticalWeight,
              weightUnit: product?.weightUnit,
              lengthMm: lineLengthMm,
              widthMm: lineWidthMm,
              thicknessMm: lineThicknessMm,
            }) ?? 0,
          // What the customer is billed on, which is not what the line costs.
          // The order's weight type — inherited from the customer — picks which
          // of the product's weights bills it.
          tradeWeight:
            pieceWeightForBasis(
              {
                weightTrade: product?.weightTrade,
                weightGerman: product?.weightGerman,
              },
              fields.weightType,
            ) ?? undefined,
          lengthMm: lineLengthMm,
          widthMm: lineWidthMm,
          thicknessMm: lineThicknessMm,
          priceUnit: product?.priceUnit,
          minProfitMargin: minimumMarginFor(product, fields.isPickup ?? false),
        });

        const orderItemUuid = generateUuid();

        await tx.insert(OrderItems).values({
          uuid: orderItemUuid,
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

          grossPrice: moneyString(grossPrice),
          priceUnit: product?.priceUnit ?? null,
          groupDiscount: moneyString(groupDiscount),
          lineDiscount: moneyString(lineDiscount),
          netPrice: moneyString(netPrice),
          amount: moneyString(financials.amount),

          costPrice: financials.costPrice.toFixed(4),
          costAmount: moneyString(financials.costAmount),
          replacementPrice: moneyString(Number(product?.replacementPrice ?? 0)),
          profit: moneyString(financials.profit),
          profitMargin: financials.profitMargin.toFixed(2),
          profitReplPrice: moneyString(financials.profitReplPrice),
          profitTooLow: financials.profitTooLow,
        });

        // The reservation, said out loud. `Stock.reservedQuantity` above holds
        // the number; this holds who is holding it, which is what the
        // reference's `Toon reserveringen` panel shows and a bare number
        // cannot: one lot can be spoken for by several lines at once.
        await tx.insert(Reservations).values({
          uuid: generateUuid(),
          stockUuid: item.stockUuid,
          orderItemUuid,
          type: "sale",
          status: "definitive",
          quantity: item.quantity,
          unit: stockRow.unit ?? "st",
          quantityKg: financials.weightKg.toFixed(2),
          reservedFor: fields.deliveryDate ?? null,
        });

        lineTotals.goodsValue += financials.amount;
        lineTotals.weightKg += financials.weightKg;
      }

      if (extras.surcharges.length > 0) {
        await tx.insert(OrderSurcharges).values(
          resolveSurchargeAmounts(extras.surcharges, {
            goodsValue: lineTotals.goodsValue,
            weightKg: lineTotals.weightKg,
            lineCount: reservableItems.length,
          }).map((surcharge) => ({
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
        // Excl. VAT, like everything else the rule weighs.
        orderAmount: Number(summary.totalExclVat),
        // This order's lines are already written, so they are excluded from
        // the committed total and counted once as orderAmount.
        excludeOrderUuid: uuid,
      });

      await tx
        .update(Orders)
        .set({
          ...summary,
          // A waived overrun still gets written down — the order passes, but
          // somebody has to be able to see that it went over the limit.
          ...(credit.reason ? { blockingReason: credit.reason } : {}),
          ...(credit.blocked ? { financialBlockage: true } : {}),
        })
        .where(eq(Orders.uuid, uuid));

      if (orderFields.financialBlockage) {
        await writeSystemLog(tx, {
          category: "financial_block",
          message: "Order entered with a financial block set by hand",
          orderUuid: uuid,
        });
      } else if (credit.blocked) {
        await writeSystemLog(tx, {
          category: "financial_block",
          message: `Order held by the credit rule — ${credit.reason}`,
          orderUuid: uuid,
        });
      }
    });

    revalidatePath("/orders");
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

    // Anything billed stops a cancellation, whether it was billed in full or in
    // part. A part-billed line stays at "delivered" so it can be billed for the
    // rest, so status alone no longer answers the question — the invoiced
    // quantity does, and cancelling around a live invoice would void goods a
    // customer has already been charged for.
    if (
      items.some(
        (item) =>
          item.status === "invoiced" || Number(item.invoicedQuantity ?? 0) > 0,
      )
    ) {
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

        // A cancelled line releases its claim as well as its quantity. The
        // reference's panel offers `Delete` and no status for a lapsed
        // reservation, so a released one leaves no row behind.
        await tx
          .delete(Reservations)
          .where(eq(Reservations.orderItemUuid, item.uuid));
      }
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${uuid}`);
    return { success: true, orderUuid: uuid };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to cancel order",
    };
  }
};

/**
 * Save the order header.
 *
 * Three things ride on a save besides the columns:
 *
 * - **The lock.** While someone else has the order open for editing the save is
 *   refused, and a successful save closes this user's own panel.
 * - **The delivery date's history.** The reference logs every move — `Leverdatum
 *   gewijzigd: 100009/10 van 6-1-2025 naar 10-1-2025`, 149 times — so a promise
 *   that slipped can be seen to have slipped.
 * - **A change after a financial release.** The release covered the order as it
 *   was; once it is edited, the credit rule runs again before goods leave
 *   (`deliverOrderItem`).
 */
export const updateOrder = async (
  uuid: string,
  fields: OrderHeaderEdit,
): Promise<OrderActionResult> => {
  const userId = await requireAuth();
  try {
    const [order] = await db
      .select({
        id: Orders.id,
        status: Orders.status,
        deliveryDate: Orders.deliveryDate,
        financialBlockage: Orders.financialBlockage,
        changedAfterFinancialDeblock: Orders.changedAfterFinancialDeblock,
      })
      .from(Orders)
      .where(eq(Orders.uuid, uuid))
      .limit(1);

    if (!order) {
      return { error: "Order not found." };
    }
    if (order.status === "cancelled") {
      return { error: "Cannot edit a cancelled order." };
    }

    const [released] = await db
      .select({ uuid: OrderDeblocks.uuid })
      .from(OrderDeblocks)
      .where(
        and(
          eq(OrderDeblocks.orderUuid, uuid),
          eq(OrderDeblocks.deblockType, "financial"),
        ),
      )
      .limit(1);
    const changedAfterRelease = Boolean(released) && !order.financialBlockage;

    await db.transaction(async (tx) => {
      await assertWorkPanelFree(tx, "order", uuid, userId);

      await tx
        .update(Orders)
        .set({
          ...fields,
          ...(changedAfterRelease ? { changedAfterFinancialDeblock: true } : {}),
        })
        .where(eq(Orders.uuid, uuid));

      if (fields.deliveryDate !== undefined) {
        const before = formatDateColumn(order.deliveryDate);
        const after = formatDateColumn(fields.deliveryDate);
        if (before !== after) {
          await writeSystemLog(tx, {
            category: "delivery_date_changed",
            message: `Delivery date of order ${order.id} changed from ${before} to ${after}`,
            orderUuid: uuid,
            userId,
          });
        }
      }

      if (changedAfterRelease && !order.changedAfterFinancialDeblock) {
        await writeSystemLog(tx, {
          category: "order_changed_after_release",
          message: `Order ${order.id} was changed after its financial release; the credit rule runs again before delivery`,
          orderUuid: uuid,
          userId,
        });
      }

      await releaseWorkPanelLockFor(tx, "order", uuid, userId);
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to update order",
    };
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${uuid}`);
  redirect(`/orders/${uuid}`);
};

/**
 * Walk a location up its tree to the warehouse it belongs to.
 *
 * The reference's tree is four levels — `00 Hego Almere` → section `01` →
 * subsection `1A` → bin `1A-1` — and some bins go deeper still, so a fixed
 * number of joins would not reach the top. The bound is a guard against a
 * parent cycle, not a claim about the depth.
 */
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const rootWarehouseOf = async (
  tx: Transaction,
  locationUuid: string,
): Promise<string | null> => {
  const seen = new Set<string>();
  const climb = async (uuid: string): Promise<string | null> => {
    if (seen.has(uuid) || seen.size > 16) {
      return null;
    }
    seen.add(uuid);
    const [row] = await tx
      .select({ parentUuid: Warehouses.parentUuid })
      .from(Warehouses)
      .where(eq(Warehouses.uuid, uuid))
      .limit(1);
    if (!row) {
      return null;
    }
    return row.parentUuid ? climb(row.parentUuid) : uuid;
  };
  return climb(locationUuid);
};

/**
 * Make an order final — the one button that turns a typed document into work.
 *
 * Watched on 21-9-2026, on order 102191. A single press produced all of this:
 *
 *   - the order confirmation printed
 *   - the order moved to `Vrijgegeven, Printed` and its line to `Released`
 *   - **warehouse work order 306697** appeared — `Picking`, `From Ontvangst`
 *     `To Laad`, 5 ST / 540 kg, status `New`
 *   - a **transport work order** appeared — direction `Deliver`, the delivery
 *     date, and `Trip` and `Bill of lading` both empty
 *   - no production work order, because a plain stock line needs no cutting
 *
 * So the two work orders are a consequence of releasing the order, not
 * something a planner raises afterwards. Until now nothing in this app created
 * a warehouse work order header at all, and the transport side could only be
 * assembled by hand from the deliveries screen.
 *
 * The transport order is deliberately left with no trip number: on the
 * reference it waits to be put on a lorry, and that is precisely what puts it
 * on the list of deliveries still to be arranged.
 */
export const makeOrderFinal = async (
  orderUuid: string,
): Promise<OrderActionResult> => {
  const userId = await requireAuth();
  try {
    await db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(Orders)
        .where(eq(Orders.uuid, orderUuid))
        .limit(1);

      if (!order) {
        throw new Error("Order not found.");
      }
      if (order.status !== "provisional") {
        throw new Error(
          "Only a provisional order can be made final — this one has already been released.",
        );
      }
      // A held order must not reach the floor. The reference gates delivery on
      // the same flag, which is the whole point of the queue that lists them.
      if (order.financialBlockage) {
        throw new Error(
          "This order is financially blocked. Release the block before making it final.",
        );
      }

      const items = await tx
        .select({
          uuid: OrderItems.uuid,
          lineNumber: OrderItems.lineNumber,
          stockUuid: OrderItems.stockUuid,
          productUuid: OrderItems.productUuid,
          quantity: OrderItems.quantity,
          kgPlanned: OrderItems.kgPlanned,
          lengthMm: OrderItems.lengthMm,
          widthMm: OrderItems.widthMm,
          thicknessMm: OrderItems.thicknessMm,
          productCode: Products.productCode,
          locationUuid: Stock.locationUuid,
        })
        .from(OrderItems)
        .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
        .leftJoin(Stock, eq(OrderItems.stockUuid, Stock.uuid))
        .where(
          and(
            eq(OrderItems.orderUuid, orderUuid),
            ne(OrderItems.status, "cancelled"),
          ),
        );

      if (items.length === 0) {
        throw new Error("An order with no lines has nothing to make final.");
      }

      // Where the picked metal is staged.
      //
      // The reference uses exactly three destinations for a picking, and this
      // is their order of preference because it is their order of frequency
      // across its own 3 936 picking rows: `Laad` 3 420, `Afhaal` 287,
      // `Afroep` 39. Order 102191's picking went to `Laad`.
      //
      // The fallback is not ceremony. Our warehouse tree has no `load` location
      // at all — six rows, four `pick`, one `call_off`, one `collection` — so
      // insisting on one would refuse every order ever made final.
      const [loadLocation] = await tx
        .select({ uuid: Warehouses.uuid })
        .from(Warehouses)
        .where(
          inArray(Warehouses.locationType, ["load", "collection", "call_off"]),
        )
        .orderBy(
          sql`FIELD(${Warehouses.locationType}, 'load', 'collection', 'call_off')`,
        )
        .limit(1);

      if (!loadLocation) {
        throw new Error(
          "No loading, collection or call-off location exists, so there is nowhere to pick this order to. Add one on the warehouses screen first.",
        );
      }

      const firstLocation = items.find(
        (item) => item.locationUuid,
      )?.locationUuid;
      const warehouseUuid = firstLocation
        ? await rootWarehouseOf(tx, firstLocation)
        : null;

      if (!warehouseUuid) {
        throw new Error(
          "The lots on this order do not sit in any warehouse, so no picking can be planned.",
        );
      }

      const number = await nextWorkOrderNumber(tx);
      const workOrderUuid = generateUuid();

      await tx.insert(WarehouseWorkOrders).values({
        uuid: workOrderUuid,
        number,
        warehouseUuid,
        type: "picking",
        // `Orders.deliveryDate` is a Date, the work order's planned date a
        // string, so the conversion is explicit rather than left to Drizzle.
        plannedDate: order.deliveryDate
          ? toDateString(order.deliveryDate)
          : todayDateString(),
        status: "new",
      });

      for (const [index, item] of items.entries()) {
        await tx.insert(WarehouseWorkOrderLines).values({
          uuid: generateUuid(),
          workOrderUuid,
          lineNumber: item.lineNumber ?? index + 1,
          orderItemUuid: item.uuid,
          orderNumber: String(order.id),
          companyUuid: order.companyUuid,
          stockUuid: item.stockUuid,
          productUuid: item.productUuid,
          productCode: item.productCode,
          fromLocationUuid: item.locationUuid,
          toLocationUuid: loadLocation.uuid,
          length: item.lengthMm,
          width: item.widthMm,
          thickness: item.thicknessMm ? Number(item.thicknessMm) : null,
          qtyPlanned: item.quantity,
          kgPlanned: item.kgPlanned,
          status: "new",
        });
      }

      const transportUuid = generateUuid();
      await tx.insert(TransportWorkOrders).values({
        uuid: transportUuid,
        tripNumber: null,
        date: order.deliveryDate ? toDateString(order.deliveryDate) : null,
        status: "new",
      });

      for (const item of items) {
        await tx.insert(TransportWorkOrderLines).values({
          uuid: generateUuid(),
          workOrderUuid: transportUuid,
          destinationCompanyUuid: order.companyUuid,
          productUuid: item.productUuid,
          productCode: item.productCode,
          orderItemUuid: item.uuid,
          orderNumber: String(order.id),
          direction: "deliver",
          status: "new",
          lengthMm: item.lengthMm,
          widthMm: item.widthMm,
          thicknessMm: item.thicknessMm,
          qtyPlanned: item.quantity,
          kgPlanned: item.kgPlanned,
        });
      }

      await tx
        .update(Orders)
        .set({ status: "released", isPrinted: true })
        .where(eq(Orders.uuid, orderUuid));

      await writeSystemLog(tx, {
        category: "order_made_final",
        message: `Order ${order.id} made final — warehouse work order ${number} and a transport work order raised`,
        orderUuid,
        userId,
      });
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderUuid}`);
    revalidatePath("/warehouse-work-orders");
    revalidatePath("/transport-workorders");
    revalidatePath("/deliveries-to-arrange");
    return { success: true, orderUuid };
  } catch (error) {
    return { error: describeError(error, "Failed to make the order final") };
  }
};
