"use server";

import { db } from "@/db";
import { Companies } from "@/db/schema/companies";
import { CompanyAddresses } from "@/db/schema/company-addresses";
import { Complaints } from "@/db/schema/complaints";
import { Contracts } from "@/db/schema/contracts";
import { OrderItems } from "@/db/schema/order-items";
import { Orders } from "@/db/schema/orders";
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import { PurchaseOrders } from "@/db/schema/purchase-orders";
import { VisitReports } from "@/db/schema/visit-reports";
import {
  currentUserHasRole,
  FINANCIAL_RELEASE_ROLES,
  requireAuth,
} from "@/lib/auth";
import { WorkListKey, workListKeys } from "@/lib/enums";
import { describeError, todayDateString } from "@/lib/helpers";
import {
  and,
  count,
  eq,
  gte,
  isNotNull,
  isNull,
  lt,
  lte,
  ne,
  notInArray,
  sql,
} from "drizzle-orm";

// How far ahead a contract counts as expiring.
const CONTRACT_EXPIRY_WINDOW_DAYS = 30;

// The screen each worklist opens.
const WORK_LIST_HREFS: Record<WorkListKey, string> = {
  orders_financially_blocked: "/financially-blocked",
  customers_blocked: "/credit-information-customers",
  customers_without_debtor_number: "/customers-and-prospects",
  order_lines_manually_blocked: "/blocked-deliveries",
  orders_transport_blocked: "/orders",
  orders_invoice_blocked: "/orders",
  order_lines_late: "/order-lines",
  order_lines_incomplete: "/order-lines",
  purchase_order_lines_overdue: "/purchase-orders-to-be-received",
  customer_contracts_expiring: "/contracts-per-customer",
  customer_complaints_open: "/complaints",
  incomplete_delivery_addresses: "/addresses",
  visit_reports_to_read: "/visit-reports",
};

// The reference shows these to its Finance and admin task profiles only.
const FINANCE_WORK_LISTS: readonly WorkListKey[] = [
  "orders_financially_blocked",
  "customers_blocked",
  "customers_without_debtor_number",
];

export type WorkListRow = {
  key: WorkListKey;
  count: number;
  href: string;
};

type CountQuery = PromiseLike<{ value: number }[]>;

/**
 * The task panel: how much is waiting on each worklist the reference's task
 * profiles define and this app can answer. A worklist is a saved question
 * ("which orders are financially blocked?"); this is the count and the screen
 * that answers it.
 */
export const getWorkLists = async (): Promise<WorkListRow[]> => {
  const userId = await requireAuth();
  const seesFinance = await currentUserHasRole(FINANCIAL_RELEASE_ROLES);

  const today = todayDateString();
  const expiryHorizon = new Date(
    Date.now() + CONTRACT_EXPIRY_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  )
    .toISOString()
    .slice(0, 10);

  const counters: Record<WorkListKey, () => CountQuery> = {
    orders_financially_blocked: () =>
      db
        .select({ value: count() })
        .from(Orders)
        .where(
          and(eq(Orders.financialBlockage, true), ne(Orders.status, "cancelled")),
        ),
    customers_blocked: () =>
      db
        .select({ value: count() })
        .from(Companies)
        .where(isNotNull(Companies.blockedByUserId)),
    customers_without_debtor_number: () =>
      db
        .select({ value: count() })
        .from(Companies)
        .where(
          and(
            sql`JSON_CONTAINS(${Companies.roles}, '"customer"')`,
            isNull(Companies.debtorNumber),
          ),
        ),
    order_lines_manually_blocked: () =>
      db
        .select({ value: count() })
        .from(OrderItems)
        .where(
          and(
            eq(OrderItems.commercialBlock, true),
            eq(OrderItems.status, "reserved"),
          ),
        ),
    orders_transport_blocked: () =>
      db
        .select({ value: count() })
        .from(Orders)
        .where(
          and(eq(Orders.transportBlockage, true), ne(Orders.status, "cancelled")),
        ),
    orders_invoice_blocked: () =>
      db
        .select({ value: count() })
        .from(Orders)
        .where(
          and(eq(Orders.invoiceBlockage, true), ne(Orders.status, "cancelled")),
        ),
    // Still waiting to ship after the day it was promised for.
    order_lines_late: () =>
      db
        .select({ value: count() })
        .from(OrderItems)
        .where(
          and(
            eq(OrderItems.status, "reserved"),
            lt(OrderItems.deliveryDate, today),
          ),
        ),
    order_lines_incomplete: () =>
      db
        .select({ value: count() })
        .from(OrderItems)
        .where(eq(OrderItems.lineStatus, "partially_delivered")),
    // Less received than ordered, past the order's delivery date.
    purchase_order_lines_overdue: () =>
      db
        .select({ value: count() })
        .from(PurchaseOrderItems)
        .innerJoin(
          PurchaseOrders,
          eq(PurchaseOrderItems.purchaseOrderUuid, PurchaseOrders.uuid),
        )
        .where(
          and(
            sql`${PurchaseOrderItems.qtyReceived} < ${PurchaseOrderItems.quantity}`,
            sql`${PurchaseOrders.deliveryDate} < CURDATE()`,
            notInArray(PurchaseOrders.status, ["completed", "cancelled"]),
          ),
        ),
    customer_contracts_expiring: () =>
      db
        .select({ value: count() })
        .from(Contracts)
        .where(
          and(
            eq(Contracts.role, "customer"),
            isNotNull(Contracts.companyUuid),
            gte(Contracts.endDate, today),
            lte(Contracts.endDate, expiryHorizon),
          ),
        ),
    customer_complaints_open: () =>
      db
        .select({ value: count() })
        .from(Complaints)
        .where(ne(Complaints.status, "done")),
    // A delivery address a lorry cannot find.
    incomplete_delivery_addresses: () =>
      db
        .select({ value: count() })
        .from(CompanyAddresses)
        .where(
          and(
            sql`JSON_CONTAINS(${CompanyAddresses.category}, '"delivery"')`,
            sql`(COALESCE(${CompanyAddresses.streetAndNo}, '') = '' OR COALESCE(${CompanyAddresses.postalCode}, '') = '' OR COALESCE(${CompanyAddresses.city}, '') = '')`,
          ),
        ),
    // Reports this user has been asked to read and has not.
    visit_reports_to_read: () =>
      db
        .select({ value: count() })
        .from(VisitReports)
        .where(
          sql`JSON_CONTAINS(${VisitReports.readers}, JSON_OBJECT('userId', ${userId}, 'toRead', CAST('true' AS JSON), 'read', CAST('false' AS JSON)))`,
        ),
  };

  const visible = workListKeys.filter(
    (key) => seesFinance || !FINANCE_WORK_LISTS.includes(key),
  );

  try {
    const rows: WorkListRow[] = [];
    // One at a time: the shared database caps connections.
    for (const key of visible) {
      const [row] = await counters[key]();
      rows.push({
        key,
        count: Number(row?.value ?? 0),
        href: WORK_LIST_HREFS[key],
      });
    }
    return rows;
  } catch (error) {
    throw new Error(describeError(error, "Failed to count the worklists"));
  }
};
