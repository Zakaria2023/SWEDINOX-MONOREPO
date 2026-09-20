"use server";

import { UNBLOCKED_ORDER_COLUMNS } from "@/app/(dashboard)/unblocked-orders/columns";
import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { OrderDeblocks, SelectOrderDeblocks } from "@/db/schema/order-deblocks";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { orderDeblockTypes } from "@/lib/enums";
import { describeError } from "@/lib/helpers";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { companyAddressFor } from "@/lib/server/company-addresses";
import { exportRows } from "@/lib/server/excel";
import {
  dateRangeFilter,
  enumFilter,
  FilterBindings,
  runPaged,
  SortableColumns,
  tableOrderBy,
  tableWhere,
  valueFilter,
} from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { and, count, desc, eq, ne, sql } from "drizzle-orm";

export type UnblockedOrderRow = {
  deblockUuid: SelectOrderDeblocks["uuid"];
  customerName: SelectCompanies["companyName"] | null;
  companyUuid: SelectCompanies["uuid"] | null;
  city: SelectCompanyAddresses["city"] | null;
  debtorNumber: SelectCompanies["debtorNumber"] | null;
  deblockType: SelectOrderDeblocks["deblockType"];
  year: number | null;
  month: number | null;
  deblockDate: Date;
  deblockedBy: string | null;
  orderUuid: SelectOrders["uuid"] | null;
  orderCode: SelectOrders["ourReference"] | null;
  orderId: SelectOrders["id"] | null;
  orderCreatedAt: Date | null;
  orderAmount: number;
  region: SelectCompanies["region"] | null;
};

const UNBLOCKED_ORDER_SEARCH = [
  Companies.companyName,
  Orders.ourReference,
] as const;

const UNBLOCKED_ORDER_FILTERS: FilterBindings = {
  deblockType: enumFilter(OrderDeblocks.deblockType, orderDeblockTypes),
  deblockDate: dateRangeFilter(OrderDeblocks.createdAt),
  deblockedBy: valueFilter(OrderDeblocks.deblockedByUserId),
  region: valueFilter(Companies.region),
};

const UNBLOCKED_ORDER_SORTABLE: SortableColumns = {
  customerName: Companies.companyName,
  deblockType: OrderDeblocks.deblockType,
  deblockDate: OrderDeblocks.createdAt,
  order: Orders.id,
  orderCreatedAt: Orders.createdAt,
  orderAmount: Orders.totalExclVat,
};

const unblockedOrderRows =
  (query: TableQuery) =>
  async (limit: number, offset: number): Promise<UnblockedOrderRow[]> => {
    // The city is the company's visiting address, the same one the other
    // company overviews read.
    const visiting = companyAddressFor("visit", "visiting_address");

    const rows = await db
      .select({
        deblockUuid: OrderDeblocks.uuid,
        customerName: Companies.companyName,
        companyUuid: Companies.uuid,
        city: visiting.city,
        debtorNumber: Companies.debtorNumber,
        deblockType: OrderDeblocks.deblockType,
        deblockDate: OrderDeblocks.createdAt,
        deblockedByUserId: OrderDeblocks.deblockedByUserId,
        year: sql<number>`YEAR(${OrderDeblocks.createdAt})`,
        month: sql<number>`MONTH(${OrderDeblocks.createdAt})`,
        orderUuid: Orders.uuid,
        orderCode: Orders.ourReference,
        orderId: Orders.id,
        orderCreatedAt: Orders.createdAt,
        // The order's own revenue excluding VAT, which is the figure the
        // reference prints here — it equals the Orders and Quotes screen's
        // Revenue on all 436 of the orders that appear on both. Reading the
        // header rollup rather than re-summing the lines is what that rollup
        // is for.
        orderAmount: Orders.totalExclVat,
        region: Companies.region,
      })
      .from(OrderDeblocks)
      .innerJoin(Orders, eq(OrderDeblocks.orderUuid, Orders.uuid))
      .innerJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
      .leftJoin(visiting, eq(Companies.uuid, visiting.companyUuid))
      .where(
        tableWhere({
          query,
          search: UNBLOCKED_ORDER_SEARCH,
          filters: UNBLOCKED_ORDER_FILTERS,
        }),
      )
      .orderBy(
        ...tableOrderBy(
          UNBLOCKED_ORDER_SORTABLE,
          query,
          [desc(OrderDeblocks.createdAt)],
          OrderDeblocks.id,
        ),
      )
      .limit(limit)
      .offset(offset);

    if (rows.length === 0) {
      return [];
    }

    // The column stores a Clerk id; Clerk owns the name.
    const users = await getClerkUsersForSelect();
    const userNames = new Map(users.map((user) => [user.value, user.label]));

    return rows.map(({ deblockedByUserId, ...row }) => ({
      ...row,
      year: row.year != null ? Number(row.year) : null,
      month: row.month != null ? Number(row.month) : null,
      deblockedBy: deblockedByUserId
        ? (userNames.get(deblockedByUserId) ?? deblockedByUserId)
        : null,
      orderAmount: Number(row.orderAmount ?? 0),
    }));
  };

export const getUnblockedOrders = async (
  query: TableQuery,
): Promise<Paged<UnblockedOrderRow>> => {
  try {
    return await runPaged(query, {
      rows: unblockedOrderRows(query),
      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(OrderDeblocks)
          .innerJoin(Orders, eq(OrderDeblocks.orderUuid, Orders.uuid))
          .innerJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
          .where(
            tableWhere({
              query,
              search: UNBLOCKED_ORDER_SEARCH,
              filters: UNBLOCKED_ORDER_FILTERS,
            }),
          );
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch unblocked orders"));
  }
};

export const exportUnblockedOrders = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Unblocked orders",
    columns: UNBLOCKED_ORDER_COLUMNS,
    columnKeys,
    rows: unblockedOrderRows(parseTableQuery(params)),
  });

/** The people who have actually lifted a block, for the filter. */
export const getUnblockingUsers = async (): Promise<
  Array<{ value: string; label: string }>
> => {
  const rows = await db
    .selectDistinct({ userId: OrderDeblocks.deblockedByUserId })
    .from(OrderDeblocks);

  const users = await getClerkUsersForSelect();
  const userNames = new Map(users.map((user) => [user.value, user.label]));

  return rows
    .map((row) => row.userId)
    .filter((userId): userId is string => Boolean(userId))
    .map((userId) => ({
      value: userId,
      label: userNames.get(userId) ?? userId,
    }));
};

/** The regions blocks have been lifted in, for the filter. */
export const getUnblockedOrderRegions = async (): Promise<string[]> => {
  const rows = await db
    .selectDistinct({ region: Companies.region })
    .from(OrderDeblocks)
    .innerJoin(Orders, eq(OrderDeblocks.orderUuid, Orders.uuid))
    .innerJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
    .where(and(ne(Companies.region, "")))
    .orderBy(Companies.region);

  return rows
    .map((row) => row.region)
    .filter((region): region is string => region !== null);
};
