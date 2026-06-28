"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  countWorkorderMethods,
  printerEntries,
  printerNames,
  stickerPerPickWorkorderTypes,
  warehouseAddresses,
  warehouseBlockReasons,
  warehouseLoadingLocations,
  warehouseLocationTypes,
  WarehouseAddress,
  WarehouseBlockReason,
  WarehouseLoadingLocation,
  WarehouseLocationType,
  WarehouseProductType,
  WarehouseTransportRegion,
  workorderPrintMethods,
  workorderProcessingMethods,
  workorderReleaseMethods,
  workorderSlipTypes,
  CountWorkorderMethod,
  PrinterEntry,
  PrinterName,
  StickerPerPickWorkorderType,
  WorkorderPrintMethod,
  WorkorderProcessingMethod,
  WorkorderReleaseMethod,
  WorkorderSlipType,
} from "@/lib/enums";
import {
  COMMON_TEXT,
  COUNT_WORKORDER_METHOD_LABELS,
  PRINTER_ENTRY_LABELS,
  PRINTER_NAME_LABELS,
  STICKER_PER_PICK_WORKORDER_LABELS,
  WAREHOUSE_ADDRESS_LABELS,
  WAREHOUSE_BLOCK_REASON_LABELS,
  WAREHOUSE_LOADING_LOCATION_LABELS,
  WAREHOUSE_LOCATION_TYPE_LABELS,
  WORKORDER_PRINT_METHOD_LABELS,
  WORKORDER_PROCESSING_METHOD_LABELS,
  WORKORDER_RELEASE_METHOD_LABELS,
  WORKORDER_SLIP_TYPE_LABELS,
} from "@/lib/labels";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import {
  createWarehouse,
  getWarehouseByUuid,
  WarehouseActionResult,
  WarehouseLocationOption,
  WarehouseOption,
} from "./actions";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import {
  createWarehouseSchema,
  DEFAULT_WAREHOUSE,
  WarehouseFormValues,
} from "./validation";

type UseWarehouseSubmitParams = {
  existingWarehouses: WarehouseOption[];
  companies: CompanyOption[];
  warehouseLocations: WarehouseLocationOption[];
};

export const useWarehouseSubmit = ({
  existingWarehouses,
  companies,
  warehouseLocations,
}: UseWarehouseSubmitParams) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<WarehouseActionResult>({});

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(createWarehouseSchema()),
    defaultValues: DEFAULT_WAREHOUSE,
  });

  const blocked = form.watch("blocked");

  const locationTypeOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...warehouseLocationTypes.map((t) => ({
      value: t,
      label: WAREHOUSE_LOCATION_TYPE_LABELS[t as WarehouseLocationType],
    })),
  ];

  const loadingLocationOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...warehouseLoadingLocations.map((l) => ({
      value: l,
      label: WAREHOUSE_LOADING_LOCATION_LABELS[l as WarehouseLoadingLocation],
    })),
  ];

  const blockReasonOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...warehouseBlockReasons.map((r) => ({
      value: r,
      label: WAREHOUSE_BLOCK_REASON_LABELS[r as WarehouseBlockReason],
    })),
  ];

  const [adaptFromValue, setAdaptFromValue] = useState("");

  const adaptFromOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...existingWarehouses.map((w) => ({ value: w.uuid, label: w.name })),
  ];

  const countMethodOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...countWorkorderMethods.map((m) => ({
      value: m,
      label: COUNT_WORKORDER_METHOD_LABELS[m as CountWorkorderMethod],
    })),
  ];

  const releaseMethodOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...workorderReleaseMethods.map((m) => ({
      value: m,
      label: WORKORDER_RELEASE_METHOD_LABELS[m as WorkorderReleaseMethod],
    })),
  ];

  const printMethodOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...workorderPrintMethods.map((m) => ({
      value: m,
      label: WORKORDER_PRINT_METHOD_LABELS[m as WorkorderPrintMethod],
    })),
  ];

  const workorderSlipOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...workorderSlipTypes.map((s) => ({
      value: s,
      label: WORKORDER_SLIP_TYPE_LABELS[s as WorkorderSlipType],
    })),
  ];

  const processingMethodOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...workorderProcessingMethods.map((m) => ({
      value: m,
      label: WORKORDER_PROCESSING_METHOD_LABELS[m as WorkorderProcessingMethod],
    })),
  ];

  const companyOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...companies.map((c) => ({ value: c.uuid, label: c.companyName })),
  ];

  const warehouseLocationOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...warehouseLocations.map((l) => ({ value: l.uuid, label: l.name })),
  ];

  const printerNameOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...printerNames.map((p) => ({
      value: p,
      label: PRINTER_NAME_LABELS[p as PrinterName],
    })),
  ];

  const printerEntryOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...printerEntries.map((e) => ({
      value: e,
      label: PRINTER_ENTRY_LABELS[e as PrinterEntry],
    })),
  ];

  const stickerPerPickOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...stickerPerPickWorkorderTypes.map((s) => ({
      value: s,
      label:
        STICKER_PER_PICK_WORKORDER_LABELS[s as StickerPerPickWorkorderType],
    })),
  ];

  const handleAdaptFrom = (uuid: string) => {
    setAdaptFromValue(uuid);
    const currentName = form.getValues("name");
    if (!uuid) {
      form.reset({ ...DEFAULT_WAREHOUSE, name: currentName });
      return;
    }
    startTransition(async () => {
      const source = await getWarehouseByUuid(uuid);
      if (!source) return;
      form.reset({
        name: currentName,
        locationType: source.locationType ?? "",
        loadingLocation: source.loadingLocation ?? "",
        address: source.address ?? "",
        blocked: source.blocked,
        blockReason: source.blockReason ?? "",
        blockedForOptimization: source.blockedForOptimization,
        limitedDimensions: source.limitedDimensions,
        minLength: source.minLength ?? "",
        maxLength: source.maxLength ?? "",
        maxWidth: source.maxWidth ?? "",
        maxWeight: source.maxWeight ?? "",
        productTypes: (source.productTypes ?? []) as WarehouseProductType[],
        loadLocations: (source.loadLocations ?? []) as Array<{
          transportRegion: WarehouseTransportRegion;
          loadLocation: WarehouseLoadingLocation;
        }>,
        documents: [],
      });
    });
  };

  const addressOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...warehouseAddresses.map((a) => ({
      value: a,
      label: WAREHOUSE_ADDRESS_LABELS[a as WarehouseAddress],
    })),
  ];

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createWarehouse({
        name: values.name,
        locationType: (values.locationType || undefined) as
          | WarehouseLocationType
          | undefined,
        loadingLocation: (values.loadingLocation || undefined) as
          | WarehouseLoadingLocation
          | undefined,
        address: (values.address || undefined) as WarehouseAddress | undefined,
        blocked: values.blocked,
        blockReason: values.blocked
          ? ((values.blockReason || undefined) as
              | WarehouseBlockReason
              | undefined)
          : undefined,
        blockedForOptimization: values.blockedForOptimization,
        limitedDimensions: values.limitedDimensions,
        minLength:
          values.minLength !== "" && values.minLength !== undefined
            ? Number(values.minLength)
            : undefined,
        maxLength:
          values.maxLength !== "" && values.maxLength !== undefined
            ? Number(values.maxLength)
            : undefined,
        maxWidth:
          values.maxWidth !== "" && values.maxWidth !== undefined
            ? Number(values.maxWidth)
            : undefined,
        maxWeight:
          values.maxWeight !== "" && values.maxWeight !== undefined
            ? Number(values.maxWeight)
            : undefined,
        productTypes:
          values.productTypes.length > 0 ? values.productTypes : undefined,
        loadLocations:
          values.loadLocations.length > 0 ? values.loadLocations : undefined,
        documents:
          (values.documents ?? []).length > 0 ? values.documents : undefined,

        // Count workorders
        countMethod: (values.countMethod || undefined) as
          | CountWorkorderMethod
          | undefined,
        countMaxLinesPerCommand:
          values.countMaxLinesPerCommand !== "" &&
          values.countMaxLinesPerCommand !== undefined
            ? Number(values.countMaxLinesPerCommand)
            : undefined,
        countReleaseMethod: (values.countReleaseMethod || undefined) as
          | WorkorderReleaseMethod
          | undefined,
        countPrintMethod: (values.countPrintMethod || undefined) as
          | WorkorderPrintMethod
          | undefined,
        countPrintStockOnSlip: values.countPrintStockOnSlip,

        // Miscellaneous
        makeWorkordersPerSubsection: values.makeWorkordersPerSubsection,
        orderEntryDeadlineForInternal:
          values.orderEntryDeadlineForInternal || null,
        capacityPerResource: values.capacityPerResource,
        sortLinesByWidthProductCodeLength:
          values.sortLinesByWidthProductCodeLength,
        printAllLocationsOnSlip: values.printAllLocationsOnSlip,
        workorderSlip: (values.workorderSlip || undefined) as
          | WorkorderSlipType
          | undefined,
        addSectionToCsvFileName: values.addSectionToCsvFileName,
        addSubsectionToCsvFileName: values.addSubsectionToCsvFileName,
        addProductTypeToCsvFileName: values.addProductTypeToCsvFileName,
        callOffLocation: values.callOffLocation || null,
        transportByCompanyUuid: values.transportByCompanyUuid || null,

        // Picking workorders
        pickingProcessingMethod: (values.pickingProcessingMethod ||
          undefined) as WorkorderProcessingMethod | undefined,
        pickingReleaseMethod: (values.pickingReleaseMethod || undefined) as
          | WorkorderReleaseMethod
          | undefined,
        pickingPrintingMethod: (values.pickingPrintingMethod || undefined) as
          | WorkorderPrintMethod
          | undefined,
        packagingMandatoryOnCompletion: values.packagingMandatoryOnCompletion,
        packagingDialogueOnCompletion: values.packagingDialogueOnCompletion,

        // Fetch workorders for Surface Treatment
        surfaceTreatmentMakePerSubsection:
          values.surfaceTreatmentMakePerSubsection,
        surfaceTreatmentProcessingMethod:
          (values.surfaceTreatmentProcessingMethod || undefined) as
            | WorkorderProcessingMethod
            | undefined,
        surfaceTreatmentReleaseMethod: (values.surfaceTreatmentReleaseMethod ||
          undefined) as WorkorderReleaseMethod | undefined,
        surfaceTreatmentPrintingMethod:
          (values.surfaceTreatmentPrintingMethod || undefined) as
            | WorkorderPrintMethod
            | undefined,

        // Fetch workorders for Sawing
        sawingMakePerSubsection: values.sawingMakePerSubsection,
        sawingProcessingMethod: (values.sawingProcessingMethod || undefined) as
          | WorkorderProcessingMethod
          | undefined,
        sawingReleaseMethod: (values.sawingReleaseMethod || undefined) as
          | WorkorderReleaseMethod
          | undefined,
        sawingPrintingMethod: (values.sawingPrintingMethod || undefined) as
          | WorkorderPrintMethod
          | undefined,

        // Print settings — A4 Printers
        a4PrinterOriginal: (values.a4PrinterOriginal || undefined) as
          | PrinterName
          | undefined,
        a4PrinterCopy1: (values.a4PrinterCopy1 || undefined) as
          | PrinterName
          | undefined,
        a4PrinterCopy2: (values.a4PrinterCopy2 || undefined) as
          | PrinterName
          | undefined,

        // Print settings — A4 Printers small material
        a4SmallMaterialThresholdMm:
          values.a4SmallMaterialThresholdMm !== "" &&
          values.a4SmallMaterialThresholdMm !== undefined
            ? Number(values.a4SmallMaterialThresholdMm)
            : undefined,
        a4SmallPrinterOriginal: (values.a4SmallPrinterOriginal || undefined) as
          | PrinterName
          | undefined,
        a4SmallPrinterCopy1: (values.a4SmallPrinterCopy1 || undefined) as
          | PrinterName
          | undefined,
        a4SmallPrinterCopy2: (values.a4SmallPrinterCopy2 || undefined) as
          | PrinterName
          | undefined,

        // Print settings — sticker per pick
        stickerPerPickWorkorder: (values.stickerPerPickWorkorder ||
          undefined) as StickerPerPickWorkorderType | undefined,

        // Print settings — other printers
        labelPrinter: (values.labelPrinter || undefined) as
          | PrinterName
          | undefined,
        stickerPrinter: (values.stickerPrinter || undefined) as
          | PrinterName
          | undefined,

        // Print settings — CSV files for customer labels
        csvCustomerLabelFileName: values.csvCustomerLabelFileName || null,
        csvCustomerLabelAddSection: values.csvCustomerLabelAddSection,
        csvCustomerLabelAddSubsection: values.csvCustomerLabelAddSubsection,
        csvCustomerLabelAddProductType: values.csvCustomerLabelAddProductType,

        // Pick-up workorders
        pickupDefaultLocationUuid: values.pickupDefaultLocationUuid || null,
        pickupSlipPrinter: (values.pickupSlipPrinter || undefined) as
          | PrinterName
          | undefined,
        pickupSlipPrinterEntry: (values.pickupSlipPrinterEntry || undefined) as
          | PrinterEntry
          | undefined,
        pickupOrderPrinter: (values.pickupOrderPrinter || undefined) as
          | PrinterName
          | undefined,
        pickupOrderPrinterEntry: (values.pickupOrderPrinterEntry ||
          undefined) as PrinterEntry | undefined,
      });
      setState(result);
      if (result.success) router.push("/warehouses");
    });
  });

  const handleCancel = () => router.push("/warehouses");

  return {
    form,
    isPending,
    onSubmit,
    state,
    blocked,
    locationTypeOptions,
    loadingLocationOptions,
    blockReasonOptions,
    addressOptions,
    adaptFromOptions,
    adaptFromValue,
    handleAdaptFrom,
    handleCancel,
    countMethodOptions,
    releaseMethodOptions,
    printMethodOptions,
    workorderSlipOptions,
    processingMethodOptions,
    companyOptions,
    warehouseLocationOptions,
    printerNameOptions,
    printerEntryOptions,
    stickerPerPickOptions,
  };
};
