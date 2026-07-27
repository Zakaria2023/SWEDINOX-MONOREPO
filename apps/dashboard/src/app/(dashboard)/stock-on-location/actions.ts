"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import { SelectStock, Stock } from "@/db/schema/stock";
import { Products, SelectProducts } from "@/db/schema/products";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { SelectWarehouses, Warehouses } from "@/db/schema/warehouses";
import { desc, eq, getTableColumns } from "drizzle-orm";

export type StockOnLocationItem = SelectStock & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  locationName: SelectWarehouses["name"] | null;
  supplierName: SelectCompanies["companyName"] | null;
};

export const getStockOnLocation = async (): Promise<StockOnLocationItem[]> => {
  try {
    return await db
      .select({
        ...getTableColumns(Stock),
        productCode: Products.productCode,
        productName: Products.name,
        locationName: Warehouses.name,
        supplierName: Companies.companyName,
      })
      .from(Stock)
      .leftJoin(Products, eq(Stock.productUuid, Products.uuid))
      .leftJoin(Warehouses, eq(Stock.locationUuid, Warehouses.uuid))
      .leftJoin(Companies, eq(Stock.supplierUuid, Companies.uuid))
      .orderBy(desc(Stock.createdAt));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch stock on location"));
  }
};
