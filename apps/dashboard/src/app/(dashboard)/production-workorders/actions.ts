"use server";

import { db } from "@/db";
import {
  ProductionWorkOrderLines,
  ProductionWorkOrders,
  SelectProductionWorkOrderLines,
  SelectProductionWorkOrders,
} from "@/db/schema/production-work-orders";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Machines, SelectMachines } from "@/db/schema/machines";
import { Products, SelectProducts } from "@/db/schema/products";
import { desc, eq, getTableColumns } from "drizzle-orm";

export type ProductionWorkOrderLineItem = SelectProductionWorkOrderLines & {
  option: SelectProductionWorkOrders["option"] | null;
  workOrderDate: SelectProductionWorkOrders["date"] | null;
  machineName: SelectMachines["name"] | null;
  companyName: SelectCompanies["companyName"] | null;
  productName: SelectProducts["name"] | null;
};

export const getProductionWorkOrderLines = async (): Promise<
  ProductionWorkOrderLineItem[]
> => {
  try {
    return await db
      .select({
        ...getTableColumns(ProductionWorkOrderLines),
        option: ProductionWorkOrders.option,
        workOrderDate: ProductionWorkOrders.date,
        machineName: Machines.name,
        companyName: Companies.companyName,
        productName: Products.name,
      })
      .from(ProductionWorkOrderLines)
      .innerJoin(
        ProductionWorkOrders,
        eq(ProductionWorkOrderLines.workOrderUuid, ProductionWorkOrders.uuid),
      )
      .leftJoin(Machines, eq(ProductionWorkOrders.machineUuid, Machines.uuid))
      .leftJoin(
        Companies,
        eq(ProductionWorkOrderLines.companyUuid, Companies.uuid),
      )
      .leftJoin(Products, eq(ProductionWorkOrderLines.productUuid, Products.uuid))
      .orderBy(desc(ProductionWorkOrderLines.createdAt));
  } catch {
    throw new Error("Failed to fetch production work orders");
  }
};
