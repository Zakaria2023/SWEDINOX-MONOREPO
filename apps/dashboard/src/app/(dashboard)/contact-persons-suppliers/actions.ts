"use server";

import { CONTACT_PERSON_SUPPLIER_COLUMNS } from "@/app/(dashboard)/contact-persons-suppliers/columns";
import { db } from "@/db";
import { Companies } from "@/db/schema/companies";
import { PurchaseOrders } from "@/db/schema/purchase-orders";
import { describeError } from "@/lib/helpers";
import { getClerkUserNames } from "@/lib/server/clerk";
import {
  contactPersonRows,
  ContactPersonRow,
  countContactPersons,
  getContactPersonRegions,
} from "@/lib/server/contact-persons";
import { exportRows } from "@/lib/server/excel";
import { runPaged } from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { desc, inArray, sql } from "drizzle-orm";

const IS_SUPPLIER = sql`JSON_CONTAINS(${Companies.roles}, '"supplier"')`;

export type ContactPersonSupplierRow = ContactPersonRow & {
  /** The purchaser on the supplier's latest purchase order. */
  purchaserName: string | null;
};

const supplierContactRows =
  (query: TableQuery) =>
  async (limit: number, offset: number): Promise<ContactPersonSupplierRow[]> => {
    const rows = await contactPersonRows(IS_SUPPLIER, query)(limit, offset);
    const companyUuids = [
      ...new Set(
        rows
          .map((row) => row.companyUuid)
          .filter((uuid): uuid is string => uuid !== null),
      ),
    ];

    const latest = new Map<string, string>();
    if (companyUuids.length > 0) {
      const orders = await db
        .select({
          supplierUuid: PurchaseOrders.supplierUuid,
          purchaser: PurchaseOrders.purchaser,
        })
        .from(PurchaseOrders)
        .where(inArray(PurchaseOrders.supplierUuid, companyUuids))
        .orderBy(desc(PurchaseOrders.createdAt));
      for (const order of orders) {
        if (
          order.supplierUuid &&
          order.purchaser &&
          !latest.has(order.supplierUuid)
        ) {
          latest.set(order.supplierUuid, order.purchaser);
        }
      }
    }

    const names = latest.size > 0 ? await getClerkUserNames() : {};

    return rows.map((row) => {
      const purchaser = row.companyUuid
        ? latest.get(row.companyUuid)
        : undefined;
      return {
        ...row,
        purchaserName: purchaser ? (names[purchaser] ?? purchaser) : null,
      };
    });
  };

// Every contact of a supplier, with its company's columns read from the
// company. Paged: the reference's list is 2 006 contacts.
export const getContactPersonsSuppliers = async (
  query: TableQuery,
): Promise<Paged<ContactPersonSupplierRow>> => {
  try {
    return await runPaged(query, {
      rows: supplierContactRows(query),
      count: () => countContactPersons(IS_SUPPLIER, query),
    });
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch supplier contact persons"),
    );
  }
};

export const exportContactPersonsSuppliers = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Contact persons suppliers",
    columns: CONTACT_PERSON_SUPPLIER_COLUMNS,
    columnKeys,
    rows: supplierContactRows(parseTableQuery(params)),
  });

/** The regions these contacts' companies carry, for the overview's filter. */
export const getContactPersonSupplierRegions = async (): Promise<string[]> =>
  getContactPersonRegions(IS_SUPPLIER);
