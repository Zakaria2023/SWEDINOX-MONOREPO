import { SelectWarehouses } from "@/db";
import {
  WarehouseLoadingLocation,
  WarehouseProductType,
  WarehouseTransportRegion,
} from "@/lib/enums";
import { WarehouseFields } from "./actions";
import { DEFAULT_WAREHOUSE, WarehouseFormValues } from "./validation";

// On an update an emptied field has to reach the column as NULL. `undefined`
// would leave the old value in place, so clearing an input would silently do
// nothing.
const numberOrNull = (value: number | "" | undefined): number | null =>
  value === "" || value === undefined ? null : Number(value);

const textOrNull = (value: string | undefined): string | null => value || null;

/** A stored warehouse in the shape its form edits. */
export const warehouseToFormValues = (
  warehouse: SelectWarehouses,
): WarehouseFormValues => ({
  name: warehouse.name,
  locationType: warehouse.locationType ?? "",
  loadingLocation: warehouse.loadingLocation ?? "",
  address: warehouse.address ?? "",
  blocked: warehouse.blocked ?? false,
  blockReason: warehouse.blockReason ?? "",
  blockedForOptimization: warehouse.blockedForOptimization ?? false,
  limitedDimensions: warehouse.limitedDimensions ?? false,
  minLength: warehouse.minLength ?? "",
  maxLength: warehouse.maxLength ?? "",
  maxWidth: warehouse.maxWidth ?? "",
  maxWeight: warehouse.maxWeight ?? "",
  productTypes: (warehouse.productTypes ?? []) as WarehouseProductType[],
  loadLocations: (warehouse.loadLocations ?? []) as Array<{
    transportRegion: WarehouseTransportRegion;
    loadLocation: WarehouseLoadingLocation;
  }>,
  documents: warehouse.documents ?? [],

  countMethod: warehouse.countMethod ?? "",
  countMaxLinesPerCommand: warehouse.countMaxLinesPerCommand ?? "",
  countReleaseMethod: warehouse.countReleaseMethod ?? "",
  countPrintMethod: warehouse.countPrintMethod ?? "",
  countPrintStockOnSlip: warehouse.countPrintStockOnSlip ?? false,

  makeWorkordersPerSubsection: warehouse.makeWorkordersPerSubsection ?? false,
  orderEntryDeadlineForInternal: warehouse.orderEntryDeadlineForInternal ?? "",
  capacityPerResource: warehouse.capacityPerResource ?? false,
  sortLinesByWidthProductCodeLength:
    warehouse.sortLinesByWidthProductCodeLength ?? false,
  printAllLocationsOnSlip: warehouse.printAllLocationsOnSlip ?? false,
  workorderSlip: warehouse.workorderSlip ?? "",
  addSectionToCsvFileName: warehouse.addSectionToCsvFileName ?? false,
  addSubsectionToCsvFileName: warehouse.addSubsectionToCsvFileName ?? false,
  addProductTypeToCsvFileName: warehouse.addProductTypeToCsvFileName ?? false,
  callOffLocation: warehouse.callOffLocation ?? "",
  transportByCompanyUuid: warehouse.transportByCompanyUuid ?? "",

  pickingProcessingMethod: warehouse.pickingProcessingMethod ?? "",
  pickingReleaseMethod: warehouse.pickingReleaseMethod ?? "",
  pickingPrintingMethod: warehouse.pickingPrintingMethod ?? "",
  packagingMandatoryOnCompletion:
    warehouse.packagingMandatoryOnCompletion ?? false,
  packagingDialogueOnCompletion:
    warehouse.packagingDialogueOnCompletion ?? false,

  surfaceTreatmentMakePerSubsection:
    warehouse.surfaceTreatmentMakePerSubsection ?? false,
  surfaceTreatmentProcessingMethod:
    warehouse.surfaceTreatmentProcessingMethod ?? "",
  surfaceTreatmentReleaseMethod: warehouse.surfaceTreatmentReleaseMethod ?? "",
  surfaceTreatmentPrintingMethod:
    warehouse.surfaceTreatmentPrintingMethod ?? "",

  sawingMakePerSubsection: warehouse.sawingMakePerSubsection ?? false,
  sawingProcessingMethod: warehouse.sawingProcessingMethod ?? "",
  sawingReleaseMethod: warehouse.sawingReleaseMethod ?? "",
  sawingPrintingMethod: warehouse.sawingPrintingMethod ?? "",

  pickupDefaultLocationUuid: warehouse.pickupDefaultLocationUuid ?? "",
  pickupSlipPrinter: warehouse.pickupSlipPrinter ?? "",
  pickupSlipPrinterEntry: warehouse.pickupSlipPrinterEntry ?? "",
  pickupOrderPrinter: warehouse.pickupOrderPrinter ?? "",
  pickupOrderPrinterEntry: warehouse.pickupOrderPrinterEntry ?? "",

  a4PrinterOriginal: warehouse.a4PrinterOriginal ?? "",
  a4PrinterCopy1: warehouse.a4PrinterCopy1 ?? "",
  a4PrinterCopy2: warehouse.a4PrinterCopy2 ?? "",

  a4SmallMaterialThresholdMm: warehouse.a4SmallMaterialThresholdMm ?? "",
  a4SmallPrinterOriginal: warehouse.a4SmallPrinterOriginal ?? "",
  a4SmallPrinterCopy1: warehouse.a4SmallPrinterCopy1 ?? "",
  a4SmallPrinterCopy2: warehouse.a4SmallPrinterCopy2 ?? "",

  stickerPerPickWorkorder: warehouse.stickerPerPickWorkorder ?? "",

  labelPrinter: warehouse.labelPrinter ?? "",
  stickerPrinter: warehouse.stickerPrinter ?? "",

  csvCustomerLabelFileName:
    warehouse.csvCustomerLabelFileName ??
    DEFAULT_WAREHOUSE.csvCustomerLabelFileName,
  csvCustomerLabelAddSection: warehouse.csvCustomerLabelAddSection ?? false,
  csvCustomerLabelAddSubsection:
    warehouse.csvCustomerLabelAddSubsection ?? false,
  csvCustomerLabelAddProductType:
    warehouse.csvCustomerLabelAddProductType ?? false,
});

/**
 * The form's values as columns.
 *
 * Both creating and saving a section go through here, so the two can't
 * disagree about how a blank select or an empty number reaches the database.
 */
export const formValuesToWarehouseFields = (
  values: WarehouseFormValues,
): WarehouseFields => ({
  name: values.name,
  locationType: values.locationType || null,
  loadingLocation: values.loadingLocation || null,
  address: values.address || null,
  blocked: values.blocked,
  // A reason for a block that no longer exists would keep showing up in
  // reports, so it is dropped along with the block itself.
  blockReason: values.blocked ? values.blockReason || null : null,
  blockedForOptimization: values.blockedForOptimization,
  limitedDimensions: values.limitedDimensions,
  minLength: numberOrNull(values.minLength),
  maxLength: numberOrNull(values.maxLength),
  maxWidth: numberOrNull(values.maxWidth),
  maxWeight: numberOrNull(values.maxWeight),
  productTypes: values.productTypes,
  loadLocations: values.loadLocations.map((row) => ({
    transportRegion: row.transportRegion,
    loadLocation: row.loadLocation || undefined,
  })),
  documents: values.documents,

  countMethod: values.countMethod || null,
  countMaxLinesPerCommand: numberOrNull(values.countMaxLinesPerCommand),
  countReleaseMethod: values.countReleaseMethod || null,
  countPrintMethod: values.countPrintMethod || null,
  countPrintStockOnSlip: values.countPrintStockOnSlip,

  makeWorkordersPerSubsection: values.makeWorkordersPerSubsection,
  orderEntryDeadlineForInternal: textOrNull(
    values.orderEntryDeadlineForInternal,
  ),
  capacityPerResource: values.capacityPerResource,
  sortLinesByWidthProductCodeLength: values.sortLinesByWidthProductCodeLength,
  printAllLocationsOnSlip: values.printAllLocationsOnSlip,
  workorderSlip: values.workorderSlip || null,
  addSectionToCsvFileName: values.addSectionToCsvFileName,
  addSubsectionToCsvFileName: values.addSubsectionToCsvFileName,
  addProductTypeToCsvFileName: values.addProductTypeToCsvFileName,
  callOffLocation: textOrNull(values.callOffLocation),
  transportByCompanyUuid: textOrNull(values.transportByCompanyUuid),

  pickingProcessingMethod: values.pickingProcessingMethod || null,
  pickingReleaseMethod: values.pickingReleaseMethod || null,
  pickingPrintingMethod: values.pickingPrintingMethod || null,
  packagingMandatoryOnCompletion: values.packagingMandatoryOnCompletion,
  packagingDialogueOnCompletion: values.packagingDialogueOnCompletion,

  surfaceTreatmentMakePerSubsection: values.surfaceTreatmentMakePerSubsection,
  surfaceTreatmentProcessingMethod:
    values.surfaceTreatmentProcessingMethod || null,
  surfaceTreatmentReleaseMethod: values.surfaceTreatmentReleaseMethod || null,
  surfaceTreatmentPrintingMethod: values.surfaceTreatmentPrintingMethod || null,

  sawingMakePerSubsection: values.sawingMakePerSubsection,
  sawingProcessingMethod: values.sawingProcessingMethod || null,
  sawingReleaseMethod: values.sawingReleaseMethod || null,
  sawingPrintingMethod: values.sawingPrintingMethod || null,

  pickupDefaultLocationUuid: textOrNull(values.pickupDefaultLocationUuid),
  pickupSlipPrinter: values.pickupSlipPrinter || null,
  pickupSlipPrinterEntry: values.pickupSlipPrinterEntry || null,
  pickupOrderPrinter: values.pickupOrderPrinter || null,
  pickupOrderPrinterEntry: values.pickupOrderPrinterEntry || null,

  a4PrinterOriginal: values.a4PrinterOriginal || null,
  a4PrinterCopy1: values.a4PrinterCopy1 || null,
  a4PrinterCopy2: values.a4PrinterCopy2 || null,

  a4SmallMaterialThresholdMm: numberOrNull(values.a4SmallMaterialThresholdMm),
  a4SmallPrinterOriginal: values.a4SmallPrinterOriginal || null,
  a4SmallPrinterCopy1: values.a4SmallPrinterCopy1 || null,
  a4SmallPrinterCopy2: values.a4SmallPrinterCopy2 || null,

  stickerPerPickWorkorder: values.stickerPerPickWorkorder || null,

  labelPrinter: values.labelPrinter || null,
  stickerPrinter: values.stickerPrinter || null,

  csvCustomerLabelFileName: textOrNull(values.csvCustomerLabelFileName),
  csvCustomerLabelAddSection: values.csvCustomerLabelAddSection,
  csvCustomerLabelAddSubsection: values.csvCustomerLabelAddSubsection,
  csvCustomerLabelAddProductType: values.csvCustomerLabelAddProductType,
});
