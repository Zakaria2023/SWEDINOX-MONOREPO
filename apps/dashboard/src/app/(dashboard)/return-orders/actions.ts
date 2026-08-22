"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import {
  InsertReturnOrders,
  InsertReturnOrderSurcharges,
  ReturnOrders,
  ReturnOrderSurcharges,
  SelectReturnOrders,
} from "@/db/schema/return-orders";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import {
  ReturnOrderItems,
  SelectReturnOrderItems,
} from "@/db/schema/return-order-items";
import { SelectReturnOrderSurcharges } from "@/db/schema/return-orders";
import { InsertTexts, SelectTexts, Texts } from "@/db/schema/texts";
import { InvoiceItems, SelectInvoiceItems } from "@/db/schema/invoice-items";
import { Invoices, SelectInvoices } from "@/db/schema/invoices";
import { JournalEntries } from "@/db/schema/journal-entries";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import {
  ComplaintItems,
  SelectComplaintItems,
} from "@/db/schema/complaint-items";
import { Complaints, SelectComplaints } from "@/db/schema/complaints";
import { Machines, SelectMachines } from "@/db/schema/machines";
import {
  ProductionWorkOrderLines,
  ProductionWorkOrders,
  SelectProductionWorkOrderLines,
  SelectProductionWorkOrders,
} from "@/db/schema/production-work-orders";
import { Stock } from "@/db/schema/stock";
import { StockMovements } from "@/db/schema/stock-movements";
import { mailDocument, sendInvoiceEmail } from "@/emails/documents";
import { ReturnOrderReason } from "@/lib/enums";
import {
  describeError,
  defaultTransportModeFor,
  generateUuid,
  getInvoiceVatRatePercent,
  getQuoteVatRatePercent,
  proRataSlice,
  QUANTITY_EPSILON,
  todayDateString,
} from "@/lib/helpers";
import {
  buildInventoryMovementEntry,
  buildSalesJournalEntry,
  LEDGER_ACCOUNTS,
} from "@/lib/server/ledger";
import { recordFreightMovement } from "@/lib/server/freight";
import { currentUser } from "@clerk/nextjs/server";
import { returnOrderReasons, returnOrderStatuses } from "@/lib/enums";
import {
  dateRangeFilter,
  enumFilter,
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
import { RETURN_ORDER_COLUMNS } from "@/app/(dashboard)/return-orders/columns";
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  inArray,
  sql,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ReturnOrderFields = Omit<
  InsertReturnOrders,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type ReturnOrderSurchargeInput = Omit<
  InsertReturnOrderSurcharges,
  "id" | "uuid" | "returnOrderUuid" | "createdAt" | "updatedAt"
>;

export type ReturnOrderTextInput = Pick<
  InsertTexts,
  "title" | "textBlock" | "textCategoryUuid"
>;

export type ReturnOrderExtras = {
  surcharges: ReturnOrderSurchargeInput[];
  texts: ReturnOrderTextInput[];
};

// Which invoiced line is coming back, and how much of it.
export type ReturnOrderItemInput = {
  orderItemUuid: string;
  returnQty: string;
  returnReason?: ReturnOrderReason | null;
  /** The complaint that caused this line to come back, when one did. */
  complaintUuid?: string | null;
};

// An invoiced order line the customer could send back, priced at what they were
// actually charged for it — not at what the order says today.
export type ReturnableLine = {
  orderItemUuid: SelectOrderItems["uuid"];
  orderUuid: SelectOrderItems["orderUuid"];
  orderId: SelectOrders["id"];
  lineNumber: SelectOrderItems["lineNumber"];
  productUuid: SelectOrderItems["productUuid"];
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  unit: SelectOrderItems["unit"];
  quantity: SelectInvoiceItems["quantity"];
  netPrice: SelectInvoiceItems["netPrice"];
  amount: SelectInvoiceItems["amount"];
  weightKg: SelectInvoiceItems["weightKg"];
  invoiceUuid: NonNullable<SelectInvoices["uuid"]>;
  invoiceId: SelectInvoices["id"];
};

// The invoice lines behind a return — the "Invoice lines" section of the
// document, and the only thing a credit note is allowed to credit against.
export type ReturnInvoiceLine = {
  returnOrderItemUuid: SelectReturnOrderItems["uuid"];
  invoiceUuid: NonNullable<SelectInvoices["uuid"]>;
  invoiceId: SelectInvoices["id"];
  invoiceDate: SelectInvoices["invoiceDate"];
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  invoicedQuantity: SelectInvoiceItems["quantity"];
  netPrice: SelectInvoiceItems["netPrice"];
  amount: SelectInvoiceItems["amount"];
};

export type ReturnOrderActionResult = {
  returnOrderUuid?: string;
  error?: string;
  success?: boolean;
};

export type ReturnOrderListItem = SelectReturnOrders & {
  companyName: SelectCompanies["companyName"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
};

const RETURN_ORDER_SEARCH = [
  ReturnOrders.customerRef,
  Companies.companyName,
] as const;

const RETURN_ORDER_SORTABLE = {
  createdAt: ReturnOrders.createdAt,
  returnDate: ReturnOrders.returnDate,
  customer: Companies.companyName,
  status: ReturnOrders.status,
};

// Status is the whole workflow of a return — raised, received, credited — so it
// is the filter this screen exists for. The reason is what the quality side
// slices by.
const RETURN_ORDER_FILTERS = {
  status: enumFilter(ReturnOrders.status, returnOrderStatuses),
  returnReason: enumFilter(ReturnOrders.returnReason, returnOrderReasons),
  company: relationFilter(ReturnOrders.companyUuid),
  returnDate: dateRangeFilter(ReturnOrders.returnDate),
};

/**
 * The rows one view of the return orders overview selects, as a window onto
 * them. Shared by the page and the export.
 */
const returnOrderRows =
  (query: TableQuery) =>
  (limit: number, offset: number): Promise<ReturnOrderListItem[]> =>
    db
      .select({
        ...getTableColumns(ReturnOrders),
        companyName: Companies.companyName,
        contactFirstName: Contacts.firstName,
        contactLastName: Contacts.lastName,
      })
      .from(ReturnOrders)
      .leftJoin(Companies, eq(ReturnOrders.companyUuid, Companies.uuid))
      .leftJoin(Contacts, eq(ReturnOrders.contactUuid, Contacts.uuid))
      .where(
        tableWhere({
          query,
          search: RETURN_ORDER_SEARCH,
          filters: RETURN_ORDER_FILTERS,
        }),
      )
      .orderBy(
        ...tableOrderBy(
          RETURN_ORDER_SORTABLE,
          query,
          [desc(ReturnOrders.createdAt)],
          ReturnOrders.id,
        ),
      )
      .limit(limit)
      .offset(offset);

/** Every return order the current view matches, as a workbook. */
export const exportReturnOrders = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Return Orders",
    columns: RETURN_ORDER_COLUMNS,
    columnKeys,
    rows: returnOrderRows(parseTableQuery(params)),
  });

export const getReturnOrders = async (
  query: TableQuery,
): Promise<Paged<ReturnOrderListItem>> => {
  try {
    const where = tableWhere({
      query,
      search: RETURN_ORDER_SEARCH,
      filters: RETURN_ORDER_FILTERS,
    });

    return await runPaged(query, {
      rows: returnOrderRows(query),

      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(ReturnOrders)
          .leftJoin(Companies, eq(ReturnOrders.companyUuid, Companies.uuid))
          .where(where);
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch return orders"));
  }
};

export type ReturnOrderLineDetail = SelectReturnOrderItems & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  // The "Sales" column: what the original order line sold these goods for. The
  // return carries its own price, and the two are not always the same figure —
  // seeing them side by side is how a credit gets checked before it goes out.
  salesNetPrice: SelectOrderItems["netPrice"] | null;
  salesAmount: SelectOrderItems["amount"] | null;
  salesQuantity: SelectOrderItems["quantity"] | null;
};

// A production work order that touched the goods on this return. Reached through
// the original order line, which is the only link the workorder carries.
export type ReturnWorkOrderLine = {
  uuid: SelectProductionWorkOrderLines["uuid"];
  workOrderId: SelectProductionWorkOrders["id"] | null;
  workOrderUuid: SelectProductionWorkOrderLines["workOrderUuid"];
  machineName: SelectMachines["name"] | null;
  date: SelectProductionWorkOrderLines["date"];
  status: SelectProductionWorkOrderLines["status"];
  productCode: SelectProductionWorkOrderLines["productCode"];
  qtyPlanned: SelectProductionWorkOrderLines["qtyPlanned"];
  qtyActual: SelectProductionWorkOrderLines["qtyActual"];
  kgActual: SelectProductionWorkOrderLines["kgActual"];
};

// A complaint raised about the goods on this return. Returns and complaints are
// two records of the same event — the customer sending something back and
// saying why — so the return has to be able to show the paperwork beside it.
export type ReturnComplaintLine = {
  uuid: SelectComplaintItems["uuid"];
  complaintUuid: SelectComplaintItems["complaintUuid"];
  complaintId: SelectComplaints["id"] | null;
  reportDate: SelectComplaints["reportDate"] | null;
  status: SelectComplaints["status"] | null;
  category: SelectComplaints["category"] | null;
  solution: SelectComplaints["solution"] | null;
  description: SelectComplaintItems["description"];
  qty: SelectComplaintItems["qty"];
  amount: SelectComplaintItems["amount"];
};

export type ReturnOrderDetail = SelectReturnOrders & {
  companyName: SelectCompanies["companyName"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
  // The order being returned against — the link the schema carries and nothing
  // surfaced. A return is only checkable once you can open what it came from.
  originalOrderId: SelectOrders["id"] | null;
  originalOrderStatus: SelectOrders["status"] | null;
  items: ReturnOrderLineDetail[];
  surcharges: SelectReturnOrderSurcharges[];
  texts: SelectTexts[];
  // The "Invoice lines" section: what each returned line was billed on.
  invoiceLines: ReturnInvoiceLine[];
  // The "Credits" section: credit notes raised against this return.
  credits: SelectInvoices[];
  // The "Workorders" section: production that touched these goods.
  workOrders: ReturnWorkOrderLine[];
  // The "Complaints" section: what the customer said was wrong.
  complaints: ReturnComplaintLine[];
};

export const getReturnOrderDetail = async (
  uuid: string,
): Promise<ReturnOrderDetail | null> => {
  const [returnOrder] = await db
    .select({
      ...getTableColumns(ReturnOrders),
      companyName: Companies.companyName,
      contactFirstName: Contacts.firstName,
      contactLastName: Contacts.lastName,
      originalOrderId: Orders.id,
      originalOrderStatus: Orders.status,
    })
    .from(ReturnOrders)
    .leftJoin(Companies, eq(ReturnOrders.companyUuid, Companies.uuid))
    .leftJoin(Contacts, eq(ReturnOrders.contactUuid, Contacts.uuid))
    .leftJoin(Orders, eq(ReturnOrders.orderUuid, Orders.uuid))
    .where(eq(ReturnOrders.uuid, uuid))
    .limit(1);

  if (!returnOrder) {
    return null;
  }

  const [items, surcharges, texts, credits] = await Promise.all([
    db
      .select({
        ...getTableColumns(ReturnOrderItems),
        productCode: Products.productCode,
        productName: Products.name,
        salesNetPrice: OrderItems.netPrice,
        salesAmount: OrderItems.amount,
        salesQuantity: OrderItems.quantity,
      })
      .from(ReturnOrderItems)
      .leftJoin(Products, eq(ReturnOrderItems.productUuid, Products.uuid))
      // Left-joined: a return line raised without pointing at an order line has
      // no sale behind it, and must still appear.
      .leftJoin(
        OrderItems,
        eq(ReturnOrderItems.originalOrderItemUuid, OrderItems.uuid),
      )
      .where(eq(ReturnOrderItems.returnOrderUuid, uuid))
      .orderBy(ReturnOrderItems.lineNumber),

    db
      .select()
      .from(ReturnOrderSurcharges)
      .where(eq(ReturnOrderSurcharges.returnOrderUuid, uuid)),

    db.select().from(Texts).where(eq(Texts.returnOrderUuid, uuid)),

    // Credit notes raised against this return, newest first.
    db
      .select()
      .from(Invoices)
      .where(eq(Invoices.returnOrderUuid, uuid))
      .orderBy(desc(Invoices.createdAt)),
  ]);

  // The invoice line behind each returned line — what it was billed on and for
  // how much, which is the only figure a credit note may be based on.
  const orderItemUuids = items.flatMap((item) =>
    item.originalOrderItemUuid ? [item.originalOrderItemUuid] : [],
  );

  const invoicedRows =
    orderItemUuids.length > 0
      ? await db
          .select({
            orderItemUuid: InvoiceItems.orderItemUuid,
            invoiceUuid: InvoiceItems.invoiceUuid,
            invoiceId: Invoices.id,
            invoiceDate: Invoices.invoiceDate,
            productCode: Products.productCode,
            productName: Products.name,
            invoicedQuantity: InvoiceItems.quantity,
            netPrice: InvoiceItems.netPrice,
            amount: InvoiceItems.amount,
          })
          .from(InvoiceItems)
          .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
          .leftJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
          .where(
            and(
              inArray(InvoiceItems.orderItemUuid, orderItemUuids),
              eq(Invoices.documentType, "invoice"),
            ),
          )
      : [];

  // Every invoice line behind a returned line, not one of them. A line billed in
  // instalments has several, and showing a single row would understate what the
  // customer was actually charged.
  const invoiceLines = items.flatMap((item) =>
    item.originalOrderItemUuid
      ? invoicedRows
          .filter((row) => row.orderItemUuid === item.originalOrderItemUuid)
          .map((row) => ({ returnOrderItemUuid: item.uuid, ...row }))
      : [],
  );

  // Production that touched these goods, and what the customer complained
  // about. Both hang off the original order line, which is the only link either
  // record carries back to a return.
  const [workOrders, complaints] =
    orderItemUuids.length > 0
      ? await Promise.all([
          db
            .select({
              uuid: ProductionWorkOrderLines.uuid,
              workOrderId: ProductionWorkOrders.id,
              workOrderUuid: ProductionWorkOrderLines.workOrderUuid,
              machineName: Machines.name,
              date: ProductionWorkOrderLines.date,
              status: ProductionWorkOrderLines.status,
              productCode: ProductionWorkOrderLines.productCode,
              qtyPlanned: ProductionWorkOrderLines.qtyPlanned,
              qtyActual: ProductionWorkOrderLines.qtyActual,
              kgActual: ProductionWorkOrderLines.kgActual,
            })
            .from(ProductionWorkOrderLines)
            .leftJoin(
              ProductionWorkOrders,
              eq(
                ProductionWorkOrderLines.workOrderUuid,
                ProductionWorkOrders.uuid,
              ),
            )
            .leftJoin(
              Machines,
              eq(ProductionWorkOrders.machineUuid, Machines.uuid),
            )
            .where(
              inArray(ProductionWorkOrderLines.orderItemUuid, orderItemUuids),
            )
            .orderBy(desc(ProductionWorkOrderLines.date)),

          db
            .select({
              uuid: ComplaintItems.uuid,
              complaintUuid: ComplaintItems.complaintUuid,
              complaintId: Complaints.id,
              reportDate: Complaints.reportDate,
              status: Complaints.status,
              category: Complaints.category,
              solution: Complaints.solution,
              description: ComplaintItems.description,
              qty: ComplaintItems.qty,
              amount: ComplaintItems.amount,
            })
            .from(ComplaintItems)
            .leftJoin(
              Complaints,
              eq(ComplaintItems.complaintUuid, Complaints.uuid),
            )
            .where(inArray(ComplaintItems.orderItemUuid, orderItemUuids))
            .orderBy(desc(Complaints.reportDate)),
        ])
      : [[], []];

  return {
    ...returnOrder,
    items,
    surcharges,
    texts,
    invoiceLines,
    credits,
    workOrders,
    complaints,
  };
};

export const updateReturnOrder = async (
  uuid: string,
  fields: ReturnOrderFields,
  extras: ReturnOrderExtras,
): Promise<ReturnOrderActionResult> => {
  try {
    const [existing] = await db
      .select({ status: ReturnOrders.status })
      .from(ReturnOrders)
      .where(eq(ReturnOrders.uuid, uuid))
      .limit(1);

    if (!existing) {
      return { error: "Return order not found." };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(ReturnOrders)
        .set(fields)
        .where(eq(ReturnOrders.uuid, uuid));

      // Surcharges and texts are replaced wholesale: the form submits the
      // complete set, so reconciling row by row would only risk the saved
      // state disagreeing with what was on screen.
      await tx
        .delete(ReturnOrderSurcharges)
        .where(eq(ReturnOrderSurcharges.returnOrderUuid, uuid));
      await tx.delete(Texts).where(eq(Texts.returnOrderUuid, uuid));

      if (extras.surcharges.length > 0) {
        await tx.insert(ReturnOrderSurcharges).values(
          extras.surcharges.map((surcharge) => ({
            ...surcharge,
            uuid: generateUuid(),
            returnOrderUuid: uuid,
          })),
        );
      }

      if (extras.texts.length > 0) {
        await tx.insert(Texts).values(
          extras.texts.map((text) => ({
            uuid: generateUuid(),
            returnOrderUuid: uuid,
            companyUuid: fields.companyUuid,
            title: text.title,
            textBlock: text.textBlock,
            textCategoryUuid: text.textCategoryUuid ?? null,
          })),
        );
      }
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to update return order",
    };
  }

  revalidatePath("/return-orders");
  revalidatePath(`/return-orders/${uuid}`);
  redirect(`/return-orders/${uuid}`);
};

export const deleteReturnOrder = async (
  uuid: string,
): Promise<ReturnOrderActionResult> => {
  try {
    await db.transaction(async (tx) => {
      await tx
        .delete(ReturnOrderItems)
        .where(eq(ReturnOrderItems.returnOrderUuid, uuid));
      await tx
        .delete(ReturnOrderSurcharges)
        .where(eq(ReturnOrderSurcharges.returnOrderUuid, uuid));
      await tx.delete(Texts).where(eq(Texts.returnOrderUuid, uuid));
      await tx.delete(ReturnOrders).where(eq(ReturnOrders.uuid, uuid));
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete return order",
    };
  }

  revalidatePath("/return-orders");
  revalidatePath("/return-lines");
  redirect("/return-orders");
};

// The invoice line that billed an order line, joined so a return is always
// priced at what the customer was actually charged. An order line that was
// never invoiced can't come back through this door: there is nothing to credit.
const invoicedLineColumns = {
  orderItemUuid: OrderItems.uuid,
  orderUuid: OrderItems.orderUuid,
  orderId: Orders.id,
  lineNumber: OrderItems.lineNumber,
  productUuid: OrderItems.productUuid,
  productCode: Products.productCode,
  productName: Products.name,
  unit: OrderItems.unit,
  quantity: InvoiceItems.quantity,
  netPrice: InvoiceItems.netPrice,
  amount: InvoiceItems.amount,
  weightKg: InvoiceItems.weightKg,
  invoiceUuid: InvoiceItems.invoiceUuid,
  invoiceId: Invoices.id,
};

/**
 * Invoiced lines a customer could send back.
 *
 * Only lines still at "invoiced" appear: one already returned is terminal, so
 * the same delivery can't be credited twice. Cancelled invoices are excluded —
 * crediting against a voided invoice would hand back money never charged.
 */
export const getReturnableLines = async (
  companyUuid: string,
): Promise<ReturnableLine[]> =>
  db
    .select(invoicedLineColumns)
    .from(OrderItems)
    .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .innerJoin(InvoiceItems, eq(InvoiceItems.orderItemUuid, OrderItems.uuid))
    .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
    .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
    .where(
      and(
        eq(Orders.companyUuid, companyUuid),
        eq(OrderItems.status, "invoiced"),
        eq(Invoices.cancelled, false),
        eq(Invoices.documentType, "invoice"),
      ),
    )
    .orderBy(desc(OrderItems.createdAt));

/**
 * Rolls the return's lines and surcharges up into the header snapshot the
 * document shows — the same shape the sales order and invoice report, so a
 * return reads like the thing it reverses.
 */
const buildReturnOrderSummary = async (
  tx: Pick<typeof db, "select">,
  returnOrderUuid: string,
  companyUuid: string,
  calculateVatIfApplicable: boolean,
) => {
  const [lines, surcharges, [company]] = await Promise.all([
    tx
      .select({
        amount: ReturnOrderItems.amount,
        weightKg: ReturnOrderItems.weightKg,
      })
      .from(ReturnOrderItems)
      .where(eq(ReturnOrderItems.returnOrderUuid, returnOrderUuid)),
    tx
      .select({ amount: ReturnOrderSurcharges.amount })
      .from(ReturnOrderSurcharges)
      .where(eq(ReturnOrderSurcharges.returnOrderUuid, returnOrderUuid)),
    tx
      .select({ calculateVat: Companies.calculateVat })
      .from(Companies)
      .where(eq(Companies.uuid, companyUuid))
      .limit(1),
  ]);

  const materialsRevenue = lines.reduce(
    (sum, line) => sum + Number(line.amount ?? 0),
    0,
  );
  const surchargesRevenue = surcharges.reduce(
    (sum, surcharge) => sum + Number(surcharge.amount ?? 0),
    0,
  );
  const totalWeightKg = lines.reduce(
    (sum, line) => sum + Number(line.weightKg ?? 0),
    0,
  );

  const totalExclVat = materialsRevenue + surchargesRevenue;
  const vatRate = getQuoteVatRatePercent(
    calculateVatIfApplicable,
    company?.calculateVat,
  );
  const vatAmount = totalExclVat * (vatRate / 100);

  return {
    materialsRevenue: materialsRevenue.toFixed(2),
    // Options aren't priced separately anywhere yet, so this stays zero rather
    // than quietly folding option value into materials.
    optionsRevenue: "0.00",
    surchargesRevenue: surchargesRevenue.toFixed(2),
    totalExclVat: totalExclVat.toFixed(2),
    vatAmount: vatAmount.toFixed(2),
    totalInclVat: (totalExclVat + vatAmount).toFixed(2),
    totalWeightKg: totalWeightKg.toFixed(2),
  };
};

/**
 * Books a received return back into stock and marks it received.
 *
 * The goods go back onto the exact lot they were picked from, at the value they
 * left at. That keeps the stock ledger symmetrical with the delivery that
 * consumed it, and it is the only valuation we can defend: whatever the lot was
 * worth when it shipped is what it is worth coming back.
 *
 * Receiving is separate from crediting on purpose. Goods arriving and money
 * being handed back are two different decisions, and the reference system
 * carries two statuses for exactly that reason.
 */
export const receiveReturnOrder = async (
  uuid: string,
): Promise<ReturnOrderActionResult> => {
  try {
    const [returnOrder] = await db
      .select({
        id: ReturnOrders.id,
        status: ReturnOrders.status,
        companyUuid: ReturnOrders.companyUuid,
      })
      .from(ReturnOrders)
      .where(eq(ReturnOrders.uuid, uuid))
      .limit(1);

    if (!returnOrder) {
      return { error: "Return order not found." };
    }
    if (
      returnOrder.status === "received" ||
      returnOrder.status === "credited"
    ) {
      return { error: "This return has already been received." };
    }
    if (returnOrder.status === "cancelled") {
      return { error: "This return was cancelled." };
    }

    const items = await db
      .select()
      .from(ReturnOrderItems)
      .where(eq(ReturnOrderItems.returnOrderUuid, uuid));

    if (items.length === 0) {
      return { error: "This return has no lines to receive." };
    }

    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return { error: "User not authenticated" };
    }

    await db.transaction(async (tx) => {
      const [claimed] = await tx
        .update(ReturnOrders)
        .set({ status: "received", returnDate: new Date() })
        .where(
          and(
            eq(ReturnOrders.uuid, uuid),
            inArray(ReturnOrders.status, ["open", "in_progress"]),
          ),
        );

      if (claimed.affectedRows === 0) {
        throw new Error(
          "This return was already received — please refresh and try again.",
        );
      }

      for (const item of items) {
        if (!item.originalOrderItemUuid) {
          continue;
        }

        const [orderItem] = await tx
          .select({
            stockUuid: OrderItems.stockUuid,
            productUuid: OrderItems.productUuid,
            orderUuid: OrderItems.orderUuid,
            costPrice: OrderItems.costPrice,
          })
          .from(OrderItems)
          .where(eq(OrderItems.uuid, item.originalOrderItemUuid))
          .limit(1);

        if (!orderItem) {
          continue;
        }

        const [stockRow] = await tx
          .select()
          .from(Stock)
          .where(eq(Stock.uuid, orderItem.stockUuid))
          .limit(1);

        if (!stockRow) {
          continue;
        }

        const returned = Number(item.returnQty ?? 0);
        const nextQuantity = (Number(stockRow.quantity) + returned).toFixed(3);

        // Goods coming back have to bring their value with them. Adding the
        // quantity alone put material on the shelf worth nothing, so every
        // return quietly wrote off the cost of what came back.
        //
        // They return at the cost the line went out at, which is the value the
        // credit note will hand back — so the two agree, and the account holding
        // the cost in between clears to nothing.
        const valueBack = returned * Number(orderItem.costPrice ?? 0);
        const nextValue = Number(stockRow.valuationEuro ?? 0) + valueBack;

        const [stockUpdate] = await tx
          .update(Stock)
          .set({
            quantity: nextQuantity,
            valuationEuro: nextValue.toFixed(2),
            // Anything back on the shelf is sellable again.
            status: "pending",
          })
          .where(
            and(
              eq(Stock.uuid, orderItem.stockUuid),
              eq(Stock.quantity, stockRow.quantity),
            ),
          );

        if (stockUpdate.affectedRows === 0) {
          throw new Error(
            "Stock changed while receiving the return — please refresh and try again.",
          );
        }

        await tx.insert(StockMovements).values({
          uuid: generateUuid(),
          productUuid: orderItem.productUuid,
          stockUuid: orderItem.stockUuid,
          type: "in",
          reason: "sales_return",
          quantity: item.returnQty ?? "0.000",
          orderUuid: orderItem.orderUuid,
          createdByUserId: userId,
        });

        await recordFreightMovement(tx, {
          productUuid: orderItem.productUuid,
          quantity: item.returnQty ?? "0.000",
          type: "in",
          reason: "sales_return",
          orderUuid: orderItem.orderUuid,
          operator: userId,
        });

        // The mirror of a delivery: stock is back on the shelf, and the cost of
        // it is owed back to the customer but not credited yet.
        if (Math.abs(valueBack) >= 0.005) {
          await tx.insert(JournalEntries).values(
            buildInventoryMovementEntry({
              bookingDate: todayDateString(),
              documentNo: String(returnOrder.id),
              description: "Returned goods received",
              companyUuid: returnOrder.companyUuid,
              debCreditor: null,
              inventoryValue: valueBack,
              counterAccount: LEDGER_ACCOUNTS.goodsDeliveredNotInvoiced,
              reference: `Return order line ${item.uuid}`,
              userId,
            }),
          );
        }
      }
    });

    revalidatePath("/return-orders");
    revalidatePath(`/return-orders/${uuid}`);
    revalidatePath("/stock");
    revalidatePath("/stock-movements");
    return { success: true, returnOrderUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to receive return order",
    };
  }
};

/**
 * Raises the credit note for a received return.
 *
 * The credit note is an Invoices row with its amounts negated, so it ages,
 * posts and settles through the machinery invoices already use — and its
 * negative `outstanding` nets the customer's balance down, handing back the
 * credit space the original invoice consumed.
 *
 * Every line is credited at the price it was invoiced at, never at what the
 * order says today, and never for more than was billed.
 */
export const creditReturnOrder = async (
  uuid: string,
): Promise<ReturnOrderActionResult> => {
  const creditNoteUuid = generateUuid();
  try {
    const [returnOrder] = await db
      .select()
      .from(ReturnOrders)
      .where(eq(ReturnOrders.uuid, uuid))
      .limit(1);

    if (!returnOrder) {
      return { error: "Return order not found." };
    }
    if (returnOrder.status === "credited") {
      return { error: "This return has already been credited." };
    }
    if (returnOrder.status !== "received") {
      return {
        error: "Receive the goods before crediting them back to the customer.",
      };
    }
    if (returnOrder.invoiceBlockage) {
      return {
        error: `This return is blocked for invoicing${returnOrder.blockingReason ? ` — ${returnOrder.blockingReason}` : ""}.`,
      };
    }

    const items = await db
      .select()
      .from(ReturnOrderItems)
      .where(eq(ReturnOrderItems.returnOrderUuid, uuid));

    const creditable = items.filter((item) => !!item.originalOrderItemUuid);
    if (creditable.length === 0) {
      return {
        error:
          "None of these lines point at an invoiced order line, so there is nothing to credit.",
      };
    }

    // What each line was actually billed at. Re-read now rather than trusting
    // the copy taken when the return was raised: the invoice may have been
    // corrected or cancelled in between.
    const invoicedRows = await db
      .select({
        orderItemUuid: InvoiceItems.orderItemUuid,
        quantity: InvoiceItems.quantity,
        netPrice: InvoiceItems.netPrice,
        costPrice: InvoiceItems.costPrice,
        replacementPrice: InvoiceItems.replacementPrice,
        weightKg: InvoiceItems.weightKg,
        productUuid: InvoiceItems.productUuid,
        invoiceUuid: InvoiceItems.invoiceUuid,
        vatScenario: Invoices.vatScenario,
        paymentTerms: Invoices.paymentTerms,
        debtorNo: Invoices.debtorNo,
      })
      .from(InvoiceItems)
      .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
      .where(
        and(
          inArray(
            InvoiceItems.orderItemUuid,
            creditable.flatMap((item) =>
              item.originalOrderItemUuid ? [item.originalOrderItemUuid] : [],
            ),
          ),
          eq(Invoices.cancelled, false),
          eq(Invoices.documentType, "invoice"),
        ),
      );

    // A line can be billed in instalments, so it can have several invoice lines.
    // They have to be added up: keeping one of them would price the credit off an
    // arbitrary slice, and check "no more than was invoiced" against a fraction
    // of what was actually charged.
    //
    // Per-unit figures are identical across the slices of a line by
    // construction — a slice divides the extended amounts and carries the unit
    // price through untouched — so the first slice speaks for all of them.
    const invoicedByOrderItem = new Map<
      string,
      {
        quantity: number;
        weightKg: number;
        netPrice: number;
        costPrice: number;
        replacementPrice: number;
        productUuid: string;
        invoiceUuids: Set<string>;
      }
    >();

    for (const row of invoicedRows) {
      const existing = invoicedByOrderItem.get(row.orderItemUuid);
      if (existing) {
        existing.quantity += Number(row.quantity ?? 0);
        existing.weightKg += Number(row.weightKg ?? 0);
        existing.invoiceUuids.add(row.invoiceUuid);
        continue;
      }
      invoicedByOrderItem.set(row.orderItemUuid, {
        quantity: Number(row.quantity ?? 0),
        weightKg: Number(row.weightKg ?? 0),
        netPrice: Number(row.netPrice ?? 0),
        costPrice: Number(row.costPrice ?? 0),
        replacementPrice: Number(row.replacementPrice ?? 0),
        productUuid: row.productUuid,
        invoiceUuids: new Set([row.invoiceUuid]),
      });
    }

    const creditLines: {
      orderItemUuid: string;
      productUuid: string;
      quantity: number;
      netPrice: number;
      costPrice: number;
      replacementPrice: number;
      weightKg: number;
      invoiceUuids: Set<string>;
    }[] = [];

    for (const item of creditable) {
      const orderItemUuid = item.originalOrderItemUuid;
      if (!orderItemUuid) {
        continue;
      }

      const invoiced = invoicedByOrderItem.get(orderItemUuid);
      if (!invoiced) {
        return {
          error:
            "One or more lines were never invoiced, or their invoice was cancelled — there is nothing to credit against.",
        };
      }

      const returnQty = Number(item.returnQty ?? 0);
      if (returnQty <= 0) {
        return { error: "Every credited line needs a return quantity." };
      }
      // The guard that matters: a return can never hand back more than was
      // charged for it. With part-billing this is the total across every
      // instalment, not whatever the last one happened to be.
      if (returnQty > invoiced.quantity + QUANTITY_EPSILON) {
        return {
          error: `Cannot credit more than was invoiced (${invoiced.quantity.toFixed(3)}).`,
        };
      }

      creditLines.push({
        orderItemUuid,
        productUuid: invoiced.productUuid,
        quantity: returnQty,
        netPrice: invoiced.netPrice,
        costPrice: invoiced.costPrice,
        replacementPrice: invoiced.replacementPrice,
        // Weight was billed across the line; credit it in proportion.
        weightKg: proRataSlice(invoiced.weightKg, {
          quantity: invoiced.quantity,
          alreadyBilled: 0,
          billing: returnQty,
        }),
        invoiceUuids: invoiced.invoiceUuids,
      });
    }

    const [first] = invoicedRows;
    // Only claim to credit one specific invoice when every line came from it —
    // and a line billed in instalments spans several, so it never does.
    const sourceInvoiceUuids = new Set(
      creditLines.flatMap((line) => [...line.invoiceUuids]),
    );
    const creditsInvoiceUuid =
      sourceInvoiceUuids.size === 1 ? [...sourceInvoiceUuids][0] : null;

    const materials = creditLines.reduce(
      (sum, line) => sum + line.netPrice * line.quantity,
      0,
    );
    const surchargeRows = await db
      .select({ amount: ReturnOrderSurcharges.amount })
      .from(ReturnOrderSurcharges)
      .where(eq(ReturnOrderSurcharges.returnOrderUuid, uuid));
    const surchargeTotal = surchargeRows.reduce(
      (sum, row) => sum + Number(row.amount ?? 0),
      0,
    );

    const exclVat = materials + surchargeTotal;
    const vatRate = getInvoiceVatRatePercent(first?.vatScenario ?? null);
    const vatAmount = exclVat * (vatRate / 100);
    const inclVat = exclVat + vatAmount;

    const user = await currentUser();
    const userId = user?.id;
    if (!userId) {
      return { error: "User not authenticated" };
    }

    await db.transaction(async (tx) => {
      // Claim the return first: whoever gets here second finds it credited and
      // stops, so a double click can't raise two credit notes.
      const [claimed] = await tx
        .update(ReturnOrders)
        .set({ status: "credited" })
        .where(
          and(eq(ReturnOrders.uuid, uuid), eq(ReturnOrders.status, "received")),
        );

      if (claimed.affectedRows === 0) {
        throw new Error(
          "This return was already credited — please refresh and try again.",
        );
      }

      // Every figure negative: this document takes value off the customer's
      // account rather than adding it.
      await tx.insert(Invoices).values({
        uuid: creditNoteUuid,
        documentType: "credit_note",
        returnOrderUuid: uuid,
        creditsInvoiceUuid,
        companyUuid: returnOrder.companyUuid,
        debtorNo: first?.debtorNo ?? null,
        invoiceDate: new Date(),
        expirationDate: new Date(),
        paymentTerms: returnOrder.paymentTerms ?? first?.paymentTerms ?? null,
        vatScenario: first?.vatScenario ?? null,
        invoiceAmountExclVat: (-exclVat).toFixed(2),
        invoiceAmountInclVat: (-inclVat).toFixed(2),
        // A credit note extends no credit, so it carries no surcharge for it.
        creditRestriction: "0.00",
        invoiceTotal: (-inclVat).toFixed(2),
        outstanding: (-inclVat).toFixed(2),
        materialsRevenue: (-materials).toFixed(2),
        surchargesRevenue: (-surchargeTotal).toFixed(2),
        totalWeightKg: (-creditLines.reduce(
          (sum, line) => sum + line.weightKg,
          0,
        )).toFixed(2),
        explanation: `Credit note for return order ${returnOrder.id}`,
      });

      const [inserted] = await tx
        .select({ id: Invoices.id })
        .from(Invoices)
        .where(eq(Invoices.uuid, creditNoteUuid))
        .limit(1);

      await tx.insert(JournalEntries).values(
        buildSalesJournalEntry({
          invoiceUuid: creditNoteUuid,
          invoiceId: inserted?.id ?? null,
          companyUuid: returnOrder.companyUuid,
          debCreditor: first?.debtorNo ?? null,
          invoiceDate: new Date(),
          // Already negative, so this books as a reduction of revenue without
          // needing the reversal flag.
          amountExclVat: -exclVat,
          vatAmount: -vatAmount,
          // Cost comes back with the revenue, clearing what the goods have been
          // parked at since they were received back into stock.
          costOfSales: -creditLines.reduce(
            (sum, line) => sum + line.costPrice * line.quantity,
            0,
          ),
          userId,
          description: "Credit note",
        }),
      );

      for (const line of creditLines) {
        // Guard: only credit a line still sitting at "invoiced". A line already
        // returned is terminal, so the same goods can't be credited twice — and
        // since a part-billed line stays at "delivered", this also holds back a
        // credit on goods that have not all been charged for yet.
        //
        // Crediting takes the quantity back out of what stands billed, so the
        // line's invoiced quantity keeps meaning "what the customer currently
        // owes for". That is what lets a cancelled credit note put it back.
        const [lineClaimed] = await tx
          .update(OrderItems)
          .set({
            status: "returned",
            invoicedQuantity: sql`GREATEST(${OrderItems.invoicedQuantity} - ${line.quantity.toFixed(3)}, 0)`,
          })
          .where(
            and(
              eq(OrderItems.uuid, line.orderItemUuid),
              eq(OrderItems.status, "invoiced"),
            ),
          );

        if (lineClaimed.affectedRows === 0) {
          throw new Error(
            "One of these lines is not fully invoiced, or was already returned or cancelled — please refresh and try again.",
          );
        }

        const amount = -(line.netPrice * line.quantity);
        const costAmount = -(line.costPrice * line.quantity);

        await tx.insert(InvoiceItems).values({
          uuid: generateUuid(),
          invoiceUuid: creditNoteUuid,
          orderItemUuid: line.orderItemUuid,
          productUuid: line.productUuid,
          quantity: (-line.quantity).toFixed(3),
          netPrice: line.netPrice.toFixed(2),
          amount: amount.toFixed(2),
          costPrice: line.costPrice.toFixed(4),
          costAmount: costAmount.toFixed(2),
          replacementPrice: line.replacementPrice.toFixed(2),
          // Margin reverses with the sale: the profit booked on the original
          // line is given back along with the revenue.
          profit: (amount - costAmount).toFixed(2),
          profitMargin: "0.00",
          profitReplPrice: (
            amount +
            line.replacementPrice * line.quantity
          ).toFixed(2),
          weightKg: (-line.weightKg).toFixed(2),
        });
      }
    });

    await mailDocument(
      () => sendInvoiceEmail(creditNoteUuid),
      `Credit note ${creditNoteUuid}`,
    );

    revalidatePath("/return-orders");
    revalidatePath(`/return-orders/${uuid}`);
    revalidatePath("/invoices");
    revalidatePath("/orders");
    revalidatePath("/financially-blocked");
    return { success: true, returnOrderUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to credit return order",
    };
  }
};

export const createReturnOrder = async (
  fields: ReturnOrderFields,
  extras: ReturnOrderExtras,
  items: ReturnOrderItemInput[] = [],
): Promise<ReturnOrderActionResult> => {
  const uuid = generateUuid();
  try {
    // Resolve what is coming back before writing anything: the line has to be
    // one this customer was actually invoiced for.
    const returnable = await getReturnableLines(fields.companyUuid);
    const returnableByUuid = new Map(
      returnable.map((line) => [line.orderItemUuid, line]),
    );

    for (const item of items) {
      const line = returnableByUuid.get(item.orderItemUuid);
      if (!line) {
        return {
          error:
            "One or more selected lines are not invoiced to this customer, or have already been returned.",
        };
      }
      const returnQty = Number(item.returnQty ?? 0);
      if (returnQty <= 0) {
        return { error: "Every returned line needs a quantity." };
      }
      if (returnQty > Number(line.quantity)) {
        return {
          error: `Cannot return more than was invoiced (${Number(line.quantity).toFixed(3)}).`,
        };
      }
    }

    await db.transaction(async (tx) => {
      await tx.insert(ReturnOrders).values({
        ...fields,
        uuid,
        orderDate: fields.orderDate ?? todayDateString(),
        // Where the goods are coming back from decides how they travel: road
        // within Europe, sea from Asia and South America. Nobody should have to
        // pick the obvious one.
        transportMode:
          fields.transportMode ??
          defaultTransportModeFor(fields.transportRegion),
      });

      // Lines were previously dropped on the floor here — a return order was
      // only ever a header, which is why nothing downstream could credit it.
      for (const [index, item] of items.entries()) {
        const line = returnableByUuid.get(item.orderItemUuid);
        if (!line) {
          continue;
        }

        const returnQty = Number(item.returnQty);
        const invoicedQty = Number(line.quantity) || 1;
        const netPrice = Number(line.netPrice ?? 0);

        await tx.insert(ReturnOrderItems).values({
          uuid: generateUuid(),
          returnOrderUuid: uuid,
          productUuid: line.productUuid,
          complaintUuid: item.complaintUuid ?? null,
          originalOrderUuid: line.orderUuid,
          originalOrderLine: line.lineNumber,
          originalOrderItemUuid: line.orderItemUuid,
          lineNumber: index + 1,
          reference: line.orderId != null ? String(line.orderId) : null,
          unit: line.unit,
          quantity: line.quantity,
          returnQty: returnQty.toFixed(3),
          returnReason: item.returnReason ?? fields.returnReason ?? null,
          netPrice: netPrice.toFixed(2),
          amount: (netPrice * returnQty).toFixed(2),
          weightKg: (
            (Number(line.weightKg ?? 0) / invoicedQty) *
            returnQty
          ).toFixed(2),
        });
      }

      if (extras.surcharges.length > 0) {
        await tx.insert(ReturnOrderSurcharges).values(
          extras.surcharges.map((surcharge) => ({
            ...surcharge,
            uuid: generateUuid(),
            returnOrderUuid: uuid,
          })),
        );
      }

      if (extras.texts.length > 0) {
        await tx.insert(Texts).values(
          extras.texts.map((text) => ({
            uuid: generateUuid(),
            returnOrderUuid: uuid,
            companyUuid: fields.companyUuid,
            title: text.title,
            textBlock: text.textBlock,
            textCategoryUuid: text.textCategoryUuid ?? null,
          })),
        );
      }

      // The Summary panel on the document — materials, surcharges, VAT and
      // weight — rolled up once the lines and surcharges are in.
      await tx
        .update(ReturnOrders)
        .set(
          await buildReturnOrderSummary(
            tx,
            uuid,
            fields.companyUuid,
            fields.calculateVatIfApplicable ?? false,
          ),
        )
        .where(eq(ReturnOrders.uuid, uuid));
    });
    revalidatePath("/return-orders");
    revalidatePath("/return-lines");
    return { success: true, returnOrderUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create return order",
    };
  }
};
