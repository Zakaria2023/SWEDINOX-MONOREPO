"use server";

import { db } from "@/db";
import {
  InsertPurchaseOrders,
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import {
  PurchaseOrderItems,
  SelectPurchaseOrderItems,
} from "@/db/schema/purchase-order-items";
import { SelectStock, Stock } from "@/db/schema/stock";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import {
  CommunicationSettings,
  SelectCommunicationSettings,
} from "@/db/schema/communication-settings";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { Contracts, SelectContracts } from "@/db/schema/contracts";
import { Products, SelectProducts } from "@/db/schema/products";
import {
  PurchaseLineReceivals,
  SelectPurchaseLineReceivals,
} from "@/db/schema/purchase-line-receivals";
import {
  PurchaseReturnOrderItems,
  SelectPurchaseReturnOrderItems,
} from "@/db/schema/purchase-return-order-items";
import {
  PurchaseReturnOrders,
  SelectPurchaseReturnOrders,
} from "@/db/schema/purchase-return-orders";
import { mailDocument, sendPurchaseOrderEmail } from "@/emails/documents";
import { purchaseOrderStatuses } from "@/lib/enums";
import { describeError, generateUuid } from "@/lib/helpers";
import {
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
import { exportRows } from "@/lib/server/excel";
import { PURCHASE_ORDER_COLUMNS } from "@/app/(dashboard)/purchase-orders/columns";
import { currentUser } from "@clerk/nextjs/server";
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  gt,
  inArray,
  ne,
  sql,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type PurchaseOrderFields = Omit<
  InsertPurchaseOrders,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type PurchaseOrderItemInput = {
  productUuid: string;
  quantity: string;
  /** Agreed purchase price per unit — what the received lot is valued at. */
  netPrice: string;
  priceUnit?: string;
};

export type PurchaseOrderActionResult = {
  purchaseOrderUuid?: string;
  error?: string;
  success?: boolean;
};

export type PurchaseOrderListItem = SelectPurchaseOrders & {
  supplierName: SelectCompanies["companyName"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
};

export type PurchaseOrderOption = Pick<
  SelectPurchaseOrders,
  "uuid" | "id" | "reference"
>;

export type ReceivablePurchaseOrderItem = {
  uuid: SelectPurchaseOrderItems["uuid"];
  productUuid: SelectPurchaseOrderItems["productUuid"];
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  purchaseOrderUuid: SelectPurchaseOrderItems["purchaseOrderUuid"];
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  orderedQuantity: SelectPurchaseOrderItems["quantity"];
  // quantity − qtyReceived, computed in SQL, so it stays a plain string.
  remainingQuantity: string;
};

export type PurchaseOrderItemDetail = {
  uuid: string;
  productUuid: string;
  productCode: string;
  productName: string;
  orderedQuantity: string;
  netPrice: SelectPurchaseOrderItems["netPrice"];
  priceUnit: SelectPurchaseOrderItems["priceUnit"];
  amount: SelectPurchaseOrderItems["amount"];
  stockUuid: string | null;
  stockQuantity: string | null;
  stockStatus: SelectStock["status"] | null;
  // What the received lot was actually valued at. Normally the line's own
  // price, but a lot received before purchase lines carried one reads zero —
  // which is precisely what needs correcting rather than hiding.
  stockValuationPrice: SelectStock["valuationPrice"] | null;
};

// A goods receipt booked against this order — the "Product Receipt Documents"
// section. Recorded since receivals existed and never shown on the order they
// belong to, so what had actually arrived could only be found by leaving it.
export type PurchaseReceiptDocument = {
  uuid: SelectPurchaseLineReceivals["uuid"];
  lineNumber: SelectPurchaseLineReceivals["lineNumber"];
  receiptDate: SelectPurchaseLineReceivals["receiptDate"];
  receiptStatus: SelectPurchaseLineReceivals["receiptStatus"];
  lineStatus: SelectPurchaseLineReceivals["lineStatus"];
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  qtyPlanned: SelectPurchaseLineReceivals["qtyPlanned"];
  receivedQty: SelectPurchaseLineReceivals["receivedQty"];
  kgActual: SelectPurchaseLineReceivals["kgActual"];
  lineAmount: SelectPurchaseLineReceivals["lineAmount"];
  purchaser: SelectPurchaseLineReceivals["purchaser"];
};

// A line of this order the supplier is being asked to take back.
export type PurchaseOrderReturnLine = {
  uuid: SelectPurchaseReturnOrderItems["uuid"];
  returnOrderUuid: SelectPurchaseReturnOrderItems["purchaseReturnOrderUuid"];
  returnOrderId: SelectPurchaseReturnOrders["id"] | null;
  returnOrderStatus: SelectPurchaseReturnOrders["status"] | null;
  lineNumber: SelectPurchaseReturnOrderItems["lineNumber"];
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  returnQty: SelectPurchaseReturnOrderItems["returnQty"];
  unit: SelectPurchaseReturnOrderItems["unit"];
  returnReason: SelectPurchaseReturnOrderItems["returnReason"];
  returnDate: SelectPurchaseReturnOrderItems["returnDate"];
  amount: SelectPurchaseReturnOrderItems["amount"];
};

export type PurchaseOrderDetail = SelectPurchaseOrders & {
  supplierName: SelectCompanies["companyName"] | null;
  agentName: SelectCompanies["companyName"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
  items: PurchaseOrderItemDetail[];
  // What has actually arrived against this order.
  receipts: PurchaseReceiptDocument[];
  // Agreements attached to this order — the schema has carried the link since
  // contracts existed and no screen followed it.
  contracts: SelectContracts[];
  // Lines going back to the supplier.
  returnLines: PurchaseOrderReturnLine[];
  // How documents reach this supplier: which channel and address each document
  // type is routed to. Held per company, shown here because the purchase order
  // is where somebody asks "did this actually get sent, and where?".
  communication: SelectCommunicationSettings[];
};

export type PurchaseOrderHeaderEdit = Pick<
  PurchaseOrderFields,
  | "reference"
  | "ourReference"
  | "orderCategory"
  | "paymentTerms"
  | "deliveryDate"
  | "deliveryRemark"
  | "remarks"
>;

export const getPurchaseOrdersForCompany = async (
  supplierUuid: string,
): Promise<PurchaseOrderOption[]> =>
  db
    .select({
      uuid: PurchaseOrders.uuid,
      id: PurchaseOrders.id,
      reference: PurchaseOrders.reference,
    })
    .from(PurchaseOrders)
    .where(eq(PurchaseOrders.supplierUuid, supplierUuid))
    .orderBy(desc(PurchaseOrders.createdAt));

const PURCHASE_ORDER_SEARCH = [
  PurchaseOrders.ourReference,
  PurchaseOrders.reference,
  Companies.companyName,
] as const;

const PURCHASE_ORDER_SORTABLE = {
  createdAt: PurchaseOrders.createdAt,
  supplier: Companies.companyName,
  status: PurchaseOrders.status,
  orderDate: PurchaseOrders.orderDate,
  deliveryDate: PurchaseOrders.deliveryDate,
  amount: PurchaseOrders.amount,
};

// Which supplier, what state, when it was placed, when it is due, what it is
// worth. Status is what /purchase-orders-to-be-received is a view of, so it
// carries an index of its own.
const PURCHASE_ORDER_FILTERS = {
  status: enumFilter(PurchaseOrders.status, purchaseOrderStatuses),
  supplier: relationFilter(PurchaseOrders.supplierUuid),
  orderDate: dateRangeFilter(PurchaseOrders.orderDate),
  deliveryDate: dateRangeFilter(PurchaseOrders.deliveryDate),
  amount: numberRangeFilter(PurchaseOrders.amount),
};

/**
 * The rows one view of the purchase orders overview selects, as a window onto
 * them. Shared by the page and the export.
 */
const purchaseOrderRows =
  (query: TableQuery) =>
  (limit: number, offset: number): Promise<PurchaseOrderListItem[]> =>
    db
      .select({
        ...getTableColumns(PurchaseOrders),
        supplierName: Companies.companyName,
        contactFirstName: Contacts.firstName,
        contactLastName: Contacts.lastName,
      })
      .from(PurchaseOrders)
      .leftJoin(Companies, eq(PurchaseOrders.supplierUuid, Companies.uuid))
      .leftJoin(Contacts, eq(PurchaseOrders.contactUuid, Contacts.uuid))
      .where(
        tableWhere({
          query,
          search: PURCHASE_ORDER_SEARCH,
          filters: PURCHASE_ORDER_FILTERS,
        }),
      )
      .orderBy(
        ...tableOrderBy(
          PURCHASE_ORDER_SORTABLE,
          query,
          [desc(PurchaseOrders.createdAt)],
          PurchaseOrders.id,
        ),
      )
      .limit(limit)
      .offset(offset);

/** Every purchase order the current view matches, as a workbook. */
export const exportPurchaseOrders = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Purchase Orders",
    columns: PURCHASE_ORDER_COLUMNS,
    columnKeys,
    rows: purchaseOrderRows(parseTableQuery(params)),
  });

export const getPurchaseOrders = async (
  query: TableQuery,
): Promise<Paged<PurchaseOrderListItem>> => {
  try {
    const where = tableWhere({
      query,
      search: PURCHASE_ORDER_SEARCH,
      filters: PURCHASE_ORDER_FILTERS,
    });

    return await runPaged(query, {
      rows: purchaseOrderRows(query),

      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(PurchaseOrders)
          .leftJoin(Companies, eq(PurchaseOrders.supplierUuid, Companies.uuid))
          .where(where);
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch purchase orders"));
  }
};

// Outstanding quantity on a purchase-order line still waiting to be received:
// what was ordered minus what earlier purchase invoices already received.
const receivableQuantity = sql<string>`(${PurchaseOrderItems.quantity} - COALESCE(${PurchaseOrderItems.qtyReceived}, 0))`;

// Purchase-order lines from a supplier that still have quantity left to
// receive — the pool a purchase invoice draws from to book goods into stock.
export const getReceivablePurchaseOrderItemsForCompany = async (
  supplierUuid: string,
): Promise<ReceivablePurchaseOrderItem[]> =>
  db
    .select({
      uuid: PurchaseOrderItems.uuid,
      productUuid: PurchaseOrderItems.productUuid,
      productCode: Products.productCode,
      productName: Products.name,
      purchaseOrderUuid: PurchaseOrderItems.purchaseOrderUuid,
      purchaseOrderId: PurchaseOrders.id,
      orderedQuantity: PurchaseOrderItems.quantity,
      remainingQuantity: receivableQuantity,
    })
    .from(PurchaseOrderItems)
    .innerJoin(
      PurchaseOrders,
      eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
    )
    .innerJoin(Products, eq(PurchaseOrderItems.productUuid, Products.uuid))
    .where(
      and(
        eq(PurchaseOrders.supplierUuid, supplierUuid),
        ne(PurchaseOrders.status, "cancelled"),
        ne(PurchaseOrderItems.status, "cancelled"),
        gt(receivableQuantity, "0"),
      ),
    )
    .orderBy(desc(PurchaseOrderItems.createdAt));

const companyHasProducts = async (companyUuid: string): Promise<boolean> => {
  const rows = await db
    .select({ id: Products.id })
    .from(Products)
    .where(eq(Products.companyUuid, companyUuid))
    .limit(1);
  return rows.length > 0;
};

export const createPurchaseOrder = async (
  fields: PurchaseOrderFields,
  items: PurchaseOrderItemInput[],
): Promise<PurchaseOrderActionResult> => {
  const uuid = generateUuid();
  try {
    if (!(await companyHasProducts(fields.supplierUuid))) {
      return {
        error:
          "Selected supplier has no products. Add products to this company before creating a purchase order.",
      };
    }

    if (fields.agentUuid && !(await companyHasProducts(fields.agentUuid))) {
      return {
        error:
          "Selected agent has no products. Add products to this company before creating a purchase order.",
      };
    }

    if (items.length === 0) {
      return { error: "At least one product is required." };
    }

    const productUuids = items.map((item) => item.productUuid);
    const validProducts = await db
      .select({ uuid: Products.uuid })
      .from(Products)
      .where(inArray(Products.uuid, productUuids));
    const validProductUuids = new Set(validProducts.map((p) => p.uuid));

    if (
      productUuids.some((productUuid) => !validProductUuids.has(productUuid))
    ) {
      return { error: "One or more selected products could not be found." };
    }

    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return { error: "User not authenticated" };
    }

    await db.transaction(async (tx) => {
      await tx.insert(PurchaseOrders).values({ ...fields, uuid });

      // A purchase order only records the intent to buy — no stock exists yet.
      // Stock (and the "in" movement) is created later, when the matching
      // purchase invoice arrives and the goods are actually received.
      for (const [index, item] of items.entries()) {
        const netPrice = Number(item.netPrice ?? 0);

        await tx.insert(PurchaseOrderItems).values({
          uuid: generateUuid(),
          purchaseOrderUuid: uuid,
          productUuid: item.productUuid,
          quantity: item.quantity,
          qtyPlanned: item.quantity,
          lineNumber: index + 1,
          netPrice: netPrice.toFixed(4),
          priceUnit: item.priceUnit ?? null,
          amount: (netPrice * Number(item.quantity)).toFixed(2),
        });
      }
    });

    // The supplier is told what we ordered as soon as the order stands. Sent
    // after the transaction commits so a rolled back order leaves no email
    // behind, and a failed send never rolls a placed order back.
    await mailDocument(
      () => sendPurchaseOrderEmail(uuid),
      `Purchase order ${uuid}`,
    );

    revalidatePath("/purchase-orders");
    return { success: true, purchaseOrderUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create purchase order",
    };
  }
};

export const getPurchaseOrderDetail = async (
  uuid: string,
): Promise<PurchaseOrderDetail | null> => {
  const [order] = await db
    .select({
      ...getTableColumns(PurchaseOrders),
      supplierName: Companies.companyName,
      contactFirstName: Contacts.firstName,
      contactLastName: Contacts.lastName,
    })
    .from(PurchaseOrders)
    .leftJoin(Companies, eq(PurchaseOrders.supplierUuid, Companies.uuid))
    .leftJoin(Contacts, eq(PurchaseOrders.contactUuid, Contacts.uuid))
    .where(eq(PurchaseOrders.uuid, uuid))
    .limit(1);

  if (!order) {
    return null;
  }

  const [agent] = order.agentUuid
    ? await db
        .select({ companyName: Companies.companyName })
        .from(Companies)
        .where(eq(Companies.uuid, order.agentUuid))
        .limit(1)
    : [];

  const items = await db
    .select({
      uuid: PurchaseOrderItems.uuid,
      productUuid: PurchaseOrderItems.productUuid,
      productCode: Products.productCode,
      productName: Products.name,
      orderedQuantity: PurchaseOrderItems.quantity,
      netPrice: PurchaseOrderItems.netPrice,
      priceUnit: PurchaseOrderItems.priceUnit,
      amount: PurchaseOrderItems.amount,
      stockValuationPrice: Stock.valuationPrice,
      stockUuid: Stock.uuid,
      stockQuantity: Stock.quantity,
      stockStatus: Stock.status,
    })
    .from(PurchaseOrderItems)
    .innerJoin(Products, eq(PurchaseOrderItems.productUuid, Products.uuid))
    .leftJoin(Stock, eq(Stock.purchaseOrderItemUuid, PurchaseOrderItems.uuid))
    .where(eq(PurchaseOrderItems.purchaseOrderUuid, uuid));

  const [receipts, contracts, returnLines, communication] = await Promise.all([
    db
      .select({
        uuid: PurchaseLineReceivals.uuid,
        lineNumber: PurchaseLineReceivals.lineNumber,
        receiptDate: PurchaseLineReceivals.receiptDate,
        receiptStatus: PurchaseLineReceivals.receiptStatus,
        lineStatus: PurchaseLineReceivals.lineStatus,
        productCode: Products.productCode,
        productName: Products.name,
        qtyPlanned: PurchaseLineReceivals.qtyPlanned,
        receivedQty: PurchaseLineReceivals.receivedQty,
        kgActual: PurchaseLineReceivals.kgActual,
        lineAmount: PurchaseLineReceivals.lineAmount,
        purchaser: PurchaseLineReceivals.purchaser,
      })
      .from(PurchaseLineReceivals)
      .leftJoin(Products, eq(PurchaseLineReceivals.productUuid, Products.uuid))
      .where(eq(PurchaseLineReceivals.purchaseOrderUuid, uuid))
      .orderBy(desc(PurchaseLineReceivals.receiptDate)),

    db.select().from(Contracts).where(eq(Contracts.purchaseOrderUuid, uuid)),

    db
      .select({
        uuid: PurchaseReturnOrderItems.uuid,
        returnOrderUuid: PurchaseReturnOrderItems.purchaseReturnOrderUuid,
        returnOrderId: PurchaseReturnOrders.id,
        returnOrderStatus: PurchaseReturnOrders.status,
        lineNumber: PurchaseReturnOrderItems.lineNumber,
        productCode: Products.productCode,
        productName: Products.name,
        returnQty: PurchaseReturnOrderItems.returnQty,
        unit: PurchaseReturnOrderItems.unit,
        returnReason: PurchaseReturnOrderItems.returnReason,
        returnDate: PurchaseReturnOrderItems.returnDate,
        amount: PurchaseReturnOrderItems.amount,
      })
      .from(PurchaseReturnOrderItems)
      .leftJoin(
        PurchaseReturnOrders,
        eq(
          PurchaseReturnOrderItems.purchaseReturnOrderUuid,
          PurchaseReturnOrders.uuid,
        ),
      )
      .leftJoin(
        Products,
        eq(PurchaseReturnOrderItems.productUuid, Products.uuid),
      )
      .where(eq(PurchaseReturnOrderItems.originalPurchaseOrderUuid, uuid))
      .orderBy(desc(PurchaseReturnOrderItems.returnDate)),

    // Routing belongs to the supplier, not the order, so an order with no
    // supplier has nothing to show rather than everybody's settings.
    order.supplierUuid
      ? db
          .select()
          .from(CommunicationSettings)
          .where(eq(CommunicationSettings.companyUuid, order.supplierUuid))
      : [],
  ]);

  return {
    ...order,
    agentName: agent?.companyName ?? null,
    items,
    receipts,
    contracts,
    returnLines,
    communication,
  };
};

export const cancelPurchaseOrder = async (
  uuid: string,
): Promise<PurchaseOrderActionResult> => {
  try {
    const [order] = await db
      .select()
      .from(PurchaseOrders)
      .where(eq(PurchaseOrders.uuid, uuid))
      .limit(1);

    if (!order) {
      return { error: "Purchase order not found." };
    }

    if (order.status === "cancelled") {
      return { error: "This purchase order is already cancelled." };
    }

    // A purchase order carries no stock of its own — stock only appears once a
    // purchase invoice receives it. If any lot already points back to this
    // order, it has been received and billed, so the order can't be cancelled.
    const stockRows = await db
      .select({ id: Stock.id })
      .from(Stock)
      .where(eq(Stock.purchaseOrderUuid, uuid));

    if (stockRows.length > 0) {
      return {
        error:
          "Cannot cancel: this purchase order has already been received on a purchase invoice.",
      };
    }

    await db
      .update(PurchaseOrders)
      .set({ status: "cancelled" })
      .where(eq(PurchaseOrders.uuid, uuid));

    revalidatePath("/purchase-orders");
    revalidatePath(`/purchase-orders/${uuid}`);
    return { success: true, purchaseOrderUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to cancel purchase order",
    };
  }
};

export const updatePurchaseOrder = async (
  uuid: string,
  fields: PurchaseOrderHeaderEdit,
): Promise<PurchaseOrderActionResult> => {
  try {
    const [order] = await db
      .select({ status: PurchaseOrders.status })
      .from(PurchaseOrders)
      .where(eq(PurchaseOrders.uuid, uuid))
      .limit(1);

    if (!order) {
      return { error: "Purchase order not found." };
    }
    if (order.status === "cancelled") {
      return { error: "Cannot edit a cancelled purchase order." };
    }

    await db
      .update(PurchaseOrders)
      .set(fields)
      .where(eq(PurchaseOrders.uuid, uuid));
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to update purchase order",
    };
  }

  revalidatePath("/purchase-orders");
  revalidatePath(`/purchase-orders/${uuid}`);
  redirect(`/purchase-orders/${uuid}`);
};
