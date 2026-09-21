"use server";

import { db } from "@/db";
import { Charges, SelectCharges } from "@/db/schema/charges";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { OrderItems } from "@/db/schema/order-items";
import { Orders, OrderSurcharges, SelectOrders } from "@/db/schema/orders";
import { Products } from "@/db/schema/products";
import { RevenueGroups, SelectRevenueGroups } from "@/db/schema/revenue-groups";
import { Stock } from "@/db/schema/stock";
import {
  describeError,
  generateUuid,
  moneyString,
  todayDateString,
} from "@/lib/helpers";
import { INVOICE_SURCHARGE_DESCRIPTION_LABELS } from "@/lib/labels";
import { CHARGE_COLUMNS } from "@/app/(dashboard)/charges/columns";
import { exportRows } from "@/lib/server/excel";
import {
  dateRangeFilter,
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
import { count, desc, eq, getTableColumns } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ChargeListItem = SelectCharges & {
  customerName: SelectCompanies["companyName"] | null;
  customerCode: SelectCompanies["id"] | null;
  companyUuid: SelectCompanies["uuid"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
};

export type GenerateChargesResult = {
  error?: string;
  success?: boolean;
};

export type ChargeDetail = ChargeListItem & {
  orderId: SelectOrders["id"] | null;
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
};

const CHARGE_SEARCH = [
  Companies.companyName,
  Charges.code,
  Charges.surcharge,
] as const;

const CHARGE_FILTERS: FilterBindings = {
  surcharge: valueFilter(Charges.surcharge),
  status: valueFilter(Charges.status),
  region: valueFilter(Charges.region),
  creationDate: dateRangeFilter(Charges.creationDate),
};

const CHARGE_SORTABLE: SortableColumns = {
  creationDate: Charges.creationDate,
  customer: Companies.companyName,
  amount: Charges.amount,
  surcharge: Charges.surcharge,
};

const chargeRows =
  (query: TableQuery) =>
  (limit: number, offset: number): Promise<ChargeListItem[]> =>
    db
      .select({
        ...getTableColumns(Charges),
        customerName: Companies.companyName,
        customerCode: Companies.id,
        companyUuid: Companies.uuid,
        revenueGroupName: RevenueGroups.name,
      })
      .from(Charges)
      .leftJoin(Companies, eq(Charges.companyUuid, Companies.uuid))
      .leftJoin(RevenueGroups, eq(Charges.revenueGroupUuid, RevenueGroups.uuid))
      .where(
        tableWhere({
          query,
          search: CHARGE_SEARCH,
          filters: CHARGE_FILTERS,
        }),
      )
      .orderBy(
        ...tableOrderBy(
          CHARGE_SORTABLE,
          query,
          [desc(Charges.creationDate)],
          Charges.id,
        ),
      )
      .limit(limit)
      .offset(offset);

export const getCharges = async (
  query: TableQuery,
): Promise<Paged<ChargeListItem>> => {
  try {
    return await runPaged(query, {
      rows: chargeRows(query),
      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(Charges)
          .leftJoin(Companies, eq(Charges.companyUuid, Companies.uuid))
          .where(
            tableWhere({
              query,
              search: CHARGE_SEARCH,
              filters: CHARGE_FILTERS,
            }),
          );
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch charges"));
  }
};

/**
 * One charge with the customer, order and revenue group it was booked against.
 */
export const getChargeDetail = async (
  uuid: string,
): Promise<ChargeDetail | null> => {
  try {
    const [row] = await db
      .select({
        ...getTableColumns(Charges),
        customerName: Companies.companyName,
        customerCode: Companies.id,
        companyUuid: Companies.uuid,
        revenueGroupName: RevenueGroups.name,
        revenueGroupNumber: RevenueGroups.number,
        orderId: Orders.id,
      })
      .from(Charges)
      .leftJoin(Companies, eq(Charges.companyUuid, Companies.uuid))
      .leftJoin(RevenueGroups, eq(Charges.revenueGroupUuid, RevenueGroups.uuid))
      .leftJoin(Orders, eq(Charges.orderUuid, Orders.uuid))
      .where(eq(Charges.uuid, uuid))
      .limit(1);

    return row ?? null;
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch charge"));
  }
};

// Turns orders into charge records: one "line charge" per order line (valued at
// its amount, cost from the reserved stock lot) plus one charge per order
// surcharge. Orders that already have charges are skipped, so it can be re-run.
export const generateChargesFromOrders =
  async (): Promise<GenerateChargesResult> => {
    try {
      const existing = await db
        .select({ orderUuid: Charges.orderUuid })
        .from(Charges);
      const chargedOrderUuids = new Set(
        existing
          .map((row) => row.orderUuid)
          .filter((uuid): uuid is string => uuid !== null),
      );

      const lines = await db
        .select({
          orderUuid: Orders.uuid,
          orderId: Orders.id,
          companyUuid: Orders.companyUuid,
          deliveryDate: OrderItems.deliveryDate,
          amount: OrderItems.amount,
          quantity: OrderItems.quantity,
          kgPlanned: OrderItems.kgPlanned,
          productName: Products.name,
          revenueGroupUuid: Products.revenueGroupUuid,
          valuationPrice: Stock.valuationPrice,
        })
        .from(OrderItems)
        .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
        .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
        .leftJoin(Stock, eq(OrderItems.stockUuid, Stock.uuid));

      const surcharges = await db
        .select({
          orderUuid: Orders.uuid,
          orderId: Orders.id,
          companyUuid: Orders.companyUuid,
          description: OrderSurcharges.description,
          amount: OrderSurcharges.amount,
          profit: OrderSurcharges.profit,
        })
        .from(OrderSurcharges)
        .innerJoin(Orders, eq(OrderSurcharges.orderUuid, Orders.uuid));

      const newLines = lines.filter(
        (line) => !chargedOrderUuids.has(line.orderUuid),
      );
      const newSurcharges = surcharges.filter(
        (surcharge) => !chargedOrderUuids.has(surcharge.orderUuid),
      );

      if (newLines.length === 0 && newSurcharges.length === 0) {
        return {
          error:
            chargedOrderUuids.size > 0
              ? "Every order already has charges."
              : "No orders to charge. Create an order first.",
        };
      }

      const today = todayDateString();
      const rows: (typeof Charges.$inferInsert)[] = [];

      for (const line of newLines) {
        const amount = Number(line.amount ?? 0);
        const cost =
          Number(line.valuationPrice ?? 0) * Number(line.quantity ?? 0);
        rows.push({
          uuid: generateUuid(),
          companyUuid: line.companyUuid,
          orderUuid: line.orderUuid,
          revenueGroupUuid: line.revenueGroupUuid,
          code: String(line.orderId),
          creationDate: today,
          deliveryDate: line.deliveryDate,
          surcharge: line.productName ?? "Order line",
          amount: moneyString(amount),
          cost: moneyString(cost),
          profit: moneyString(amount - cost),
          weightKg: line.kgPlanned ?? "0.00",
          status: "open",
        });
      }

      for (const surcharge of newSurcharges) {
        const amount = Number(surcharge.amount ?? 0);
        rows.push({
          uuid: generateUuid(),
          companyUuid: surcharge.companyUuid,
          orderUuid: surcharge.orderUuid,
          code: String(surcharge.orderId),
          creationDate: today,
          surcharge: surcharge.description
            ? INVOICE_SURCHARGE_DESCRIPTION_LABELS[surcharge.description]
            : "Surcharge",
          amount: moneyString(amount),
          cost: "0.00",
          profit: moneyString(Number(surcharge.profit ?? 0) || amount),
          status: "open",
        });
      }

      if (rows.length > 0) {
        await db.insert(Charges).values(rows);
      }

      revalidatePath("/charges");
      return { success: true };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to generate charges",
      };
    }
  };

/** Every charge the current view matches, as a workbook. */
export const exportCharges = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Charges",
    columns: CHARGE_COLUMNS,
    columnKeys,
    rows: chargeRows(parseTableQuery(params)),
  });

/** The surcharge types actually raised, for the filter. */
export const getChargeSurcharges = async (): Promise<string[]> => {
  const rows = await db
    .selectDistinct({ surcharge: Charges.surcharge })
    .from(Charges)
    .orderBy(Charges.surcharge);

  return rows
    .map((row) => row.surcharge)
    .filter((value): value is string => Boolean(value));
};
