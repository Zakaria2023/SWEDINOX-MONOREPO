"use server";

import type { CompanyActionResult } from "@/app/(dashboard)/companies/actions";
import {
  productDialogSchema,
  ProductDialogValues,
} from "@/app/(dashboard)/companies/validation";
import { db } from "@/db";
import { InsertProducts, Products, SelectProducts } from "@/db/schema/products";
import { describeError, generateUuid } from "@/lib/helpers";
import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  productValuesToInsertColumns,
  productValuesToUpdateColumns,
} from "./mappers";

export type SaveCompanyProductPayload = {
  companyUuid: string;
  // uuid of the company's own product row being edited — null inserts a new
  // row. Distinct from values.productUuid, which holds the picked catalog
  // product (or this same row uuid when the product wasn't re-picked).
  productUuid: string | null;
  values: ProductDialogValues;
};

export type DeleteCompanyProductPayload = {
  companyUuid: string;
  productUuid: string;
};

const revalidateProductPaths = (companyUuid: string) => {
  revalidatePath(`/companies/${companyUuid}/edit/products`);
  revalidatePath(`/companies/${companyUuid}/edit`);
  revalidatePath(`/companies/${companyUuid}/edit/full`);
};

// The identity columns a company product row copies from the picked catalog
// product (the row is a per-company copy, not a reference).
const getPickedProduct = async (uuid: string) => {
  const [picked] = await db
    .select({
      productCode: Products.productCode,
      name: Products.name,
      productGroupUuid: Products.productGroupUuid,
    })
    .from(Products)
    .where(eq(Products.uuid, uuid))
    .limit(1);

  return picked ?? null;
};

// All of the company's own product rows load into one list — the legacy
// form's general-products vs customer-products split isn't stored on the row
// (both flavors write the same table), so there is no way to tell them apart
// here.
export const getCompanyProducts = async (
  companyUuid: string,
): Promise<SelectProducts[]> =>
  await db
    .select()
    .from(Products)
    .where(eq(Products.companyUuid, companyUuid))
    .orderBy(asc(Products.id));

// Inserts a new company product or updates an existing one by uuid. New rows
// copy their identity (code, name, product group) from the picked catalog
// product, matching the legacy create-company flow. Updates write only the
// dialog-editable columns — plus the identity columns when the user re-picked
// a different catalog product.
export const saveCompanyProduct = async (
  _prevState: CompanyActionResult,
  payload: SaveCompanyProductPayload,
): Promise<CompanyActionResult> => {
  const parsed = productDialogSchema.safeParse(payload.values);
  if (!parsed.success) {
    return { error: "Invalid product data — check the fields and try again" };
  }

  try {
    if (payload.productUuid) {
      let identityColumns: Partial<InsertProducts> = {};

      if (parsed.data.productUuid !== payload.productUuid) {
        const picked = await getPickedProduct(parsed.data.productUuid);

        if (!picked) {
          return { error: "Selected product not found" };
        }

        identityColumns = picked;
      }

      await db
        .update(Products)
        .set({
          ...productValuesToUpdateColumns(parsed.data),
          ...identityColumns,
        })
        .where(
          and(
            eq(Products.uuid, payload.productUuid),
            eq(Products.companyUuid, payload.companyUuid),
          ),
        );
    } else {
      const picked = await getPickedProduct(parsed.data.productUuid);

      if (!picked) {
        return { error: "Selected product not found" };
      }

      await db.insert(Products).values({
        ...productValuesToInsertColumns(parsed.data),
        ...picked,
        uuid: generateUuid(),
        companyUuid: payload.companyUuid,
      });
    }

    revalidateProductPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to save product") };
  }
};

export const deleteCompanyProduct = async (
  _prevState: CompanyActionResult,
  payload: DeleteCompanyProductPayload,
): Promise<CompanyActionResult> => {
  try {
    await db
      .delete(Products)
      .where(
        and(
          eq(Products.uuid, payload.productUuid),
          eq(Products.companyUuid, payload.companyUuid),
        ),
      );

    revalidateProductPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to delete product") };
  }
};
