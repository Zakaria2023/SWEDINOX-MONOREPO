"use server";
import { describeError } from "@/lib/helpers";

import { db } from "@/db";
import {
  FreightMovements,
  SelectFreightMovements,
} from "@/db/schema/freight-movements";
import { Products, SelectProducts } from "@/db/schema/products";
import { RevenueGroups, SelectRevenueGroups } from "@/db/schema/revenue-groups";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { PurchaseOrders, SelectPurchaseOrders } from "@/db/schema/purchase-orders";
import { Charges, SelectCharges } from "@/db/schema/charges";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

const Suppliers = alias(Companies, "suppliers");

export type FreightMovementListItem = SelectFreightMovements & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  length: SelectProducts["length"] | null;
  widthDiameter: SelectProducts["widthDiameter"] | null;
  standardProduct: SelectProducts["standardProduct"] | null;
  stockProduct: SelectProducts["stockProduct"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
  companyId: SelectCompanies["id"] | null;
  companyName: SelectCompanies["companyName"] | null;
  orderId: SelectOrders["id"] | null;
  chargeCode: SelectCharges["code"] | null;
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  supplierName: SelectCompanies["companyName"] | null;
};

export type FreightMovementDetail = FreightMovementListItem;

const selection = {
  ...getTableColumns(FreightMovements),
  productCode: Products.productCode,
  productName: Products.name,
  length: Products.length,
  widthDiameter: Products.widthDiameter,
  standardProduct: Products.standardProduct,
  stockProduct: Products.stockProduct,
  revenueGroupName: RevenueGroups.name,
  companyId: Companies.id,
  companyName: Companies.companyName,
  orderId: Orders.id,
  chargeCode: Charges.code,
  purchaseOrderId: PurchaseOrders.id,
  supplierName: Suppliers.companyName,
};

export const getFreightMovements = async (): Promise<
  FreightMovementListItem[]
> => {
  try {
    return await db
      .select(selection)
      .from(FreightMovements)
      .leftJoin(Products, eq(FreightMovements.productUuid, Products.uuid))
      .leftJoin(
        RevenueGroups,
        eq(FreightMovements.revenueGroupUuid, RevenueGroups.uuid),
      )
      .leftJoin(Companies, eq(FreightMovements.companyUuid, Companies.uuid))
      .leftJoin(Orders, eq(FreightMovements.orderUuid, Orders.uuid))
      .leftJoin(Charges, eq(FreightMovements.chargeUuid, Charges.uuid))
      .leftJoin(
        PurchaseOrders,
        eq(FreightMovements.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(Suppliers, eq(FreightMovements.supplierUuid, Suppliers.uuid))
      .orderBy(desc(FreightMovements.mutationDate));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch freight movements"));
  }
};

export const getFreightMovementDetail = async (
  uuid: string,
): Promise<FreightMovementDetail | null> => {
  const [movement] = await db
    .select(selection)
    .from(FreightMovements)
    .leftJoin(Products, eq(FreightMovements.productUuid, Products.uuid))
    .leftJoin(
      RevenueGroups,
      eq(FreightMovements.revenueGroupUuid, RevenueGroups.uuid),
    )
    .leftJoin(Companies, eq(FreightMovements.companyUuid, Companies.uuid))
    .leftJoin(Orders, eq(FreightMovements.orderUuid, Orders.uuid))
    .leftJoin(Charges, eq(FreightMovements.chargeUuid, Charges.uuid))
    .leftJoin(
      PurchaseOrders,
      eq(FreightMovements.purchaseOrderUuid, PurchaseOrders.uuid),
    )
    .leftJoin(Suppliers, eq(FreightMovements.supplierUuid, Suppliers.uuid))
    .where(eq(FreightMovements.uuid, uuid))
    .limit(1);

  return movement ?? null;
};
