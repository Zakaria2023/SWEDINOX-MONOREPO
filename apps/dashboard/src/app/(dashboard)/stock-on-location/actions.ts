"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import { SelectStock, Stock } from "@/db/schema/stock";
import { Products, SelectProducts } from "@/db/schema/products";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { SelectWarehouses, Warehouses } from "@/db/schema/warehouses";
import { desc, eq, getTableColumns, sql } from "drizzle-orm";

export type StockOnLocationItem = SelectStock & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  locationName: SelectWarehouses["name"] | null;
  supplierName: SelectCompanies["companyName"] | null;
  /** Quantity less what is reserved: free stock on the lot. */
  available: number;
  /** The same in kilograms. */
  availableKg: number;
  /** Weight times the valuation price, which is struck per tonne. */
  stockValue: number;
};

// A lot's free stock and what it is worth. The reference rounds the available
// quantity to whole units for display — kilograms included — but the stored
// figure keeps its decimals, so the rounding belongs on the screen and not
// here.
//
// The valuation price is per tonne like every other price in the system. A
// negative one is a data error rather than a business case, but it exists in
// the reference's own stock, so this multiplies it out instead of clamping and
// hiding it.
const stockDerived = {
  available:
    sql<number>`GREATEST(0, COALESCE(${Stock.quantity}, 0) - COALESCE(${Stock.reservedQuantity}, 0))`.mapWith(
      Number,
    ),
  availableKg: sql<number>`GREATEST(0,
    COALESCE(${Stock.quantityKg}, 0)
    - CASE WHEN COALESCE(${Stock.quantity}, 0) > 0
        THEN COALESCE(${Stock.quantityKg}, 0) * COALESCE(${Stock.reservedQuantity}, 0) / ${Stock.quantity}
        ELSE 0
      END)`.mapWith(Number),
  stockValue:
    sql<number>`COALESCE(${Stock.quantityKg}, 0) * COALESCE(${Stock.valuationPrice}, 0) / 1000`.mapWith(
      Number,
    ),
};

export const getStockOnLocation = async (): Promise<StockOnLocationItem[]> => {
  try {
    return await db
      .select({
        ...getTableColumns(Stock),
        ...stockDerived,
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
