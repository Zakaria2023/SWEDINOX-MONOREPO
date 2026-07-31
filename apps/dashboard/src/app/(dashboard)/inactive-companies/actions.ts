"use server";
import { describeError } from "@/lib/helpers";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { Orders } from "@/db/schema/orders";
import { and, asc, eq, isNull, lt, max, min, or, sql } from "drizzle-orm";

export type InactiveCompanyRow = {
  companyUuid: SelectCompanies["uuid"];
  companyCode: SelectCompanies["id"];
  companyName: SelectCompanies["companyName"];
  city: SelectContacts["city"] | null;
  representative: SelectCompanies["representative"] | null;
  customerGroup: SelectCompanies["customerGroup"] | null;
  region: SelectCompanies["region"] | null;
  lastOrderDate: string | null;
};

// Customers/prospects with no order in the last 12 months (or none ever) —
// candidates to re-engage or archive.
export const getInactiveCompanies = async (): Promise<InactiveCompanyRow[]> => {
  try {
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
      })
      .from(Contacts)
      .innerJoin(primaryContactId, eq(Contacts.id, primaryContactId.minId))
      .as("primary_contact");

    const orderStats = db
      .select({
        companyUuid: Orders.companyUuid,
        lastOrderDate: max(Orders.createdAt).as("last_order_date"),
      })
      .from(Orders)
      .groupBy(Orders.companyUuid)
      .as("order_stats");

    const rows = await db
      .select({
        companyUuid: Companies.uuid,
        companyCode: Companies.id,
        companyName: Companies.companyName,
        city: primaryContact.city,
        representative: Companies.representative,
        customerGroup: Companies.customerGroup,
        region: Companies.region,
        lastOrderDate: orderStats.lastOrderDate,
      })
      .from(Companies)
      .leftJoin(primaryContact, eq(Companies.uuid, primaryContact.companyUuid))
      .leftJoin(orderStats, eq(Companies.uuid, orderStats.companyUuid))
      .where(
        // Either flagged inactive by hand, or a customer/prospect where nothing
        // has happened on the account for twelve months.
        or(
          eq(Companies.isInactive, true),
          and(
            or(
              sql`JSON_CONTAINS(${Companies.roles}, '"customer"')`,
              sql`JSON_CONTAINS(${Companies.roles}, '"prospect"')`,
            ),
            or(
              // Ordered before, but not lately. NULL fails this comparison, so
              // a customer who has never ordered is left to the next branch.
              lt(
                orderStats.lastOrderDate,
                sql`DATE_SUB(NOW(), INTERVAL 12 MONTH)`,
              ),
              // Never ordered — but only counts as inactive once the account has
              // been on the books long enough for that to mean something. A
              // customer taken on last week has not gone quiet, they have not
              // started; listing them made every new customer look dormant and
              // the screen read as "all companies".
              and(
                isNull(orderStats.lastOrderDate),
                lt(
                  Companies.createdAt,
                  sql`DATE_SUB(NOW(), INTERVAL 12 MONTH)`,
                ),
              ),
            ),
          ),
        ),
      )
      .orderBy(asc(Companies.companyName));

    return rows.map((row) => ({
      companyUuid: row.companyUuid,
      companyCode: row.companyCode,
      companyName: row.companyName,
      city: row.city ?? null,
      representative: row.representative,
      customerGroup: row.customerGroup,
      region: row.region,
      lastOrderDate: row.lastOrderDate ? row.lastOrderDate.toISOString() : null,
    }));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch inactive companies"));
  }
};
