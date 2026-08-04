"use server";

import {
  MachineActionResult,
  MachinePostProcessingInput,
  MachineProductInput,
} from "@/app/(dashboard)/machines/actions";
import { MachineFormValues } from "@/app/(dashboard)/machines/validation";
import { db } from "@/db";
import {
  MachinePostProcessings,
  MachineProducts,
  Machines,
  SelectMachinePostProcessings,
  SelectMachineProducts,
  SelectMachines,
} from "@/db/schema/machines";
import { Warehouses } from "@/db/schema/warehouses";
import {
  MachineCapacityUnit,
  MachineLoadingType,
  MachineOptionType,
  MachineProductionType,
} from "@/lib/enums";
import { describeError, generateUuid, toIntOrNull } from "@/lib/helpers";
import { MACHINE_PRODUCTION_LABELS } from "@/lib/labels";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type MachineEditData = SelectMachines & {
  products: SelectMachineProducts[];
  postProcessings: SelectMachinePostProcessings[];
};

export type MachineEditOverview = {
  machine: SelectMachines;
  stockLocationName: string | null;
  counts: {
    products: number;
    postProcessings: number;
    documents: number;
  };
};

const numberOrNull = (value: number | "" | undefined): number | null =>
  value === "" || value === undefined ? null : Number(value);

const dateOrNull = (value: string | undefined): Date | null =>
  value ? new Date(value) : null;

export const getMachineForEdit = async (
  uuid: string,
): Promise<MachineEditData | null> => {
  try {
    const [machine] = await db
      .select()
      .from(Machines)
      .where(eq(Machines.uuid, uuid))
      .limit(1);

    if (!machine) {
      return null;
    }

    const [products, postProcessings] = await Promise.all([
      db
        .select()
        .from(MachineProducts)
        .where(eq(MachineProducts.machineUuid, uuid)),
      db
        .select()
        .from(MachinePostProcessings)
        .where(eq(MachinePostProcessings.machineUuid, uuid)),
    ]);

    return { ...machine, products, postProcessings };
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch the machine"));
  }
};

export const getMachineEditOverview = async (
  uuid: string,
): Promise<MachineEditOverview | null> => {
  const machine = await getMachineForEdit(uuid);

  if (!machine) {
    return null;
  }

  const { products, postProcessings, ...row } = machine;

  const [stockLocation] = await db
    .select({ name: Warehouses.name })
    .from(Warehouses)
    .where(eq(Warehouses.uuid, row.stockLocationUuid))
    .limit(1);

  return {
    machine: row,
    stockLocationName: stockLocation?.name ?? null,
    counts: {
      products: products.length,
      postProcessings: postProcessings.length,
      documents: (row.documents ?? []).length,
    },
  };
};

// Each section writes only the columns it owns, so saving one never carries a
// half-finished edit from another section along with it.
const saveSection = async (
  uuid: string,
  values: Partial<typeof Machines.$inferInsert>,
): Promise<MachineActionResult> => {
  try {
    await db.update(Machines).set(values).where(eq(Machines.uuid, uuid));
  } catch (error) {
    return { error: describeError(error, "Failed to update machine") };
  }

  revalidatePath("/machines");
  revalidatePath(`/machines/${uuid}/edit`);
  redirect(`/machines/${uuid}/edit`);
};

export const updateMachineGeneral = async (
  uuid: string,
  values: MachineFormValues,
): Promise<MachineActionResult> => {
  const code = values.code.trim().toUpperCase();
  const production = values.production as MachineProductionType;

  try {
    // Both are unique in the schema; checking here turns a database error into
    // something the form can say. The machine being edited is excluded, or it
    // would collide with itself.
    const [duplicateCode] = await db
      .select({ uuid: Machines.uuid })
      .from(Machines)
      .where(and(eq(Machines.code, code), ne(Machines.uuid, uuid)))
      .limit(1);

    if (duplicateCode) {
      return { error: "Machine code already exists" };
    }

    const [duplicateProduction] = await db
      .select({ uuid: Machines.uuid })
      .from(Machines)
      .where(and(eq(Machines.production, production), ne(Machines.uuid, uuid)))
      .limit(1);

    if (duplicateProduction) {
      return {
        error: `A machine already exists for production ${MACHINE_PRODUCTION_LABELS[production]}`,
      };
    }
  } catch (error) {
    return { error: describeError(error, "Failed to update machine") };
  }

  return saveSection(uuid, {
    code,
    name: values.name.trim(),
    option: values.option as MachineOptionType,
    production,
    loading: values.loading as MachineLoadingType,
    stockLocationUuid: values.stockLocationUuid,
  });
};

export const updateMachineDimensions = async (
  uuid: string,
  values: MachineFormValues,
): Promise<MachineActionResult> =>
  saveSection(uuid, {
    minLengthMm: numberOrNull(values.minLengthMm),
    maxLengthMm: numberOrNull(values.maxLengthMm),
    remarks: values.remarks.trim() || null,
  });

export const updateMachineAvailability = async (
  uuid: string,
  values: MachineFormValues,
): Promise<MachineActionResult> =>
  saveSection(uuid, {
    outOfBusiness: values.outOfBusiness,
    // A window left behind by a machine that is back in business would keep
    // showing up in capacity planning, so it goes with the flag.
    outOfBusinessFrom: values.outOfBusiness
      ? dateOrNull(values.outOfBusinessFrom)
      : null,
    outOfBusinessUntil: values.outOfBusiness
      ? dateOrNull(values.outOfBusinessUntil)
      : null,
  });

export const updateMachineCapacity = async (
  uuid: string,
  values: MachineFormValues,
): Promise<MachineActionResult> =>
  saveSection(uuid, {
    averageDailyCapacity: numberOrNull(values.averageDailyCapacity),
    averageDailyCapacityUnit: (values.averageDailyCapacityUnit ||
      null) as MachineCapacityUnit | null,
    warningPercentage: numberOrNull(values.warningPercentage),
  });

export const updateMachineDocuments = async (
  uuid: string,
  values: MachineFormValues,
): Promise<MachineActionResult> =>
  saveSection(uuid, { documents: values.documents });

export const updateMachineProducts = async (
  uuid: string,
  products: MachineProductInput[],
): Promise<MachineActionResult> => {
  try {
    await db.transaction(async (tx) => {
      await tx
        .delete(MachineProducts)
        .where(eq(MachineProducts.machineUuid, uuid));

      if (products.length > 0) {
        await tx.insert(MachineProducts).values(
          products.map((product) => ({
            ...product,
            uuid: generateUuid(),
            machineUuid: uuid,
          })),
        );
      }
    });
  } catch (error) {
    return { error: describeError(error, "Failed to update machine products") };
  }

  revalidatePath("/machines");
  revalidatePath(`/machines/${uuid}/edit`);
  redirect(`/machines/${uuid}/edit`);
};

export const updateMachinePostProcessings = async (
  uuid: string,
  postProcessings: MachinePostProcessingInput[],
): Promise<MachineActionResult> => {
  try {
    await db.transaction(async (tx) => {
      await tx
        .delete(MachinePostProcessings)
        .where(eq(MachinePostProcessings.machineUuid, uuid));

      if (postProcessings.length > 0) {
        await tx.insert(MachinePostProcessings).values(
          postProcessings.map((postProcessing) => ({
            option: postProcessing.option,
            preference: toIntOrNull(String(postProcessing.preference)) ?? 0,
            daysInSystem: toIntOrNull(String(postProcessing.daysInSystem)) ?? 0,
            uuid: generateUuid(),
            machineUuid: uuid,
          })),
        );
      }
    });
  } catch (error) {
    return {
      error: describeError(error, "Failed to update machine post-processing"),
    };
  }

  revalidatePath("/machines");
  revalidatePath(`/machines/${uuid}/edit`);
  redirect(`/machines/${uuid}/edit`);
};
