"use server";

import { db } from "@/db";
import { SelectStock, Stock } from "@/db/schema/stock";
import { Products, SelectProducts } from "@/db/schema/products";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { SelectWarehouses, Warehouses } from "@/db/schema/warehouses";
import { alias } from "drizzle-orm/mysql-core";
import { desc, eq, getTableColumns, isNotNull } from "drizzle-orm";

export type CustomerStockItem = SelectStock & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  locationName: SelectWarehouses["name"] | null;
  supplierName: SelectCompanies["companyName"] | null;
  ownerName: SelectCompanies["companyName"] | null;
};

// Stock physically at one of our locations but owned by a customer/supplier
// (consignment) — everything with an `ownerCompanyUuid` set.
export const getCustomerStock = async (): Promise<CustomerStockItem[]> => {
  const owner = alias(Companies, "owner");
  try {
    return await db
      .select({
        ...getTableColumns(Stock),
        productCode: Products.productCode,
        productName: Products.name,
        locationName: Warehouses.name,
        supplierName: Companies.companyName,
        ownerName: owner.companyName,
      })
      .from(Stock)
      .leftJoin(Products, eq(Stock.productUuid, Products.uuid))
      .leftJoin(Warehouses, eq(Stock.locationUuid, Warehouses.uuid))
      .leftJoin(Companies, eq(Stock.supplierUuid, Companies.uuid))
      .leftJoin(owner, eq(Stock.ownerCompanyUuid, owner.uuid))
      .where(isNotNull(Stock.ownerCompanyUuid))
      .orderBy(desc(Stock.createdAt));
  } catch {
    throw new Error("Failed to fetch customer stock");
  }
};
