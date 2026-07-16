"use server";

import { db } from "@/db";
import { Stock } from "@/db/schema/stock";
import { Products, SelectProducts } from "@/db/schema/products";
import { desc, eq, sql, sum } from "drizzle-orm";

export type ReservationItem = {
  productUuid: SelectProducts["uuid"];
  productCode: SelectProducts["productCode"];
  productName: SelectProducts["name"];
  technicalQty: number; // SUM(quantity) — physical technical stock
  technicalKg: number; // SUM(quantity_kg)
  reservedQty: number; // SUM(reserved_quantity)
};

// Technical stock vs. what open sales orders hold, aggregated per product.
export const getReservations = async (): Promise<ReservationItem[]> => {
  try {
    const rows = await db
      .select({
        productUuid: Products.uuid,
        productCode: Products.productCode,
        productName: Products.name,
        technicalQty: sum(Stock.quantity),
        technicalKg: sum(Stock.quantityKg),
        reservedQty: sum(Stock.reservedQuantity),
      })
      .from(Stock)
      .innerJoin(Products, eq(Stock.productUuid, Products.uuid))
      .groupBy(Products.uuid, Products.productCode, Products.name)
      .having(sql`SUM(${Stock.reservedQuantity}) > 0`)
      .orderBy(desc(sum(Stock.reservedQuantity)));

    return rows.map((row) => ({
      productUuid: row.productUuid,
      productCode: row.productCode,
      productName: row.productName,
      technicalQty: Number(row.technicalQty ?? 0),
      technicalKg: Number(row.technicalKg ?? 0),
      reservedQty: Number(row.reservedQty ?? 0),
    }));
  } catch {
    throw new Error("Failed to fetch reservations");
  }
};
