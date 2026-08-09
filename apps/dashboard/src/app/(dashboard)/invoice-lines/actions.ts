"use server";
import { describeError } from "@/lib/helpers";

import { db } from "@/db";
import { InvoiceItems, SelectInvoiceItems } from "@/db/schema/invoice-items";
import { Invoices, SelectInvoices } from "@/db/schema/invoices";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Products, SelectProducts } from "@/db/schema/products";
import { count, desc, eq, getTableColumns } from "drizzle-orm";
import {
  dateRangeFilter,
  numberRangeFilter,
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
import { INVOICE_LINE_COLUMNS } from "@/app/(dashboard)/invoice-lines/columns";

// The money and weight columns come from the invoice line itself, which
// snapshots them at invoicing — reaching back to the order line would report
// whatever it says today rather than what was billed.
export type InvoiceLineItem = SelectInvoiceItems & {
  invoiceId: SelectInvoices["id"] | null;
  invoiceDate: SelectInvoices["invoiceDate"] | null;
  customerName: SelectCompanies["companyName"] | null;
  vatNumber: SelectCompanies["vatNumber"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  lineNumber: SelectOrderItems["lineNumber"] | null;
};

export type InvoiceLineDetail = InvoiceLineItem & {
  invoiceDocumentType: SelectInvoices["documentType"] | null;
  companyUuid: SelectCompanies["uuid"] | null;
  orderUuid: SelectOrderItems["orderUuid"] | null;
};

const INVOICE_LINE_SEARCH = [
  Products.productCode,
  Products.name,
  Companies.companyName,
] as const;

const INVOICE_LINE_SORTABLE = {
  invoiceDate: Invoices.invoiceDate,
  customer: Companies.companyName,
  productCode: Products.productCode,
  amount: InvoiceItems.amount,
};

// A billed line is looked up by whose invoice it was on, which article, and
// over what period.
const INVOICE_LINE_FILTERS = {
  company: relationFilter(Invoices.companyUuid),
  product: relationFilter(InvoiceItems.productUuid),
  invoiceDate: dateRangeFilter(Invoices.invoiceDate),
  amount: numberRangeFilter(InvoiceItems.amount),
};

/**
 * The rows one view of the invoice lines overview selects, as a window onto
 * them. Shared by the page and the export.
 */
const invoiceLineRows =
  (query: TableQuery) =>
  (limit: number, offset: number): Promise<InvoiceLineItem[]> =>
    db
      .select({
        ...getTableColumns(InvoiceItems),
        invoiceId: Invoices.id,
        invoiceDate: Invoices.invoiceDate,
        customerName: Companies.companyName,
        vatNumber: Companies.vatNumber,
        productCode: Products.productCode,
        productName: Products.name,
        lineNumber: OrderItems.lineNumber,
      })
      .from(InvoiceItems)
      .leftJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
      .leftJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
      .leftJoin(OrderItems, eq(InvoiceItems.orderItemUuid, OrderItems.uuid))
      .leftJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
      .where(
        tableWhere({
          query,
          search: INVOICE_LINE_SEARCH,
          filters: INVOICE_LINE_FILTERS,
        }),
      )
      .orderBy(
        ...tableOrderBy(
          INVOICE_LINE_SORTABLE,
          query,
          [desc(Invoices.invoiceDate)],
          InvoiceItems.id,
        ),
      )
      .limit(limit)
      .offset(offset);

/** Every invoice line the current view matches, as a workbook. */
export const exportInvoiceLines = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Invoice Lines",
    columns: INVOICE_LINE_COLUMNS,
    columnKeys,
    rows: invoiceLineRows(parseTableQuery(params)),
  });

export const getInvoiceLines = async (
  query: TableQuery,
): Promise<Paged<InvoiceLineItem>> => {
  try {
    const where = tableWhere({
      query,
      search: INVOICE_LINE_SEARCH,
      filters: INVOICE_LINE_FILTERS,
    });

    return await runPaged(query, {
      rows: invoiceLineRows(query),

      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(InvoiceItems)
          .leftJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
          .leftJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
          .leftJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
          .where(where);
        return Number(row?.value ?? 0);
      },
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch invoice lines"));
  }
};

/**
 * One invoice line with the invoice, customer, product and order line behind it.
 * The money and weight are the line's own snapshot, taken at invoicing.
 */
export const getInvoiceLineDetail = async (
  uuid: string,
): Promise<InvoiceLineDetail | null> => {
  try {
    const [row] = await db
      .select({
        ...getTableColumns(InvoiceItems),
        invoiceId: Invoices.id,
        invoiceDate: Invoices.invoiceDate,
        invoiceDocumentType: Invoices.documentType,
        customerName: Companies.companyName,
        companyUuid: Companies.uuid,
        vatNumber: Companies.vatNumber,
        productCode: Products.productCode,
        productName: Products.name,
        lineNumber: OrderItems.lineNumber,
        orderUuid: OrderItems.orderUuid,
      })
      .from(InvoiceItems)
      .leftJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
      .leftJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
      .leftJoin(OrderItems, eq(InvoiceItems.orderItemUuid, OrderItems.uuid))
      .leftJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
      .where(eq(InvoiceItems.uuid, uuid))
      .limit(1);

    return row ?? null;
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch invoice line"));
  }
};
