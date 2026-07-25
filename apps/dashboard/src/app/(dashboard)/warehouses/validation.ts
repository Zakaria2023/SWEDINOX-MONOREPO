import {
  countWorkorderMethods,
  printerEntries,
  printerNames,
  stickerPerPickWorkorderTypes,
  warehouseAddresses,
  warehouseBlockReasons,
  warehouseLoadingLocations,
  warehouseLocationTypes,
  warehouseProductTypes,
  warehouseTransportRegions,
  workorderPrintMethods,
  workorderProcessingMethods,
  workorderReleaseMethods,
  workorderSlipTypes,
} from "@/lib/enums";
import { z } from "zod";

export const createWarehouseSchema = () =>
  z.object({
    name: z.string().min(1, "Name is required"),
    locationType: z.union([
      z.enum(warehouseLocationTypes),
      z.literal(""),
      z.undefined(),
    ]),
    loadingLocation: z.union([
      z.enum(warehouseLoadingLocations),
      z.literal(""),
      z.undefined(),
    ]),
    address: z.union([
      z.enum(warehouseAddresses),
      z.literal(""),
      z.undefined(),
    ]),
    blocked: z.boolean(),
    blockReason: z.union([
      z.enum(warehouseBlockReasons),
      z.literal(""),
      z.undefined(),
    ]),
    blockedForOptimization: z.boolean(),
    limitedDimensions: z.boolean(),
    minLength: z.union([z.number().int().min(0), z.literal(""), z.undefined()]),
    maxLength: z.union([z.number().int().min(0), z.literal(""), z.undefined()]),
    maxWidth: z.union([z.number().int().min(0), z.literal(""), z.undefined()]),
    maxWeight: z.union([z.number().int().min(0), z.literal(""), z.undefined()]),
    productTypes: z.array(z.enum(warehouseProductTypes)),
    loadLocations: z.array(
      z.object({
        transportRegion: z.enum(warehouseTransportRegions),
        loadLocation: z.union([
          z.enum(warehouseLoadingLocations),
          z.literal(""),
          z.undefined(),
        ]),
      }),
    ),
    documents: z.array(z.object({ id: z.string(), fileName: z.string() })),

    // Count workorders
    countMethod: z.union([z.enum(countWorkorderMethods), z.literal(""), z.undefined()]),
    countMaxLinesPerCommand: z.union([z.number().int().min(0), z.literal(""), z.undefined()]),
    countReleaseMethod: z.union([z.enum(workorderReleaseMethods), z.literal(""), z.undefined()]),
    countPrintMethod: z.union([z.enum(workorderPrintMethods), z.literal(""), z.undefined()]),
    countPrintStockOnSlip: z.boolean(),

    // Miscellaneous
    makeWorkordersPerSubsection: z.boolean(),
    orderEntryDeadlineForInternal: z.string().max(5).optional(),
    capacityPerResource: z.boolean(),
    sortLinesByWidthProductCodeLength: z.boolean(),
    printAllLocationsOnSlip: z.boolean(),
    workorderSlip: z.union([z.enum(workorderSlipTypes), z.literal(""), z.undefined()]),
    addSectionToCsvFileName: z.boolean(),
    addSubsectionToCsvFileName: z.boolean(),
    addProductTypeToCsvFileName: z.boolean(),
    callOffLocation: z.string().optional(),
    transportByCompanyUuid: z.union([z.string(), z.literal(""), z.undefined()]),

    // Picking workorders
    pickingProcessingMethod: z.union([z.enum(workorderProcessingMethods), z.literal(""), z.undefined()]),
    pickingReleaseMethod: z.union([z.enum(workorderReleaseMethods), z.literal(""), z.undefined()]),
    pickingPrintingMethod: z.union([z.enum(workorderPrintMethods), z.literal(""), z.undefined()]),
    packagingMandatoryOnCompletion: z.boolean(),
    packagingDialogueOnCompletion: z.boolean(),

    // Fetch workorders for Surface Treatment
    surfaceTreatmentMakePerSubsection: z.boolean(),
    surfaceTreatmentProcessingMethod: z.union([z.enum(workorderProcessingMethods), z.literal(""), z.undefined()]),
    surfaceTreatmentReleaseMethod: z.union([z.enum(workorderReleaseMethods), z.literal(""), z.undefined()]),
    surfaceTreatmentPrintingMethod: z.union([z.enum(workorderPrintMethods), z.literal(""), z.undefined()]),

    // Fetch workorders for Sawing
    sawingMakePerSubsection: z.boolean(),
    sawingProcessingMethod: z.union([z.enum(workorderProcessingMethods), z.literal(""), z.undefined()]),
    sawingReleaseMethod: z.union([z.enum(workorderReleaseMethods), z.literal(""), z.undefined()]),
    sawingPrintingMethod: z.union([z.enum(workorderPrintMethods), z.literal(""), z.undefined()]),

    // Pick-up workorders
    pickupDefaultLocationUuid: z.union([z.string(), z.literal(""), z.undefined()]),
    pickupSlipPrinter: z.union([z.enum(printerNames), z.literal(""), z.undefined()]),
    pickupSlipPrinterEntry: z.union([z.enum(printerEntries), z.literal(""), z.undefined()]),
    pickupOrderPrinter: z.union([z.enum(printerNames), z.literal(""), z.undefined()]),
    pickupOrderPrinterEntry: z.union([z.enum(printerEntries), z.literal(""), z.undefined()]),

    // Print settings — A4 Printers
    a4PrinterOriginal: z.union([z.enum(printerNames), z.literal(""), z.undefined()]),
    a4PrinterCopy1: z.union([z.enum(printerNames), z.literal(""), z.undefined()]),
    a4PrinterCopy2: z.union([z.enum(printerNames), z.literal(""), z.undefined()]),

    // Print settings — A4 Printers small material
    a4SmallMaterialThresholdMm: z.union([z.number().int().min(0), z.literal(""), z.undefined()]),
    a4SmallPrinterOriginal: z.union([z.enum(printerNames), z.literal(""), z.undefined()]),
    a4SmallPrinterCopy1: z.union([z.enum(printerNames), z.literal(""), z.undefined()]),
    a4SmallPrinterCopy2: z.union([z.enum(printerNames), z.literal(""), z.undefined()]),

    // Print settings — sticker per pick
    stickerPerPickWorkorder: z.union([z.enum(stickerPerPickWorkorderTypes), z.literal(""), z.undefined()]),

    // Print settings — other printers
    labelPrinter: z.union([z.enum(printerNames), z.literal(""), z.undefined()]),
    stickerPrinter: z.union([z.enum(printerNames), z.literal(""), z.undefined()]),

    // Print settings — CSV files for customer labels
    csvCustomerLabelFileName: z.string().optional(),
    csvCustomerLabelAddSection: z.boolean(),
    csvCustomerLabelAddSubsection: z.boolean(),
    csvCustomerLabelAddProductType: z.boolean(),
  });

export type WarehouseFormValues = z.infer<
  ReturnType<typeof createWarehouseSchema>
>;

export const DEFAULT_WAREHOUSE: WarehouseFormValues = {
  name: "",
  locationType: "",
  loadingLocation: "",
  address: "",
  blocked: false,
  blockReason: "",
  blockedForOptimization: false,
  limitedDimensions: false,
  minLength: "",
  maxLength: "",
  maxWidth: "",
  maxWeight: "",
  productTypes: [],
  loadLocations: [],
  documents: [],

  // Count workorders
  countMethod: "",
  countMaxLinesPerCommand: "",
  countReleaseMethod: "",
  countPrintMethod: "",
  countPrintStockOnSlip: false,

  // Miscellaneous
  makeWorkordersPerSubsection: false,
  orderEntryDeadlineForInternal: "",
  capacityPerResource: false,
  sortLinesByWidthProductCodeLength: false,
  printAllLocationsOnSlip: false,
  workorderSlip: "",
  addSectionToCsvFileName: false,
  addSubsectionToCsvFileName: false,
  addProductTypeToCsvFileName: false,
  callOffLocation: "",
  transportByCompanyUuid: "",

  // Picking workorders
  pickingProcessingMethod: "",
  pickingReleaseMethod: "",
  pickingPrintingMethod: "",
  packagingMandatoryOnCompletion: false,
  packagingDialogueOnCompletion: false,

  // Fetch workorders for Surface Treatment
  surfaceTreatmentMakePerSubsection: false,
  surfaceTreatmentProcessingMethod: "",
  surfaceTreatmentReleaseMethod: "",
  surfaceTreatmentPrintingMethod: "",

  // Fetch workorders for Sawing
  sawingMakePerSubsection: false,
  sawingProcessingMethod: "",
  sawingReleaseMethod: "",
  sawingPrintingMethod: "",

  // Pick-up workorders
  pickupDefaultLocationUuid: "",
  pickupSlipPrinter: "",
  pickupSlipPrinterEntry: "",
  pickupOrderPrinter: "",
  pickupOrderPrinterEntry: "",

  // Print settings — A4 Printers
  a4PrinterOriginal: "",
  a4PrinterCopy1: "",
  a4PrinterCopy2: "",

  // Print settings — A4 Printers small material
  a4SmallMaterialThresholdMm: "",
  a4SmallPrinterOriginal: "",
  a4SmallPrinterCopy1: "",
  a4SmallPrinterCopy2: "",

  // Print settings — sticker per pick
  stickerPerPickWorkorder: "",

  // Print settings — other printers
  labelPrinter: "",
  stickerPrinter: "",

  // Print settings — CSV files for customer labels
  csvCustomerLabelFileName: "Label",
  csvCustomerLabelAddSection: false,
  csvCustomerLabelAddSubsection: false,
  csvCustomerLabelAddProductType: false,
};
