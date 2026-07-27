"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { Products, SelectProducts } from "@/db/schema/products";
import {
  PurchaseInvoiceItems,
  SelectPurchaseInvoiceItems,
} from "@/db/schema/purchase-invoice-items";
import {
  PurchaseInvoices,
  SelectPurchaseInvoices,
} from "@/db/schema/purchase-invoices";
import { Stock } from "@/db/schema/stock";
import { desc, eq, min } from "drizzle-orm";

export type PurchaseInvoiceLineRow = {
  invoiceId: SelectPurchaseInvoices["id"] | null;
  invoiceDate: SelectPurchaseInvoices["invoiceDate"] | null;
  purchaseOrderNumber: SelectPurchaseInvoices["purchaseOrderNumber"] | null;
  supplierName: SelectCompanies["companyName"] | null;
  country: SelectContacts["addressCountry"] | null;
  vatNumber: SelectCompanies["vatNumber"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  quantity: SelectPurchaseInvoiceItems["quantity"];
  revenue: number;
};

// Purchase invoice lines with the supplier's country/VAT and the purchased
// value (stock lot valuation × invoiced quantity) as "revenue products".
export const getPurchaseInvoiceLines = async (): Promise<
  PurchaseInvoiceLineRow[]
> => {
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
        addressCountry: Contacts.addressCountry,
      })
      .from(Contacts)
      .innerJoin(primaryContactId, eq(Contacts.id, primaryContactId.minId))
      .as("primary_contact");

    const rows = await db
      .select({
        invoiceId: PurchaseInvoices.id,
        invoiceDate: PurchaseInvoices.invoiceDate,
        purchaseOrderNumber: PurchaseInvoices.purchaseOrderNumber,
        supplierName: Companies.companyName,
        country: primaryContact.addressCountry,
        vatNumber: Companies.vatNumber,
        productCode: Products.productCode,
        productName: Products.name,
        quantity: PurchaseInvoiceItems.quantity,
        valuationPrice: Stock.valuationPrice,
      })
      .from(PurchaseInvoiceItems)
      .leftJoin(
        PurchaseInvoices,
        eq(PurchaseInvoiceItems.purchaseInvoiceUuid, PurchaseInvoices.uuid),
      )
      .leftJoin(Companies, eq(PurchaseInvoices.companyUuid, Companies.uuid))
      .leftJoin(primaryContact, eq(Companies.uuid, primaryContact.companyUuid))
      .leftJoin(Products, eq(PurchaseInvoiceItems.productUuid, Products.uuid))
      .leftJoin(Stock, eq(PurchaseInvoiceItems.stockUuid, Stock.uuid))
      .orderBy(desc(PurchaseInvoices.invoiceDate));

    return rows.map((row) => ({
      invoiceId: row.invoiceId,
      invoiceDate: row.invoiceDate,
      purchaseOrderNumber: row.purchaseOrderNumber,
      supplierName: row.supplierName,
      country: row.country ?? null,
      vatNumber: row.vatNumber,
      productCode: row.productCode,
      productName: row.productName,
      quantity: row.quantity,
      revenue: Number(row.valuationPrice ?? 0) * Number(row.quantity ?? 0),
    }));
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch purchase invoice lines"),
    );
  }
};
