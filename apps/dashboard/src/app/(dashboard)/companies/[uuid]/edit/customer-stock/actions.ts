"use server";

import { CompanyActionResult } from "@/app/(dashboard)/companies/actions";
import {
  customerStockDialogSchema,
  CustomerStockDialogValues,
} from "@/app/(dashboard)/companies/validation";
import { db } from "@/db";
import { CustomerStock, SelectCustomerStock } from "@/db/schema/customer-stock";
import { Products } from "@/db/schema/products";
import { describeError, generateUuid } from "@/lib/helpers";
import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { customerStockValuesToColumns } from "./mappers";

export type SaveCustomerStockPayload = {
  companyUuid: string;
  customerStockUuid: string | null;
  values: CustomerStockDialogValues;
};

export type DeleteCustomerStockPayload = {
  companyUuid: string;
  customerStockUuid: string;
};

const revalidateCustomerStockPaths = (companyUuid: string) => {
  revalidatePath(`/companies/${companyUuid}/edit/customer-stock`);
  revalidatePath(`/companies/${companyUuid}/edit`);
};

export const getCompanyCustomerStock = async (
  companyUuid: string,
): Promise<SelectCustomerStock[]> =>
  await db
    .select()
    .from(CustomerStock)
    .where(eq(CustomerStock.companyUuid, companyUuid))
    .orderBy(asc(CustomerStock.id));

// Inserts a new stock booking or updates an existing one by uuid. The picked
// product's code and name are snapshotted onto the row — the same behavior as
// the legacy save handler — so the stock grid stays readable even if the
// catalog product changes later.
export const saveCompanyCustomerStock = async (
  _prevState: CompanyActionResult,
  payload: SaveCustomerStockPayload,
): Promise<CompanyActionResult> => {
  const parsed = customerStockDialogSchema.safeParse(payload.values);
  if (!parsed.success) {
    return { error: "Invalid stock data — check the fields and try again" };
  }

  try {
    const [product] = await db
      .select({
        uuid: Products.uuid,
        productCode: Products.productCode,
        name: Products.name,
      })
      .from(Products)
      .where(eq(Products.uuid, parsed.data.productUuid))
      .limit(1);

    if (!product) {
      return { error: "Selected product not found" };
    }

    const columns = {
      ...customerStockValuesToColumns(parsed.data),
      productUuid: product.uuid,
      productCode: product.productCode,
      productName: product.name,
    };

    if (payload.customerStockUuid) {
      await db
        .update(CustomerStock)
        .set(columns)
        .where(
          and(
            eq(CustomerStock.uuid, payload.customerStockUuid),
            eq(CustomerStock.companyUuid, payload.companyUuid),
          ),
        );
    } else {
      await db.insert(CustomerStock).values({
        ...columns,
        uuid: generateUuid(),
        companyUuid: payload.companyUuid,
      });
    }

    revalidateCustomerStockPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to save customer stock") };
  }
};

export const deleteCompanyCustomerStock = async (
  _prevState: CompanyActionResult,
  payload: DeleteCustomerStockPayload,
): Promise<CompanyActionResult> => {
  try {
    await db
      .delete(CustomerStock)
      .where(
        and(
          eq(CustomerStock.uuid, payload.customerStockUuid),
          eq(CustomerStock.companyUuid, payload.companyUuid),
        ),
      );

    revalidateCustomerStockPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to delete customer stock") };
  }
};
