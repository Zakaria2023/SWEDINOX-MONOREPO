"use server";

import {
  Companies,
  db,
  InsertInvoices,
  InsertInvoiceSurcharges,
  Invoices,
  InvoiceSurcharges,
  SelectCompanies,
  SelectInvoices,
  SelectInvoiceSurcharges,
} from "@/db";
import { InvoiceItems, SelectInvoiceItems } from "@/db/schema/invoice-items";
import { OrderItems } from "@/db/schema/order-items";
import { Orders } from "@/db/schema/orders";
import { Products, SelectProducts } from "@/db/schema/products";
import { Stock } from "@/db/schema/stock";
import { StockMovements } from "@/db/schema/stock-movements";
import { generateUuid } from "@/lib/helpers";
import { currentUser } from "@clerk/nextjs/server";
import { and, desc, eq, getTableColumns, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type InvoiceActionResult = {
  invoiceUuid?: string;
  error?: string;
  success?: boolean;
};

export type InvoiceFields = Omit<
  InsertInvoices,
  | "id"
  | "uuid"
  | "invoiceAmountExclVat"
  | "invoiceAmountInclVat"
  | "creditRestriction"
  | "invoiceTotal"
  | "outstanding"
  | "createdAt"
  | "updatedAt"
>;

export type InvoiceSurchargeInput = Omit<
  InsertInvoiceSurcharges,
  "id" | "uuid" | "invoiceUuid" | "createdAt" | "updatedAt"
>;

export type InvoiceWithCompany = SelectInvoices & {
  companyName: SelectCompanies["companyName"] | null;
  companyCode: SelectCompanies["id"] | null;
};

export const getInvoices = async (): Promise<InvoiceWithCompany[]> =>
  db
    .select({
      ...getTableColumns(Invoices),
      companyName: Companies.companyName,
      companyCode: Companies.id,
    })
    .from(Invoices)
    .leftJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
    .orderBy(desc(Invoices.createdAt));

export const getInvoicesByCompanyUuid = async (
  companyUuid: string,
): Promise<SelectInvoices[]> =>
  db
    .select()
    .from(Invoices)
    .where(eq(Invoices.companyUuid, companyUuid))
    .orderBy(desc(Invoices.createdAt));

export type ReservedOrderItemOption = {
  uuid: string;
  quantity: string;
  productCode: string | null;
  productName: string | null;
  orderId: number;
};

// Open reservations for a customer, ready to be billed on an invoice.
export const getReservedOrderItemsForCompany = async (
  companyUuid: string,
): Promise<ReservedOrderItemOption[]> =>
  db
    .select({
      uuid: OrderItems.uuid,
      quantity: OrderItems.quantity,
      productCode: Products.productCode,
      productName: Products.name,
      orderId: Orders.id,
    })
    .from(OrderItems)
    .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
    .leftJoin(Products, eq(OrderItems.productUuid, Products.uuid))
    .where(
      and(
        eq(Orders.companyUuid, companyUuid),
        eq(OrderItems.status, "reserved"),
      ),
    )
    .orderBy(desc(OrderItems.createdAt));

export const createInvoice = async (
  fields: InvoiceFields,
  surcharges: InvoiceSurchargeInput[] = [],
  orderItemUuids: string[] = [],
): Promise<InvoiceActionResult> => {
  const uuid = generateUuid();
  const exclVat = surcharges.reduce(
    (sum, s) => sum + parseFloat(s.amount ?? "0"),
    0,
  );
  const invoiceAmountInclVat = (exclVat * 1.21).toFixed(2);
  const creditRestriction = "0.00";
  const invoiceTotal = invoiceAmountInclVat;
  const outstanding = invoiceTotal;

  try {
    const orderItemRows =
      orderItemUuids.length > 0
        ? await db
            .select()
            .from(OrderItems)
            .where(inArray(OrderItems.uuid, orderItemUuids))
        : [];
    const orderItemByUuid = new Map(orderItemRows.map((row) => [row.uuid, row]));

    for (const id of orderItemUuids) {
      const row = orderItemByUuid.get(id);
      if (!row) {
        return { error: "One or more selected reservations could not be found." };
      }
      if (row.status !== "reserved") {
        return { error: "One or more selected reservations are no longer open." };
      }
    }

    const user = await currentUser();
    const userId = user?.id;
    if (orderItemUuids.length > 0 && !userId) {
      return { error: "User not authenticated" };
    }

    await db.transaction(async (tx) => {
      await tx.insert(Invoices).values({
        ...fields,
        uuid,
        invoiceAmountExclVat: exclVat.toFixed(2),
        invoiceAmountInclVat,
        creditRestriction,
        invoiceTotal,
        outstanding,
      });

      for (const surcharge of surcharges) {
        await tx.insert(InvoiceSurcharges).values({
          ...surcharge,
          uuid: generateUuid(),
          invoiceUuid: uuid,
        });
      }

      for (const id of orderItemUuids) {
        const orderItem = orderItemByUuid.get(id);
        if (!orderItem) {
          continue;
        }

        // Guard: only bill a reservation that's still "reserved" — a
        // concurrent invoice or cancellation can't double-bill it.
        const [itemUpdateResult] = await tx
          .update(OrderItems)
          .set({ status: "invoiced" })
          .where(and(eq(OrderItems.uuid, id), eq(OrderItems.status, "reserved")));

        if (itemUpdateResult.affectedRows === 0) {
          throw new Error(
            "One of the selected reservations was already billed or cancelled — please refresh and try again.",
          );
        }

        const [stockRow] = await tx
          .select()
          .from(Stock)
          .where(eq(Stock.uuid, orderItem.stockUuid))
          .limit(1);

        if (!stockRow) {
          continue;
        }

        const nextQuantity = (
          Number(stockRow.quantity) - Number(orderItem.quantity)
        ).toFixed(3);
        const nextReserved = (
          Number(stockRow.reservedQuantity) - Number(orderItem.quantity)
        ).toFixed(3);

        const [stockUpdateResult] = await tx
          .update(Stock)
          .set({
            quantity: nextQuantity,
            reservedQuantity: nextReserved,
            status: Number(nextQuantity) > 0 ? "pending" : "received",
          })
          .where(
            and(
              eq(Stock.uuid, orderItem.stockUuid),
              eq(Stock.quantity, stockRow.quantity),
              eq(Stock.reservedQuantity, stockRow.reservedQuantity),
            ),
          );

        if (stockUpdateResult.affectedRows === 0) {
          throw new Error(
            "Stock changed while billing this order — please refresh and try again.",
          );
        }

        await tx.insert(InvoiceItems).values({
          uuid: generateUuid(),
          invoiceUuid: uuid,
          orderItemUuid: id,
          productUuid: orderItem.productUuid,
          quantity: orderItem.quantity,
        });

        await tx.insert(StockMovements).values({
          uuid: generateUuid(),
          productUuid: orderItem.productUuid,
          stockUuid: orderItem.stockUuid,
          type: "out",
          reason: "sale_consumption",
          quantity: orderItem.quantity,
          invoiceUuid: uuid,
          createdByUserId: userId as string,
        });
      }
    });

    revalidatePath("/invoices");
    revalidatePath("/orders");
    revalidatePath("/stock");
    revalidatePath("/stock-movements");
    return { success: true, invoiceUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create invoice",
    };
  }
};

export type InvoiceItemDetail = SelectInvoiceItems & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
};

export type InvoiceDetail = SelectInvoices & {
  companyName: SelectCompanies["companyName"] | null;
  companyCode: SelectCompanies["id"] | null;
  surcharges: SelectInvoiceSurcharges[];
  items: InvoiceItemDetail[];
};

export const getInvoiceDetail = async (
  uuid: string,
): Promise<InvoiceDetail | null> => {
  const [invoice] = await db
    .select({
      ...getTableColumns(Invoices),
      companyName: Companies.companyName,
      companyCode: Companies.id,
    })
    .from(Invoices)
    .leftJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
    .where(eq(Invoices.uuid, uuid))
    .limit(1);

  if (!invoice) {
    return null;
  }

  const surcharges = await db
    .select()
    .from(InvoiceSurcharges)
    .where(eq(InvoiceSurcharges.invoiceUuid, uuid));

  const items = await db
    .select({
      ...getTableColumns(InvoiceItems),
      productCode: Products.productCode,
      productName: Products.name,
    })
    .from(InvoiceItems)
    .leftJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
    .where(eq(InvoiceItems.invoiceUuid, uuid));

  return { ...invoice, surcharges, items };
};

export const cancelInvoice = async (
  uuid: string,
): Promise<InvoiceActionResult> => {
  try {
    const [invoice] = await db
      .select()
      .from(Invoices)
      .where(eq(Invoices.uuid, uuid))
      .limit(1);

    if (!invoice) {
      return { error: "Invoice not found." };
    }
    if (invoice.cancelled) {
      return { error: "This invoice is already cancelled." };
    }

    const items = await db
      .select({
        ...getTableColumns(InvoiceItems),
        stockUuid: OrderItems.stockUuid,
      })
      .from(InvoiceItems)
      .innerJoin(OrderItems, eq(InvoiceItems.orderItemUuid, OrderItems.uuid))
      .where(eq(InvoiceItems.invoiceUuid, uuid));

    const user = await currentUser();
    const userId = user?.id;
    if (items.length > 0 && !userId) {
      return { error: "User not authenticated" };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(Invoices)
        .set({ cancelled: true })
        .where(eq(Invoices.uuid, uuid));

      for (const item of items) {
        await tx
          .update(OrderItems)
          .set({ status: "reserved" })
          .where(eq(OrderItems.uuid, item.orderItemUuid));

        const [stockRow] = await tx
          .select()
          .from(Stock)
          .where(eq(Stock.uuid, item.stockUuid))
          .limit(1);

        if (!stockRow) {
          continue;
        }

        const restoredQuantity = (
          Number(stockRow.quantity) + Number(item.quantity)
        ).toFixed(3);
        const restoredReserved = (
          Number(stockRow.reservedQuantity) + Number(item.quantity)
        ).toFixed(3);

        await tx
          .update(Stock)
          .set({
            quantity: restoredQuantity,
            reservedQuantity: restoredReserved,
            status: "pending",
          })
          .where(eq(Stock.uuid, stockRow.uuid));

        await tx.insert(StockMovements).values({
          uuid: generateUuid(),
          productUuid: item.productUuid,
          stockUuid: stockRow.uuid,
          type: "in",
          reason: "sale_invoice_cancelled",
          quantity: item.quantity,
          invoiceUuid: uuid,
          createdByUserId: userId as string,
        });
      }
    });

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${uuid}`);
    revalidatePath("/orders");
    revalidatePath("/stock");
    revalidatePath("/stock-movements");
    return { success: true, invoiceUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to cancel invoice",
    };
  }
};

export type InvoiceHeaderEdit = Pick<
  InvoiceFields,
  "debtorNo" | "invoiceDate" | "expirationDate" | "paymentTerms" | "explanation"
>;

export const updateInvoice = async (
  uuid: string,
  fields: InvoiceHeaderEdit,
): Promise<InvoiceActionResult> => {
  try {
    const [invoice] = await db
      .select({ cancelled: Invoices.cancelled })
      .from(Invoices)
      .where(eq(Invoices.uuid, uuid))
      .limit(1);

    if (!invoice) {
      return { error: "Invoice not found." };
    }
    if (invoice.cancelled) {
      return { error: "Cannot edit a cancelled invoice." };
    }

    await db.update(Invoices).set(fields).where(eq(Invoices.uuid, uuid));
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update invoice",
    };
  }

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${uuid}`);
  redirect(`/invoices/${uuid}`);
};
