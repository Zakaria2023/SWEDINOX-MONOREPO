"use server";

import { db } from "@/db";
import {
  InsertPurchaseOrders,
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { PurchaseInvoiceItems } from "@/db/schema/purchase-invoice-items";
import { PurchaseInvoices } from "@/db/schema/purchase-invoices";
import {
  PurchaseOrderItems,
  SelectPurchaseOrderItems,
} from "@/db/schema/purchase-order-items";
import { SelectStock, Stock } from "@/db/schema/stock";
import { Warehouses } from "@/db/schema/warehouses";
import {
  WarehouseWorkOrderLines,
  WarehouseWorkOrders,
} from "@/db/schema/warehouse-work-orders";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import {
  CommunicationSettings,
  SelectCommunicationSettings,
} from "@/db/schema/communication-settings";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { Batches } from "@/db/schema/batches";
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
import { PurchaseSourceType, purchaseOrderStatuses } from "@/lib/enums";
import {
  amountForWeight,
  articlePieceWeightKg,
  describeError,
  generateUuid,
  purchaseSourceTypeFor,
  isWeightPriceUnit,
  moneyString,
  receptionActions,
  toDateString,
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
import { nextWorkOrderNumber } from "@/lib/server/work-order-numbers";
import {
  refreshPurchaseLineStatus,
  refreshPurchaseOrderTotals,
  syncPurchaseLineReceipts,
  syncPurchaseLineReceiptDates,
} from "@/lib/server/purchase-lines";
import { PURCHASE_ORDER_COLUMNS } from "@/app/(dashboard)/purchase-orders/columns";
import {
  PreNotifyFormValues,
  preNotifySchema,
  ReceptionBatchSettingsFormValues,
  receptionBatchSettingsSchema,
  ReceptionChargeFormValues,
  receptionChargeSchema,
} from "@/app/(dashboard)/purchase-orders/validation";
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
  isNotNull,
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
  /** The reference's `Line type`; blank follows the header's CD tick. */
  sourceType?: PurchaseSourceType | "";
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
  // 🔑 What the reference's invoice `Lines` grid shows beside the quantity —
  // `Item` · `Kg` · `Length` · `Price` · `Per` · `Material` · `VAT rate` ·
  // `Delivery date`. `Material` is price x weight in the unit `Per` names, and
  // a clerk has to see it move as they key the quantity.
  lineNumber: SelectPurchaseOrderItems["lineNumber"];
  unit: SelectPurchaseOrderItems["unit"];
  lengthMm: SelectPurchaseOrderItems["lengthMm"];
  widthMm: SelectPurchaseOrderItems["widthMm"];
  thicknessMm: SelectPurchaseOrderItems["thicknessMm"];
  // The weighbridge figure where a lorry has been, the theoretical until then —
  // the same weight the line is billed on.
  kgBilling: string;
  netPrice: SelectPurchaseOrderItems["netPrice"];
  priceUnit: SelectPurchaseOrderItems["priceUnit"];
  options: SelectPurchaseOrderItems["options"];
  receiptDate: SelectPurchaseOrderItems["receiptDate"];
  vatCode: SelectProducts["vatCode"] | null;
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
  // What has arrived, what kind of line it is, and whether a buyer has closed
  // it short. The reference prints `Qty(a)` and `Type` on every line.
  qtyReceived: SelectPurchaseOrderItems["qtyReceived"];
  sourceType: SelectPurchaseOrderItems["sourceType"];
  closedAt: SelectPurchaseOrderItems["closedAt"];
  stockUuid: string | null;
  stockQuantity: string | null;
  stockStatus: SelectStock["status"] | null;
  // What the received lot was actually valued at. Normally the line's own
  // price, but a lot received before purchase lines carried one reads zero —
  // which is precisely what needs correcting rather than hiding.
  stockValuationPrice: SelectStock["valuationPrice"] | null;
  // 🔑 `For line`, the second column of the reference's grid: the line this
  // purchase line was bought for. A sales line reads `O108183/10` (a `CD`
  // purchase, 404299); another purchase line reads `IO400142/10` (the
  // `Ex works Processor` return leg, 400143). Composed, so a plain string.
  forLine: string | null;
  // Where `For line` opens — the reference's tooltip reads `Open linked order`.
  forLineHref: string | null;
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

  // 🔑 The lot identity the reception carries, which the two reception dialogs
  // captured on 6-10-2026 both read and one of them writes. The columns have
  // existed since the receipt chain was built; no screen had ever shown them,
  // so a reception that knew its heat number looked like one that did not.
  charge: SelectPurchaseLineReceivals["charge"];
  internalCharge: SelectPurchaseLineReceivals["internalCharge"];
  plateNumber: SelectPurchaseLineReceivals["plateNumber"];
  // Written by `Partijregistratie instellingen` and by nothing else. Never
  // populated until now, because the dialog that sets it was not built.
  documentObligationWaived: SelectPurchaseLineReceivals["documentObligationWaived"];

  // `Afmetingen / gewicht` on `Partijregistratie instellingen` reads
  // `19x0,8 / 158 KG(w)` — width by thickness off the line, weight off the
  // reception. Carried here so the dialog can restate the parcel rather than
  // make somebody trust that they selected the right row.
  widthMm: SelectPurchaseOrderItems["widthMm"] | null;
  thicknessMm: SelectPurchaseOrderItems["thicknessMm"] | null;
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

/**
 * One entry in the `Selecteer` picker behind `Nieuwe interne Charge`.
 *
 * ⚠️ **What the reference's picker actually lists has never been seen** — it was
 * greyed on the captured reception. An internal charge is ours, handed out on
 * receipt, so it cannot be minted from a text box; this lists the codes already
 * in use, which is the reading the evidence supports. Revisit if the picker is
 * ever captured open.
 */
export type InternalChargeOption = {
  internalCharge: NonNullable<SelectPurchaseLineReceivals["internalCharge"]>;
  /** How many receptions already carry it — a sanity check, not a filter. */
  receptionCount: number;
};

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

// 🔑 An expired order drops out of the purchase overviews, as on the
// reference — `400142` was findable only from its supplier's record. Asking
// for a status by name brings it back.
const purchaseOrderScope = (query: TableQuery) =>
  query.filters.status && query.filters.status.length > 0
    ? []
    : [ne(PurchaseOrders.status, "expired")];

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
          scope: purchaseOrderScope(query),
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
      scope: purchaseOrderScope(query),
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

// The Drizzle transaction handle passed into db.transaction(async (tx) => ...).
type PurchaseTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * The warehouse a location belongs to, found by climbing its parents.
 *
 * Locations nest — a bay inside an aisle inside a hall — and a work order is
 * raised against the building, not the shelf. The climb is bounded because a
 * cycle in the tree would otherwise hang the transaction.
 */
const rootWarehouseOfLocation = async (
  tx: PurchaseTransaction,
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

// What a purchase line has already been billed for, across every invoice that
// has not been cancelled.
const invoicedQuantity = sql<string>`(
  SELECT COALESCE(SUM(${PurchaseInvoiceItems.quantity}), 0)
    FROM ${PurchaseInvoiceItems}
    JOIN ${PurchaseInvoices}
      ON ${PurchaseInvoices.uuid} = ${PurchaseInvoiceItems.purchaseInvoiceUuid}
   WHERE ${PurchaseInvoiceItems.purchaseOrderItemUuid} = ${PurchaseOrderItems.uuid}
     AND ${PurchaseInvoices.cancelled} = FALSE
)`;

// What is still to be billed: goods that arrived, less what has been invoiced.
const invoiceableQuantity = sql<string>`(COALESCE(${PurchaseOrderItems.qtyReceived}, 0) - ${invoicedQuantity})`;

/**
 * The purchase lines a supplier's invoice can bill.
 *
 * 🔴 This used to offer lines **still to be received** — `quantity − qtyReceived
 * > 0` — which is exactly backwards. An invoice bills goods that have *arrived*,
 * so a line vanished from the picker at the very moment it became invoiceable,
 * and the only lines on offer were ones where nothing had turned up yet.
 *
 * A line qualifies when something has been received against it and not all of it
 * has been billed. `remainingQuantity` is what is left to bill, which is what a
 * clerk keys the quantity against.
 */
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
      remainingQuantity: invoiceableQuantity,
      lineNumber: PurchaseOrderItems.lineNumber,
      unit: PurchaseOrderItems.unit,
      lengthMm: PurchaseOrderItems.lengthMm,
      widthMm: PurchaseOrderItems.widthMm,
      thicknessMm: PurchaseOrderItems.thicknessMm,
      kgBilling: sql<string>`COALESCE(${PurchaseOrderItems.kgActual}, ${PurchaseOrderItems.kgPurchased}, 0)`,
      netPrice: PurchaseOrderItems.netPrice,
      priceUnit: PurchaseOrderItems.priceUnit,
      options: PurchaseOrderItems.options,
      receiptDate: PurchaseOrderItems.receiptDate,
      vatCode: Products.vatCode,
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
        gt(invoiceableQuantity, "0"),
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
          sourceType:
            item.sourceType ||
            purchaseSourceTypeFor(fields.pickupDropoffCdPurchases),
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
      qtyReceived: PurchaseOrderItems.qtyReceived,
      sourceType: PurchaseOrderItems.sourceType,
      closedAt: PurchaseOrderItems.closedAt,
      stockValuationPrice: Stock.valuationPrice,
      stockUuid: Stock.uuid,
      stockQuantity: Stock.quantity,
      stockStatus: Stock.status,
      forLine: sql<string | null>`COALESCE(
        (SELECT CONCAT('O', o.id, '/', oi.line_number)
           FROM OrderItems oi JOIN Orders o ON o.uuid = oi.order_uuid
          WHERE oi.purchase_order_item_uuid = ${PurchaseOrderItems.uuid}
          ORDER BY oi.line_number LIMIT 1),
        (SELECT CONCAT('IO', po2.id, '/', poi2.line_number * 10)
           FROM PurchaseOrderItems poi2
           JOIN PurchaseOrders po2 ON po2.uuid = poi2.purchase_order_uuid
          WHERE poi2.uuid = ${PurchaseOrderItems.forPurchaseOrderItemUuid}
          LIMIT 1))`,
      forLineHref: sql<string | null>`COALESCE(
        (SELECT CONCAT('/orders/', oi.order_uuid)
           FROM OrderItems oi
          WHERE oi.purchase_order_item_uuid = ${PurchaseOrderItems.uuid}
          ORDER BY oi.line_number LIMIT 1),
        (SELECT CONCAT('/purchase-orders/', poi2.purchase_order_uuid)
           FROM PurchaseOrderItems poi2
          WHERE poi2.uuid = ${PurchaseOrderItems.forPurchaseOrderItemUuid}
          LIMIT 1))`,
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
        // 🔴 The **line's** status, not the reception's stored copy of it.
        //
        // `PurchaseLineReceivals.lineStatus` is written once, when the reception
        // is created, and nothing updates it afterwards. So receiving goods
        // moved the line to `Received` in the grid above while this panel went
        // on reading `In progress` — the same line, two statuses, on one page.
        // Coalesced rather than joined blindly, because imported receptions
        // exist whose line has since gone.
        lineStatus: sql<
          SelectPurchaseOrderItems["status"]
        >`COALESCE(${PurchaseOrderItems.status}, ${PurchaseLineReceivals.lineStatus})`,
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
        charge: PurchaseLineReceivals.charge,
        internalCharge: PurchaseLineReceivals.internalCharge,
        plateNumber: PurchaseLineReceivals.plateNumber,
        documentObligationWaived:
          PurchaseLineReceivals.documentObligationWaived,
        widthMm: PurchaseOrderItems.widthMm,
        thicknessMm: PurchaseOrderItems.thicknessMm,
      })
      .from(PurchaseLineReceivals)
      .leftJoin(Products, eq(PurchaseLineReceivals.productUuid, Products.uuid))
      .leftJoin(
        PurchaseOrderItems,
        eq(PurchaseLineReceivals.purchaseOrderItemUuid, PurchaseOrderItems.uuid),
      )
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
        .set({ status: "released" })
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
 * `Send…` — mail the order to the supplier again. Making the order final
 * already sends it once; this is for the supplier who lost it or a changed
 * order. A send that reaches nobody is an error, not a silent success, and
 * every attempt is logged.
 */
export const sendPurchaseOrder = async (
  uuid: string,
): Promise<PurchaseOrderActionResult> => {
  try {
    const [order] = await db
      .select({
        status: PurchaseOrders.status,
        id: PurchaseOrders.id,
        supplierUuid: PurchaseOrders.supplierUuid,
      })
      .from(PurchaseOrders)
      .where(eq(PurchaseOrders.uuid, uuid))
      .limit(1);

    if (!order) {
      return { error: "Purchase order not found." };
    }
    if (order.status === "provisional") {
      return { error: "Make the purchase order final before sending it." };
    }

    const result = await sendPurchaseOrderEmail(uuid);
    const user = await currentUser();
    // Logged to `Communications` like every other send, delivered or not.
    await mailDocument(
      () => Promise.resolve(result),
      `Purchase order ${order.id}`,
      {
        documentType: "purchase_order",
        documentUuid: uuid,
        companyUuid: order.supplierUuid,
        userId: user?.id ?? null,
      },
    );

    if (result.sent === 0) {
      return {
        error:
          "Nothing was sent: the supplier has no e-mail address on the order's contact or the company.",
      };
    }

    revalidatePath(`/purchase-orders/${uuid}`);
    return { success: true, purchaseOrderUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to send purchase order",
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
  _prevState: PurchaseOrderActionResult,
  data: PreNotifyFormValues,
): Promise<PurchaseOrderActionResult> => {
  try {
    const parsed = preNotifySchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }
    const { purchaseOrderUuid: uuid, advisedDate } = parsed.data;

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

    await db.transaction(async (tx) => {
      // A stamp, not a rung: the order keeps its place on the ladder.
      await tx
        .update(PurchaseOrders)
        .set({ preNotifiedAt: new Date() })
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
      // A stamp, not a rung: the order keeps its place on the ladder.
      await tx
        .update(PurchaseOrders)
        .set({ confirmedAt: new Date() })
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

/**
 * `Workorder` — raise the unloading that books this order's goods in.
 *
 * 🔴 This is the missing rung of the ladder, and without it nothing in the
 * system could ever create a stock lot.
 *
 * Watched on the reference, order `401141` / work order `306675`:
 *
 * ```
 * Release the order        -> nothing
 * Pre-notify               -> reception exists, Kg(a) 0        no stock
 * Release the work order   -> stock labels print               no stock
 * Report completion        -> FIVE STOCK LOTS EXIST
 * (Approve)                -> happens by itself
 * ```
 *
 * So reporting the unloading is what turns a purchase order into metal on a
 * shelf — **not** the invoice. A warehouse work order could only be raised from
 * a sales order until now, which is why `StockMovements` was empty: the one code
 * path that writes a receipt movement had never been reachable.
 *
 * One line per outstanding purchase line, carrying what was ordered as the plan.
 * What actually turns up is typed when the line is reported, bundle by bundle,
 * and every bundle needs a `Charge` before it is allowed to become stock.
 */
export const createUnloadingWorkOrder = async (
  purchaseOrderUuid: string,
): Promise<PurchaseOrderActionResult> => {
  try {
    const userId = (await currentUser())?.id ?? null;
    const [order] = await db
      .select({
        id: PurchaseOrders.id,
        status: PurchaseOrders.status,
        supplierUuid: PurchaseOrders.supplierUuid,
        deliveryDate: PurchaseOrders.deliveryDate,
      })
      .from(PurchaseOrders)
      .where(eq(PurchaseOrders.uuid, purchaseOrderUuid))
      .limit(1);

    if (!order) {
      return { error: "Purchase order not found." };
    }
    if (order.status === "cancelled") {
      return { error: "A cancelled purchase order receives nothing." };
    }
    // A provisional order is a draft. The reference greys the whole Receipts
    // panel until `Make final`, so there is nothing for the warehouse to plan.
    if (order.status === "provisional") {
      return {
        error:
          "This order is still provisional, so no goods are expected of anybody yet. Make it final first.",
      };
    }

    const workOrderUuid = generateUuid();

    const outcome = await db.transaction(async (tx) => {
      const lines = await tx
        .select({
          uuid: PurchaseOrderItems.uuid,
          lineNumber: PurchaseOrderItems.lineNumber,
          productUuid: PurchaseOrderItems.productUuid,
          productCode: Products.productCode,
          quality: PurchaseOrderItems.qualityCode,
          lengthMm: PurchaseOrderItems.lengthMm,
          widthMm: PurchaseOrderItems.widthMm,
          thicknessMm: PurchaseOrderItems.thicknessMm,
          quantity: PurchaseOrderItems.quantity,
          qtyReceived: PurchaseOrderItems.qtyReceived,
          kgPurchased: PurchaseOrderItems.kgPurchased,
          status: PurchaseOrderItems.status,
        })
        .from(PurchaseOrderItems)
        .innerJoin(Products, eq(PurchaseOrderItems.productUuid, Products.uuid))
        .where(eq(PurchaseOrderItems.purchaseOrderUuid, purchaseOrderUuid))
        .orderBy(asc(PurchaseOrderItems.lineNumber));

      // Only what is still owed. A line already received in full has nothing
      // left for a lorry to bring, and putting it on the slip would invite the
      // floor to book the same metal in twice.
      const outstanding = lines.filter(
        (line) =>
          line.status !== "cancelled" &&
          Number(line.quantity) - Number(line.qtyReceived ?? 0) > 0,
      );

      if (outstanding.length === 0) {
        return {
          error:
            "Every line on this order has already been received, so there is nothing to unload.",
        };
      }

      // 🔑 Goods land in `put_away` — the reference's `Ontvangst`, a real named
      // place in the location list rather than a state. It is where a lot sits
      // until somebody restocks it into the racking.
      const [goodsIn] = await tx
        .select({ uuid: Warehouses.uuid })
        .from(Warehouses)
        .where(eq(Warehouses.locationType, "put_away"))
        .limit(1);

      if (!goodsIn) {
        return {
          error:
            "No goods-in location exists, so there is nowhere to unload to. Give a location the `Put away` type on the warehouses screen first.",
        };
      }

      const warehouseUuid =
        (await rootWarehouseOfLocation(tx, goodsIn.uuid)) ?? goodsIn.uuid;

      const number = await nextWorkOrderNumber(tx);

      await tx.insert(WarehouseWorkOrders).values({
        createdByUserId: userId,
        uuid: workOrderUuid,
        number,
        warehouseUuid,
        type: "unloading",
        plannedDate: order.deliveryDate
          ? toDateString(order.deliveryDate)
          : todayDateString(),
        status: "new",
      });

      for (const [index, line] of outstanding.entries()) {
        const quantity = Number(line.quantity);
        const stillDue = quantity - Number(line.qtyReceived ?? 0);
        // The weight follows the quantity still owed, so a part-received line
        // plans the remainder rather than the whole order again.
        const kgPurchased = Number(line.kgPurchased ?? 0);
        const kgDue =
          quantity > 0 ? (kgPurchased * stillDue) / quantity : kgPurchased;

        await tx.insert(WarehouseWorkOrderLines).values({
          modifiedByUserId: userId,
          uuid: generateUuid(),
          workOrderUuid,
          lineNumber: line.lineNumber ?? index + 1,
          purchaseOrderItemUuid: line.uuid,
          orderNumber: String(order.id),
          companyUuid: order.supplierUuid,
          productUuid: line.productUuid,
          productCode: line.productCode,
          // An unloading comes from outside the building, so it has no `from`.
          fromLocationUuid: null,
          toLocationUuid: goodsIn.uuid,
          length: line.lengthMm,
          width: line.widthMm,
          thickness: line.thicknessMm ? Number(line.thicknessMm) : null,
          qtyPlanned: stillDue.toFixed(3),
          kgPlanned: kgDue.toFixed(2),
          quality: line.quality,
          status: "new",
        });
      }

      // The goods are now expected of the warehouse rather than only of the
      // supplier, which is the state the reference's 53 `Workorders created`
      // receptions are in.
      await tx
        .update(PurchaseLineReceivals)
        .set({ receiptStatus: "workorders_created" })
        .where(
          and(
            eq(PurchaseLineReceivals.purchaseOrderUuid, purchaseOrderUuid),
            inArray(PurchaseLineReceivals.receiptStatus, ["new", "released"]),
          ),
        );

      return { number };
    });

    if ("error" in outcome) {
      return { error: outcome.error };
    }

    revalidatePath(`/purchase-orders/${purchaseOrderUuid}`);
    revalidatePath("/warehouse-work-orders");
    revalidatePath("/purchase-receivals");
    return { success: true, purchaseOrderUuid };
  } catch (error) {
    return {
      error: describeError(error, "Failed to raise the unloading work order"),
    };
  }
};

/**
 * The codes `Nieuwe interne Charge` may be set to.
 *
 * ⚠️ A guess, and flagged as one. The reference offers a `Selecteer` picker
 * here rather than a text box — an internal charge is handed out on receipt and
 * has to stay unique, so it is *chosen*, not typed — but the picker was greyed
 * on the captured reception, so its contents are unseen. Listing the codes
 * already in use is what "chosen from a registry" can mean with the evidence we
 * have, and it is strictly safer than a free-text field that would let somebody
 * invent an identity for metal that already has one.
 */
export const getInternalChargeOptions = async (): Promise<
  InternalChargeOption[]
> => {
  const rows = await db
    .select({
      internalCharge: PurchaseLineReceivals.internalCharge,
      receptionCount: count(),
    })
    .from(PurchaseLineReceivals)
    .where(isNotNull(PurchaseLineReceivals.internalCharge))
    .groupBy(PurchaseLineReceivals.internalCharge)
    .orderBy(PurchaseLineReceivals.internalCharge);

  return rows.flatMap((row) =>
    row.internalCharge
      ? [
          {
            internalCharge: row.internalCharge,
            receptionCount: Number(row.receptionCount),
          },
        ]
      : [],
  );
};

/**
 * `Charge aanpassen…` — replace the lot identity a reception claims.
 *
 * The rule the 6-10-2026 capture states is enforced here and not only in the
 * toolbar: the two stamping actions wake **only** once the goods are in,
 * because a charge is copied off a mill certificate that arrives with the
 * metal. Greying a button is a courtesy; refusing the write is the guarantee.
 */
export const updateReceptionCharge = async (
  _prevState: PurchaseOrderActionResult,
  data: ReceptionChargeFormValues,
): Promise<PurchaseOrderActionResult> => {
  try {
    const parsed = receptionChargeSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }
    const values = parsed.data;

    const [reception] = await db
      .select({
        purchaseOrderUuid: PurchaseLineReceivals.purchaseOrderUuid,
        receiptStatus: PurchaseLineReceivals.receiptStatus,
      })
      .from(PurchaseLineReceivals)
      .where(eq(PurchaseLineReceivals.uuid, values.receivalUuid))
      .limit(1);

    if (!reception) {
      return { error: "Reception not found." };
    }

    const permitted = receptionActions(reception.receiptStatus);
    if (!permitted.canAdjustCharge) {
      return {
        error: permitted.stampReason ?? "This reception cannot carry a charge.",
      };
    }

    // An internal charge is an identity, not a value. It may be pointed at one
    // that already exists; it may not be invented here, because the code that
    // mints them is the receipt chain and nothing else.
    if (values.internalCharge) {
      const known = await getInternalChargeOptions();
      if (!known.some((row) => row.internalCharge === values.internalCharge)) {
        return {
          error:
            "That internal charge does not exist. An internal charge is issued when goods are received, so it is chosen here, never created.",
        };
      }
    }

    await db
      .update(PurchaseLineReceivals)
      // An empty box clears the field. The dialog prefills `Nieuwe Charge` with
      // the current value, so a blank one is a deliberate erasure rather than an
      // untouched control — the opposite of the lot correction dialog, where an
      // absent key means "the form never offered it".
      .set({
        charge: values.charge ? values.charge : null,
        plateNumber: values.plateNumber ? values.plateNumber : null,
        internalCharge: values.internalCharge ? values.internalCharge : null,
      })
      .where(eq(PurchaseLineReceivals.uuid, values.receivalUuid));

    if (reception.purchaseOrderUuid) {
      revalidatePath(`/purchase-orders/${reception.purchaseOrderUuid}`);
    }
    revalidatePath("/purchase-receivals");
    return {
      success: true,
      purchaseOrderUuid: reception.purchaseOrderUuid ?? undefined,
    };
  } catch (error) {
    return { error: describeError(error, "Failed to adjust the charge") };
  }
};

/**
 * `Partijregistratie instellingen` — waive, or reinstate, the document
 * obligation on one reception.
 *
 * 🔑 This is the mechanism behind the `documents` block reason, and the first
 * thing that has ever written `documentObligationWaived`. Switching it on drops
 * the reception off `Certificates to be linked` and `Deliveries from missing
 * batch`, which is exactly what the reference's own warning says it does.
 */
export const updateReceptionBatchSettings = async (
  _prevState: PurchaseOrderActionResult,
  data: ReceptionBatchSettingsFormValues,
): Promise<PurchaseOrderActionResult> => {
  try {
    const parsed = receptionBatchSettingsSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }
    const values = parsed.data;

    const [reception] = await db
      .select({
        purchaseOrderUuid: PurchaseLineReceivals.purchaseOrderUuid,
        receiptStatus: PurchaseLineReceivals.receiptStatus,
      })
      .from(PurchaseLineReceivals)
      .where(eq(PurchaseLineReceivals.uuid, values.receivalUuid))
      .limit(1);

    if (!reception) {
      return { error: "Reception not found." };
    }

    const permitted = receptionActions(reception.receiptStatus);
    if (!permitted.canRegisterBatch) {
      return {
        error:
          permitted.stampReason ??
          "Batch settings apply once the goods have arrived.",
      };
    }

    await db
      .update(PurchaseLineReceivals)
      .set({ documentObligationWaived: values.documentObligationWaived })
      .where(eq(PurchaseLineReceivals.uuid, values.receivalUuid));

    if (reception.purchaseOrderUuid) {
      revalidatePath(`/purchase-orders/${reception.purchaseOrderUuid}`);
    }
    revalidatePath("/purchase-receivals");
    revalidatePath("/certificates-to-be-linked");
    return {
      success: true,
      purchaseOrderUuid: reception.purchaseOrderUuid ?? undefined,
    };
  } catch (error) {
    return {
      error: describeError(error, "Failed to save the batch settings"),
    };
  }
};

/**
 * `Delete` on the reception toolbar.
 *
 * Live only while nothing has arrived, which is the capture's rule and also the
 * only reading that keeps the ledger honest: a reception that received metal is
 * the record that it happened, and deleting it would leave stock whose arrival
 * nothing accounts for.
 */
export const deleteReception = async (
  uuid: string,
): Promise<PurchaseOrderActionResult> => {
  try {
    const [reception] = await db
      .select({
        purchaseOrderUuid: PurchaseLineReceivals.purchaseOrderUuid,
        receiptStatus: PurchaseLineReceivals.receiptStatus,
      })
      .from(PurchaseLineReceivals)
      .where(eq(PurchaseLineReceivals.uuid, uuid))
      .limit(1);

    if (!reception) {
      return { error: "Reception not found." };
    }

    const permitted = receptionActions(reception.receiptStatus);
    if (!permitted.canDelete) {
      return {
        error: permitted.deleteReason ?? "This reception cannot be deleted.",
      };
    }

    // The status rule is about the goods; this is about the paperwork. A batch
    // registered against the reception is a second record pointing at it, and
    // the foreign key would refuse the delete anyway — better a sentence than a
    // constraint violation.
    const [batch] = await db
      .select({ id: Batches.id })
      .from(Batches)
      .where(eq(Batches.purchaseLineReceivalUuid, uuid))
      .limit(1);

    if (batch) {
      return {
        error:
          "A batch is registered against this reception. Remove the batch first.",
      };
    }

    await db
      .delete(PurchaseLineReceivals)
      .where(eq(PurchaseLineReceivals.uuid, uuid));

    if (reception.purchaseOrderUuid) {
      revalidatePath(`/purchase-orders/${reception.purchaseOrderUuid}`);
    }
    revalidatePath("/purchase-receivals");
    return {
      success: true,
      purchaseOrderUuid: reception.purchaseOrderUuid ?? undefined,
    };
  } catch (error) {
    return { error: describeError(error, "Failed to delete the reception") };
  }
};

/**
 * Close a purchase line that arrived short — the remainder is not coming.
 *
 * 🔑 The reference does this rather than leave the line open: `401616/50` was
 * closed and invoiced at 6 plates of 17, and five more lines between 8 % and
 * 22 % short went the same way (J4, 7-10-2026). A line inside the unloading
 * tolerance closes by itself; this is for the rest.
 *
 * What it does: stamps who closed the line and when, lapses every reception
 * still waiting for goods to `expired` — the state the reference gives a
 * reception that was never fulfilled — and re-derives the line's status, which
 * now reads `Received` (or `Invoiced`, if what arrived is already billed).
 *
 * Refused when nothing has arrived: a line with nothing received is not short,
 * it is not delivered, and the way out of that is cancelling it.
 */
export const closePurchaseLine = async (
  purchaseOrderItemUuid: string,
): Promise<PurchaseOrderActionResult> => {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return { error: "User not authenticated" };
    }

    const [line] = await db
      .select({
        purchaseOrderUuid: PurchaseOrderItems.purchaseOrderUuid,
        quantity: PurchaseOrderItems.quantity,
        received: PurchaseOrderItems.qtyReceived,
        status: PurchaseOrderItems.status,
        closedAt: PurchaseOrderItems.closedAt,
      })
      .from(PurchaseOrderItems)
      .where(eq(PurchaseOrderItems.uuid, purchaseOrderItemUuid))
      .limit(1);

    if (!line) {
      return { error: "Purchase line not found." };
    }
    if (line.closedAt !== null) {
      return { error: "This line is already closed." };
    }
    if (Number(line.received ?? 0) <= 0) {
      return {
        error:
          "Nothing has arrived on this line, so there is nothing to close it at. Cancel the line instead.",
      };
    }
    if (Number(line.received ?? 0) >= Number(line.quantity)) {
      return { error: "Everything ordered has arrived; the line closes by itself." };
    }
    if (line.status !== "partially_received") {
      return {
        error: "Only a line that is partially received can be closed short.",
      };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(PurchaseOrderItems)
        .set({ closedAt: new Date(), closedByUserId: user.id })
        .where(eq(PurchaseOrderItems.uuid, purchaseOrderItemUuid));

      await tx
        .update(PurchaseLineReceivals)
        .set({ receiptStatus: "expired" })
        .where(
          and(
            eq(PurchaseLineReceivals.purchaseOrderItemUuid, purchaseOrderItemUuid),
            inArray(PurchaseLineReceivals.receiptStatus, [
              "new",
              "released",
              "workorders_created",
            ]),
          ),
        );

      await refreshPurchaseLineStatus(tx, purchaseOrderItemUuid);
    });

    revalidatePath(`/purchase-orders/${line.purchaseOrderUuid}`);
    revalidatePath("/purchase-lines");
    revalidatePath("/purchase-receivals");
    return { success: true, purchaseOrderUuid: line.purchaseOrderUuid };
  } catch (error) {
    return { error: describeError(error, "Failed to close the purchase line") };
  }
};
