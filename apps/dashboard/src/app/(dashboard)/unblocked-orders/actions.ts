"use server";
import { describeError } from "@/lib/helpers";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { OrderDeblocks, SelectOrderDeblocks } from "@/db/schema/order-deblocks";
import { OrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { desc, eq, min, sql } from "drizzle-orm";

export type UnblockedOrderRow = {
  customerName: SelectCompanies["companyName"] | null;
  city: SelectContacts["city"] | null;
  debtorNumber: SelectCompanies["id"] | null;
  deblockType: SelectOrderDeblocks["deblockType"];
  year: number | null;
  month: number | null;
  deblockDate: string | null;
  deblockedBy: string | null;
  orderCode: SelectOrders["ourReference"] | null;
  orderId: SelectOrders["id"] | null;
  orderCreatedAt: string | null;
  orderAmount: number;
  regionCode: SelectContacts["customerRegionCode"] | null;
  region: SelectCompanies["region"] | null;
};

// Orders whose block has been released, read from the deblock audit trail and
// enriched with the debtor, order total and the region/user that released it.
export const getUnblockedOrders = async (): Promise<UnblockedOrderRow[]> => {
  try {
    const year = sql<number>`YEAR(${OrderDeblocks.createdAt})`;
    const month = sql<number>`MONTH(${OrderDeblocks.createdAt})`;

    const primaryContactId = db
      .select({
        companyUuid: Contacts.companyUuid,
        minId: min(Contacts.id).as("min_id"),
      })
      .from(Contacts)
      .groupBy(Contacts.companyUuid)
      .as("primary_contact_id");

    const primaryContact = db
      .select({
        companyUuid: Contacts.companyUuid,
        city: Contacts.city,
        customerRegionCode: Contacts.customerRegionCode,
      })
      .from(Contacts)
      .innerJoin(primaryContactId, eq(Contacts.id, primaryContactId.minId))
      .as("primary_contact");

    const orderAmounts = db
      .select({
        orderUuid: OrderItems.orderUuid,
        amount: sql<string>`COALESCE(SUM(${OrderItems.amount}), 0)`.as(
          "order_amount",
        ),
      })
      .from(OrderItems)
      .groupBy(OrderItems.orderUuid)
      .as("order_amounts");

    const rows = await db
      .select({
        customerName: Companies.companyName,
        city: primaryContact.city,
        debtorNumber: Companies.id,
        deblockType: OrderDeblocks.deblockType,
        deblockDate: OrderDeblocks.createdAt,
        deblockedByUserId: OrderDeblocks.deblockedByUserId,
        year,
        month,
        orderCode: Orders.ourReference,
        orderId: Orders.id,
        orderCreatedAt: Orders.createdAt,
        orderAmount: orderAmounts.amount,
        regionCode: primaryContact.customerRegionCode,
        region: Companies.region,
      })
      .from(OrderDeblocks)
      .innerJoin(Orders, eq(OrderDeblocks.orderUuid, Orders.uuid))
      .innerJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
      .leftJoin(primaryContact, eq(Companies.uuid, primaryContact.companyUuid))
      .leftJoin(orderAmounts, eq(Orders.uuid, orderAmounts.orderUuid))
      .orderBy(desc(OrderDeblocks.createdAt));

    // Resolve the Clerk user id into a display name.
    const users = await getClerkUsersForSelect();
    const userNames = new Map(users.map((u) => [u.value, u.label]));

    return rows.map((row) => ({
      customerName: row.customerName,
      city: row.city ?? null,
      debtorNumber: row.debtorNumber,
      deblockType: row.deblockType,
      year: row.year != null ? Number(row.year) : null,
      month: row.month != null ? Number(row.month) : null,
      deblockDate: row.deblockDate ? row.deblockDate.toISOString() : null,
      deblockedBy: row.deblockedByUserId
        ? (userNames.get(row.deblockedByUserId) ?? row.deblockedByUserId)
        : null,
      orderCode: row.orderCode,
      orderId: row.orderId,
      orderCreatedAt: row.orderCreatedAt
        ? row.orderCreatedAt.toISOString()
        : null,
      orderAmount: Number(row.orderAmount ?? 0),
      regionCode: row.regionCode ?? null,
      region: row.region,
    }));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch unblocked orders"));
  }
};
