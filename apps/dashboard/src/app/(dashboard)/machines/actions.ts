"use server";

import { db } from "@/db";
import { InsertMachines, Machines, SelectMachines } from "@/db/schema/machines";
import { SelectWarehouses, Warehouses } from "@/db/schema/warehouses";
import { MachineProductionType } from "@/lib/enums";
import { generateUuid } from "@/lib/helpers";
import { MACHINE_PRODUCTION_LABELS } from "@/lib/labels";
import { desc, eq, getTableColumns } from "drizzle-orm";

export type MachineFields = Omit<
  InsertMachines,
  "id" | "uuid" | "createdAt" | "updatedAt"
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
  } catch {
    throw new Error("Failed to fetch machines");
  }
};

export const createMachine = async (
  fields: MachineFields,
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

    await db.insert(Machines).values({ ...fields, uuid });
    return { success: true, machineUuid: uuid };
  } catch {
    return { error: "Failed to create machine" };
  }
};
