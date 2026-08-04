"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import {
  ComplaintItems,
  SelectComplaintItems,
} from "@/db/schema/complaint-items";
import { Complaints, SelectComplaints } from "@/db/schema/complaints";
import { Contacts } from "@/db/schema/contacts";
import { OrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import { Stock } from "@/db/schema/stock";
import { SelectWarehouses, Warehouses } from "@/db/schema/warehouses";
import { describeError, generateUuid, todayDateString } from "@/lib/helpers";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { aliasedTable, and, asc, desc, eq, SQL, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const StockLocations = aliasedTable(Warehouses, "stock_locations");

export type ComplaintLineRow = SelectComplaintItems & {
  complaintNumber: SelectComplaints["id"] | null;
  reportDate: SelectComplaints["reportDate"] | null;
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
  // Resolved from the Clerk user id stored on the line.
  responsibleName: string | null;
  createdByName: string | null;
  // Derived from the report date, so the overview can group by period.
  reportMonth: number | null;
  reportYear: number | null;
};

export type GenerateComplaintLinesResult = {
  error?: string;
  success?: boolean;
  createdLines?: number;
};

// Every complaint line, joined to its complaint, that complaint's company, the
// order line it is about and the section the goods sat in.
//
// The overview and the detail screen show the same row, so they share one query
// and differ only in the filter applied. `where` is left off for the overview.
const selectComplaintLines = async (
  where?: SQL,
): Promise<ComplaintLineRow[]> => {
  const base = db
    .select({
      item: ComplaintItems,
      complaintNumber: Complaints.id,
      reportDate: Complaints.reportDate,
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

  // Clerk owns the user list, so the ids stored on the line are resolved to
  // names here rather than joined.
  const users = await getClerkUsersForSelect();
  const nameById = new Map(users.map((user) => [user.value, user.label]));

  return rows.map(({ item, ...rest }) => ({
    ...item,
    complaintNumber: rest.complaintNumber,
    reportDate: rest.reportDate,
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
    responsibleName: item.responsibleUserId
      ? (nameById.get(item.responsibleUserId) ?? item.responsibleUserId)
      : null,
    createdByName: item.createdByUserId
      ? (nameById.get(item.createdByUserId) ?? item.createdByUserId)
      : null,
    reportMonth: rest.reportMonth === null ? null : Number(rest.reportMonth),
    reportYear: rest.reportYear === null ? null : Number(rest.reportYear),
  }));
};

export const getComplaintLines = async (): Promise<ComplaintLineRow[]> => {
  try {
    return await selectComplaintLines();
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch complaint lines"));
  }
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

// Breaks each complaint that has no lines yet down into the lines it is
// actually about.
//
// A complaint names a company and (usually) a product. Every order line that
// customer has for that product becomes its own complaint line, carrying the
// order, the order line number, the seller and the warehouse section the stock
// sat in — that is what makes a complaint actionable per delivery. A complaint
// whose product was never ordered by that customer still gets one line, taken
// straight from the complaint header, so nothing is silently dropped.
//
// Complaints that already have lines are skipped, so it can be re-run.
export const generateComplaintLines =
  async (): Promise<GenerateComplaintLinesResult> => {
    try {
      const complaints = await db
        .select({
          complaint: Complaints,
          contactFirstName: Contacts.firstName,
          contactLastName: Contacts.lastName,
        })
        .from(Complaints)
        .leftJoin(Contacts, eq(Complaints.contactUuid, Contacts.uuid));

      if (complaints.length === 0) {
        return { error: "No complaints yet. Create one first." };
      }

      const existing = await db
        .select({ complaintUuid: ComplaintItems.complaintUuid })
        .from(ComplaintItems);
      const complaintsWithLines = new Set(
        existing.map((row) => row.complaintUuid),
      );

      const openComplaints = complaints.filter(
        (row) => !complaintsWithLines.has(row.complaint.uuid),
      );
      if (openComplaints.length === 0) {
        return { error: "Every complaint already has lines." };
      }

      const statusDate = todayDateString();
      const rows: (typeof ComplaintItems.$inferInsert)[] = [];

      for (const {
        complaint,
        contactFirstName,
        contactLastName,
      } of openComplaints) {
        const correspondenceName =
          [contactFirstName, contactLastName].filter(Boolean).join(" ") || null;

        const orderLines = complaint.productUuid
          ? await db
              .select({
                orderUuid: OrderItems.orderUuid,
                orderItemUuid: OrderItems.uuid,
                productUuid: OrderItems.productUuid,
                quantity: OrderItems.quantity,
                weightKg: OrderItems.kgPlanned,
                amount: OrderItems.amount,
                seller: Orders.seller,
                // Stock sits in a location, which is a leaf of the Warehouses
                // tree; the section is that location's parent (or the location
                // itself when it hangs straight off the warehouse).
                locationUuid: StockLocations.uuid,
                locationParentUuid: StockLocations.parentUuid,
              })
              .from(OrderItems)
              .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
              .leftJoin(Stock, eq(OrderItems.stockUuid, Stock.uuid))
              .leftJoin(
                StockLocations,
                eq(Stock.locationUuid, StockLocations.uuid),
              )
              .where(
                and(
                  eq(Orders.companyUuid, complaint.companyUuid),
                  eq(OrderItems.productUuid, complaint.productUuid),
                ),
              )
          : [];

        const shared = {
          complaintUuid: complaint.uuid,
          description: complaint.description,
          category: complaint.category,
          complaintType: complaint.complaintType,
          status: complaint.status,
          statusDate,
          deadline: complaint.deadline,
          cause: complaint.cause,
          explanationOfCause: complaint.explanationOfCause,
          solution: complaint.solution,
          explanationOfSolution: complaint.explanationOfSolution,
          responsibleUserId: complaint.responsibleUserId,
          createdByUserId: complaint.responsibleUserId,
          correspondenceName,
        };

        if (orderLines.length === 0) {
          rows.push({
            ...shared,
            uuid: generateUuid(),
            productUuid: complaint.productUuid,
            lineNumber: 1,
            qty: complaint.qty ?? "0.000",
            amount: complaint.amount ?? "0.00",
            weightKg: Number(complaint.weight ?? 0).toFixed(2),
          });
          continue;
        }

        for (const [index, line] of orderLines.entries()) {
          rows.push({
            ...shared,
            uuid: generateUuid(),
            orderUuid: line.orderUuid,
            orderItemUuid: line.orderItemUuid,
            productUuid: line.productUuid,
            warehouseSectionUuid: line.locationParentUuid ?? line.locationUuid,
            purchaserSeller: line.seller,
            lineNumber: index + 1,
            qty: line.quantity ?? "0.000",
            amount: line.amount ?? "0.00",
            weightKg: line.weightKg ?? "0.00",
          });
        }
      }

      await db.insert(ComplaintItems).values(rows);

      revalidatePath("/complaint-lines");
      revalidatePath("/complaints");
      return { success: true, createdLines: rows.length };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate complaint lines",
      };
    }
  };
