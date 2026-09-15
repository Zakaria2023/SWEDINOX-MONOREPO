"use server";

import { db } from "@/db";
import {
  Complaints,
  InsertComplaints,
  SelectComplaints,
} from "@/db/schema/complaints";
import {
  ComplaintItems,
  SelectComplaintItems,
} from "@/db/schema/complaint-items";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import { ReturnOrderItems } from "@/db/schema/return-order-items";
import { ReturnOrders, SelectReturnOrders } from "@/db/schema/return-orders";
import { createReturnOrder } from "@/app/(dashboard)/return-orders/actions";
import {
  complaintSolutionReturnsGoods,
  describeError,
  generateUuid,
  moneyString,
  returnReasonForComplaintCategory,
} from "@/lib/helpers";
import { currentUser } from "@clerk/nextjs/server";
import {
  complaintCategories,
  complaintCauses,
  complaintSolutions,
  complaintStatuses,
} from "@/lib/enums";
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
import { COMPLAINT_COLUMNS } from "@/app/(dashboard)/complaints/columns";
import { and, count, desc, eq, getTableColumns, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ComplaintFields = Omit<
  InsertComplaints,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type ComplaintActionResult = {
  complaintUuid?: string;
  returnOrderUuid?: string;
  error?: string;
  success?: boolean;
};

// Which delivered line the customer is complaining about, and how much of it.
export type ComplaintItemInput = {
  orderItemUuid: string;
  qty: string;
  description?: string | null;
};

// A line the customer could complain about: anything that actually reached
// them. A reserved line hasn't left the warehouse, so there is nothing yet to
// be wrong with it.
export type ComplainableLine = {
  orderItemUuid: SelectOrderItems["uuid"];
  orderUuid: SelectOrderItems["orderUuid"];
  orderId: SelectOrders["id"];
  lineNumber: SelectOrderItems["lineNumber"];
  productUuid: SelectOrderItems["productUuid"];
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  quantity: SelectOrderItems["quantity"];
  amount: SelectOrderItems["amount"];
  weightKg: SelectOrderItems["kgActual"];
  status: SelectOrderItems["status"];
  deliveryDate: SelectOrderItems["deliveryDate"];
};

export type ComplaintListItem = SelectComplaints & {
  companyName: SelectCompanies["companyName"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
  productCode: SelectProducts["productCode"] | null;
};

const COMPLAINT_SEARCH = [
  Complaints.description,
  Companies.companyName,
  Products.productCode,
] as const;

const COMPLAINT_SORTABLE = {
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
  category: enumFilter(Complaints.category, complaintCategories),
  cause: enumFilter(Complaints.cause, complaintCauses),
  solution: enumFilter(Complaints.solution, complaintSolutions),
  company: relationFilter(Complaints.companyUuid),
  product: relationFilter(Complaints.productUuid),
  reportDate: dateRangeFilter(Complaints.reportDate),
};

/**
 * The rows one view of the complaints overview selects, as a window onto them.
 *
 * Shared by the page and the export so the file cannot drift from the screen.
 */
const complaintRows =
  (query: TableQuery) =>
  (limit: number, offset: number): Promise<ComplaintListItem[]> =>
    db
      .select({
        ...getTableColumns(Complaints),
        companyName: Companies.companyName,
        contactFirstName: Contacts.firstName,
        contactLastName: Contacts.lastName,
        productCode: Products.productCode,
      })
      .from(Complaints)
      .leftJoin(Companies, eq(Complaints.companyUuid, Companies.uuid))
      .leftJoin(Contacts, eq(Complaints.contactUuid, Contacts.uuid))
      .leftJoin(Products, eq(Complaints.productUuid, Products.uuid))
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

// A complaint line, with the order it was raised against resolved. This is the
// link the schema has always carried and nothing surfaced: a complaint is only
// actionable once you can see which order line it is about.
export type ComplaintItemDetail = SelectComplaintItems & {
  orderId: SelectOrders["id"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
};

export type ComplaintDetail = SelectComplaints & {
  companyName: SelectCompanies["companyName"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  items: ComplaintItemDetail[];
  // Return orders raised off the back of this complaint — the link between a
  // customer's grievance and the goods actually coming back.
  returnOrders: SelectReturnOrders[];
};

export const getComplaintDetail = async (
  uuid: string,
): Promise<ComplaintDetail | null> => {
  const [complaint] = await db
    .select({
      ...getTableColumns(Complaints),
      companyName: Companies.companyName,
      contactFirstName: Contacts.firstName,
      contactLastName: Contacts.lastName,
      productCode: Products.productCode,
      productName: Products.name,
    })
    .from(Complaints)
    .leftJoin(Companies, eq(Complaints.companyUuid, Companies.uuid))
    .leftJoin(Contacts, eq(Complaints.contactUuid, Contacts.uuid))
    .leftJoin(Products, eq(Complaints.productUuid, Products.uuid))
    .where(eq(Complaints.uuid, uuid))
    .limit(1);

  if (!complaint) {
    return null;
  }

  const items = await db
    .select({
      ...getTableColumns(ComplaintItems),
      orderId: Orders.id,
      productCode: Products.productCode,
      productName: Products.name,
    })
    .from(ComplaintItems)
    .leftJoin(Orders, eq(ComplaintItems.orderUuid, Orders.uuid))
    .leftJoin(Products, eq(ComplaintItems.productUuid, Products.uuid))
    .where(eq(ComplaintItems.complaintUuid, uuid))
    .orderBy(ComplaintItems.lineNumber);

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

  return { ...complaint, items, returnOrders };
};

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
      .set({ ...fields, statusHistory })
      .where(eq(Complaints.uuid, uuid));
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update complaint",
    };
  }

  revalidatePath("/complaints");
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

// Delivered or invoiced lines for a customer — what they can complain about.
export const getComplainableLines = async (
  companyUuid: string,
): Promise<ComplainableLine[]> =>
  db
    .select({
      orderItemUuid: OrderItems.uuid,
      orderUuid: OrderItems.orderUuid,
      orderId: Orders.id,
      lineNumber: OrderItems.lineNumber,
      productUuid: OrderItems.productUuid,
      productCode: Products.productCode,
      productName: Products.name,
      quantity: OrderItems.quantity,
      amount: OrderItems.amount,
      weightKg: OrderItems.kgActual,
      status: OrderItems.status,
      deliveryDate: OrderItems.deliveryDate,
    })
    .from(OrderItems)
    .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
    .where(
      and(
        eq(Orders.companyUuid, companyUuid),
        inArray(OrderItems.status, ["delivered", "invoiced"]),
      ),
    )
    .orderBy(desc(OrderItems.createdAt));

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

    const withOrderLine = items.filter((item) => !!item.orderItemUuid);
    if (withOrderLine.length === 0) {
      return {
        error:
          "This complaint has no lines pointing at an order line, so there is nothing to return.",
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
  items: ComplaintItemInput[] = [],
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

    // Resolve the complained-about lines before writing, so a complaint can
    // only ever point at goods this customer actually received.
    const complainable = await getComplainableLines(fields.companyUuid);
    const byUuid = new Map(
      complainable.map((line) => [line.orderItemUuid, line]),
    );

    for (const item of items) {
      const line = byUuid.get(item.orderItemUuid);
      if (!line) {
        return {
          error:
            "One or more selected lines were not delivered to this customer.",
        };
      }
      if (Number(item.qty) <= 0) {
        return { error: "Every complaint line needs a quantity." };
      }
      if (Number(item.qty) > Number(line.quantity)) {
        return {
          error: `Cannot complain about more than was delivered (${Number(line.quantity).toFixed(3)}).`,
        };
      }
    }

    await db.transaction(async (tx) => {
      await tx.insert(Complaints).values({ ...fields, uuid, statusHistory });

      // Lines were previously discarded here, so a complaint was only ever a
      // header — which is why nothing could act on one.
      for (const [index, item] of items.entries()) {
        const line = byUuid.get(item.orderItemUuid);
        if (!line) {
          continue;
        }

        const qty = Number(item.qty);
        const deliveredQty = Number(line.quantity) || 1;

        await tx.insert(ComplaintItems).values({
          uuid: generateUuid(),
          complaintUuid: uuid,
          orderUuid: line.orderUuid,
          orderItemUuid: line.orderItemUuid,
          productUuid: line.productUuid,
          lineNumber: index + 1,
          description: item.description ?? null,
          category: fields.category ?? null,
          complaintType: fields.complaintType ?? null,
          // Handling (status, responsible) is recorded once, on the complaint.
          deliveryDate: line.deliveryDate,
          createdByUserId: user?.id ?? null,
          qty: qty.toFixed(3),
          // The complained-about share of what the line was worth and weighed.
          amount: moneyString((Number(line.amount ?? 0) / deliveredQty) * qty),
          weightKg: ((Number(line.weightKg ?? 0) / deliveredQty) * qty).toFixed(
            2,
          ),
        });
      }
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
