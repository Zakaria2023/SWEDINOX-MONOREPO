"use server";

import { db } from "@/db";
import {
  PurchaseLineReceivals,
  SelectPurchaseLineReceivals,
} from "@/db/schema/purchase-line-receivals";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Products, SelectProducts } from "@/db/schema/products";
import { desc, eq, getTableColumns } from "drizzle-orm";

export type PurchaseReceivalItem = SelectPurchaseLineReceivals & {
  supplierName: SelectCompanies["companyName"] | null;
  supplierCode: SelectCompanies["searchCode1"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
};

export const getPurchaseReceivals = async (): Promise<
  PurchaseReceivalItem[]
> => {
  try {
    return await db
      .select({
        ...getTableColumns(PurchaseLineReceivals),
        supplierName: Companies.companyName,
        supplierCode: Companies.searchCode1,
        productCode: Products.productCode,
        productName: Products.name,
      })
      .from(PurchaseLineReceivals)
      .leftJoin(Companies, eq(PurchaseLineReceivals.companyUuid, Companies.uuid))
      .leftJoin(Products, eq(PurchaseLineReceivals.productUuid, Products.uuid))
      .orderBy(desc(PurchaseLineReceivals.receiptDate));
  } catch {
    throw new Error("Failed to fetch purchase receivals");
  }
};
