"use server";

import { db } from "@/db";
import {
  InsertMachinePostProcessings,
  InsertMachineProducts,
  InsertMachines,
  MachinePostProcessings,
  MachineProducts,
  Machines,
  SelectMachinePostProcessings,
  SelectMachineProducts,
  SelectMachines,
} from "@/db/schema/machines";
import { ProductGroups, SelectProductGroups } from "@/db/schema/product-groups";
import { Products, SelectProducts } from "@/db/schema/products";
import { SelectWarehouses, Warehouses } from "@/db/schema/warehouses";
import { MachineProductionType } from "@/lib/enums";
import {
  canMachinePerform,
  describeError,
  generateUuid,
  machineCapacityUnitFor,
} from "@/lib/helpers";
import { MACHINE_OPTION_LABELS, MACHINE_PRODUCTION_LABELS } from "@/lib/labels";
import { desc, eq, getTableColumns } from "drizzle-orm";

export type MachineFields = Omit<
  InsertMachines,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type MachineProductInput = Omit<
  InsertMachineProducts,
  "id" | "uuid" | "machineUuid" | "createdAt" | "updatedAt"
>;

export type MachinePostProcessingInput = Omit<
  InsertMachinePostProcessings,
  "id" | "uuid" | "machineUuid" | "createdAt" | "updatedAt"
>;

export type MachineActionResult = {
  machineUuid?: string;
  error?: string;
  success?: boolean;
};

export type MachineListItem = SelectMachines & {
  stockLocationName: SelectWarehouses["name"] | null;
};

export type MachineProductRow = SelectMachineProducts & {
  catalogProductCode: SelectProducts["productCode"] | null;
  catalogProductName: SelectProducts["name"] | null;
  productGroupName: SelectProductGroups["name"] | null;
};

export type MachineDetail = MachineListItem & {
  stockLocationType: SelectWarehouses["type"] | null;
  products: MachineProductRow[];
  postProcessings: SelectMachinePostProcessings[];
};

export const getMachines = async (): Promise<MachineListItem[]> => {
  try {
    return await db
      .select({
        ...getTableColumns(Machines),
        stockLocationName: Warehouses.name,
      })
      .from(Machines)
      .leftJoin(Warehouses, eq(Machines.stockLocationUuid, Warehouses.uuid))
      .orderBy(desc(Machines.createdAt));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch machines"));
  }
};

/**
 * One machine with everything recorded on it: its own settings, the stock
 * location it stands in, the products/groups it can run, and the post
 * processings that follow it.
 *
 * A machine product keeps its own snapshot of the code and description it was
 * added under, so the catalogue row is joined alongside rather than instead of
 * it — a product later renamed should not silently rewrite the machine's setup.
 */
export const getMachineDetail = async (
  uuid: string,
): Promise<MachineDetail | null> => {
  const [machine] = await db
    .select({
      ...getTableColumns(Machines),
      stockLocationName: Warehouses.name,
      stockLocationType: Warehouses.type,
    })
    .from(Machines)
    .leftJoin(Warehouses, eq(Machines.stockLocationUuid, Warehouses.uuid))
    .where(eq(Machines.uuid, uuid))
    .limit(1);

  if (!machine) {
    return null;
  }

  const [products, postProcessings] = await Promise.all([
    db
      .select({
        ...getTableColumns(MachineProducts),
        catalogProductCode: Products.productCode,
        catalogProductName: Products.name,
        productGroupName: ProductGroups.name,
      })
      .from(MachineProducts)
      .leftJoin(Products, eq(Products.uuid, MachineProducts.productUuid))
      .leftJoin(
        ProductGroups,
        eq(ProductGroups.uuid, MachineProducts.productGroupUuid),
      )
      .where(eq(MachineProducts.machineUuid, uuid))
      .orderBy(MachineProducts.preference),
    db
      .select()
      .from(MachinePostProcessings)
      .where(eq(MachinePostProcessings.machineUuid, uuid))
      .orderBy(MachinePostProcessings.preference),
  ]);

  return { ...machine, products, postProcessings };
};

export const createMachine = async (
  fields: MachineFields,
  products: MachineProductInput[] = [],
  postProcessings: MachinePostProcessingInput[] = [],
): Promise<MachineActionResult> => {
  const uuid = generateUuid();
  try {
    const [existingCode] = await db
      .select({ uuid: Machines.uuid })
      .from(Machines)
      .where(eq(Machines.code, fields.code))
      .limit(1);

    if (existingCode) {
      return { error: "Machine code already exists" };
    }

    const [existingProduction] = await db
      .select({ uuid: Machines.uuid })
      .from(Machines)
      .where(eq(Machines.production, fields.production))
      .limit(1);

    if (existingProduction) {
      return {
        error: `A machine already exists for production ${
          MACHINE_PRODUCTION_LABELS[fields.production as MachineProductionType]
        }`,
      };
    }

    // A production line runs a known set of options. A decoiler cannot run a
    // laser, and planning a job onto one that cannot do it would put the work
    // on a machine that has to hand it straight back.
    if (!canMachinePerform(fields.production, fields.option)) {
      return {
        error: `${MACHINE_PRODUCTION_LABELS[fields.production]} cannot run ${MACHINE_OPTION_LABELS[fields.option]}.`,
      };
    }

    await db.transaction(async (tx) => {
      await tx.insert(Machines).values({
        ...fields,
        uuid,
        // A day of laser time is measured in cutting metres and a day of
        // grinding in square metres. The option knows which; nobody should
        // have to remember it.
        averageDailyCapacityUnit:
          fields.averageDailyCapacityUnit ??
          machineCapacityUnitFor(fields.option, fields.production),
      });

      if (products.length > 0) {
        await tx.insert(MachineProducts).values(
          products.map((product) => ({
            ...product,
            uuid: generateUuid(),
            machineUuid: uuid,
          })),
        );
      }

      if (postProcessings.length > 0) {
        await tx.insert(MachinePostProcessings).values(
          postProcessings.map((postProcessing) => ({
            ...postProcessing,
            uuid: generateUuid(),
            machineUuid: uuid,
          })),
        );
      }
    });

    return { success: true, machineUuid: uuid };
  } catch {
    return { error: "Failed to create machine" };
  }
};
