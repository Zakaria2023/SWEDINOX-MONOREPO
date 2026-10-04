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
import {
  amountForWeight,
  articlePieceWeightKg,
  describeError,
  generateUuid,
  isWeightPriceUnit,
  moneyString,
  todayDateString,
} from "@/lib/helpers";
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
import {
  refreshPurchaseOrderTotals,
  syncPurchaseLineReceipts,
  syncPurchaseLineReceiptDates,
} from "@/lib/server/purchase-lines";
import { PURCHASE_ORDER_COLUMNS } from "@/app/(dashboard)/purchase-orders/columns";
import { currentUser } from "@clerk/nextjs/server";
import {
  and,
  asc,
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
  /**
   * 🔑 Carried off the article the stock dialog handed back, not typed.
   *
   * A purchase line holds its own dimensions and quality because the receival
   * behind it has to weigh what arrives against what was ordered — and because
   * a lot is weighed by **its own** measurements, never the catalogue's.
   */
  qualityCode?: string;
  lengthMm?: string;
  widthMm?: string;
  thicknessMm?: string;
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
  // The reference's line grid, column for column: `Code` · `Delivery date` ·
  // `Status` · `Quality` · `Length` · `Width` · `Thickness` · `Qty(p)` · `U` ·
  // `Kg(p)` · `Net Price` · `U`. Every one of them was already stored and none
  // of them was shown.
  lineNumber: SelectPurchaseOrderItems["lineNumber"];
  lineStatus: SelectPurchaseOrderItems["status"];
  receiptDate: SelectPurchaseOrderItems["receiptDate"];
  qualityCode: SelectPurchaseOrderItems["qualityCode"];
  lengthMm: SelectPurchaseOrderItems["lengthMm"];
  widthMm: SelectPurchaseOrderItems["widthMm"];
  thicknessMm: SelectPurchaseOrderItems["thicknessMm"];
  unit: SelectPurchaseOrderItems["unit"];
  kgPurchased: SelectPurchaseOrderItems["kgPurchased"];
  // What the weighbridge said, where a lorry has been. Null until one has.
  kgActual: SelectPurchaseOrderItems["kgActual"];
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
  qtyActual: SelectPurchaseLineReceivals["qtyActual"];
  receivedQty: SelectPurchaseLineReceivals["receivedQty"];
  // 🔑 The reference's Receipts panel pairs every planned figure with its
  // actual one — `Kg(p)` beside `Kg(a)`, `Qty(p)` beside `Qty(a)`. Showing only
  // the actuals is why this panel read as a row of noughts: nothing has arrived
  // yet, which is the correct answer to a question the panel never asked.
  kgPlanned: SelectPurchaseLineReceivals["kgPlanned"];
  kgActual: SelectPurchaseLineReceivals["kgActual"];
  unit: SelectPurchaseLineReceivals["unit"];
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

export const createPurchaseOrder = async (
  fields: PurchaseOrderFields,
  items: PurchaseOrderItemInput[],
): Promise<PurchaseOrderActionResult> => {
  const uuid = generateUuid();
  try {
    // ⚠️ There was a guard here refusing an order whose supplier had no
    // products linked to it. It belonged to the era when the line's product
    // came from a dropdown of that supplier's own articles — the arrangement
    // that offered one article out of 5 626. A line now names anything in the
    // catalogue, because the reason to raise a purchase order is that the metal
    // is not here, so who has it linked decides nothing.

    if (items.length === 0) {
      return { error: "At least one product is required." };
    }

    const productUuids = items.map((item) => item.productUuid);
    // The weights come back with the uuid because a line's weight is the
    // product's weight per piece times the quantity, and its amount is derived
    // from that weight rather than from the piece count.
    //
    // 🔴 The geometry comes with them. Reading only the two stored weight
    // columns was the whole of the EUR 0,00 purchase order: `weight_theoretical`
    // is written by the product form, and 5 624 of 5 626 articles never went
    // through it. Shape, dimensions, grade and density reproduce the figure
    // instead of trusting a column nobody filled.
    const validProducts = await db
      .select({
        uuid: Products.uuid,
        dimensionShape: Products.dimensionShape,
        featuresQuality: Products.featuresQuality,
        densityKgDm3: Products.densityKgDm3,
        length: Products.length,
        widthDiameter: Products.widthDiameter,
        thickness: Products.thickness,
        theoreticalThickness: Products.theoreticalThickness,
        weightTheoretical: Products.weightTheoretical,
        theoreticalWeight: Products.theoreticalWeight,
        weightUnit: Products.weightUnit,
      })
      .from(Products)
      .where(inArray(Products.uuid, productUuids));
    const validProductUuids = new Set(validProducts.map((p) => p.uuid));
    const productByUuid = new Map(validProducts.map((p) => [p.uuid, p]));

    if (
      productUuids.some((productUuid) => !validProductUuids.has(productUuid))
    ) {
      return { error: "One or more selected products could not be found." };
    }

    // 🔴 A price per tonne against a product with no weight bills nothing.
    //
    // Steel is bought by the tonne, so the amount is `price x weight` and the
    // weight comes from the product's dimensions and density — not from the
    // piece count. A product carrying none of those makes the weight zero, and
    // the line saves at EUR 0,00 without complaining. The receival raised behind
    // it then plans zero kilos, and the error travels quietly all the way to the
    // invoice.
    //
    // Found on 3-10-2026: 5 624 of 5 626 products carry no dimensions at all, so
    // this is the normal case here rather than an edge one.
    const weightless = items.filter((item) => {
      if (!isWeightPriceUnit(item.priceUnit)) {
        return false;
      }
      const product = productByUuid.get(item.productUuid);
      const pieceWeight = product ? articlePieceWeightKg(product, item) : null;
      return (pieceWeight ?? 0) * Number(item.quantity) <= 0;
    });

    if (weightless.length > 0) {
      return {
        error:
          weightless.length === items.length
            ? "This product has no weight, so a price per tonne or per kilo cannot be turned into an amount. Give the product its dimensions and density, or price the line per piece."
            : `${weightless.length} of ${items.length} lines are priced by weight against a product that has none. Give those products their dimensions and density, or price those lines per piece.`,
      };
    }

    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return { error: "User not authenticated" };
    }

    await db.transaction(async (tx) => {
      // 🔴 The day the order was placed. Converting a quote has always stamped
      // this; creating an order directly never did, so every such order carried
      // a blank `Order date` — and the receivals overview, which repeats it off
      // the order, showed a dash where the reference shows a `Creation date`
      // on every row. A date filter cannot find a row that has no date.
      await tx
        .insert(PurchaseOrders)
        .values({ orderDate: todayDateString(), ...fields, uuid });

      // A purchase order only records the intent to buy — no stock exists yet.
      // Stock (and the "in" movement) is created later, when the matching
      // purchase invoice arrives and the goods are actually received.
      for (const [index, item] of items.entries()) {
        const netPrice = Number(item.netPrice ?? 0);

        const quantity = Number(item.quantity);
        const product = productByUuid.get(item.productUuid);

        // A purchase price is struck per tonne far more often than per piece,
        // so the amount is the weight times the price in that price's own
        // unit — never the piece count times the price. Eleven plates at
        // EUR 1.930 per tonne cost EUR 666,62, not EUR 21.230.
        // The line's dimensions win over the catalogue's: a line may be
        // struck at a size the article is not normally stocked in, and it is
        // the line that was ordered.
        const pieceWeight = product ? articlePieceWeightKg(product, item) : null;
        const weightKg = (pieceWeight ?? 0) * quantity;

        const intOrNull = (value: string | undefined) => {
          const parsed = Number(value);
          return value && Number.isFinite(parsed) ? Math.round(parsed) : null;
        };

        await tx.insert(PurchaseOrderItems).values({
          uuid: generateUuid(),
          purchaseOrderUuid: uuid,
          productUuid: item.productUuid,
          quantity: item.quantity,
          qtyPlanned: item.quantity,
          lineNumber: index + 1,
          qualityCode: item.qualityCode?.trim() || null,
          lengthMm: intOrNull(item.lengthMm),
          widthMm: intOrNull(item.widthMm),
          thicknessMm: item.thicknessMm?.trim() || null,
          netPrice: netPrice.toFixed(4),
          priceUnit: item.priceUnit ?? null,
          kgPurchased: weightKg.toFixed(2),
          amount: moneyString(
            amountForWeight(netPrice, item.priceUnit ?? null, weightKg, {
              quantity: Number(item.quantity ?? 0),
            }),
          ),
        });
      }

      // A line is expected when the order is: its planned receipt date.
      await syncPurchaseLineReceiptDates(tx, uuid);
      // The order now expects goods, so the receptions that expect them exist
      // too — that is what makes Purchase receivals a planned-vs-actual screen
      // rather than a list of arrivals.
      await syncPurchaseLineReceipts(tx, uuid);
      // And the header says what the lines add up to — € 95.513,48 and 48.484 kg
      // on purchase order `402532`, both sums of the lines rather than figures
      // anybody types.
      await refreshPurchaseOrderTotals(tx, uuid);
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
      lineNumber: PurchaseOrderItems.lineNumber,
      lineStatus: PurchaseOrderItems.status,
      receiptDate: PurchaseOrderItems.receiptDate,
      qualityCode: PurchaseOrderItems.qualityCode,
      lengthMm: PurchaseOrderItems.lengthMm,
      widthMm: PurchaseOrderItems.widthMm,
      thicknessMm: PurchaseOrderItems.thicknessMm,
      unit: PurchaseOrderItems.unit,
      kgPurchased: PurchaseOrderItems.kgPurchased,
      kgActual: PurchaseOrderItems.kgActual,
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
    .where(eq(PurchaseOrderItems.purchaseOrderUuid, uuid))
    // The reference numbers its lines 10, 20, 30 and shows them in that order.
    .orderBy(asc(PurchaseOrderItems.lineNumber));

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
        qtyActual: PurchaseLineReceivals.qtyActual,
        receivedQty: PurchaseLineReceivals.receivedQty,
        kgPlanned: PurchaseLineReceivals.kgPlanned,
        kgActual: PurchaseLineReceivals.kgActual,
        unit: PurchaseLineReceivals.unit,
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

    await db.transaction(async (tx) => {
      await tx
        .update(PurchaseOrders)
        .set(fields)
        .where(eq(PurchaseOrders.uuid, uuid));

      // A moved delivery date moves the receipt date of what is still to come.
      await syncPurchaseLineReceiptDates(tx, uuid);
      // The order now expects goods, so the receptions that expect them exist
      // too — that is what makes Purchase receivals a planned-vs-actual screen
      // rather than a list of arrivals.
      await syncPurchaseLineReceipts(tx, uuid);
      // And the header says what the lines add up to — € 95.513,48 and 48.484 kg
      // on purchase order `402532`, both sums of the lines rather than figures
      // anybody types.
      await refreshPurchaseOrderTotals(tx, uuid);
    });
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

/**
 * `Make final` — the action that only exists on a provisional order.
 *
 * An order converted from a quote arrives provisional: it exists, its
 * reception is already created, but nothing can be received against it and the
 * whole Receipts panel is read-only. Making it final opens it.
 */
export const makePurchaseOrderFinal = async (
  uuid: string,
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
    if (order.status !== "provisional") {
      return { error: "Only a provisional purchase order can be made final." };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(PurchaseOrders)
        .set({ status: "open" })
        .where(eq(PurchaseOrders.uuid, uuid));

      // The lines follow the header out of provisional, and the order is now
      // genuinely with the supplier.
      await tx
        .update(PurchaseOrderItems)
        .set({
          status: "released",
          qtyOrdered: sql`${PurchaseOrderItems.qtyPlanned}`,
        })
        .where(eq(PurchaseOrderItems.purchaseOrderUuid, uuid));
    });

    // Only now is the order with the supplier, so this is when they get it.
    // A provisional order from a quote has not been sent before this point.
    await mailDocument(
      () => sendPurchaseOrderEmail(uuid),
      `Purchase order ${uuid}`,
    );

    revalidatePath("/purchase-orders");
    revalidatePath(`/purchase-orders/${uuid}`);
    revalidatePath("/purchase-lines");
    return { success: true, purchaseOrderUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to make purchase order final",
    };
  }
};

/**
 * `Pre-notify` — the supplier has advised when the goods are coming.
 *
 * Stamps the advised date on every reception of the order that has not arrived
 * yet, which is the column the reference calls `Pre-announced delivery` on the
 * reception. A reception that already has its actuals is left alone: it has
 * arrived, and pre-advising the past would be nonsense.
 */
export const preNotifyPurchaseOrder = async (
  uuid: string,
  advisedDate: string,
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
    if (order.status === "provisional") {
      return {
        error: "Make the purchase order final before pre-notifying it.",
      };
    }
    if (order.status === "cancelled") {
      return { error: "A cancelled purchase order cannot be pre-notified." };
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(advisedDate)) {
      return { error: "Enter the advised delivery date." };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(PurchaseOrders)
        .set({ status: "pre_notified" })
        .where(eq(PurchaseOrders.uuid, uuid));

      await tx
        .update(PurchaseLineReceivals)
        .set({ preAnnouncedDeliveryDate: advisedDate })
        .where(
          and(
            eq(PurchaseLineReceivals.purchaseOrderUuid, uuid),
            eq(PurchaseLineReceivals.kgActual, "0.00"),
          ),
        );
    });

    revalidatePath("/purchase-orders");
    revalidatePath(`/purchase-orders/${uuid}`);
    revalidatePath("/purchase-receivals");
    return { success: true, purchaseOrderUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to pre-notify purchase order",
    };
  }
};

/**
 * `Confirm` — the supplier has acknowledged the order.
 *
 * This is what fills the quantity the reference calls "Qty confirmed", and
 * what the receivals overview confusingly labels "Received Qty": a figure that
 * is non-zero long before anything arrives, because it records a promise
 * rather than a receipt.
 */
export const confirmPurchaseOrder = async (
  uuid: string,
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
    if (order.status === "provisional") {
      return {
        error: "Make the purchase order final before confirming it.",
      };
    }
    if (order.status === "cancelled") {
      return { error: "A cancelled purchase order cannot be confirmed." };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(PurchaseOrders)
        .set({ status: "confirmed" })
        .where(eq(PurchaseOrders.uuid, uuid));

      await tx
        .update(PurchaseOrderItems)
        .set({ qtyConfirmed: sql`${PurchaseOrderItems.qtyPlanned}` })
        .where(eq(PurchaseOrderItems.purchaseOrderUuid, uuid));
    });

    revalidatePath("/purchase-orders");
    revalidatePath(`/purchase-orders/${uuid}`);
    revalidatePath("/purchase-lines");
    revalidatePath("/purchase-receivals");
    return { success: true, purchaseOrderUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to confirm purchase order",
    };
  }
};
