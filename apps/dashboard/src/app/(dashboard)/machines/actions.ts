"use server";

import { db } from "@/db";
import {
  InsertMachinePostProcessings,
  InsertMachineProducts,
  InsertMachines,
  MachinePostProcessings,
  MachineProducts,
  Machines,
  SelectMachines,
} from "@/db/schema/machines";
import { SelectWarehouses, Warehouses } from "@/db/schema/warehouses";
import { MachineProductionType } from "@/lib/enums";
import { describeError, generateUuid } from "@/lib/helpers";
import { MACHINE_PRODUCTION_LABELS } from "@/lib/labels";
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

    await db.transaction(async (tx) => {
      await tx.insert(Machines).values({ ...fields, uuid });

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
