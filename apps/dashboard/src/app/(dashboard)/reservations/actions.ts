"use server";

import { db } from "@/db";
import { Stock } from "@/db/schema/stock";
import { Products, SelectProducts } from "@/db/schema/products";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { SelectWarehouses, Warehouses } from "@/db/schema/warehouses";
import { desc, eq, getTableColumns, ne, sql, sum } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

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

export type ReservationRecord = SelectOrderItems & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  stockProduct: SelectProducts["stockProduct"] | null;
  standardProduct: SelectProducts["standardProduct"] | null;
  productLength: SelectProducts["length"] | null;
  sectionName: SelectWarehouses["name"] | null;
  locationName: SelectWarehouses["name"] | null;
  locationType: SelectWarehouses["locationType"] | null;
  orderId: SelectOrders["id"] | null;
  companyName: SelectCompanies["companyName"] | null;
  // Derived label: definitive once invoiced, otherwise temporary.
  reservationType: string;
};

// One row per stock reservation held by an order line, with the lot's
// location and the owning order/company.
export const getReservationRecords = async (): Promise<ReservationRecord[]> => {
  try {
    const location = alias(Warehouses, "res_location");
    const section = alias(Warehouses, "res_section");

    const rows = await db
      .select({
        ...getTableColumns(OrderItems),
        productCode: Products.productCode,
        productName: Products.name,
        stockProduct: Products.stockProduct,
        standardProduct: Products.standardProduct,
        productLength: Products.length,
        sectionName: section.name,
        locationName: location.name,
        locationType: location.locationType,
        orderId: Orders.id,
        companyName: Companies.companyName,
      })
      .from(OrderItems)
      .innerJoin(Products, eq(OrderItems.productUuid, Products.uuid))
      .leftJoin(Stock, eq(OrderItems.stockUuid, Stock.uuid))
      .leftJoin(location, eq(Stock.locationUuid, location.uuid))
      .leftJoin(section, eq(location.parentUuid, section.uuid))
      .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
      .where(ne(OrderItems.status, "cancelled"))
      .orderBy(desc(OrderItems.createdAt));

    return rows.map((row) => ({
      ...row,
      reservationType:
        row.status === "invoiced"
          ? "Definitive (Sales)"
          : "Temporary (Sales)",
    }));
  } catch {
    throw new Error("Failed to fetch reservation records");
  }
};
