"use server";

import { db } from "@/db";
import { InvoiceItems, SelectInvoiceItems } from "@/db/schema/invoice-items";
import { Invoices, SelectInvoices } from "@/db/schema/invoices";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import {
  asTransportMode,
  asTransportRegion,
  describeError,
  requiresCustomsDocuments,
  transportModeCbsCode,
  transportRegionMetaOf,
} from "@/lib/helpers";
import { desc, eq } from "drizzle-orm";

export type CbsDocumentationRow = {
  key: string;
  invoiceDate: SelectInvoices["invoiceDate"];
  invoiceId: SelectInvoices["id"];
  invoiceAmount: SelectInvoiceItems["amount"];
  weightKg: SelectInvoiceItems["weightKg"];
  companyName: SelectCompanies["companyName"] | null;
  partnerId: SelectCompanies["vatNumber"] | null;
  orderType: SelectOrders["orderCategory"];
  orderCode: SelectOrders["id"];
  orderLineNr: SelectOrderItems["lineNumber"];
  // The Intrastat mode-of-transport code the return declares — 1 sea, 3 road,
  // 4 air — and whether the consignment left the customs union at all. Null
  // where the order does not say how the goods travelled: a statutory return
  // may not guess.
  transportCode: number | null;
  intraCommunity: boolean | null;
  customsDocumentRequired: boolean | null;
};

// CBS / Intrastat documentation export — one row per invoiced goods line, with
// its invoice, customer and originating order line.
//
// The mode-of-transport code is the order's own transport mode read as its
// Intrastat code, and whether the consignment was intra-community comes from
// its transport region. The remaining CBS codes (rubric, commodity code,
// origin, container, statistical value, transaction code) aren't captured in
// this system yet, so those columns still have no source.
export const getCbsDocumentation = async (): Promise<CbsDocumentationRow[]> => {
  try {
    const rows = await db
      .select({
        key: InvoiceItems.uuid,
        invoiceDate: Invoices.invoiceDate,
        invoiceId: Invoices.id,
        // Declared value and weight come from the invoice line itself — a
        // statutory return must state what was invoiced, not what the order
        // happens to say now. The order stays joined for its identifiers.
        invoiceAmount: InvoiceItems.amount,
        weightKg: InvoiceItems.weightKg,
        companyName: Companies.companyName,
        partnerId: Companies.vatNumber,
        orderType: Orders.orderCategory,
        orderCode: Orders.id,
        orderLineNr: OrderItems.lineNumber,
        transportMode: Orders.transportMode,
        transportRegion: Orders.transportRegion,
      })
      .from(InvoiceItems)
      .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
      .leftJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
      .innerJoin(OrderItems, eq(InvoiceItems.orderItemUuid, OrderItems.uuid))
      .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .orderBy(desc(Invoices.invoiceDate), desc(Invoices.id));

    return rows.map((row) => {
      const region = asTransportRegion(row.transportRegion);
      const regionMeta = transportRegionMetaOf(region);
      return {
        ...row,
        transportCode: transportModeCbsCode(asTransportMode(row.transportMode)),
        intraCommunity: regionMeta ? regionMeta.inEuCustomsUnion : null,
        customsDocumentRequired: region
          ? requiresCustomsDocuments(region)
          : null,
      };
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch CBS documentation"));
  }
};
