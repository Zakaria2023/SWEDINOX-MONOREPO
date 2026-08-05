"use server";

import {
  WarehouseActionResult,
  WarehouseFields,
} from "@/app/(dashboard)/warehouses/actions";
import { formValuesToWarehouseFields } from "@/app/(dashboard)/warehouses/mappers";
import { WarehouseFormValues } from "@/app/(dashboard)/warehouses/validation";
import { db } from "@/db";
import { SelectWarehouses, Warehouses } from "@/db/schema/warehouses";
import { describeError } from "@/lib/helpers";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type WarehouseEditOverview = {
  warehouse: SelectWarehouses;
  counts: {
    loadLocations: number;
    documents: number;
  };
};

// Which columns each section owns, so saving one never carries a half-finished
// edit from another along with it. A warehouse has more than sixty settings
// spread across twelve screens, which is exactly why they are saved apart.
const SECTION_COLUMNS = {
  general: [
    "name",
    "locationType",
    "loadingLocation",
    "address",
    "minLength",
    "maxLength",
    "maxWidth",
    "maxWeight",
  ],
  status: [
    "blocked",
    "blockReason",
    "blockedForOptimization",
    "limitedDimensions",
    "productTypes",
  ],
  loadLocations: ["loadLocations"],
  countWorkorders: [
    "countMethod",
    "countMaxLinesPerCommand",
    "countReleaseMethod",
    "countPrintMethod",
    "countPrintStockOnSlip",
  ],
  miscellaneous: [
    "makeWorkordersPerSubsection",
    "orderEntryDeadlineForInternal",
    "capacityPerResource",
    "sortLinesByWidthProductCodeLength",
    "printAllLocationsOnSlip",
    "workorderSlip",
    "addSectionToCsvFileName",
    "addSubsectionToCsvFileName",
    "addProductTypeToCsvFileName",
    "callOffLocation",
    "transportByCompanyUuid",
  ],
  pickingWorkorders: [
    "pickingProcessingMethod",
    "pickingReleaseMethod",
    "pickingPrintingMethod",
    "packagingMandatoryOnCompletion",
    "packagingDialogueOnCompletion",
  ],
  surfaceTreatment: [
    "surfaceTreatmentMakePerSubsection",
    "surfaceTreatmentProcessingMethod",
    "surfaceTreatmentReleaseMethod",
    "surfaceTreatmentPrintingMethod",
  ],
  sawing: [
    "sawingMakePerSubsection",
    "sawingProcessingMethod",
    "sawingReleaseMethod",
    "sawingPrintingMethod",
  ],
  pickupWorkorders: [
    "pickupDefaultLocationUuid",
    "pickupSlipPrinter",
    "pickupSlipPrinterEntry",
    "pickupOrderPrinter",
    "pickupOrderPrinterEntry",
  ],
  printSettings: [
    "a4PrinterOriginal",
    "a4PrinterCopy1",
    "a4PrinterCopy2",
    "a4SmallMaterialThresholdMm",
    "a4SmallPrinterOriginal",
    "a4SmallPrinterCopy1",
    "a4SmallPrinterCopy2",
    "stickerPerPickWorkorder",
    "labelPrinter",
    "stickerPrinter",
    "csvCustomerLabelFileName",
    "csvCustomerLabelAddSection",
    "csvCustomerLabelAddSubsection",
    "csvCustomerLabelAddProductType",
  ],
  documents: ["documents"],
} as const satisfies Record<string, readonly (keyof WarehouseFields)[]>;

const pickColumns = <K extends keyof WarehouseFields>(
  fields: WarehouseFields,
  keys: readonly K[],
): Pick<WarehouseFields, K> =>
  Object.fromEntries(keys.map((key) => [key, fields[key]])) as Pick<
    WarehouseFields,
    K
  >;

export const getWarehouseForEdit = async (
  uuid: string,
): Promise<SelectWarehouses | null> => {
  try {
    const [warehouse] = await db
      .select()
      .from(Warehouses)
      .where(eq(Warehouses.uuid, uuid))
      .limit(1);

    return warehouse ?? null;
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch the warehouse"));
  }
};

export const getWarehouseEditOverview = async (
  uuid: string,
): Promise<WarehouseEditOverview | null> => {
  const warehouse = await getWarehouseForEdit(uuid);

  if (!warehouse) {
    return null;
  }

  return {
    warehouse,
    counts: {
      loadLocations: (warehouse.loadLocations ?? []).length,
      documents: (warehouse.documents ?? []).length,
    },
  };
};

const saveSection = async (
  uuid: string,
  columns: Partial<WarehouseFields>,
): Promise<WarehouseActionResult> => {
  try {
    await db.update(Warehouses).set(columns).where(eq(Warehouses.uuid, uuid));
  } catch (error) {
    return { error: describeError(error, "Failed to update warehouse") };
  }

  revalidatePath("/warehouses");
  revalidatePath(`/warehouses/${uuid}/edit`);
  redirect(`/warehouses/${uuid}/edit`);
};

export const updateWarehouseGeneral = async (
  uuid: string,
  values: WarehouseFormValues,
): Promise<WarehouseActionResult> =>
  saveSection(
    uuid,
    pickColumns(formValuesToWarehouseFields(values), SECTION_COLUMNS.general),
  );

export const updateWarehouseStatus = async (
  uuid: string,
  values: WarehouseFormValues,
): Promise<WarehouseActionResult> =>
  saveSection(
    uuid,
    pickColumns(formValuesToWarehouseFields(values), SECTION_COLUMNS.status),
  );

export const updateWarehouseLoadLocations = async (
  uuid: string,
  values: WarehouseFormValues,
): Promise<WarehouseActionResult> =>
  saveSection(
    uuid,
    pickColumns(
      formValuesToWarehouseFields(values),
      SECTION_COLUMNS.loadLocations,
    ),
  );

export const updateWarehouseCountWorkorders = async (
  uuid: string,
  values: WarehouseFormValues,
): Promise<WarehouseActionResult> =>
  saveSection(
    uuid,
    pickColumns(
      formValuesToWarehouseFields(values),
      SECTION_COLUMNS.countWorkorders,
    ),
  );

export const updateWarehouseMiscellaneous = async (
  uuid: string,
  values: WarehouseFormValues,
): Promise<WarehouseActionResult> =>
  saveSection(
    uuid,
    pickColumns(
      formValuesToWarehouseFields(values),
      SECTION_COLUMNS.miscellaneous,
    ),
  );

export const updateWarehousePickingWorkorders = async (
  uuid: string,
  values: WarehouseFormValues,
): Promise<WarehouseActionResult> =>
  saveSection(
    uuid,
    pickColumns(
      formValuesToWarehouseFields(values),
      SECTION_COLUMNS.pickingWorkorders,
    ),
  );

export const updateWarehouseSurfaceTreatment = async (
  uuid: string,
  values: WarehouseFormValues,
): Promise<WarehouseActionResult> =>
  saveSection(
    uuid,
    pickColumns(
      formValuesToWarehouseFields(values),
      SECTION_COLUMNS.surfaceTreatment,
    ),
  );

export const updateWarehouseSawing = async (
  uuid: string,
  values: WarehouseFormValues,
): Promise<WarehouseActionResult> =>
  saveSection(
    uuid,
    pickColumns(formValuesToWarehouseFields(values), SECTION_COLUMNS.sawing),
  );

export const updateWarehousePickupWorkorders = async (
  uuid: string,
  values: WarehouseFormValues,
): Promise<WarehouseActionResult> =>
  saveSection(
    uuid,
    pickColumns(
      formValuesToWarehouseFields(values),
      SECTION_COLUMNS.pickupWorkorders,
    ),
  );

export const updateWarehousePrintSettings = async (
  uuid: string,
  values: WarehouseFormValues,
): Promise<WarehouseActionResult> =>
  saveSection(
    uuid,
    pickColumns(
      formValuesToWarehouseFields(values),
      SECTION_COLUMNS.printSettings,
    ),
  );

export const updateWarehouseDocumentsSection = async (
  uuid: string,
  values: WarehouseFormValues,
): Promise<WarehouseActionResult> =>
  saveSection(
    uuid,
    pickColumns(formValuesToWarehouseFields(values), SECTION_COLUMNS.documents),
  );
