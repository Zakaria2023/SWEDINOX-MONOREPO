"use server";

import { COMPLAINT_LINE_COLUMNS } from "@/app/(dashboard)/complaint-lines/columns";
import { ComplaintOverviewRow } from "@/app/(dashboard)/complaints/columns";
import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import {
  ComplaintItems,
  SelectComplaintItems,
} from "@/db/schema/complaint-items";
import { Complaints, SelectComplaints } from "@/db/schema/complaints";
import { Contacts } from "@/db/schema/contacts";
import { CounterOrders } from "@/db/schema/counter-orders";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import { PurchaseOrders } from "@/db/schema/purchase-orders";
import { PurchaseQuotes } from "@/db/schema/purchase-quotes";
import { Quotes } from "@/db/schema/quotes";
import { ReturnOrders } from "@/db/schema/return-orders";
import { SelectWarehouses, Warehouses } from "@/db/schema/warehouses";
import { requireAuth } from "@/lib/auth";
import {
  complaintCategories,
  complaintStatuses,
  complaintTypes,
} from "@/lib/enums";
import { describeError } from "@/lib/helpers";
import {
  getClerkUserNames,
  getClerkUsersForSelect,
} from "@/lib/server/clerk";
import {
  COMPLAINT_OVERVIEW_FIELDS,
  toComplaintOverviewFields,
} from "@/lib/server/complaint-overview";
import { exportRows } from "@/lib/server/excel";
import {
  booleanFilter,
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
import { asc, count, desc, eq, SQL, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const COMPLAINT_LINE_SEARCH = [
  Complaints.description,
  Companies.companyName,
  Products.productCode,
] as const;

const COMPLAINT_LINE_SORTABLE = {
  complaintNumber: Complaints.id,
  reportDate: Complaints.reportDate,
  customer: Companies.companyName,
  status: Complaints.status,
  deadline: Complaints.deadline,
  createdAt: Complaints.createdAt,
};

const COMPLAINT_LINE_FILTERS = {
  status: enumFilter(Complaints.status, complaintStatuses),
  complaintType: enumFilter(Complaints.complaintType, complaintTypes),
  category: enumFilter(Complaints.category, complaintCategories),
  company: relationFilter(Complaints.companyUuid),
  product: relationFilter(ComplaintItems.productUuid),
  reportDate: dateRangeFilter(Complaints.reportDate),
  completed: booleanFilter(ComplaintItems.completed),
};

// A line names the order line it is about; its order is the complaint's
// (34 of 34 reference lines), and the line's own stands in when the complaint
// header was saved without one.
const lineOrderUuid = sql`COALESCE(${Complaints.orderUuid}, ${ComplaintItems.orderUuid})`;

export type ComplaintLineOverviewRow = ComplaintOverviewRow & {
  lineUuid: SelectComplaintItems["uuid"];
  orderLine: SelectOrderItems["lineNumber"] | null;
  warehouseSection: SelectWarehouses["name"] | null;
};

export type ComplaintLineRow = SelectComplaintItems & {
  complaintNumber: SelectComplaints["id"] | null;
  reportDate: SelectComplaints["reportDate"] | null;
  // Handling is the complaint's; every line shows its complaint's.
  status: SelectComplaints["status"] | null;
  deadline: SelectComplaints["deadline"] | null;
  cause: SelectComplaints["cause"] | null;
  explanationOfCause: SelectComplaints["explanationOfCause"] | null;
  solution: SelectComplaints["solution"] | null;
  explanationOfSolution: SelectComplaints["explanationOfSolution"] | null;
  /** The date of the complaint's latest status change. */
  statusDate: string | null;
  companyCode: SelectCompanies["id"] | null;
  companyName: SelectCompanies["companyName"] | null;
  companyUuid: SelectCompanies["uuid"] | null;
  customerGroup: SelectCompanies["customerGroup"] | null;
  representative: SelectCompanies["representative"] | null;
  orderId: SelectOrders["id"] | null;
  orderSeller: SelectOrders["seller"] | null;
  orderLineNumber: number | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  warehouseSection: SelectWarehouses["name"] | null;
  // Resolved from the Clerk user ids on the complaint and the line.
  responsibleName: string | null;
  createdByName: string | null;
  // Derived from the report date, so the overview can group by period.
  reportMonth: number | null;
  reportYear: number | null;
};

export type ComplaintLineActionResult = {
  error?: string;
  success?: boolean;
};

/**
 * The Complaint lines overview: the complaint's own 29 columns on every line,
 * plus the two that belong to the line — which order line, and the warehouse
 * section.
 */
const complaintLineOverviewRows =
  (query: TableQuery) =>
  async (
    limit: number,
    offset: number,
  ): Promise<ComplaintLineOverviewRow[]> => {
    const rows = await db
      .select({
        ...COMPLAINT_OVERVIEW_FIELDS,
        lineUuid: ComplaintItems.uuid,
        lineOrderUuid: sql<string | null>`${lineOrderUuid}`,
        orderLine: OrderItems.lineNumber,
        warehouseSection: Warehouses.name,
        productCode: Products.productCode,
        productDescription: Products.name,
      })
      .from(ComplaintItems)
      .innerJoin(Complaints, eq(ComplaintItems.complaintUuid, Complaints.uuid))
      .leftJoin(Companies, eq(Complaints.companyUuid, Companies.uuid))
      .leftJoin(Contacts, eq(Complaints.contactUuid, Contacts.uuid))
      .leftJoin(Products, eq(ComplaintItems.productUuid, Products.uuid))
      .leftJoin(Orders, sql`${Orders.uuid} = ${lineOrderUuid}`)
      .leftJoin(OrderItems, eq(ComplaintItems.orderItemUuid, OrderItems.uuid))
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
      .leftJoin(
        Warehouses,
        eq(ComplaintItems.warehouseSectionUuid, Warehouses.uuid),
      )
      .where(
        tableWhere({
          query,
          search: COMPLAINT_LINE_SEARCH,
          filters: COMPLAINT_LINE_FILTERS,
        }),
      )
      .orderBy(
        ...tableOrderBy(
          COMPLAINT_LINE_SORTABLE,
          query,
          [desc(Complaints.id), asc(ComplaintItems.lineNumber)],
          ComplaintItems.id,
        ),
      )
      .limit(limit)
      .offset(offset);

    if (rows.length === 0) {
      return [];
    }
    const nameById = new Map(Object.entries(await getClerkUserNames()));
    return rows.map(
      ({
        lineUuid,
        lineOrderUuid: orderUuid,
        orderLine,
        warehouseSection,
        productCode,
        productDescription,
        ...raw
      }) => ({
        ...toComplaintOverviewFields({ ...raw, orderUuid }, nameById),
        lineUuid,
        orderLine,
        warehouseSection,
        productCode,
        productDescription,
      }),
    );
  };

export const getComplaintLineOverview = async (
  query: TableQuery,
): Promise<Paged<ComplaintLineOverviewRow>> => {
  try {
    return await runPaged(query, {
      rows: complaintLineOverviewRows(query),
      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(ComplaintItems)
          .innerJoin(
            Complaints,
            eq(ComplaintItems.complaintUuid, Complaints.uuid),
          )
          .leftJoin(Companies, eq(Complaints.companyUuid, Companies.uuid))
          .leftJoin(Products, eq(ComplaintItems.productUuid, Products.uuid))
          .where(
            tableWhere({
              query,
              search: COMPLAINT_LINE_SEARCH,
              filters: COMPLAINT_LINE_FILTERS,
            }),
          );
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch complaint lines"));
  }
};

export const exportComplaintLines = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Complaint lines",
    columns: COMPLAINT_LINE_COLUMNS,
    columnKeys,
    rows: complaintLineOverviewRows(parseTableQuery(params)),
  });

// One complaint line, joined to its complaint, that complaint's company, the
// order line it is about and the section the goods sat in.
const selectComplaintLines = async (
  where?: SQL,
): Promise<ComplaintLineRow[]> => {
  const base = db
    .select({
      item: ComplaintItems,
      complaintNumber: Complaints.id,
      reportDate: Complaints.reportDate,
      status: Complaints.status,
      deadline: Complaints.deadline,
      cause: Complaints.cause,
      explanationOfCause: Complaints.explanationOfCause,
      solution: Complaints.solution,
      explanationOfSolution: Complaints.explanationOfSolution,
      statusHistory: Complaints.statusHistory,
      responsibleUserId: Complaints.responsibleUserId,
      companyCode: Companies.id,
      companyName: Companies.companyName,
      companyUuid: Companies.uuid,
      customerGroup: Companies.customerGroup,
      representative: Companies.representative,
      orderId: Orders.id,
      orderSeller: Orders.seller,
      orderLineNumber: OrderItems.lineNumber,
      productCode: Products.productCode,
      productName: Products.name,
      warehouseSection: Warehouses.name,
      reportMonth: sql<number>`MONTH(${Complaints.reportDate})`,
      reportYear: sql<number>`YEAR(${Complaints.reportDate})`,
    })
    .from(ComplaintItems)
    .innerJoin(Complaints, eq(ComplaintItems.complaintUuid, Complaints.uuid))
    .leftJoin(Companies, eq(Complaints.companyUuid, Companies.uuid))
    .leftJoin(Orders, eq(ComplaintItems.orderUuid, Orders.uuid))
    .leftJoin(OrderItems, eq(ComplaintItems.orderItemUuid, OrderItems.uuid))
    .leftJoin(Products, eq(ComplaintItems.productUuid, Products.uuid))
    .leftJoin(
      Warehouses,
      eq(ComplaintItems.warehouseSectionUuid, Warehouses.uuid),
    );

  const rows = await (where ? base.where(where) : base).orderBy(
    desc(Complaints.id),
    asc(ComplaintItems.lineNumber),
  );

  // Clerk owns the user list, so the ids stored are resolved to names here
  // rather than joined.
  const users = await getClerkUsersForSelect();
  const nameById = new Map(users.map((user) => [user.value, user.label]));

  return rows.map(({ item, statusHistory, responsibleUserId, ...rest }) => ({
    ...item,
    complaintNumber: rest.complaintNumber,
    reportDate: rest.reportDate,
    status: rest.status,
    deadline: rest.deadline,
    cause: rest.cause,
    explanationOfCause: rest.explanationOfCause,
    solution: rest.solution,
    explanationOfSolution: rest.explanationOfSolution,
    statusDate: statusHistory?.at(-1)?.statusDate ?? null,
    companyCode: rest.companyCode,
    companyName: rest.companyName,
    companyUuid: rest.companyUuid,
    customerGroup: rest.customerGroup,
    representative: rest.representative,
    orderId: rest.orderId,
    orderSeller: rest.orderSeller,
    orderLineNumber: rest.orderLineNumber,
    productCode: rest.productCode,
    productName: rest.productName,
    warehouseSection: rest.warehouseSection,
    responsibleName: responsibleUserId
      ? (nameById.get(responsibleUserId) ?? responsibleUserId)
      : null,
    createdByName: item.createdByUserId
      ? (nameById.get(item.createdByUserId) ?? item.createdByUserId)
      : null,
    reportMonth: rest.reportMonth === null ? null : Number(rest.reportMonth),
    reportYear: rest.reportYear === null ? null : Number(rest.reportYear),
  }));
};

/**
 * One complaint line with its complaint, the customer, the order line it is
 * about, the product and the warehouse section the goods sat in.
 */
export const getComplaintLineDetail = async (
  uuid: string,
): Promise<ComplaintLineRow | null> => {
  try {
    const [row] = await selectComplaintLines(eq(ComplaintItems.uuid, uuid));
    return row ?? null;
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch complaint line"));
  }
};

/**
 * Tick a line off — or back on. A complaint about four deliveries is often
 * settled one delivery at a time, and the complaint stays open until the last.
 */
export const setComplaintLineCompleted = async (
  uuid: string,
  completed: boolean,
): Promise<ComplaintLineActionResult> => {
  await requireAuth();
  try {
    const [update] = await db
      .update(ComplaintItems)
      .set({ completed })
      .where(eq(ComplaintItems.uuid, uuid));

    if (update.affectedRows === 0) {
      return { error: "Complaint line not found." };
    }
  } catch (error) {
    return { error: describeError(error, "Failed to update the line") };
  }

  revalidatePath("/complaint-lines");
  revalidatePath(`/complaint-lines/${uuid}`);
  revalidatePath("/complaints");
  return { success: true };
};
