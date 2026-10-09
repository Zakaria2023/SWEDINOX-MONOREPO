"use server";
import { describeError } from "@/lib/helpers";

import { PURCHASE_INVOICE_TO_RECEIVE_COLUMNS } from "@/app/(dashboard)/purchase-invoices-to-be-received/columns";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { db } from "@/db";
import { companyAddressFor } from "@/lib/server/company-addresses";
import { PurchaseInvoiceItems } from "@/db/schema/purchase-invoice-items";
import {
  PurchaseLineReceivals,
  SelectPurchaseLineReceivals,
} from "@/db/schema/purchase-line-receivals";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { PurchaseInvoices } from "@/db/schema/purchase-invoices";
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import { exportRows } from "@/lib/server/excel";
import {
  dateRangeFilter,
  FilterBindings,
  relationFilter,
  runPaged,
  SortableColumns,
  tableOrderBy,
  tableWhere,
} from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import {
  count,
  desc,
  eq,
  isNotNull,
  max,
  notInArray,
  SQL,
  sql,
} from "drizzle-orm";

// 🔴 The amount still to be invoiced is the sum of the order's **received
// lines**, not the header's `PurchaseOrders.amount` — which reads EUR 0.00 on
// almost every order, so the whole screen did. "Received" is what puts an
// order on this screen at all: a receival booked against it, here against the
// line. "Not yet invoiced" needs no test per line — an order with any line
// already on a live supplier invoice is off the screen entirely (see
// `purchaseInvoiceToReceiveScope`).
const uninvoicedAmountSql = sql<string>`(
  SELECT COALESCE(SUM(${PurchaseOrderItems.amount}), 0)
  FROM ${PurchaseOrderItems}
  WHERE ${PurchaseOrderItems.purchaseOrderUuid} = ${PurchaseOrders.uuid}
    AND EXISTS (
      SELECT 1 FROM ${PurchaseLineReceivals}
      WHERE ${PurchaseLineReceivals.purchaseOrderItemUuid} = ${PurchaseOrderItems.uuid}
    )
)`;

// The order's number, the supplier and the supplier's reference — what the
// invoice that eventually lands will quote.
const PURCHASE_INVOICE_TO_RECEIVE_SEARCH = [
  PurchaseOrders.id,
  Companies.companyName,
  PurchaseOrders.reference,
] as const;

const PURCHASE_INVOICE_TO_RECEIVE_FILTERS: FilterBindings = {
  supplier: relationFilter(PurchaseOrders.supplierUuid),
  orderDate: dateRangeFilter(PurchaseOrders.orderDate),
  scheduledDeliveryDate: dateRangeFilter(PurchaseOrders.deliveryDate),
};

const PURCHASE_INVOICE_TO_RECEIVE_SORTABLE: SortableColumns = {
  purchaseOrderId: PurchaseOrders.id,
  supplierName: Companies.companyName,
  orderDate: PurchaseOrders.orderDate,
  scheduledDeliveryDate: PurchaseOrders.deliveryDate,
  amount: uninvoicedAmountSql,
};

export type PurchaseInvoiceToReceiveRow = {
  purchaseOrderUuid: SelectPurchaseOrders["uuid"];
  // The order's own number. The `Purchase order` column used to show
  // `reference`, which is the **supplier's** reference and is empty on almost
  // every order, so no row named the document it was about.
  purchaseOrderId: SelectPurchaseOrders["id"];
  reference: SelectPurchaseOrders["reference"];
  supplierName: SelectCompanies["companyName"] | null;
  companyCode: SelectCompanies["id"] | null;
  city: SelectCompanyAddresses["city"] | null;
  orderDate: SelectPurchaseOrders["orderDate"];
  paymentTerms: SelectPurchaseOrders["paymentTerms"];
  scheduledDeliveryDate: SelectPurchaseOrders["deliveryDate"];
  actualDeliveryDate: SelectPurchaseLineReceivals["receiptDate"] | null;
  amount: number; // SUM(...) of the received lines' amounts
};

export type PurchaseInvoicesToReceivePage = Paged<PurchaseInvoiceToReceiveRow> & {
  /** Every matching order's amount, not just this page's. */
  totalAmount: number; // SUM(...)
};

// Actual delivery = latest receipt date booked against the order.
const receivalsSubquery = () =>
  db
    .select({
      purchaseOrderUuid: PurchaseLineReceivals.purchaseOrderUuid,
      actualDeliveryDate: max(PurchaseLineReceivals.receiptDate).as(
        "actual_delivery_date",
      ),
    })
    .from(PurchaseLineReceivals)
    .where(isNotNull(PurchaseLineReceivals.purchaseOrderUuid))
    .groupBy(PurchaseLineReceivals.purchaseOrderUuid)
    .as("receivals");

// Purchase orders whose goods have been received (a receival exists) but for
// which no supplier invoice has landed yet — the invoices we are still waiting
// to receive.
const purchaseInvoiceToReceiveScope = async (): Promise<
  Array<SQL | undefined>
> => {
  // 🔴 Purchase orders already covered by a supplier invoice, read off the
  // **invoice line's own link to the purchase line**.
  //
  // This used to go `PurchaseInvoiceItems -> Stock -> purchaseOrderUuid`,
  // which was a leftover from when booking an invoice created the stock lot.
  // It does not any more — the reference proved goods are booked in by the
  // unloading work order and no invoice appears anywhere in that chain — so
  // `stockUuid` is empty on every invoice raised now, and an order that had
  // been invoiced would never leave this queue.
  const invoicedRows = await db
    .selectDistinct({
      purchaseOrderUuid: PurchaseOrderItems.purchaseOrderUuid,
    })
    .from(PurchaseInvoiceItems)
    .innerJoin(
      PurchaseOrderItems,
      eq(PurchaseInvoiceItems.purchaseOrderItemUuid, PurchaseOrderItems.uuid),
    )
    .innerJoin(
      PurchaseInvoices,
      eq(PurchaseInvoiceItems.purchaseInvoiceUuid, PurchaseInvoices.uuid),
    )
    // A cancelled invoice bills nothing, so its order is owed one again.
    .where(eq(PurchaseInvoices.cancelled, false));

  const invoicedPoUuids = invoicedRows
    .map((row) => row.purchaseOrderUuid)
    .filter((uuid): uuid is string => uuid !== null);

  return [
    sql`${PurchaseOrders.status} <> 'cancelled'`,
    invoicedPoUuids.length > 0
      ? notInArray(PurchaseOrders.uuid, invoicedPoUuids)
      : undefined,
  ];
};

// The rows one view selects, as a window onto them. Shared by the page and the
// export.
const purchaseInvoiceToReceiveRows =
  (query: TableQuery, scope: Array<SQL | undefined>) =>
  async (
    limit: number,
    offset: number,
  ): Promise<PurchaseInvoiceToReceiveRow[]> => {
    const receivals = receivalsSubquery();

    // The supplier's city is its visiting address.
    const visiting = companyAddressFor("visit", "visiting_address");

    const rows = await db
      .select({
        purchaseOrderUuid: PurchaseOrders.uuid,
        purchaseOrderId: PurchaseOrders.id,
        reference: PurchaseOrders.reference,
        supplierName: Companies.companyName,
        companyCode: Companies.id,
        city: visiting.city,
        orderDate: PurchaseOrders.orderDate,
        paymentTerms: PurchaseOrders.paymentTerms,
        scheduledDeliveryDate: PurchaseOrders.deliveryDate,
        actualDeliveryDate: receivals.actualDeliveryDate,
        amount: uninvoicedAmountSql,
      })
      .from(PurchaseOrders)
      .innerJoin(Companies, eq(PurchaseOrders.supplierUuid, Companies.uuid))
      .innerJoin(
        receivals,
        eq(receivals.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(visiting, eq(Companies.uuid, visiting.companyUuid))
      .where(
        tableWhere({
          query,
          search: PURCHASE_INVOICE_TO_RECEIVE_SEARCH,
          filters: PURCHASE_INVOICE_TO_RECEIVE_FILTERS,
          scope,
        }),
      )
      // Newest first. Sorting alphabetically by company buried a
      // just-received order hundreds of rows down.
      .orderBy(
        ...tableOrderBy(
          PURCHASE_INVOICE_TO_RECEIVE_SORTABLE,
          query,
          [desc(PurchaseOrders.id)],
          PurchaseOrders.id,
        ),
      )
      .limit(limit)
      .offset(offset);

    return rows.map((row) => ({
      purchaseOrderUuid: row.purchaseOrderUuid,
      purchaseOrderId: row.purchaseOrderId,
      reference: row.reference,
      supplierName: row.supplierName,
      companyCode: row.companyCode,
      city: row.city ?? null,
      orderDate: row.orderDate,
      paymentTerms: row.paymentTerms,
      scheduledDeliveryDate: row.scheduledDeliveryDate,
      actualDeliveryDate: row.actualDeliveryDate ?? null,
      amount: Number(row.amount),
    }));
  };

export const getPurchaseInvoicesToBeReceived = async (
  query: TableQuery,
): Promise<PurchaseInvoicesToReceivePage> => {
  try {
    const scope = await purchaseInvoiceToReceiveScope();
    const where = tableWhere({
      query,
      search: PURCHASE_INVOICE_TO_RECEIVE_SEARCH,
      filters: PURCHASE_INVOICE_TO_RECEIVE_FILTERS,
      scope,
    });

    const page = await runPaged(query, {
      rows: purchaseInvoiceToReceiveRows(query, scope),
      count: async () => {
        const receivals = receivalsSubquery();
        const [row] = await db
          .select({ value: count() })
          .from(PurchaseOrders)
          .innerJoin(
            Companies,
            eq(PurchaseOrders.supplierUuid, Companies.uuid),
          )
          .innerJoin(
            receivals,
            eq(receivals.purchaseOrderUuid, PurchaseOrders.uuid),
          )
          .where(where);
        return Number(row?.value ?? 0);
      },
    });

    // The screen's total spans every matching order, so it is summed on the
    // server rather than over the ten rows on show. Sequential, after the
    // page: this database caps connections.
    const receivals = receivalsSubquery();
    const amounts = db
      .select({ amount: uninvoicedAmountSql.as("order_amount") })
      .from(PurchaseOrders)
      .innerJoin(Companies, eq(PurchaseOrders.supplierUuid, Companies.uuid))
      .innerJoin(
        receivals,
        eq(receivals.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .where(where)
      .as("order_amounts");
    const [total] = await db
      .select({ value: sql<string>`COALESCE(SUM(${amounts.amount}), 0)` })
      .from(amounts);

    return { ...page, totalAmount: Number(total?.value ?? 0) };
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch purchase invoices to be received"));
  }
};

export const exportPurchaseInvoicesToBeReceived = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> => {
  const scope = await purchaseInvoiceToReceiveScope();
  return exportRows({
    name: "Purchase invoices to be received",
    columns: PURCHASE_INVOICE_TO_RECEIVE_COLUMNS,
    columnKeys,
    rows: purchaseInvoiceToReceiveRows(parseTableQuery(params), scope),
  });
};
