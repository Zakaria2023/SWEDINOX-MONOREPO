"use server";

import { COMPLAINT_COLUMNS } from "@/app/(dashboard)/complaints/columns";
import { createReturnOrder } from "@/app/(dashboard)/return-orders/actions";
import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import {
  ComplaintItems,
  SelectComplaintItems,
} from "@/db/schema/complaint-items";
import {
  Complaints,
  InsertComplaints,
  SelectComplaints,
} from "@/db/schema/complaints";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { CounterOrders } from "@/db/schema/counter-orders";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import { PurchaseOrders } from "@/db/schema/purchase-orders";
import { PurchaseQuotes } from "@/db/schema/purchase-quotes";
import { Quotes } from "@/db/schema/quotes";
import { ReturnOrderItems } from "@/db/schema/return-order-items";
import { ReturnOrders, SelectReturnOrders } from "@/db/schema/return-orders";
import { Stock } from "@/db/schema/stock";
import { SelectWarehouses, Warehouses } from "@/db/schema/warehouses";
import { requireAuth } from "@/lib/auth";
import {
  complaintCategories,
  complaintCauses,
  complaintSolutions,
  complaintStatuses,
  ComplaintType,
  complaintTypes,
} from "@/lib/enums";
import {
  calendarDaysBetween,
  complaintDocumentCode,
  complaintDocumentColumns,
  complaintSolutionReturnsGoods,
  describeError,
  generateUuid,
  moneyString,
  returnReasonForComplaintCategory,
  todayDateString,
} from "@/lib/helpers";
import { getClerkUserNames } from "@/lib/server/clerk";
import {
  COMPLAINT_OVERVIEW_FIELDS,
  ComplaintOverviewFields,
  toComplaintOverviewFields,
} from "@/lib/server/complaint-overview";
import { exportRows } from "@/lib/server/excel";
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
import { currentUser } from "@clerk/nextjs/server";
import {
  aliasedTable,
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  inArray,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const StockLocations = aliasedTable(Warehouses, "stock_locations");
const ExchangeProducts = aliasedTable(Products, "exchange_products");

const COMPLAINT_SEARCH = [
  Complaints.description,
  Companies.companyName,
  Products.productCode,
] as const;

const COMPLAINT_SORTABLE = {
  complaintNumber: Complaints.id,
  createdAt: Complaints.createdAt,
  reportDate: Complaints.reportDate,
  deadline: Complaints.deadline,
  customer: Companies.companyName,
  status: Complaints.status,
};

// A complaint is worked by state and by deadline. Category, cause and solution
// are what the quality reporting slices it by, and the solution is what decides
// whether goods physically come back — see complaintSolutionReturnsGoods.
const COMPLAINT_FILTERS = {
  status: enumFilter(Complaints.status, complaintStatuses),
  complaintType: enumFilter(Complaints.complaintType, complaintTypes),
  category: enumFilter(Complaints.category, complaintCategories),
  cause: enumFilter(Complaints.cause, complaintCauses),
  solution: enumFilter(Complaints.solution, complaintSolutions),
  company: relationFilter(Complaints.companyUuid),
  product: relationFilter(Complaints.productUuid),
  reportDate: dateRangeFilter(Complaints.reportDate),
};

// Only goods that reached the customer can be complained about. A reserved
// line has not left the warehouse, so there is nothing yet to be wrong with it.
const DELIVERED_LINE_STATUSES = ["delivered", "invoiced"] as const;

export type ComplaintFields = Omit<
  InsertComplaints,
  | "id"
  | "uuid"
  | "createdAt"
  | "updatedAt"
  | "createdByUserId"
  | "modifiedByUserId"
>;

export type ComplaintActionResult = {
  complaintUuid?: string;
  returnOrderUuid?: string;
  error?: string;
  success?: boolean;
};

export type ComplaintListItem = ComplaintOverviewFields & {
  productUuid: SelectComplaints["productUuid"];
  productCode: SelectProducts["productCode"] | null;
  productDescription: SelectProducts["name"] | null;
};

// One line on the record's `Lines` panel, in the reference's columns.
export type ComplaintItemDetail = SelectComplaintItems & {
  orderId: SelectOrders["id"] | null;
  orderLineNumber: SelectOrderItems["lineNumber"] | null;
  lengthMm: SelectOrderItems["lengthMm"] | null;
  widthMm: SelectOrderItems["widthMm"] | null;
  thicknessMm: SelectOrderItems["thicknessMm"] | null;
  options: SelectOrderItems["options"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  exchangeProductCode: SelectProducts["productCode"] | null;
  exchangeProductName: SelectProducts["name"] | null;
  warehouseSection: SelectWarehouses["name"] | null;
};

export type ComplaintDetail = SelectComplaints & {
  companyName: SelectCompanies["companyName"] | null;
  accountManager: SelectCompanies["accountManager"] | null;
  representative: SelectCompanies["representative"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  // The document the header names, the way the reference prints it.
  documentCode: string | null;
  // `Days in system` on every line: today less the report date. It keeps
  // counting on a closed complaint (566 on 40025, Done since the day it came
  // in) — unlike the overview's resolution time.
  daysInSystem: number | null;
  items: ComplaintItemDetail[];
  // Return orders raised off the back of this complaint — the link between a
  // customer's grievance and the goods actually coming back.
  returnOrders: SelectReturnOrders[];
};

export type ComplaintDocumentOption = {
  value: string;
  label: string;
};

// What the form reads off the company once one is picked: the two people the
// reference shows read-only under it, and the documents its type can name.
export type ComplaintCompanyContext = {
  accountManager: SelectCompanies["accountManager"] | null;
  representative: SelectCompanies["representative"] | null;
  documents: ComplaintDocumentOption[];
};

// A delivered line of the complaint's order, offered on the Lines panel.
export type ComplaintOrderLine = {
  orderItemUuid: SelectOrderItems["uuid"];
  lineNumber: SelectOrderItems["lineNumber"];
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  quantity: SelectOrderItems["quantity"];
  unit: SelectOrderItems["unit"];
  deliveryDate: SelectOrderItems["deliveryDate"];
};

export type ComplaintLineDeleteInput = {
  lineUuid: string;
};

export type ComplaintLineInput = {
  complaintUuid: string;
  orderItemUuid: string;
  billOfLading: string;
  qtyShortfall: string;
  exchangeProductUuid: string;
};

/**
 * The rows one view of the complaints overview selects, as a window onto them.
 *
 * Shared by the page and the export so the file cannot drift from the screen.
 */
const complaintRows =
  (query: TableQuery) =>
  async (limit: number, offset: number): Promise<ComplaintListItem[]> => {
    const rows = await db
      .select({
        ...COMPLAINT_OVERVIEW_FIELDS,
        productUuid: Complaints.productUuid,
        productCode: Products.productCode,
        productDescription: Products.name,
      })
      .from(Complaints)
      .leftJoin(Companies, eq(Complaints.companyUuid, Companies.uuid))
      .leftJoin(Contacts, eq(Complaints.contactUuid, Contacts.uuid))
      .leftJoin(Products, eq(Complaints.productUuid, Products.uuid))
      .leftJoin(Orders, eq(Complaints.orderUuid, Orders.uuid))
      .leftJoin(Quotes, eq(Complaints.quoteUuid, Quotes.uuid))
      .leftJoin(
        CounterOrders,
        eq(Complaints.counterOrderUuid, CounterOrders.uuid),
      )
      .leftJoin(
        PurchaseOrders,
        eq(Complaints.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(
        PurchaseQuotes,
        eq(Complaints.purchaseQuoteUuid, PurchaseQuotes.uuid),
      )
      .leftJoin(ReturnOrders, eq(Complaints.returnOrderUuid, ReturnOrders.uuid))
      .where(
        tableWhere({
          query,
          search: COMPLAINT_SEARCH,
          filters: COMPLAINT_FILTERS,
        }),
      )
      .orderBy(
        ...tableOrderBy(
          COMPLAINT_SORTABLE,
          query,
          [desc(Complaints.createdAt)],
          Complaints.id,
        ),
      )
      .limit(limit)
      .offset(offset);

    if (rows.length === 0) {
      return [];
    }
    const nameById = new Map(Object.entries(await getClerkUserNames()));
    return rows.map(
      ({ productUuid, productCode, productDescription, ...raw }) => ({
        ...toComplaintOverviewFields(raw, nameById),
        productUuid,
        productCode,
        productDescription,
      }),
    );
  };

/** Every complaint the current view matches, as a workbook. */
export const exportComplaints = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Complaints",
    columns: COMPLAINT_COLUMNS,
    columnKeys,
    rows: complaintRows(parseTableQuery(params)),
  });

export const getComplaints = async (
  query: TableQuery,
): Promise<Paged<ComplaintListItem>> => {
  try {
    const where = tableWhere({
      query,
      search: COMPLAINT_SEARCH,
      filters: COMPLAINT_FILTERS,
    });

    return await runPaged(query, {
      rows: complaintRows(query),

      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(Complaints)
          .leftJoin(Companies, eq(Complaints.companyUuid, Companies.uuid))
          .leftJoin(Products, eq(Complaints.productUuid, Products.uuid))
          .where(where);
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch complaints"));
  }
};

export const getComplaintDetail = async (
  uuid: string,
): Promise<ComplaintDetail | null> => {
  const [complaint] = await db
    .select({
      ...getTableColumns(Complaints),
      companyName: Companies.companyName,
      accountManager: Companies.accountManager,
      representative: Companies.representative,
      contactFirstName: Contacts.firstName,
      contactLastName: Contacts.lastName,
      productCode: Products.productCode,
      productName: Products.name,
      orderId: Orders.id,
      quoteId: Quotes.id,
      counterOrderId: CounterOrders.id,
      purchaseOrderId: PurchaseOrders.id,
      purchaseQuoteId: PurchaseQuotes.id,
      returnOrderId: ReturnOrders.id,
    })
    .from(Complaints)
    .leftJoin(Companies, eq(Complaints.companyUuid, Companies.uuid))
    .leftJoin(Contacts, eq(Complaints.contactUuid, Contacts.uuid))
    .leftJoin(Products, eq(Complaints.productUuid, Products.uuid))
    .leftJoin(Orders, eq(Complaints.orderUuid, Orders.uuid))
    .leftJoin(Quotes, eq(Complaints.quoteUuid, Quotes.uuid))
    .leftJoin(CounterOrders, eq(Complaints.counterOrderUuid, CounterOrders.uuid))
    .leftJoin(
      PurchaseOrders,
      eq(Complaints.purchaseOrderUuid, PurchaseOrders.uuid),
    )
    .leftJoin(
      PurchaseQuotes,
      eq(Complaints.purchaseQuoteUuid, PurchaseQuotes.uuid),
    )
    .leftJoin(ReturnOrders, eq(Complaints.returnOrderUuid, ReturnOrders.uuid))
    .where(eq(Complaints.uuid, uuid))
    .limit(1);

  if (!complaint) {
    return null;
  }

  const items = await db
    .select({
      ...getTableColumns(ComplaintItems),
      orderId: Orders.id,
      orderLineNumber: OrderItems.lineNumber,
      lengthMm: OrderItems.lengthMm,
      widthMm: OrderItems.widthMm,
      thicknessMm: OrderItems.thicknessMm,
      options: OrderItems.options,
      productCode: Products.productCode,
      productName: Products.name,
      exchangeProductCode: ExchangeProducts.productCode,
      exchangeProductName: ExchangeProducts.name,
      warehouseSection: Warehouses.name,
    })
    .from(ComplaintItems)
    .leftJoin(Orders, eq(ComplaintItems.orderUuid, Orders.uuid))
    .leftJoin(OrderItems, eq(ComplaintItems.orderItemUuid, OrderItems.uuid))
    .leftJoin(Products, eq(ComplaintItems.productUuid, Products.uuid))
    .leftJoin(
      ExchangeProducts,
      eq(ComplaintItems.exchangeProductUuid, ExchangeProducts.uuid),
    )
    .leftJoin(
      Warehouses,
      eq(ComplaintItems.warehouseSectionUuid, Warehouses.uuid),
    )
    .where(eq(ComplaintItems.complaintUuid, uuid))
    .orderBy(asc(ComplaintItems.lineNumber), asc(ComplaintItems.id));

  // Reached through the return lines, since it is the line that records which
  // complaint sent it back.
  const returnOrders = await db
    .selectDistinct(getTableColumns(ReturnOrders))
    .from(ReturnOrders)
    .innerJoin(
      ReturnOrderItems,
      eq(ReturnOrderItems.returnOrderUuid, ReturnOrders.uuid),
    )
    .where(eq(ReturnOrderItems.complaintUuid, uuid))
    .orderBy(desc(ReturnOrders.createdAt));

  const {
    orderId,
    quoteId,
    counterOrderId,
    purchaseOrderId,
    purchaseQuoteId,
    returnOrderId,
    ...rest
  } = complaint;

  return {
    ...rest,
    documentCode: complaintDocumentCode({
      complaintType: complaint.complaintType,
      orderId,
      quoteId,
      counterOrderId,
      purchaseOrderId,
      purchaseQuoteId,
      returnOrderId,
    }),
    daysInSystem: complaint.reportDate
      ? calendarDaysBetween(complaint.reportDate, todayDateString())
      : null,
    items,
    returnOrders,
  };
};

// The documents of one kind a company can have a complaint about, newest first.
const documentsFor = async (
  companyUuid: string,
  complaintType: ComplaintType,
): Promise<ComplaintDocumentOption[]> => {
  const option = (prefix: string) => (row: { uuid: string; id: number }) => ({
    value: row.uuid,
    label: `${prefix}${row.id}`,
  });

  switch (complaintType) {
    case "order":
      return (
        await db
          .select({ uuid: Orders.uuid, id: Orders.id })
          .from(Orders)
          .where(eq(Orders.companyUuid, companyUuid))
          .orderBy(desc(Orders.id))
      ).map(option("O"));
    case "quote":
      return (
        await db
          .select({ uuid: Quotes.uuid, id: Quotes.id })
          .from(Quotes)
          .where(eq(Quotes.companyUuid, companyUuid))
          .orderBy(desc(Quotes.id))
      ).map(option("Q"));
    case "counter_order":
      return (
        await db
          .select({ uuid: CounterOrders.uuid, id: CounterOrders.id })
          .from(CounterOrders)
          .where(eq(CounterOrders.companyUuid, companyUuid))
          .orderBy(desc(CounterOrders.id))
      ).map(option("C"));
    case "purchase_order":
      return (
        await db
          .select({ uuid: PurchaseOrders.uuid, id: PurchaseOrders.id })
          .from(PurchaseOrders)
          .where(eq(PurchaseOrders.supplierUuid, companyUuid))
          .orderBy(desc(PurchaseOrders.id))
      ).map(option("IO"));
    case "purchase_quote":
      return (
        await db
          .select({ uuid: PurchaseQuotes.uuid, id: PurchaseQuotes.id })
          .from(PurchaseQuotes)
          .where(eq(PurchaseQuotes.companyUuid, companyUuid))
          .orderBy(desc(PurchaseQuotes.id))
      ).map(option("IQ"));
    case "return_order":
      return (
        await db
          .select({ uuid: ReturnOrders.uuid, id: ReturnOrders.id })
          .from(ReturnOrders)
          .where(eq(ReturnOrders.companyUuid, companyUuid))
          .orderBy(desc(ReturnOrders.id))
      ).map(option("R"));
    case "general":
      return [];
  }
};

export const getComplaintCompanyContext = async (
  companyUuid: string,
  complaintType: ComplaintType | null,
): Promise<ComplaintCompanyContext> => {
  await requireAuth();
  const [company] = await db
    .select({
      accountManager: Companies.accountManager,
      representative: Companies.representative,
    })
    .from(Companies)
    .where(eq(Companies.uuid, companyUuid))
    .limit(1);

  return {
    accountManager: company?.accountManager ?? null,
    representative: company?.representative ?? null,
    documents:
      company && complaintType
        ? await documentsFor(companyUuid, complaintType)
        : [],
  };
};

// The document the fields name has to be one of the company's own, of the kind
// the type says — the picker only offers those, and the server holds to it.
const assertDocumentFits = async (fields: ComplaintFields): Promise<void> => {
  const links = complaintDocumentColumns(
    fields.complaintType,
    fields.orderUuid ??
      fields.quoteUuid ??
      fields.counterOrderUuid ??
      fields.purchaseOrderUuid ??
      fields.purchaseQuoteUuid ??
      fields.returnOrderUuid,
  );
  const chosen = Object.values(links).find((value) => value !== null);
  if (!chosen || !fields.complaintType) {
    return;
  }
  const allowed = await documentsFor(fields.companyUuid, fields.complaintType);
  if (!allowed.some((document) => document.value === chosen)) {
    throw new Error("The chosen document does not belong to this company.");
  }
};

// Keeps only the document link the type calls for.
const withDocumentLink = (fields: ComplaintFields): ComplaintFields => ({
  ...fields,
  ...complaintDocumentColumns(
    fields.complaintType,
    fields.orderUuid ??
      fields.quoteUuid ??
      fields.counterOrderUuid ??
      fields.purchaseOrderUuid ??
      fields.purchaseQuoteUuid ??
      fields.returnOrderUuid,
  ),
});

export const updateComplaint = async (
  uuid: string,
  fields: ComplaintFields,
): Promise<ComplaintActionResult> => {
  try {
    const [existing] = await db
      .select({
        status: Complaints.status,
        statusHistory: Complaints.statusHistory,
      })
      .from(Complaints)
      .where(eq(Complaints.uuid, uuid))
      .limit(1);

    if (!existing) {
      return { error: "Complaint not found." };
    }

    const linked = withDocumentLink(fields);
    await assertDocumentFits(linked);

    // The status trail is append-only, and only grows when the status actually
    // moves — re-saving a complaint without touching its status should not
    // manufacture a history entry that says somebody changed something.
    const user = await currentUser();
    const statusChanged = fields.status && fields.status !== existing.status;
    const statusHistory = statusChanged
      ? [
          ...(existing.statusHistory ?? []),
          {
            status: fields.status ?? "new",
            statusDate: new Date().toISOString(),
            assignedByUserId: user?.id ?? "",
            assignedByName:
              user?.fullName ||
              [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
              user?.username ||
              "",
          },
        ]
      : existing.statusHistory;

    await db
      .update(Complaints)
      .set({
        ...linked,
        statusHistory,
        modifiedByUserId: user?.id ?? null,
      })
      .where(eq(Complaints.uuid, uuid));
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update complaint",
    };
  }

  revalidatePath("/complaints");
  revalidatePath("/complaint-lines");
  revalidatePath(`/complaints/${uuid}`);
  redirect(`/complaints/${uuid}`);
};

export const deleteComplaint = async (
  uuid: string,
): Promise<ComplaintActionResult> => {
  try {
    await db.transaction(async (tx) => {
      await tx
        .delete(ComplaintItems)
        .where(eq(ComplaintItems.complaintUuid, uuid));
      await tx.delete(Complaints).where(eq(Complaints.uuid, uuid));
    });
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to delete complaint",
    };
  }

  revalidatePath("/complaints");
  revalidatePath("/complaint-lines");
  redirect("/complaints");
};

/**
 * The delivered lines of the order a complaint names — what its Lines panel can
 * add. Lines exist only on an `Order` complaint: all 23 reference complaints
 * with lines were of that type, and every line named the complaint's own order.
 */
export const getComplaintOrderLines = async (
  complaintUuid: string,
): Promise<ComplaintOrderLine[]> => {
  const [complaint] = await db
    .select({ orderUuid: Complaints.orderUuid })
    .from(Complaints)
    .where(eq(Complaints.uuid, complaintUuid))
    .limit(1);

  if (!complaint?.orderUuid) {
    return [];
  }

  return db
    .select({
      orderItemUuid: OrderItems.uuid,
      lineNumber: OrderItems.lineNumber,
      productCode: Products.productCode,
      productName: Products.name,
      quantity: OrderItems.quantity,
      unit: OrderItems.unit,
      deliveryDate: OrderItems.deliveryDate,
    })
    .from(OrderItems)
    .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
    .where(
      and(
        eq(OrderItems.orderUuid, complaint.orderUuid),
        inArray(OrderItems.status, [...DELIVERED_LINE_STATUSES]),
      ),
    )
    .orderBy(asc(OrderItems.lineNumber));
};

/**
 * Adds one delivered order line to an order complaint — the `New` button of the
 * reference's Lines panel.
 *
 * A line records which delivery is meant and how much of it is in dispute. The
 * disputed quantity may be 0 (complaint 40043 lists three deliveries, all 0, to
 * say which lines an invoicing complaint is about) and never exceeds what the
 * delivery brought. The same order line may be added again for a second
 * delivery, which is how the reference comes to list one order line twice.
 */
export const addComplaintLine = async (
  _prevState: ComplaintActionResult,
  input: ComplaintLineInput,
): Promise<ComplaintActionResult> => {
  const userId = await requireAuth();
  try {
    const [complaint] = await db
      .select({
        uuid: Complaints.uuid,
        orderUuid: Complaints.orderUuid,
        complaintType: Complaints.complaintType,
        category: Complaints.category,
        description: Complaints.description,
      })
      .from(Complaints)
      .where(eq(Complaints.uuid, input.complaintUuid))
      .limit(1);

    if (!complaint) {
      return { error: "Complaint not found." };
    }
    if (complaint.complaintType !== "order" || !complaint.orderUuid) {
      return {
        error:
          "Only an order complaint has lines. Set the complaint type to Order and choose its order first.",
      };
    }

    const [line] = await db
      .select({
        orderItemUuid: OrderItems.uuid,
        orderUuid: OrderItems.orderUuid,
        productUuid: OrderItems.productUuid,
        lineNumber: OrderItems.lineNumber,
        quantity: OrderItems.quantity,
        unit: OrderItems.unit,
        amount: OrderItems.amount,
        weightKg: OrderItems.kgActual,
        deliveryDate: OrderItems.deliveryDate,
        status: OrderItems.status,
        seller: Orders.seller,
        locationUuid: StockLocations.uuid,
        locationParentUuid: StockLocations.parentUuid,
      })
      .from(OrderItems)
      .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .leftJoin(Stock, eq(OrderItems.stockUuid, Stock.uuid))
      .leftJoin(StockLocations, eq(Stock.locationUuid, StockLocations.uuid))
      .where(eq(OrderItems.uuid, input.orderItemUuid))
      .limit(1);

    if (!line || line.orderUuid !== complaint.orderUuid) {
      return { error: "That line is not on this complaint's order." };
    }
    if (
      !DELIVERED_LINE_STATUSES.some((status) => status === line.status)
    ) {
      return {
        error:
          "That line has not been delivered yet, so there is nothing to complain about.",
      };
    }

    const shortfall = Number(input.qtyShortfall);
    const delivered = Number(line.quantity);
    if (!Number.isFinite(shortfall) || shortfall < 0) {
      return { error: "The disputed quantity cannot be negative." };
    }
    if (shortfall > delivered) {
      return {
        error: `The disputed quantity cannot exceed what was delivered (${delivered}).`,
      };
    }

    // The disputed share of what the delivery was worth and weighed.
    const share = delivered > 0 ? shortfall / delivered : 0;

    await db.insert(ComplaintItems).values({
      uuid: generateUuid(),
      complaintUuid: complaint.uuid,
      orderUuid: line.orderUuid,
      orderItemUuid: line.orderItemUuid,
      productUuid: line.productUuid,
      // Stock sits in a location, a leaf of the Warehouses tree; the section is
      // that location's parent, or the location itself off the warehouse root.
      warehouseSectionUuid: line.locationParentUuid ?? line.locationUuid,
      // The reference numbers a complaint line by its order line (40025: 20).
      lineNumber: line.lineNumber,
      description: complaint.description,
      category: complaint.category,
      complaintType: complaint.complaintType,
      deliveryDate: line.deliveryDate,
      billOfLading: input.billOfLading.trim() || null,
      createdByUserId: userId,
      purchaserSeller: line.seller,
      qtyDelivered: delivered.toFixed(3),
      unit: line.unit,
      qty: shortfall.toFixed(3),
      exchangeProductUuid: input.exchangeProductUuid || null,
      amount: moneyString(Number(line.amount ?? 0) * share),
      weightKg: (Number(line.weightKg ?? 0) * share).toFixed(2),
    });
  } catch (error) {
    return { error: describeError(error, "Failed to add the line") };
  }

  revalidatePath(`/complaints/${input.complaintUuid}`);
  revalidatePath("/complaint-lines");
  return { success: true, complaintUuid: input.complaintUuid };
};

export const deleteComplaintLine = async (
  _prevState: ComplaintActionResult,
  input: ComplaintLineDeleteInput,
): Promise<ComplaintActionResult> => {
  await requireAuth();
  const { lineUuid } = input;
  try {
    const [line] = await db
      .select({ complaintUuid: ComplaintItems.complaintUuid })
      .from(ComplaintItems)
      .where(eq(ComplaintItems.uuid, lineUuid))
      .limit(1);

    if (!line) {
      return { error: "Complaint line not found." };
    }

    // A line a return order was raised from is part of that return's record.
    const [returned] = await db
      .select({ uuid: ReturnOrderItems.uuid })
      .from(ReturnOrderItems)
      .where(eq(ReturnOrderItems.complaintUuid, line.complaintUuid))
      .limit(1);
    if (returned) {
      return {
        error:
          "A return order has been raised from this complaint, so its lines stay.",
      };
    }

    await db.delete(ComplaintItems).where(eq(ComplaintItems.uuid, lineUuid));

    revalidatePath(`/complaints/${line.complaintUuid}`);
    revalidatePath("/complaint-lines");
    return { success: true, complaintUuid: line.complaintUuid };
  } catch (error) {
    return { error: describeError(error, "Failed to delete the line") };
  }
};

/**
 * Raises the return order a complaint calls for.
 *
 * Only solutions that bring the goods physically back qualify — a price
 * correction settles on paper and a subsequent delivery sends more out, so
 * neither has anything to receive. The return is created through
 * createReturnOrder rather than written here directly, so it inherits the same
 * guards: only invoiced lines, never more than was billed, and never a line
 * that has already come back.
 */
export const convertComplaintToReturnOrder = async (
  complaintUuid: string,
): Promise<ComplaintActionResult> => {
  try {
    const [complaint] = await db
      .select()
      .from(Complaints)
      .where(eq(Complaints.uuid, complaintUuid))
      .limit(1);

    if (!complaint) {
      return { error: "Complaint not found." };
    }
    if (!complaintSolutionReturnsGoods(complaint.solution)) {
      return {
        error:
          "This complaint's solution doesn't bring the goods back, so there is nothing to return. Set it to collect or return the goods first.",
      };
    }

    const items = await db
      .select()
      .from(ComplaintItems)
      .where(eq(ComplaintItems.complaintUuid, complaintUuid));

    // Only the disputed part comes back; a line listed with nothing in dispute
    // says which delivery is meant and returns nothing.
    const withOrderLine = items.filter(
      (item) => !!item.orderItemUuid && Number(item.qty ?? 0) > 0,
    );
    if (withOrderLine.length === 0) {
      return {
        error:
          "This complaint has no lines with a disputed quantity, so there is nothing to return.",
      };
    }

    const existing = await db
      .select({ uuid: ReturnOrderItems.uuid })
      .from(ReturnOrderItems)
      .where(eq(ReturnOrderItems.complaintUuid, complaintUuid))
      .limit(1);

    if (existing.length > 0) {
      return {
        error: "A return order has already been raised for this complaint.",
      };
    }

    const result = await createReturnOrder(
      {
        companyUuid: complaint.companyUuid,
        contactUuid: complaint.contactUuid,
        orderUuid: withOrderLine[0].orderUuid,
        complaintRef: String(complaint.id),
        returnReason: returnReasonForComplaintCategory(complaint.category),
        status: "open",
      },
      { surcharges: [], texts: [] },
      withOrderLine.flatMap((item) =>
        item.orderItemUuid
          ? [
              {
                orderItemUuid: item.orderItemUuid,
                returnQty: item.qty ?? "0.000",
                complaintUuid,
              },
            ]
          : [],
      ),
    );

    if (result.error) {
      return { error: result.error };
    }

    revalidatePath("/complaints");
    revalidatePath(`/complaints/${complaintUuid}`);
    revalidatePath("/return-orders");
    return {
      success: true,
      complaintUuid,
      returnOrderUuid: result.returnOrderUuid,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to raise a return order from this complaint",
    };
  }
};

export const createComplaint = async (
  fields: ComplaintFields,
): Promise<ComplaintActionResult> => {
  const uuid = generateUuid();
  try {
    // The initial status history entry is stamped server-side with the current
    // user, so "Assigned by" always reflects who actually created the record.
    const user = await currentUser();
    const assignedByName =
      user?.fullName ||
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      user?.username ||
      "";
    const statusHistory = [
      {
        status: fields.status ?? "new",
        statusDate: new Date().toISOString(),
        assignedByUserId: user?.id ?? "",
        assignedByName,
      },
    ];

    const linked = withDocumentLink(fields);
    await assertDocumentFits(linked);

    await db.insert(Complaints).values({
      ...linked,
      uuid,
      statusHistory,
      createdByUserId: user?.id ?? null,
      modifiedByUserId: user?.id ?? null,
    });

    revalidatePath("/complaints");
    return { success: true, complaintUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create complaint",
    };
  }
};
