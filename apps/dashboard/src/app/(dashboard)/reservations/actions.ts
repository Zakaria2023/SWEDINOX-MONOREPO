"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import { Reservations, SelectReservations } from "@/db/schema/reservations";
import { Stock } from "@/db/schema/stock";
import { Products, SelectProducts } from "@/db/schema/products";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { SelectWarehouses, Warehouses } from "@/db/schema/warehouses";
import { desc, eq, getTableColumns, sql, sum } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

export type ReservationItem = {
  productUuid: SelectProducts["uuid"];
  productCode: SelectProducts["productCode"];
  productName: SelectProducts["name"];
  technicalQty: number; // SUM(quantity) — physical technical stock
  technicalKg: number; // SUM(quantity_kg)
  reservedQty: number; // SUM(reserved_quantity)
};

export type ReservationRecord = SelectReservations & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  stockProduct: SelectProducts["stockProduct"] | null;
  standardProduct: SelectProducts["standardProduct"] | null;
  productLength: SelectProducts["length"] | null;
  sectionName: SelectWarehouses["name"] | null;
  locationName: SelectWarehouses["name"] | null;
  locationType: SelectWarehouses["locationType"] | null;
  orderId: SelectOrders["id"] | null;
  lineNumber: SelectOrderItems["lineNumber"] | null;
  companyName: SelectCompanies["companyName"] | null;
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
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch reservations"));
  }
};

/**
 * One row per reservation, the way the reference's `Toon reserveringen` panel
 * shows them: what kind of demand, how firm, how much, which order line, whose,
 * and for when.
 *
 * ⚠️ This used to be reconstructed from `OrderItems` with the type derived as
 * *"definitive once invoiced, otherwise temporary"*. That rule was wrong.
 * Reservation `O100742/50` reads **Definitive** on a line whose status is still
 * `In progress` — a reservation is definitive from the moment the order is
 * placed, and invoicing has nothing to do with it. `Type` and `Status` are also
 * two columns in the reference and were being squashed into one string here.
 */
export const getReservationRecords = async (): Promise<ReservationRecord[]> => {
  try {
    const location = alias(Warehouses, "res_location");
    const section = alias(Warehouses, "res_section");

    const rows = await db
      .select({
        ...getTableColumns(Reservations),
        productCode: Products.productCode,
        productName: Products.name,
        stockProduct: Products.stockProduct,
        standardProduct: Products.standardProduct,
        productLength: Products.length,
        sectionName: section.name,
        locationName: location.name,
        locationType: location.locationType,
        orderId: Orders.id,
        lineNumber: OrderItems.lineNumber,
        companyName: Companies.companyName,
      })
      .from(Reservations)
      .innerJoin(Stock, eq(Reservations.stockUuid, Stock.uuid))
      .innerJoin(Products, eq(Stock.productUuid, Products.uuid))
      .leftJoin(location, eq(Stock.locationUuid, location.uuid))
      .leftJoin(section, eq(location.parentUuid, section.uuid))
      .leftJoin(OrderItems, eq(Reservations.orderItemUuid, OrderItems.uuid))
      .leftJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
      .orderBy(desc(Reservations.createdAt));

    return rows;
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch reservation records"));
  }
};
