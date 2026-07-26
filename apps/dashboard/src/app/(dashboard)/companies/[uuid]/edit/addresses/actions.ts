"use server";

import type { CompanyActionResult } from "@/app/(dashboard)/companies/actions";
import {
  AddressFormValues,
  createAddressSchema,
} from "@/app/(dashboard)/companies/validation";
import { db } from "@/db";
import {
  CompanyAddresses,
  SelectCompanyAddresses,
} from "@/db/schema/company-addresses";
import { CounterOrders } from "@/db/schema/counter-orders";
import { Orders } from "@/db/schema/orders";
import { PurchaseOrders } from "@/db/schema/purchase-orders";
import { PurchaseQuotes } from "@/db/schema/purchase-quotes";
import { PurchaseRequests } from "@/db/schema/purchase-requests";
import { PurchaseReturnOrders } from "@/db/schema/purchase-return-orders";
import { Quotes } from "@/db/schema/quotes";
import { ReturnOrders } from "@/db/schema/return-orders";
import { describeError, generateUuid, pluralize } from "@/lib/helpers";
import { and, asc, eq, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { addressValuesToColumns } from "./mappers";

export type SaveAddressPayload = {
  companyUuid: string;
  addressUuid: string | null;
  values: AddressFormValues;
};

export type DeleteAddressPayload = {
  companyUuid: string;
  addressUuid: string;
};

const revalidateAddressPaths = (companyUuid: string) => {
  revalidatePath(`/companies/${companyUuid}/edit/addresses`);
  revalidatePath(`/companies/${companyUuid}/edit`);
};

const toCount = (rows: Array<{ value: number }>): number =>
  Number(rows[0]?.value ?? 0);

export const getCompanyAddresses = async (
  companyUuid: string,
): Promise<SelectCompanyAddresses[]> =>
  await db
    .select()
    .from(CompanyAddresses)
    .where(eq(CompanyAddresses.companyUuid, companyUuid))
    .orderBy(asc(CompanyAddresses.id));

// Inserts a new address or updates an existing one by uuid. Updates write
// every dialog-editable column, so an emptied field clears its column.
export const saveCompanyAddress = async (
  _prevState: CompanyActionResult,
  payload: SaveAddressPayload,
): Promise<CompanyActionResult> => {
  const parsed = createAddressSchema().safeParse(payload.values);
  if (!parsed.success) {
    return { error: "Invalid address data — check the fields and try again" };
  }

  try {
    const columns = addressValuesToColumns(parsed.data);

    if (payload.addressUuid) {
      await db
        .update(CompanyAddresses)
        .set(columns)
        .where(
          and(
            eq(CompanyAddresses.uuid, payload.addressUuid),
            eq(CompanyAddresses.companyUuid, payload.companyUuid),
          ),
        );
    } else {
      await db.insert(CompanyAddresses).values({
        ...columns,
        category: parsed.data.category,
        uuid: generateUuid(),
        companyUuid: payload.companyUuid,
      });
    }

    revalidateAddressPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to save address") };
  }
};

// Sales and purchase documents keep foreign keys to the address they deliver
// to / bill to, so an address that any of them reference can't be removed —
// surface a friendly per-document-type count instead of a raw FK error.
export const deleteCompanyAddress = async (
  _prevState: CompanyActionResult,
  payload: DeleteAddressPayload,
): Promise<CompanyActionResult> => {
  try {
    const { addressUuid } = payload;
    const count = { value: sql<number>`COUNT(*)` };

    const [
      orderRows,
      counterOrderRows,
      quoteRows,
      returnOrderRows,
      purchaseOrderRows,
      purchaseQuoteRows,
      purchaseRequestRows,
      purchaseReturnOrderRows,
    ] = await Promise.all([
      db
        .select(count)
        .from(Orders)
        .where(
          or(
            eq(Orders.deliveryAddressUuid, addressUuid),
            eq(Orders.billingAddressUuid, addressUuid),
          ),
        ),
      db
        .select(count)
        .from(CounterOrders)
        .where(
          or(
            eq(CounterOrders.deliveryAddressUuid, addressUuid),
            eq(CounterOrders.billingAddressUuid, addressUuid),
          ),
        ),
      db
        .select(count)
        .from(Quotes)
        .where(
          or(
            eq(Quotes.deliveryAddressUuid, addressUuid),
            eq(Quotes.billingAddressUuid, addressUuid),
          ),
        ),
      db
        .select(count)
        .from(ReturnOrders)
        .where(
          or(
            eq(ReturnOrders.deliveryAddressUuid, addressUuid),
            eq(ReturnOrders.billingAddressUuid, addressUuid),
          ),
        ),
      db
        .select(count)
        .from(PurchaseOrders)
        .where(
          or(
            eq(PurchaseOrders.deliveryAddressUuid, addressUuid),
            eq(PurchaseOrders.supplierAddressUuid, addressUuid),
          ),
        ),
      db
        .select(count)
        .from(PurchaseQuotes)
        .where(
          or(
            eq(PurchaseQuotes.deliveryAddressUuid, addressUuid),
            eq(PurchaseQuotes.supplierAddressUuid, addressUuid),
          ),
        ),
      db
        .select(count)
        .from(PurchaseRequests)
        .where(
          or(
            eq(PurchaseRequests.deliveryAddressUuid, addressUuid),
            eq(PurchaseRequests.supplierAddressUuid, addressUuid),
          ),
        ),
      db
        .select(count)
        .from(PurchaseReturnOrders)
        .where(eq(PurchaseReturnOrders.deliveryAddressUuid, addressUuid)),
    ]);

    const linked = [
      { count: toCount(orderRows), noun: "order" },
      { count: toCount(counterOrderRows), noun: "counter order" },
      { count: toCount(quoteRows), noun: "quote" },
      { count: toCount(returnOrderRows), noun: "return order" },
      { count: toCount(purchaseOrderRows), noun: "purchase order" },
      { count: toCount(purchaseQuoteRows), noun: "purchase quote" },
      { count: toCount(purchaseRequestRows), noun: "purchase request" },
      {
        count: toCount(purchaseReturnOrderRows),
        noun: "purchase return order",
      },
    ].filter((entry) => entry.count > 0);

    if (linked.length > 0) {
      const parts = linked.map(
        (entry) => `${entry.count} ${pluralize(entry.count, entry.noun)}`,
      );
      return {
        error: `This address is linked to ${parts.join(
          ", ",
        )} and can't be deleted`,
      };
    }

    await db
      .delete(CompanyAddresses)
      .where(
        and(
          eq(CompanyAddresses.uuid, payload.addressUuid),
          eq(CompanyAddresses.companyUuid, payload.companyUuid),
        ),
      );

    revalidateAddressPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to delete address") };
  }
};
